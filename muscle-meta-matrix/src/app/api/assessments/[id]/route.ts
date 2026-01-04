import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET /api/assessments/[id] - Get a single assessment
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    // Check for invitation token in query params (for non-authenticated users)
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    let assessment;

    if (token) {
      // Fetch by invitation token
      assessment = await prisma.assessment.findFirst({
        where: {
          OR: [
            { id, invitationToken: token },
            { invitationToken: token },
          ],
        },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          assessmentType: true,
          responses: true,
          scoring: true,
        },
      });
    } else {
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      assessment = await prisma.assessment.findUnique({
        where: { id },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          assessmentType: true,
          responses: true,
          scoring: true,
        },
      });

      // Non-admin users can only view their own assessments
      if (
        assessment &&
        session.user.role !== "ADMIN" &&
        assessment.userId !== session.user.id
      ) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    if (!assessment) {
      return NextResponse.json(
        { error: "Assessment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: assessment,
    });
  } catch (error) {
    console.error("Error fetching assessment:", error);
    return NextResponse.json(
      { error: "Failed to fetch assessment" },
      { status: 500 }
    );
  }
}

// PATCH /api/assessments/[id] - Update assessment (save progress)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { responses, currentQuestionIndex, status } = body;

    // Get the assessment
    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: { assessmentType: true },
    });

    if (!assessment) {
      return NextResponse.json(
        { error: "Assessment not found" },
        { status: 404 }
      );
    }

    // Check permissions
    if (
      session.user.role !== "ADMIN" &&
      assessment.userId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update responses if provided
    if (responses && Array.isArray(responses)) {
      for (const response of responses) {
        await prisma.assessmentResponse.upsert({
          where: {
            assessmentId_questionId: {
              assessmentId: id,
              questionId: response.questionId,
            },
          },
          update: {
            value: response.value,
            score: response.score,
            sectionId: response.sectionId,
            questionType: response.questionType,
            updatedAt: new Date(),
          },
          create: {
            assessmentId: id,
            questionId: response.questionId,
            sectionId: response.sectionId,
            questionType: response.questionType,
            value: response.value,
            score: response.score,
          },
        });
      }
    }

    // Update assessment
    const updateData: any = {
      lastSavedAt: new Date(),
    };

    if (currentQuestionIndex !== undefined) {
      updateData.currentQuestionIndex = currentQuestionIndex;
    }

    if (status) {
      updateData.status = status;
      if (status === "IN_PROGRESS" && !assessment.startedAt) {
        updateData.startedAt = new Date();
      }
    }

    const updatedAssessment = await prisma.assessment.update({
      where: { id },
      data: updateData,
      include: {
        responses: true,
        assessmentType: {
          select: { code: true, name: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedAssessment,
    });
  } catch (error) {
    console.error("Error updating assessment:", error);
    return NextResponse.json(
      { error: "Failed to update assessment" },
      { status: 500 }
    );
  }
}

// DELETE /api/assessments/[id] - Delete an assessment (admin only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.assessment.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Assessment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting assessment:", error);
    return NextResponse.json(
      { error: "Failed to delete assessment" },
      { status: 500 }
    );
  }
}
