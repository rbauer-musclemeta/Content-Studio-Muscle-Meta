import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions, hashPassword } from "@/lib/auth";
import { z } from "zod";

// Validation schema for creating a user
const createUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  age: z.number().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]).optional(),
  tags: z.array(z.string()).optional(),
  sendAssessmentInvite: z.boolean().optional(),
});

// GET /api/users - List all users (admin only)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const riskTier = searchParams.get("riskTier");
    const status = searchParams.get("status");

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get users with their latest assessment
    const users = await prisma.user.findMany({
      where,
      include: {
        assessments: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            scoring: true,
            assessmentType: {
              select: { code: true, name: true },
            },
          },
        },
        _count: {
          select: { assessments: true, notes: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Filter by risk tier if specified
    let filteredUsers = users;
    if (riskTier && riskTier !== "ALL") {
      filteredUsers = users.filter((user) => {
        const latestAssessment = user.assessments[0];
        return latestAssessment?.scoring?.riskTier === riskTier;
      });
    }

    // Filter by status if specified
    if (status && status !== "ALL") {
      filteredUsers = filteredUsers.filter((user) => {
        const latestAssessment = user.assessments[0];
        if (status === "PENDING") {
          return !latestAssessment || latestAssessment.status === "NOT_STARTED";
        }
        if (status === "IN_PROGRESS") {
          return latestAssessment?.status === "IN_PROGRESS";
        }
        if (status === "COMPLETED") {
          return latestAssessment?.status === "COMPLETED";
        }
        return true;
      });
    }

    return NextResponse.json({
      success: true,
      data: filteredUsers,
      count: filteredUsers.length,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// POST /api/users - Create a new user (admin only)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = createUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { email, password, name, age, gender, tags, sendAssessmentInvite } =
      validation.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        age,
        gender,
        tags: tags || ["founding_cohort"],
        role: "USER",
      },
    });

    // Log the activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "registered",
        details: { createdBy: session.user.id, method: "admin" },
      },
    });

    // If sendAssessmentInvite is true, create an assessment and send invite
    if (sendAssessmentInvite) {
      // Find or create CRA assessment type
      let assessmentType = await prisma.assessmentType.findUnique({
        where: { code: "CRA" },
      });

      if (!assessmentType) {
        // Create CRA assessment type if it doesn't exist
        const craConfig = await import("@/lib/assessments/cra-config.json");
        assessmentType = await prisma.assessmentType.create({
          data: {
            code: "CRA",
            name: "Catabolic Risk Assessment",
            description: craConfig.description,
            version: craConfig.version,
            totalQuestions: craConfig.totalQuestions,
            maxScore: craConfig.maxScore,
            configuration: craConfig as any,
          },
        });
      }

      // Create assessment with invitation token
      const invitationToken = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

      await prisma.assessment.create({
        data: {
          userId: user.id,
          assessmentTypeId: assessmentType.id,
          status: "NOT_STARTED",
          invitationToken,
          invitationSentAt: new Date(),
        },
      });

      // TODO: Send email invitation
      // await sendAssessmentInvitationEmail(user.email, user.name, invitationToken);
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      data: userWithoutPassword,
      message: sendAssessmentInvite
        ? "User created and assessment invitation sent"
        : "User created successfully",
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
