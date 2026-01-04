import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  ClipboardCheck,
  AlertTriangle,
  TrendingDown,
} from "lucide-react";
import Link from "next/link";
import { formatRelativeTime } from "@/lib/utils";

async function getDashboardStats() {
  const [
    totalUsers,
    completedAssessments,
    highRiskUsers,
    recentActivity,
    avgScore,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "USER" } }),
    prisma.assessment.count({ where: { status: "COMPLETED" } }),
    prisma.scoringResult.count({
      where: { riskTier: { in: ["HIGH", "CRITICAL"] } },
    }),
    prisma.activityLog.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.scoringResult.aggregate({ _avg: { totalScore: true } }),
  ]);

  return {
    totalUsers,
    completedAssessments,
    highRiskUsers,
    recentActivity,
    avgScore: Math.round(avgScore._avg?.totalScore || 0),
  };
}

async function getHighRiskUsers() {
  const users = await prisma.user.findMany({
    where: {
      assessments: {
        some: {
          scoring: {
            riskTier: { in: ["HIGH", "CRITICAL"] },
          },
        },
      },
    },
    include: {
      assessments: {
        where: { status: "COMPLETED" },
        orderBy: { completedAt: "desc" },
        take: 1,
        include: { scoring: true },
      },
    },
    take: 5,
  });

  return users;
}

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  const stats = await getDashboardStats();
  const highRiskUsers = await getHighRiskUsers();

  const riskTierColors: Record<string, string> = {
    CRITICAL: "critical",
    HIGH: "high",
    MODERATE: "moderate",
    LOW: "low",
    MINIMAL: "minimal",
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">
          Welcome back, {session?.user.name?.split(" ")[0]}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Users
            </CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-gray-500">Founding cohort members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Completed Assessments
            </CardTitle>
            <ClipboardCheck className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.completedAssessments}
            </div>
            <p className="text-xs text-gray-500">
              {stats.totalUsers > 0
                ? Math.round(
                    (stats.completedAssessments / stats.totalUsers) * 100
                  )
                : 0}
              % completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              High Risk Users
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.highRiskUsers}
            </div>
            <p className="text-xs text-gray-500">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Average Score
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgScore}/400</div>
            <p className="text-xs text-gray-500">
              {stats.avgScore <= 80
                ? "Minimal"
                : stats.avgScore <= 160
                  ? "Low-Moderate"
                  : "Moderate-High"}{" "}
              risk average
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentActivity.length === 0 ? (
                <p className="text-sm text-gray-500">No recent activity</p>
              ) : (
                stats.recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 text-sm"
                  >
                    <div className="w-2 h-2 mt-2 rounded-full bg-primary" />
                    <div className="flex-1">
                      <p className="text-gray-700">
                        <span className="font-medium">
                          {activity.user.name}
                        </span>{" "}
                        {activity.action.replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatRelativeTime(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* High Risk Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Users Requiring Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {highRiskUsers.length === 0 ? (
                <p className="text-sm text-gray-500">No high-risk users</p>
              ) : (
                highRiskUsers.map((user) => {
                  const assessment = user.assessments[0];
                  const scoring = assessment?.scoring;
                  return (
                    <Link
                      key={user.id}
                      href={`/admin/users/${user.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                      {scoring && (
                        <Badge
                          variant={
                            riskTierColors[scoring.riskTier] as
                              | "critical"
                              | "high"
                              | "moderate"
                              | "low"
                              | "minimal"
                          }
                        >
                          {scoring.riskTier} ({scoring.totalScore})
                        </Badge>
                      )}
                    </Link>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="flex gap-4">
          <Link
            href="/admin/users/create"
            className="inline-flex items-center justify-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Users className="h-4 w-4 mr-2" />
            Create User
          </Link>
          <Link
            href="/admin/users"
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            View All Users
          </Link>
          <Link
            href="/admin/assessments"
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            View Assessments
          </Link>
        </div>
      </div>
    </div>
  );
}
