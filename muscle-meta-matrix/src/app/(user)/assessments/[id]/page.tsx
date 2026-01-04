"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProgressBar } from "@/components/assessment/ProgressBar";
import { QuestionRenderer } from "@/components/assessment/QuestionRenderer";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Save,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { shouldShowQuestion } from "@/lib/assessments/conditional-logic";
import type { AssessmentQuestion, AssessmentSection } from "@/lib/types";

interface AssessmentData {
  id: string;
  status: string;
  currentQuestionIndex: number;
  responses: Array<{
    questionId: string;
    sectionId: string;
    questionType: string;
    value: any;
    score: number;
  }>;
  assessmentType: {
    code: string;
    name: string;
    description: string;
    configuration: {
      sections: AssessmentSection[];
    };
  };
}

export default function AssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const assessmentId = params.id as string;

  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Flatten questions from all sections
  const getAllQuestions = useCallback(() => {
    if (!assessment) return [];
    return assessment.assessmentType.configuration.sections.flatMap(
      (section) =>
        section.questions.map((q) => ({
          ...q,
          sectionId: section.id,
          sectionTitle: section.title,
        }))
    );
  }, [assessment]);

  // Get visible questions based on responses
  const getVisibleQuestions = useCallback(() => {
    const allQuestions = getAllQuestions();
    return allQuestions.filter((q) =>
      shouldShowQuestion(q as AssessmentQuestion, responses)
    );
  }, [getAllQuestions, responses]);

  // Load assessment
  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        const response = await fetch(`/api/assessments/${assessmentId}`);
        const data = await response.json();

        if (!data.success) {
          setError(data.error);
          setLoading(false);
          return;
        }

        setAssessment(data.data);

        // Load existing responses
        const existingResponses: Record<string, any> = {};
        data.data.responses?.forEach((r: any) => {
          existingResponses[r.questionId] = r.value;
        });
        setResponses(existingResponses);

        // Set current question index
        setCurrentQuestionIndex(data.data.currentQuestionIndex || 0);
        setLoading(false);
      } catch (err) {
        setError("Failed to load assessment");
        setLoading(false);
      }
    };

    fetchAssessment();
  }, [assessmentId]);

  // Auto-save every 30 seconds
  useEffect(() => {
    const saveInterval = setInterval(() => {
      if (Object.keys(responses).length > 0 && assessment?.status !== "COMPLETED") {
        saveProgress(false);
      }
    }, 30000);

    return () => clearInterval(saveInterval);
  }, [responses, assessment]);

  // Save progress
  const saveProgress = async (showIndicator = true) => {
    if (showIndicator) setSaving(true);

    try {
      const visibleQuestions = getVisibleQuestions();
      const responsesToSave = visibleQuestions
        .filter((q) => responses[q.id] !== undefined)
        .map((q) => {
          const value = responses[q.id];
          let score = 0;

          // Calculate score
          if (q.type === "select" && q.options) {
            const selectedOption = q.options.find((o) => o.value === value);
            score = selectedOption?.score || 0;
          } else if (q.type === "checkbox_multiple" && q.options && Array.isArray(value)) {
            score = value.reduce((sum, v) => {
              const option = q.options?.find((o) => o.value === v);
              return sum + (option?.score || 0);
            }, 0);
          }

          return {
            questionId: q.id,
            sectionId: q.sectionId,
            questionType: q.type,
            value,
            score,
          };
        });

      await fetch(`/api/assessments/${assessmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          responses: responsesToSave,
          currentQuestionIndex,
          status: "IN_PROGRESS",
        }),
      });

      setLastSaved(new Date());
    } catch (err) {
      console.error("Failed to save progress:", err);
    } finally {
      if (showIndicator) setSaving(false);
    }
  };

  // Handle response change
  const handleResponseChange = (questionId: string, value: any) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  // Navigate to next question
  const goToNext = () => {
    const visibleQuestions = getVisibleQuestions();
    if (currentQuestionIndex < visibleQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  // Navigate to previous question
  const goToPrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // Check if current question is answered
  const isCurrentQuestionAnswered = () => {
    const visibleQuestions = getVisibleQuestions();
    const currentQuestion = visibleQuestions[currentQuestionIndex];
    if (!currentQuestion) return false;

    const value = responses[currentQuestion.id];
    if (value === undefined || value === null) return false;
    if (Array.isArray(value) && value.length === 0) return false;
    if (typeof value === "string" && value.trim() === "") return false;

    return true;
  };

  // Check if all required questions are answered
  const canSubmit = () => {
    const visibleQuestions = getVisibleQuestions();
    return visibleQuestions
      .filter((q) => q.required)
      .every((q) => {
        const value = responses[q.id];
        if (value === undefined || value === null) return false;
        if (Array.isArray(value) && value.length === 0) return false;
        return true;
      });
  };

  // Submit assessment
  const handleSubmit = async () => {
    setSubmitting(true);

    try {
      // Save final responses first
      await saveProgress(false);

      // Submit for scoring
      const response = await fetch(`/api/assessments/${assessmentId}/submit`, {
        method: "POST",
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error);
        setSubmitting(false);
        return;
      }

      // Redirect to results
      router.push(`/assessments/${assessmentId}/results`);
    } catch (err) {
      setError("Failed to submit assessment");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="py-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!assessment) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="py-8 text-center">
          <p className="text-gray-500">Assessment not found</p>
        </CardContent>
      </Card>
    );
  }

  if (assessment.status === "COMPLETED") {
    router.push(`/assessments/${assessmentId}/results`);
    return null;
  }

  const visibleQuestions = getVisibleQuestions();
  const currentQuestion = visibleQuestions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === visibleQuestions.length - 1;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {assessment.assessmentType.name}
        </h1>
        <p className="text-gray-500">{assessment.assessmentType.description}</p>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <ProgressBar
          currentQuestion={currentQuestionIndex + 1}
          totalQuestions={visibleQuestions.length}
          sectionName={currentQuestion?.sectionTitle}
        />
      </div>

      {/* Question Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">{currentQuestion?.text}</CardTitle>
          {currentQuestion?.helpText && (
            <CardDescription>{currentQuestion.helpText}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {currentQuestion && (
            <QuestionRenderer
              question={currentQuestion as AssessmentQuestion}
              value={responses[currentQuestion.id]}
              onChange={(value) =>
                handleResponseChange(currentQuestion.id, value)
              }
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={goToPrevious}
          disabled={currentQuestionIndex === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          {saving && (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Saving...</span>
            </>
          )}
          {!saving && lastSaved && (
            <>
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Saved</span>
            </>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => saveProgress()}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>

          {isLastQuestion ? (
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit() || submitting}
            >
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit Assessment
            </Button>
          ) : (
            <Button
              onClick={goToNext}
              disabled={!isCurrentQuestionAnswered() && currentQuestion?.required}
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
