"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import Link from "next/link";
import { Search, ChevronDown, Eye, FileText, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminAssessmentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const assessments = useQuery(api.admin.getAllAssessments, {
    status: statusFilter || undefined,
    limit: 100,
  });

  const filteredAssessments = assessments?.filter((assessment) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      assessment.user?.email.toLowerCase().includes(search) ||
      assessment.user?.firstName?.toLowerCase().includes(search) ||
      assessment.user?.lastName?.toLowerCase().includes(search)
    );
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "IN_PROGRESS":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "NOT_STARTED":
        return <FileText className="w-4 h-4 text-gray-400" />;
      case "EXPIRED":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Assessments</h1>
        <p className="mt-1 text-gray-600">
          View and manage all user assessments
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by user name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
        <div className="relative">
          <select
            value={statusFilter || ""}
            onChange={(e) => setStatusFilter(e.target.value || null)}
            className="appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
          >
            <option value="">All Status</option>
            <option value="NOT_STARTED">Not Started</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="EXPIRED">Expired</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Assessments Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAssessments?.map((assessment) => (
                <tr key={assessment._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="font-medium text-gray-900">
                        {assessment.user?.firstName
                          ? `${assessment.user.firstName} ${assessment.user.lastName || ""}`
                          : assessment.user?.email || "Unknown"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {assessment.user?.email}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {assessment.type === "CRA"
                        ? "Catabolic Risk"
                        : assessment.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(assessment.status)}
                      <span
                        className={cn(
                          "text-xs px-2 py-1 rounded-full font-medium",
                          assessment.status === "COMPLETED" &&
                            "bg-green-100 text-green-700",
                          assessment.status === "IN_PROGRESS" &&
                            "bg-yellow-100 text-yellow-700",
                          assessment.status === "NOT_STARTED" &&
                            "bg-gray-100 text-gray-700",
                          assessment.status === "EXPIRED" &&
                            "bg-red-100 text-red-700"
                        )}
                      >
                        {assessment.status.replace("_", " ")}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-teal-600 h-2 rounded-full"
                          style={{
                            width: `${(assessment.currentQuestionIndex / assessment.totalQuestions) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm text-gray-500">
                        {assessment.currentQuestionIndex}/{assessment.totalQuestions}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {assessment.result ? (
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
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {assessment.completedAt
                      ? new Date(assessment.completedAt).toLocaleDateString()
                      : assessment.invitedAt
                        ? new Date(assessment.invitedAt).toLocaleDateString()
                        : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <Link
                      href={
                        assessment.status === "COMPLETED"
                          ? `/admin/assessments/${assessment._id}/results`
                          : `/admin/users/${assessment.userId}`
                      }
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 inline-flex"
                      title="View Details"
                    >
                      <Eye className="w-5 h-5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredAssessments?.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No assessments found</p>
          </div>
        )}
      </div>
    </div>
  );
}
