import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create or update user from Clerk webhook
export const syncUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existing) {
      // Update existing user
      await ctx.db.patch(existing._id, {
        email: args.email,
        firstName: args.firstName,
        lastName: args.lastName,
        updatedAt: Date.now(),
        lastLoginAt: Date.now(),
      });
      return existing._id;
    }

    // Create new user
    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      role: "USER", // Default role
      status: "PENDING_ASSESSMENT",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastLoginAt: Date.now(),
    });
  },
});

// Get current user by Clerk ID
export const getCurrentUser = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
  },
});

// Get user by ID (for admin)
export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

// List all users (admin only)
export const listUsers = query({
  args: {
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let users;

    if (args.status) {
      users = await ctx.db
        .query("users")
        .withIndex("by_status", (q) =>
          q.eq("status", args.status as "ACTIVE" | "PENDING_ASSESSMENT" | "INACTIVE")
        )
        .order("desc")
        .take(args.limit ?? 100);
    } else {
      users = await ctx.db
        .query("users")
        .order("desc")
        .take(args.limit ?? 100);
    }

    return users;
  },
});

// Update user role (admin only)
export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("USER"), v.literal("ADMIN")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      role: args.role,
      updatedAt: Date.now(),
    });
  },
});

// Update user profile
export const updateUserProfile = mutation({
  args: {
    userId: v.id("users"),
    profile: v.object({
      age: v.optional(v.number()),
      gender: v.optional(v.union(
        v.literal("male"),
        v.literal("female"),
        v.literal("other"),
        v.literal("prefer_not_to_say")
      )),
      height: v.optional(v.number()),
      weight: v.optional(v.number()),
      primaryGoal: v.optional(v.string()),
      healthConditions: v.optional(v.array(v.string())),
      medications: v.optional(v.array(v.string())),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      profile: args.profile,
      updatedAt: Date.now(),
    });
  },
});

// Update user status
export const updateUserStatus = mutation({
  args: {
    userId: v.id("users"),
    status: v.union(
      v.literal("ACTIVE"),
      v.literal("PENDING_ASSESSMENT"),
      v.literal("INACTIVE")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

// Get user with their assessments
export const getUserWithAssessments = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    const assessments = await ctx.db
      .query("assessments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    // Get results for completed assessments
    const assessmentsWithResults = await Promise.all(
      assessments.map(async (assessment) => {
        if (assessment.status === "COMPLETED") {
          const result = await ctx.db
            .query("assessmentResults")
            .withIndex("by_assessment", (q) => q.eq("assessmentId", assessment._id))
            .first();
          return { ...assessment, result };
        }
        return { ...assessment, result: null };
      })
    );

    return {
      ...user,
      assessments: assessmentsWithResults,
    };
  },
});
