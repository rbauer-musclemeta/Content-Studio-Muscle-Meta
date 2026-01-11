import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Dashboard Statistics
export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const assessments = await ctx.db.query("assessments").collect();
    const results = await ctx.db.query("assessmentResults").collect();

    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const newUsersThisWeek = users.filter((u) => u.createdAt > oneWeekAgo).length;

    const completedAssessments = assessments.filter(
      (a) => a.status === "COMPLETED"
    ).length;
    const pendingAssessments = assessments.filter(
      (a) => a.status === "IN_PROGRESS" || a.status === "NOT_STARTED"
    ).length;

    const highRiskResults = results.filter(
      (r) => r.riskLevel === "HIGH" || r.riskLevel === "CRITICAL"
    );
    const criticalRiskResults = results.filter(
      (r) => r.riskLevel === "CRITICAL"
    );

    const avgRiskScore =
      results.length > 0
        ? results.reduce((sum, r) => sum + r.totalScore, 0) / results.length
        : 0;

    return {
      totalUsers: users.length,
      newUsersThisWeek,
      completedAssessments,
      pendingAssessments,
      highRiskUsers: highRiskResults.length,
      criticalRiskUsers: criticalRiskResults.length,
      avgRiskScore,
    };
  },
});

// Get Recent Users
export const getRecentUsers = query({
  args: { limit: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .order("desc")
      .take(args.limit);
  },
});

// Get Recent Assessments with User Data
export const getRecentAssessments = query({
  args: { limit: v.number() },
  handler: async (ctx, args) => {
    const assessments = await ctx.db
      .query("assessments")
      .withIndex("by_status", (q) => q.eq("status", "COMPLETED"))
      .order("desc")
      .take(args.limit);

    // Enrich with user data and results
    const enriched = await Promise.all(
      assessments.map(async (assessment) => {
        const user = await ctx.db.get(assessment.userId);
        const result = await ctx.db
          .query("assessmentResults")
          .withIndex("by_assessment", (q) =>
            q.eq("assessmentId", assessment._id)
          )
          .first();

        return {
          ...assessment,
          user,
          result,
        };
      })
    );

    return enriched;
  },
});

// Get all assessments for admin view
export const getAllAssessments = query({
  args: {
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let assessments;

    if (args.status) {
      assessments = await ctx.db
        .query("assessments")
        .withIndex("by_status", (q) =>
          q.eq("status", args.status as "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "EXPIRED")
        )
        .order("desc")
        .take(args.limit ?? 100);
    } else {
      assessments = await ctx.db
        .query("assessments")
        .order("desc")
        .take(args.limit ?? 100);
    }

    // Enrich with user data and results
    const enriched = await Promise.all(
      assessments.map(async (assessment) => {
        const user = await ctx.db.get(assessment.userId);
        const result = assessment.status === "COMPLETED"
          ? await ctx.db
              .query("assessmentResults")
              .withIndex("by_assessment", (q) => q.eq("assessmentId", assessment._id))
              .first()
          : null;

        return {
          ...assessment,
          user,
          result,
        };
      })
    );

    return enriched;
  },
});

// Create User (Admin)
export const createUser = mutation({
  args: {
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    sendAssessmentInvite: v.boolean(),
    adminId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Create user
    const userId = await ctx.db.insert("users", {
      clerkId: "", // Will be populated when user signs up
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      role: "USER",
      status: "PENDING_ASSESSMENT",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create assessment if requested
    if (args.sendAssessmentInvite) {
      const invitationToken =
        Math.random().toString(36).substring(2) + Date.now().toString(36);

      await ctx.db.insert("assessments", {
        userId,
        type: "CRA",
        status: "NOT_STARTED",
        currentQuestionIndex: 0,
        totalQuestions: 30,
        invitedAt: Date.now(),
        invitationToken,
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
        invitedBy: args.adminId,
      });

      // TODO: Send email invitation via action
    }

    return userId;
  },
});

// Add Admin Note
export const addNote = mutation({
  args: {
    userId: v.id("users"),
    adminId: v.id("users"),
    assessmentId: v.optional(v.id("assessments")),
    note: v.string(),
    noteType: v.union(
      v.literal("GENERAL"),
      v.literal("ASSESSMENT_REVIEW"),
      v.literal("FOLLOW_UP"),
      v.literal("ESCALATION")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("adminNotes", {
      userId: args.userId,
      adminId: args.adminId,
      assessmentId: args.assessmentId,
      note: args.note,
      noteType: args.noteType,
      createdAt: Date.now(),
    });
  },
});

// Get User Notes
export const getUserNotes = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const notes = await ctx.db
      .query("adminNotes")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    // Enrich with admin info
    const enrichedNotes = await Promise.all(
      notes.map(async (note) => {
        const admin = await ctx.db.get(note.adminId);
        return {
          ...note,
          admin: admin ? { firstName: admin.firstName, lastName: admin.lastName } : null,
        };
      })
    );

    return enrichedNotes;
  },
});

// Update Admin Note
export const updateNote = mutation({
  args: {
    noteId: v.id("adminNotes"),
    note: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.noteId, {
      note: args.note,
      updatedAt: Date.now(),
    });
  },
});

// Delete Admin Note
export const deleteNote = mutation({
  args: { noteId: v.id("adminNotes") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.noteId);
  },
});

// Get risk distribution for charts
export const getRiskDistribution = query({
  args: {},
  handler: async (ctx) => {
    const results = await ctx.db.query("assessmentResults").collect();

    const distribution = {
      MINIMAL: 0,
      LOW_MODERATE: 0,
      MODERATE_HIGH: 0,
      HIGH: 0,
      CRITICAL: 0,
    };

    for (const result of results) {
      distribution[result.riskLevel]++;
    }

    return distribution;
  },
});

// Resend assessment invitation
export const resendInvitation = mutation({
  args: { assessmentId: v.id("assessments") },
  handler: async (ctx, args) => {
    const assessment = await ctx.db.get(args.assessmentId);
    if (!assessment) throw new Error("Assessment not found");

    // Generate new token and extend expiration
    const invitationToken =
      Math.random().toString(36).substring(2) + Date.now().toString(36);

    await ctx.db.patch(args.assessmentId, {
      invitationToken,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      invitedAt: Date.now(),
    });

    // TODO: Send email via action
    return invitationToken;
  },
});
