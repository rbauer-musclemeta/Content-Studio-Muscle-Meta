import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { calculateCRAScore, generateRecommendations } from "@/lib/assessments/scoring-engine";
import type { ResponseValue } from "@/lib/assessments/scoring-engine";

// POST /api/assessments/[id]/submit - Submit and score an assessment
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the assessment with all responses
    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: {
        responses: true,
        assessmentType: true,
        user: true,
      },
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

    // Check if already completed
    if (assessment.status === "COMPLETED") {
      return NextResponse.json(
        { error: "Assessment already completed" },
        { status: 400 }
      );
    }

    // Transform responses for scoring
    const responseValues: ResponseValue[] = assessment.responses.map((r) => ({
      questionId: r.questionId,
      sectionId: r.sectionId,
      value: r.value as string | string[] | number,
      score: r.score,
    }));

    // Calculate score
    const scoringResult = calculateCRAScore(responseValues);

    // Generate recommendations
    const recommendations = generateRecommendations(scoringResult);

    // Calculate time spent
    const startTime = assessment.startedAt || assessment.createdAt;
    const timeSpentSeconds = Math.floor(
      (new Date().getTime() - startTime.getTime()) / 1000
    );

    // Save scoring result
    await prisma.scoringResult.create({
      data: {
        assessmentId: id,
        totalScore: scoringResult.totalScore,
        maxScore: scoringResult.maxScore,
        percentScore: scoringResult.percentScore,
        riskTier: scoringResult.riskTier,
        sectionScores: scoringResult.sectionScores,
        criticalFlags: scoringResult.criticalFlags,
        highFlags: scoringResult.highFlags,
        protectiveFactors: scoringResult.protectiveFactors,
        recommendations: recommendations,
      },
    });

    // Update assessment status
    await prisma.assessment.update({
      where: { id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        timeSpentSeconds,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: assessment.userId,
        action: "assessment_completed",
        details: {
          assessmentId: id,
          assessmentType: assessment.assessmentType.code,
          riskTier: scoringResult.riskTier,
          score: scoringResult.totalScore,
        },
      },
    });

    // Add system note
    await prisma.userNote.create({
      data: {
        userId: assessment.userId,
        noteType: "SYSTEM",
        content: `Completed ${assessment.assessmentType.name} - ${scoringResult.riskTier} RISK (${scoringResult.totalScore}/${scoringResult.maxScore} points)`,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        assessmentId: id,
        scoring: {
          ...scoringResult,
          recommendations,
        },
        timeSpentSeconds,
        completedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Error submitting assessment:", error);
    return NextResponse.json(
      { error: "Failed to submit assessment" },
      { status: 500 }
    );
  }
}
