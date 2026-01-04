import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, TrendingUp, CheckCircle, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { RiskTierBadge } from "@/components/assessment/RiskTierBadge";

async function getUserData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      assessments: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          scoring: true,
          assessmentType: {
            select: { code: true, name: true, maxScore: true },
          },
        },
      },
    },
  });

  return user;
}

export default async function UserDashboardPage() {
  const session = await getServerSession(authOptions);
  const user = await getUserData(session!.user.id);

  if (!user) {
    return <div>Error loading user data</div>;
  }

  const latestAssessment = user.assessments.find(
    (a) => a.status === "COMPLETED"
  );
  const pendingAssessments = user.assessments.filter(
    (a) => a.status === "NOT_STARTED" || a.status === "IN_PROGRESS"
  );

  return (
    <div>
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {user.name?.split(" ")[0]}!
        </h1>
        <p className="text-gray-500">
          Track your muscle health and catabolic risk
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Current Risk Status */}
        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Your Risk Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {latestAssessment?.scoring ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <RiskTierBadge
                    tier={latestAssessment.scoring.riskTier as any}
                    score={latestAssessment.scoring.totalScore}
                    maxScore={latestAssessment.assessmentType.maxScore}
                    size="lg"
                  />
                </div>
                <p className="text-sm text-gray-600">
                  Based on your {latestAssessment.assessmentType.name} completed
                  on {formatDate(latestAssessment.completedAt!)}
                </p>
                <Link href={`/assessments/${latestAssessment.id}/results`}>
                  <Button variant="outline" size="sm">
                    View Full Results
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-500">No assessment completed yet</p>
                {pendingAssessments.length > 0 && (
                  <Link href={`/assessments/${pendingAssessments[0].id}`}>
                    <Button>Start Your Assessment</Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Assessments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Pending Assessments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingAssessments.length === 0 ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span>All caught up!</span>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingAssessments.map((assessment) => (
                  <Link
                    key={assessment.id}
                    href={`/assessments/${assessment.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="font-medium">
                        {assessment.assessmentType.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {assessment.status === "IN_PROGRESS"
                          ? "Continue where you left off"
                          : "Ready to start"}
                      </p>
                    </div>
                    <Badge
                      variant={
                        assessment.status === "IN_PROGRESS"
                          ? "secondary"
                          : "default"
                      }
                    >
                      {assessment.status === "IN_PROGRESS"
                        ? "In Progress"
                        : "Start"}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Tips */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Tips</CardTitle>
            <CardDescription>
              Ways to reduce your catabolic risk
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <span>
                  Aim for 1.2-1.6g protein per kg body weight daily
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <span>Include resistance training 2-3 times per week</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <span>Get 7-9 hours of quality sleep each night</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <span>Stay hydrated throughout the day</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Assessment History */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Assessment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user.assessments.filter((a) => a.status === "COMPLETED").length ===
          0 ? (
            <p className="text-gray-500">
              No completed assessments yet. Complete your first assessment to
              see your results here.
            </p>
          ) : (
            <div className="space-y-4">
              {user.assessments
                .filter((a) => a.status === "COMPLETED")
                .map((assessment) => (
                  <div
                    key={assessment.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div>
                      <p className="font-medium">
                        {assessment.assessmentType.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(assessment.completedAt!)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      {assessment.scoring && (
                        <RiskTierBadge
                          tier={assessment.scoring.riskTier as any}
                          score={assessment.scoring.totalScore}
                        />
                      )}
                      <Link href={`/assessments/${assessment.id}/results`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
