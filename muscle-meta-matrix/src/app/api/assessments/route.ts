import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET /api/assessments - List assessments
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");
    const type = searchParams.get("type");

    // Build where clause
    const where: any = {};

    // Non-admin users can only see their own assessments
    if (session.user.role !== "ADMIN") {
      where.userId = session.user.id;
    } else if (userId) {
      where.userId = userId;
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (type && type !== "ALL") {
      where.assessmentType = {
        code: type,
      };
    }

    const assessments = await prisma.assessment.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        assessmentType: {
          select: { code: true, name: true, maxScore: true },
        },
        scoring: true,
        _count: {
          select: { responses: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: assessments,
      count: assessments.length,
    });
  } catch (error) {
    console.error("Error fetching assessments:", error);
    return NextResponse.json(
      { error: "Failed to fetch assessments" },
      { status: 500 }
    );
  }
}

// POST /api/assessments - Create a new assessment (admin only or for invited users)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { userId, assessmentTypeCode } = body;

    // Only admins can create assessments for other users
    if (!session || (session.user.role !== "ADMIN" && session.user.id !== userId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find the assessment type
    let assessmentType = await prisma.assessmentType.findUnique({
      where: { code: assessmentTypeCode || "CRA" },
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

    // Generate invitation token
    const invitationToken = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

    // Create the assessment
    const assessment = await prisma.assessment.create({
      data: {
        userId,
        assessmentTypeId: assessmentType.id,
        status: "NOT_STARTED",
        invitationToken,
        invitationSentAt: session.user.role === "ADMIN" ? new Date() : null,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        assessmentType: {
          select: { code: true, name: true, maxScore: true },
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId,
        action: "assessment_created",
        details: {
          assessmentId: assessment.id,
          assessmentType: assessmentType.code,
          createdBy: session.user.id,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: assessment,
    });
  } catch (error) {
    console.error("Error creating assessment:", error);
    return NextResponse.json(
      { error: "Failed to create assessment" },
      { status: 500 }
    );
  }
}
