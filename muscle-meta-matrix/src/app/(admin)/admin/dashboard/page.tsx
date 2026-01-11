"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import Link from "next/link";
import { Users, FileCheck, AlertTriangle, TrendingUp, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminDashboard() {
  const stats = useQuery(api.admin.getDashboardStats);
  const recentUsers = useQuery(api.admin.getRecentUsers, { limit: 5 });
  const recentAssessments = useQuery(api.admin.getRecentAssessments, {
    limit: 5,
  });

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-1 text-gray-600">
          Overview of your Muscle-Meta Matrix platform
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.totalUsers}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                +{stats.newUsersThisWeek} this week
              </p>
            </div>
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-teal-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Assessments Completed
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.completedAssessments}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.pendingAssessments} pending
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FileCheck className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                High Risk Users
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.highRiskUsers}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.criticalRiskUsers} critical
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Avg. Risk Score
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.avgRiskScore.toFixed(1)}
              </p>
              <p className="text-xs text-gray-500 mt-1">out of 200</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Recent Users */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Users
            </h2>
            <Link
              href="/admin/users"
              className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center"
            >
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          {recentUsers && recentUsers.length > 0 ? (
            <div className="space-y-3">
              {recentUsers.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                      <span className="text-teal-600 font-medium text-sm">
                        {user.firstName?.[0] || user.email[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {user.firstName
                          ? `${user.firstName} ${user.lastName || ""}`
                          : user.email}
                      </p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "text-xs px-2 py-1 rounded-full",
                      user.status === "ACTIVE" &&
                        "bg-green-100 text-green-700",
                      user.status === "PENDING_ASSESSMENT" &&
                        "bg-yellow-100 text-yellow-700",
                      user.status === "INACTIVE" && "bg-gray-100 text-gray-700"
                    )}
                  >
                    {user.status.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No users yet</p>
          )}
        </div>

        {/* Recent Assessments */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Assessments
            </h2>
            <Link
              href="/admin/assessments"
              className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center"
            >
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          {recentAssessments && recentAssessments.length > 0 ? (
            <div className="space-y-3">
              {recentAssessments.map((assessment) => (
                <div
                  key={assessment._id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {assessment.user?.firstName
                        ? `${assessment.user.firstName} ${assessment.user.lastName || ""}`
                        : assessment.user?.email || "Unknown User"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {assessment.type} -{" "}
                      {assessment.completedAt
                        ? new Date(assessment.completedAt).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                  {assessment.result && (
                    <span
                      className={cn(
                        "text-xs px-2 py-1 rounded-full font-medium",
                        assessment.result.riskLevel === "MINIMAL" &&
                          "bg-green-100 text-green-700",
                        assessment.result.riskLevel === "LOW_MODERATE" &&
                          "bg-yellow-100 text-yellow-700",
                        assessment.result.riskLevel === "MODERATE_HIGH" &&
                          "bg-orange-100 text-orange-700",
                        assessment.result.riskLevel === "HIGH" &&
                          "bg-red-100 text-red-700",
                        assessment.result.riskLevel === "CRITICAL" &&
                          "bg-red-200 text-red-800"
                      )}
                    >
                      {assessment.result.riskLevel.replace("_", " ")}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No completed assessments yet
            </p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/users?action=invite"
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium text-sm"
          >
            Invite New User
          </Link>
          <Link
            href="/admin/assessments?status=pending"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
          >
            View Pending Assessments
          </Link>
          <Link
            href="/admin/users?filter=high-risk"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
          >
            View High Risk Users
          </Link>
        </div>
      </div>
    </div>
  );
}
