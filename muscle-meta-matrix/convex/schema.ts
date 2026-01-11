import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ============================================
  // USERS TABLE
  // ============================================
  users: defineTable({
    // Clerk Integration
    clerkId: v.string(),
    email: v.string(),

    // Profile
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),

    // Role: "USER" or "ADMIN"
    role: v.union(v.literal("USER"), v.literal("ADMIN")),

    // Profile Data (collected during onboarding or assessment)
    profile: v.optional(v.object({
      age: v.optional(v.number()),
      gender: v.optional(v.union(
        v.literal("male"),
        v.literal("female"),
        v.literal("other"),
        v.literal("prefer_not_to_say")
      )),
      height: v.optional(v.number()), // in cm
      weight: v.optional(v.number()), // in kg
      primaryGoal: v.optional(v.string()),
      healthConditions: v.optional(v.array(v.string())),
      medications: v.optional(v.array(v.string())),
    })),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
    lastLoginAt: v.optional(v.number()),

    // Status
    status: v.union(
      v.literal("ACTIVE"),
      v.literal("PENDING_ASSESSMENT"),
      v.literal("INACTIVE")
    ),

    // Subscription (future use)
    subscriptionTier: v.optional(v.union(
      v.literal("FREE"),
      v.literal("STARTER"),
      v.literal("PROFESSIONAL"),
      v.literal("PREMIUM")
    )),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_role", ["role"])
    .index("by_status", ["status"]),

  // ============================================
  // ASSESSMENTS TABLE
  // ============================================
  assessments: defineTable({
    // Relationships
    userId: v.id("users"),

    // Assessment Type
    type: v.union(
      v.literal("CRA"),        // Catabolic Risk Assessment (30 questions)
      v.literal("4P-MMA"),     // 4-Pillar Assessment (60 questions) - Phase 2
      v.literal("GLP1"),       // GLP-1 Specific - Phase 2
      v.literal("PICKLEBALL")  // Pickleball Readiness - Phase 2
    ),

    // Status
    status: v.union(
      v.literal("NOT_STARTED"),
      v.literal("IN_PROGRESS"),
      v.literal("COMPLETED"),
      v.literal("EXPIRED")
    ),

    // Progress Tracking
    currentQuestionIndex: v.number(),
    totalQuestions: v.number(),

    // Timestamps
    invitedAt: v.optional(v.number()),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()),

    // Invitation
    invitationToken: v.optional(v.string()),
    invitedBy: v.optional(v.id("users")), // Admin who sent invitation
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_type", ["type"])
    .index("by_invitation_token", ["invitationToken"]),

  // ============================================
  // ASSESSMENT RESPONSES TABLE
  // ============================================
  assessmentResponses: defineTable({
    // Relationships
    assessmentId: v.id("assessments"),

    // Question Reference
    questionId: v.string(),
    sectionId: v.string(),

    // Response Data
    value: v.any(), // Can be string, number, array, etc.

    // Calculated Score
    score: v.number(),
    maxScore: v.number(),

    // Metadata
    answeredAt: v.number(),

    // Flags
    isCriticalFlag: v.boolean(),
    isHighRiskIndicator: v.boolean(),
  })
    .index("by_assessment", ["assessmentId"])
    .index("by_question", ["questionId"]),

  // ============================================
  // ASSESSMENT RESULTS TABLE
  // ============================================
  assessmentResults: defineTable({
    // Relationships
    assessmentId: v.id("assessments"),
    userId: v.id("users"),

    // Total Score
    totalScore: v.number(),
    maxPossibleScore: v.number(),
    percentageScore: v.number(),

    // Risk Classification
    riskLevel: v.union(
      v.literal("MINIMAL"),
      v.literal("LOW_MODERATE"),
      v.literal("MODERATE_HIGH"),
      v.literal("HIGH"),
      v.literal("CRITICAL")
    ),
    riskTier: v.number(), // 1-5

    // Percentile (compared to age/gender cohort)
    percentile: v.optional(v.number()),

    // Section Scores (CRA Sections)
    sectionScores: v.object({
      medicalEvents: v.number(),
      weightLoss: v.number(),
      medications: v.number(),
      neurological: v.number(),
      functional: v.number(),
      muscleBalance: v.number(),
      strength: v.number(),
      boneHealth: v.number(),
      energySleep: v.number(),
      warningSigns: v.number(),
    }),

    // 4-Pillar Breakdown
    pillarScores: v.object({
      exerciseMobility: v.number(),
      nutritionMetabolism: v.number(),
      recoveryStress: v.number(),
      balanceBrain: v.number(),
    }),

    // Critical Alerts
    criticalAlerts: v.array(v.object({
      severity: v.union(
        v.literal("WARNING"),
        v.literal("URGENT"),
        v.literal("CRITICAL")
      ),
      category: v.string(),
      message: v.string(),
      action: v.string(),
      timeframe: v.string(),
    })),

    // Recommended Pathways (ordered by priority)
    pathways: v.array(v.object({
      pillar: v.string(),
      priority: v.number(),
      score: v.number(),
      pathway: v.string(),
      expectedOutcome: v.string(),
      timeframe: v.string(),
    })),

    // PDF Report
    pdfStorageId: v.optional(v.id("_storage")),
    pdfGeneratedAt: v.optional(v.number()),

    // Timestamps
    calculatedAt: v.number(),
  })
    .index("by_assessment", ["assessmentId"])
    .index("by_user", ["userId"])
    .index("by_risk_level", ["riskLevel"]),

  // ============================================
  // ADMIN NOTES TABLE
  // ============================================
  adminNotes: defineTable({
    // Relationships
    userId: v.id("users"),
    adminId: v.id("users"),
    assessmentId: v.optional(v.id("assessments")),

    // Note Content
    note: v.string(),
    noteType: v.union(
      v.literal("GENERAL"),
      v.literal("ASSESSMENT_REVIEW"),
      v.literal("FOLLOW_UP"),
      v.literal("ESCALATION")
    ),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_admin", ["adminId"])
    .index("by_assessment", ["assessmentId"]),

  // ============================================
  // EMAIL LOG TABLE
  // ============================================
  emailLog: defineTable({
    // Relationships
    userId: v.id("users"),

    // Email Details
    emailType: v.union(
      v.literal("ASSESSMENT_INVITATION"),
      v.literal("ASSESSMENT_REMINDER"),
      v.literal("ASSESSMENT_COMPLETED"),
      v.literal("RESULTS_READY"),
      v.literal("ADMIN_NOTIFICATION")
    ),
    recipientEmail: v.string(),
    subject: v.string(),

    // Status
    status: v.union(
      v.literal("SENT"),
      v.literal("DELIVERED"),
      v.literal("FAILED")
    ),

    // Metadata
    sentAt: v.number(),
    resendId: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_type", ["emailType"]),

  // ============================================
  // ASSESSMENT CONFIGURATION TABLE
  // ============================================
  assessmentConfig: defineTable({
    // Assessment Type
    type: v.string(), // "CRA", "4P-MMA", etc.
    version: v.string(),

    // Configuration
    config: v.object({
      title: v.string(),
      description: v.string(),
      estimatedMinutes: v.number(),
      totalQuestions: v.number(),
      sections: v.array(v.object({
        id: v.string(),
        title: v.string(),
        description: v.optional(v.string()),
        questions: v.array(v.any()), // Question objects
      })),
      scoringRules: v.any(),
      conditionalLogic: v.optional(v.array(v.any())),
    }),

    // Status
    isActive: v.boolean(),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_type", ["type"])
    .index("by_active", ["isActive"]),
});
