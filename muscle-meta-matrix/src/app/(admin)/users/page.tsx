"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserPlus, Search, MoreHorizontal, Eye, Mail, FileText, Loader2 } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  lastLoginAt: string | null;
  assessments: Array<{
    id: string;
    status: string;
    completedAt: string | null;
    scoring: {
      riskTier: string;
      totalScore: number;
    } | null;
    assessmentType: {
      code: string;
      name: string;
    };
  }>;
  _count: {
    assessments: number;
    notes: number;
  };
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    fetchUsers();
  }, [search, riskFilter, statusFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (riskFilter !== "ALL") params.append("riskTier", riskFilter);
      if (statusFilter !== "ALL") params.append("status", statusFilter);

      const response = await fetch(`/api/users?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadgeVariant = (riskTier: string) => {
    const variants: Record<string, "critical" | "high" | "moderate" | "low" | "minimal"> = {
      CRITICAL: "critical",
      HIGH: "high",
      MODERATE: "moderate",
      LOW: "low",
      MINIMAL: "minimal",
    };
    return variants[riskTier] || "secondary";
  };

  const getLatestAssessment = (user: User) => {
    return user.assessments?.[0] || null;
  };

  const getStatus = (user: User) => {
    const assessment = getLatestAssessment(user);
    if (!assessment) return { label: "No Assessment", color: "text-gray-500" };
    if (assessment.status === "COMPLETED")
      return { label: "Completed", color: "text-green-600" };
    if (assessment.status === "IN_PROGRESS")
      return { label: "In Progress", color: "text-yellow-600" };
    return { label: "Pending", color: "text-blue-600" };
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-500">Manage founding cohort members</p>
        </div>
        <Link href="/admin/users/create">
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Create User
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={riskFilter} onValueChange={setRiskFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Risk Tier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Tiers</SelectItem>
            <SelectItem value="CRITICAL">Critical</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="MODERATE">Moderate</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
            <SelectItem value="MINIMAL">Minimal</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Risk Tier</TableHead>
              <TableHead>Last Assessment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-gray-500"
                >
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => {
                const assessment = getLatestAssessment(user);
                const status = getStatus(user);
                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-gray-500">{user.email}</TableCell>
                    <TableCell>
                      {assessment?.scoring ? (
                        <Badge variant={getRiskBadgeVariant(assessment.scoring.riskTier)}>
                          {assessment.scoring.riskTier} ({assessment.scoring.totalScore})
                        </Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {assessment?.completedAt
                        ? formatRelativeTime(assessment.completedAt)
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <span className={status.color}>{status.label}</span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/users/${user.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Profile
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="h-4 w-4 mr-2" />
                            Send Assessment
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <FileText className="h-4 w-4 mr-2" />
                            Generate Report
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
