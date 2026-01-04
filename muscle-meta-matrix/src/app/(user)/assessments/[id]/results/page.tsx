import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  RiskTierBadge,
  RiskScoreVisual,
} from "@/components/assessment/RiskTierBadge";
import {
  ArrowLeft,
  Download,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Book,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { RiskTierKey } from "@/lib/types";

interface Recommendations {
  immediate: string[];
  shortTerm: string[];
  resources: string[];
}

async function getAssessmentResults(assessmentId: string, userId: string) {
  const assessment = await prisma.assessment.findFirst({
    where: {
      id: assessmentId,
      userId,
      status: "COMPLETED",
    },
    include: {
      scoring: true,
      assessmentType: {
        select: { code: true, name: true, maxScore: true },
      },
    },
  });

  return assessment;
}

export default async function AssessmentResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const { id } = await params;
  const assessment = await getAssessmentResults(id, session.user.id);

  if (!assessment || !assessment.scoring) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-gray-500">Assessment results not found</p>
            <Link href="/dashboard">
              <Button className="mt-4">Return to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { scoring } = assessment;
  const sectionScores = scoring.sectionScores as Record<
    string,
    { sectionName: string; score: number; maxScore: number; percentScore: number }
  >;
  const recommendations = scoring.recommendations as Recommendations | null;

  // Get priority areas (top 3 highest scoring sections)
  const priorityAreas = Object.values(sectionScores)
    .filter((s) => s.score > 0)
    .sort((a, b) => b.percentScore - a.percentScore)
    .slice(0, 3);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {assessment.assessmentType.name} Results
            </h1>
            <p className="text-gray-500">
              Completed on {formatDate(assessment.completedAt!)}
            </p>
          </div>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Risk Score Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Your Risk Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1">
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {scoring.totalScore}/{scoring.maxScore} points
              </div>
              <RiskTierBadge
                tier={scoring.riskTier as RiskTierKey}
                showPercentage
                size="lg"
              />
            </div>
            <div className="flex-1">
              <RiskScoreVisual
                score={scoring.totalScore}
                maxScore={scoring.maxScore}
              />
            </div>
          </div>

          {/* Risk Tier Explanation */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">What This Means</h4>
            <p className="text-sm text-gray-600">
              {scoring.riskTier === "CRITICAL" &&
                "Your assessment indicates CRITICAL risk for muscle loss and functional decline. This requires immediate attention and structured intervention with professional guidance."}
              {scoring.riskTier === "HIGH" &&
                "Your assessment indicates HIGH risk for muscle loss. This requires structured intervention and monitoring to prevent further decline."}
              {scoring.riskTier === "MODERATE" &&
                "Your assessment indicates MODERATE risk. With targeted interventions, you can significantly reduce your risk and improve your muscle health."}
              {scoring.riskTier === "LOW" &&
                "Your assessment indicates LOW risk. Continue your current healthy habits and consider the recommendations to optimize your muscle health."}
              {scoring.riskTier === "MINIMAL" &&
                "Excellent! Your assessment indicates MINIMAL risk. Your current lifestyle supports good muscle health. Keep up the great work!"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Priority Areas */}
      {priorityAreas.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Your Priority Areas
            </CardTitle>
            <CardDescription>
              Focus on these areas to reduce your catabolic risk
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {priorityAreas.map((area, index) => (
                <div key={area.sectionName} className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{area.sectionName}</span>
                      <span className="text-sm text-gray-500">
                        {area.score}/{area.maxScore} points
                      </span>
                    </div>
                    <Progress value={area.percentScore} className="h-2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section Breakdown */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Score Breakdown by Section</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {Object.values(sectionScores).map((section) => (
              <div
                key={section.sectionName}
                className="p-4 border rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{section.sectionName}</span>
                  <span className="text-sm">
                    {section.score}/{section.maxScore}
                  </span>
                </div>
                <Progress value={section.percentScore} className="h-2" />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-500">
                    {section.percentScore}%
                  </span>
                  <span className="text-xs text-gray-500">
                    {section.percentScore <= 20
                      ? "Low"
                      : section.percentScore <= 40
                        ? "Moderate"
                        : "High"}{" "}
                    risk
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Flags */}
      {(scoring.criticalFlags.length > 0 || scoring.highFlags.length > 0) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Identified Risk Factors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {scoring.criticalFlags.length > 0 && (
              <div>
                <h4 className="font-medium text-red-600 mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Critical Factors
                </h4>
                <div className="flex flex-wrap gap-2">
                  {scoring.criticalFlags.map((flag) => (
                    <Badge key={flag} variant="critical">
                      {flag.replace(/_/g, " ")}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {scoring.highFlags.length > 0 && (
              <div>
                <h4 className="font-medium text-orange-600 mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  High Priority Factors
                </h4>
                <div className="flex flex-wrap gap-2">
                  {scoring.highFlags.map((flag) => (
                    <Badge key={flag} variant="high">
                      {flag.replace(/_/g, " ")}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Protective Factors */}
      {scoring.protectiveFactors.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Your Protective Factors
            </CardTitle>
            <CardDescription>
              These factors are helping reduce your risk - keep them up!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {scoring.protectiveFactors.map((factor) => (
                <Badge key={factor} variant="minimal">
                  {factor.replace(/_/g, " ")}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {recommendations && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Book className="h-5 w-5" />
              Personalized Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {recommendations.immediate.length > 0 && (
              <div>
                <h4 className="font-medium text-red-600 mb-3">
                  Immediate Actions (This Week)
                </h4>
                <ul className="space-y-2">
                  {recommendations.immediate.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <div className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {recommendations.shortTerm.length > 0 && (
              <div>
                <h4 className="font-medium text-orange-600 mb-3">
                  Short-Term Goals (1-4 Weeks)
                </h4>
                <ul className="space-y-2">
                  {recommendations.shortTerm.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <div className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {recommendations.resources.length > 0 && (
              <div>
                <h4 className="font-medium text-primary mb-3">
                  Recommended Resources
                </h4>
                <ul className="space-y-2">
                  {recommendations.resources.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center flex-shrink-0">
              1
            </div>
            <div>
              <p className="font-medium">Review this report with your healthcare provider</p>
              <p className="text-sm text-gray-500">
                Share your results and recommendations with your doctor or physical therapist
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center flex-shrink-0">
              2
            </div>
            <div>
              <p className="font-medium">Begin recommended interventions</p>
              <p className="text-sm text-gray-500">
                Start with the immediate actions listed above
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center flex-shrink-0">
              3
            </div>
            <div>
              <p className="font-medium">Schedule a reassessment in 2-4 weeks</p>
              <p className="text-sm text-gray-500">
                Track your progress and adjust your plan as needed
              </p>
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download PDF Report
            </Button>
            <Link href="/dashboard">
              <Button>Return to Dashboard</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
