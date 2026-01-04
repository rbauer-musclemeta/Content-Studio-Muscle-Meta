"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  Mail,
  FileText,
  ClipboardList,
  Plus,
  Loader2,
  User as UserIcon,
  Calendar,
  Clock,
} from "lucide-react";
import { formatDate, formatDateTime, formatRelativeTime } from "@/lib/utils";

interface UserData {
  id: string;
  name: string;
  email: string;
  age: number | null;
  gender: string | null;
  tags: string[];
  subscriptionTier: string | null;
  subscriptionStatus: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  assessments: Array<{
    id: string;
    status: string;
    startedAt: string | null;
    completedAt: string | null;
    timeSpentSeconds: number;
    assessmentType: {
      code: string;
      name: string;
      maxScore: number;
    };
    scoring: {
      totalScore: number;
      percentScore: number;
      riskTier: string;
      sectionScores: Record<string, any>;
      criticalFlags: string[];
      highFlags: string[];
    } | null;
  }>;
  notes: Array<{
    id: string;
    content: string;
    noteType: string;
    createdAt: string;
  }>;
  activityLogs: Array<{
    id: string;
    action: string;
    createdAt: string;
    details: any;
  }>;
}

export default function UserDetailPage() {
  const params = useParams();
  const userId = params.id as string;
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    try {
      const response = await fetch(`/api/users/${userId}`);
      const data = await response.json();
      if (data.success) {
        setUser(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
    } finally {
      setLoading(false);
    }
  };

  const addNote = async () => {
    if (!newNote.trim()) return;

    setSavingNote(true);
    try {
      const response = await fetch(`/api/users/${userId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newNote }),
      });

      if (response.ok) {
        setNewNote("");
        fetchUser();
      }
    } catch (error) {
      console.error("Failed to add note:", error);
    } finally {
      setSavingNote(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8">
        <p className="text-gray-500">User not found</p>
      </div>
    );
  }

  const latestAssessment = user.assessments[0];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/users"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Users
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
            <p className="text-gray-500">{user.email}</p>
            {latestAssessment?.scoring && (
              <div className="mt-2">
                <Badge
                  variant={getRiskBadgeVariant(latestAssessment.scoring.riskTier)}
                  className="text-sm"
                >
                  {latestAssessment.scoring.riskTier} RISK (
                  {latestAssessment.scoring.totalScore}/
                  {latestAssessment.assessmentType.maxScore})
                </Badge>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Mail className="h-4 w-4 mr-2" />
              Send Email
            </Button>
            <Button variant="outline">
              <ClipboardList className="h-4 w-4 mr-2" />
              Send Assessment
            </Button>
            <Button>
              <FileText className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="assessments">
            Assessments ({user.assessments.length})
          </TabsTrigger>
          <TabsTrigger value="notes">Notes ({user.notes.length})</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-gray-500">Full Name</label>
                  <p className="font-medium">{user.name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Email</label>
                  <p className="font-medium">{user.email}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">Age</label>
                    <p className="font-medium">{user.age || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Gender</label>
                    <p className="font-medium">{user.gender || "-"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Account Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-gray-500">Registered</label>
                  <p className="font-medium">{formatDate(user.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Last Login</label>
                  <p className="font-medium">
                    {user.lastLoginAt
                      ? formatRelativeTime(user.lastLoginAt)
                      : "Never"}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">
                    Subscription Tier
                  </label>
                  <p className="font-medium">
                    {user.subscriptionTier?.replace(/_/g, " ") || "Founding Member"}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Tags</label>
                  <div className="flex gap-2 mt-1">
                    {user.tags.length > 0 ? (
                      user.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-gray-400">No tags</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Assessments Tab */}
        <TabsContent value="assessments" className="mt-6">
          <div className="space-y-4">
            {user.assessments.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-gray-500">No assessments yet</p>
                  <Button className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Send Assessment Invitation
                  </Button>
                </CardContent>
              </Card>
            ) : (
              user.assessments.map((assessment) => (
                <Card key={assessment.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{assessment.assessmentType.name}</CardTitle>
                        <CardDescription>
                          {assessment.completedAt
                            ? `Completed ${formatDate(assessment.completedAt)}`
                            : assessment.status === "IN_PROGRESS"
                              ? "In Progress"
                              : "Not Started"}
                        </CardDescription>
                      </div>
                      {assessment.scoring && (
                        <Badge
                          variant={getRiskBadgeVariant(assessment.scoring.riskTier)}
                        >
                          {assessment.scoring.riskTier} -{" "}
                          {assessment.scoring.totalScore}/
                          {assessment.assessmentType.maxScore}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  {assessment.scoring && (
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {Math.round(assessment.timeSpentSeconds / 60)} min
                          </span>
                          <span>
                            Score: {assessment.scoring.percentScore}%
                          </span>
                        </div>

                        {/* Section Scores */}
                        <div className="grid gap-2 md:grid-cols-2">
                          {Object.entries(assessment.scoring.sectionScores).map(
                            ([key, section]: [string, any]) => (
                              <div
                                key={key}
                                className="flex items-center justify-between p-2 bg-gray-50 rounded"
                              >
                                <span className="text-sm">
                                  {section.sectionName}
                                </span>
                                <span className="text-sm font-medium">
                                  {section.score}/{section.maxScore}
                                </span>
                              </div>
                            )
                          )}
                        </div>

                        {/* Flags */}
                        {(assessment.scoring.criticalFlags.length > 0 ||
                          assessment.scoring.highFlags.length > 0) && (
                          <div className="space-y-2">
                            {assessment.scoring.criticalFlags.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                <span className="text-sm font-medium text-red-600">
                                  Critical:
                                </span>
                                {assessment.scoring.criticalFlags.map((flag) => (
                                  <Badge key={flag} variant="critical">
                                    {flag.replace(/_/g, " ")}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            {assessment.scoring.highFlags.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                <span className="text-sm font-medium text-orange-600">
                                  High:
                                </span>
                                {assessment.scoring.highFlags.map((flag) => (
                                  <Badge key={flag} variant="high">
                                    {flag.replace(/_/g, " ")}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex gap-2 pt-2">
                          <Button variant="outline" size="sm">
                            View Full Results
                          </Button>
                          <Button variant="outline" size="sm">
                            Download PDF
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Progress Notes</CardTitle>
              <CardDescription>
                Track communication and progress with this user
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Note */}
              <div className="space-y-2">
                <Textarea
                  placeholder="Add a note about this user..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={3}
                />
                <Button
                  onClick={addNote}
                  disabled={!newNote.trim() || savingNote}
                >
                  {savingNote && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Add Note
                </Button>
              </div>

              {/* Notes List */}
              <div className="space-y-4 pt-4 border-t">
                {user.notes.length === 0 ? (
                  <p className="text-gray-500 text-sm">No notes yet</p>
                ) : (
                  user.notes.map((note) => (
                    <div key={note.id} className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">
                        {note.content}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {formatDateTime(note.createdAt)}
                        {note.noteType === "SYSTEM" && " (System)"}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {user.activityLogs.length === 0 ? (
                  <p className="text-gray-500 text-sm">No activity yet</p>
                ) : (
                  user.activityLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 text-sm"
                    >
                      <div className="w-2 h-2 mt-2 rounded-full bg-gray-300" />
                      <div>
                        <p className="text-gray-700">
                          {log.action.replace(/_/g, " ")}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDateTime(log.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
