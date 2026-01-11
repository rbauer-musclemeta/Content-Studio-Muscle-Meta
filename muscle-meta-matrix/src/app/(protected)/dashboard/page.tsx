"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import Link from "next/link";
import { ArrowRight, FileText, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { userId } = useAuth();

  const user = useQuery(
    api.users.getCurrentUser,
    userId ? { clerkId: userId } : "skip"
  );

  const assessments = useQuery(
    api.assessments.getUserAssessments,
    user?._id ? { userId: user._id } : "skip"
  );

  const latestResult = useQuery(
    api.assessments.getResultsByUser,
    user?._id ? { userId: user._id } : "skip"
  );

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    );
  }

  const pendingAssessment = assessments?.find(
    (a) => a.status === "NOT_STARTED" || a.status === "IN_PROGRESS"
  );
  const completedAssessments = assessments?.filter(
    (a) => a.status === "COMPLETED"
  );
  const latestResultData = latestResult?.[0];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user.firstName || "there"}!
        </h1>
        <p className="mt-1 text-gray-600">
          {user.status === "PENDING_ASSESSMENT"
            ? "Complete your assessment to get personalized insights."
            : "Track your muscle-metabolic health journey."}
        </p>
      </div>

      {/* CTA Card - Pending Assessment */}
      {pendingAssessment && (
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                {pendingAssessment.status === "NOT_STARTED"
                  ? "Start Your Catabolic Risk Assessment"
                  : "Continue Your Assessment"}
              </h2>
              <p className="mt-2 text-teal-100">
                {pendingAssessment.status === "NOT_STARTED"
                  ? "Take 10-15 minutes to complete your personalized muscle-metabolic health assessment."
                  : `You've completed ${pendingAssessment.currentQuestionIndex} of ${pendingAssessment.totalQuestions} questions.`}
              </p>
              <Link
                href={`/assessments/${pendingAssessment._id}`}
                className="inline-flex items-center mt-4 px-4 py-2 bg-white text-teal-600 rounded-lg font-medium hover:bg-teal-50 transition-colors"
              >
                {pendingAssessment.status === "NOT_STARTED"
                  ? "Start Assessment"
                  : "Continue Assessment"}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </div>
            <div className="hidden sm:block">
              <FileText className="w-16 h-16 text-teal-200" />
            </div>
          </div>
        </div>
      )}

      {/* Latest Results Summary */}
      {latestResultData && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Your Latest Results
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-gray-900">
                {latestResultData.totalScore}
              </p>
              <p className="text-sm text-gray-600">Risk Score</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p
                className={cn(
                  "text-xl font-semibold",
                  latestResultData.riskLevel === "MINIMAL" && "text-green-600",
                  latestResultData.riskLevel === "LOW_MODERATE" &&
                    "text-yellow-600",
                  latestResultData.riskLevel === "MODERATE_HIGH" &&
                    "text-orange-600",
                  latestResultData.riskLevel === "HIGH" && "text-red-600",
                  latestResultData.riskLevel === "CRITICAL" && "text-red-700"
                )}
              >
                {latestResultData.riskLevel.replace("_", " ")}
              </p>
              <p className="text-sm text-gray-600">Risk Level</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-gray-900">
                {latestResultData.criticalAlerts.length}
              </p>
              <p className="text-sm text-gray-600">Alerts</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-gray-900">
                {latestResultData.pathways.length}
              </p>
              <p className="text-sm text-gray-600">Pathways</p>
            </div>
          </div>
          <Link
            href={`/assessments/${latestResultData.assessmentId}/results`}
            className="inline-flex items-center mt-4 text-teal-600 hover:text-teal-700 font-medium"
          >
            View Full Results
            <ArrowRight className="ml-1 w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Assessment History */}
      {completedAssessments && completedAssessments.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Assessment History
          </h2>
          <div className="space-y-3">
            {completedAssessments.map((assessment) => (
              <div
                key={assessment._id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {assessment.type === "CRA"
                        ? "Catabolic Risk Assessment"
                        : assessment.type}
                    </p>
                    <p className="text-sm text-gray-500">
                      Completed{" "}
                      {assessment.completedAt
                        ? new Date(assessment.completedAt).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/assessments/${assessment._id}/results`}
                  className="text-teal-600 hover:text-teal-700 text-sm font-medium"
                >
                  View Results
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!pendingAssessment &&
        (!completedAssessments || completedAssessments.length === 0) && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              No Assessments Yet
            </h2>
            <p className="text-gray-600 mb-4">
              You don't have any assessments assigned yet. Contact your
              administrator to get started.
            </p>
          </div>
        )}
    </div>
  );
}
