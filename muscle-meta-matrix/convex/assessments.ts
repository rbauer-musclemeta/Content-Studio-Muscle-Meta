import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Create new assessment
export const createAssessment = mutation({
  args: {
    userId: v.id("users"),
    type: v.union(
      v.literal("CRA"),
      v.literal("4P-MMA"),
      v.literal("GLP1"),
      v.literal("PICKLEBALL")
    ),
    invitedBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    // Get assessment config
    const config = await ctx.db
      .query("assessmentConfig")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    // Default to 30 questions for CRA if no config exists
    const totalQuestions = config?.config.totalQuestions ?? 30;

    const invitationToken = generateToken();
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

    return await ctx.db.insert("assessments", {
      userId: args.userId,
      type: args.type,
      status: "NOT_STARTED",
      currentQuestionIndex: 0,
      totalQuestions,
      invitedAt: Date.now(),
      invitationToken,
      expiresAt,
      invitedBy: args.invitedBy,
    });
  },
});

// Get assessment by ID
export const getAssessment = query({
  args: { assessmentId: v.id("assessments") },
  handler: async (ctx, args) => {
    const assessment = await ctx.db.get(args.assessmentId);
    if (!assessment) return null;

    // Get responses
    const responses = await ctx.db
      .query("assessmentResponses")
      .withIndex("by_assessment", (q) => q.eq("assessmentId", args.assessmentId))
      .collect();

    // Get config
    const config = await ctx.db
      .query("assessmentConfig")
      .withIndex("by_type", (q) => q.eq("type", assessment.type))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    return {
      ...assessment,
      responses,
      config: config?.config,
    };
  },
});

// Get user's assessments
export const getUserAssessments = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("assessments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

// Get assessment by invitation token
export const getAssessmentByToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("assessments")
      .withIndex("by_invitation_token", (q) => q.eq("invitationToken", args.token))
      .first();
  },
});

// Start assessment
export const startAssessment = mutation({
  args: { assessmentId: v.id("assessments") },
  handler: async (ctx, args) => {
    const assessment = await ctx.db.get(args.assessmentId);
    if (!assessment) throw new Error("Assessment not found");

    if (assessment.status !== "NOT_STARTED") {
      throw new Error("Assessment already started");
    }

    await ctx.db.patch(args.assessmentId, {
      status: "IN_PROGRESS",
      startedAt: Date.now(),
    });
  },
});

// Save response
export const saveResponse = mutation({
  args: {
    assessmentId: v.id("assessments"),
    questionId: v.string(),
    sectionId: v.string(),
    value: v.any(),
    score: v.number(),
    maxScore: v.number(),
    isCriticalFlag: v.boolean(),
    isHighRiskIndicator: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Check if response already exists
    const existing = await ctx.db
      .query("assessmentResponses")
      .withIndex("by_assessment", (q) => q.eq("assessmentId", args.assessmentId))
      .filter((q) => q.eq(q.field("questionId"), args.questionId))
      .first();

    if (existing) {
      // Update existing response
      await ctx.db.patch(existing._id, {
        value: args.value,
        score: args.score,
        answeredAt: Date.now(),
        isCriticalFlag: args.isCriticalFlag,
        isHighRiskIndicator: args.isHighRiskIndicator,
      });
    } else {
      // Create new response
      await ctx.db.insert("assessmentResponses", {
        assessmentId: args.assessmentId,
        questionId: args.questionId,
        sectionId: args.sectionId,
        value: args.value,
        score: args.score,
        maxScore: args.maxScore,
        answeredAt: Date.now(),
        isCriticalFlag: args.isCriticalFlag,
        isHighRiskIndicator: args.isHighRiskIndicator,
      });
    }

    // Update assessment progress
    const responses = await ctx.db
      .query("assessmentResponses")
      .withIndex("by_assessment", (q) => q.eq("assessmentId", args.assessmentId))
      .collect();

    await ctx.db.patch(args.assessmentId, {
      currentQuestionIndex: responses.length,
    });
  },
});

// Complete assessment
export const completeAssessment = mutation({
  args: { assessmentId: v.id("assessments") },
  handler: async (ctx, args) => {
    const assessment = await ctx.db.get(args.assessmentId);
    if (!assessment) throw new Error("Assessment not found");

    // Get all responses
    const responses = await ctx.db
      .query("assessmentResponses")
      .withIndex("by_assessment", (q) => q.eq("assessmentId", args.assessmentId))
      .collect();

    // Calculate scores
    const results = calculateAssessmentResults(responses);

    // Save results
    const resultsId = await ctx.db.insert("assessmentResults", {
      assessmentId: args.assessmentId,
      userId: assessment.userId,
      ...results,
      calculatedAt: Date.now(),
    });

    // Update assessment status
    await ctx.db.patch(args.assessmentId, {
      status: "COMPLETED",
      completedAt: Date.now(),
    });

    // Update user status
    await ctx.db.patch(assessment.userId, {
      status: "ACTIVE",
      updatedAt: Date.now(),
    });

    return resultsId;
  },
});

// Get assessment results
export const getResults = query({
  args: { assessmentId: v.id("assessments") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("assessmentResults")
      .withIndex("by_assessment", (q) => q.eq("assessmentId", args.assessmentId))
      .first();
  },
});

// Get results by user
export const getResultsByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("assessmentResults")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

// Helper: Generate invitation token
function generateToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Helper: Calculate assessment results
function calculateAssessmentResults(responses: any[]) {
  // Group by section
  const sectionScores: Record<string, number> = {};
  let totalScore = 0;
  let maxPossibleScore = 0;
  const criticalAlerts: any[] = [];

  for (const response of responses) {
    // Accumulate section scores
    if (!sectionScores[response.sectionId]) {
      sectionScores[response.sectionId] = 0;
    }
    sectionScores[response.sectionId] += response.score;
    totalScore += response.score;
    maxPossibleScore += response.maxScore;

    // Check for critical flags
    if (response.isCriticalFlag) {
      criticalAlerts.push({
        severity: "CRITICAL" as const,
        category: response.sectionId,
        message: `Critical indicator detected in ${response.sectionId}`,
        action: "Consult healthcare provider",
        timeframe: "Within 24-48 hours",
      });
    }
  }

  // Calculate risk level
  const percentageScore = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;
  const riskLevel = getRiskLevel(totalScore);
  const riskTier = getRiskTier(riskLevel);

  // Calculate pillar scores
  const pillarScores = calculatePillarScores(sectionScores);

  // Generate pathway recommendations
  const pathways = generatePathways(pillarScores);

  return {
    totalScore,
    maxPossibleScore,
    percentageScore,
    riskLevel,
    riskTier,
    sectionScores: {
      medicalEvents: sectionScores["medical-events"] || 0,
      weightLoss: sectionScores["weight-loss"] || 0,
      medications: sectionScores["medications"] || 0,
      neurological: sectionScores["neurological"] || 0,
      functional: sectionScores["functional"] || 0,
      muscleBalance: sectionScores["muscle-balance"] || 0,
      strength: sectionScores["strength"] || 0,
      boneHealth: sectionScores["bone-health"] || 0,
      energySleep: sectionScores["energy-sleep"] || 0,
      warningSigns: sectionScores["warning-signs"] || 0,
    },
    pillarScores,
    criticalAlerts,
    pathways,
  };
}

function getRiskLevel(score: number): "MINIMAL" | "LOW_MODERATE" | "MODERATE_HIGH" | "HIGH" | "CRITICAL" {
  if (score <= 25) return "MINIMAL";
  if (score <= 55) return "LOW_MODERATE";
  if (score <= 85) return "MODERATE_HIGH";
  if (score <= 120) return "HIGH";
  return "CRITICAL";
}

function getRiskTier(riskLevel: string): number {
  const tiers: Record<string, number> = {
    MINIMAL: 1,
    LOW_MODERATE: 2,
    MODERATE_HIGH: 3,
    HIGH: 4,
    CRITICAL: 5,
  };
  return tiers[riskLevel] || 3;
}

function calculatePillarScores(sectionScores: Record<string, number>) {
  return {
    exerciseMobility:
      (sectionScores["functional"] || 0) +
      (sectionScores["muscle-balance"] || 0) +
      (sectionScores["strength"] || 0),
    nutritionMetabolism:
      (sectionScores["weight-loss"] || 0) +
      (sectionScores["medications"] || 0),
    recoveryStress:
      (sectionScores["medical-events"] || 0) +
      (sectionScores["energy-sleep"] || 0),
    balanceBrain:
      (sectionScores["neurological"] || 0) +
      (sectionScores["bone-health"] || 0) +
      (sectionScores["warning-signs"] || 0),
  };
}

function generatePathways(pillarScores: Record<string, number>) {
  const pathwayMap: Record<string, { pathway: string; expectedOutcome: string; timeframe: string }> = {
    exerciseMobility: {
      pathway: "Functional Strength Foundation",
      expectedOutcome: "Improved sit-to-stand time, better balance",
      timeframe: "4-6 weeks",
    },
    nutritionMetabolism: {
      pathway: "GLP-1 Muscle Preservation Protocol",
      expectedOutcome: "50% reduction in muscle loss risk",
      timeframe: "30 days",
    },
    recoveryStress: {
      pathway: "Post-Surgical Recovery Optimization",
      expectedOutcome: "Faster recovery, reduced fatigue",
      timeframe: "6-8 weeks",
    },
    balanceBrain: {
      pathway: "Balance & Coordination Mastery",
      expectedOutcome: "Reduced fall risk, improved confidence",
      timeframe: "4-8 weeks",
    },
  };

  return Object.entries(pillarScores)
    .map(([pillar, score], index) => ({
      pillar,
      priority: index + 1,
      score,
      ...pathwayMap[pillar],
    }))
    .sort((a, b) => b.score - a.score);
}
