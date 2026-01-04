"use client";

import { Progress } from "@/components/ui/progress";

interface ProgressBarProps {
  currentQuestion: number;
  totalQuestions: number;
  sectionName?: string;
}

export function ProgressBar({
  currentQuestion,
  totalQuestions,
  sectionName,
}: ProgressBarProps) {
  const percentage = Math.round((currentQuestion / totalQuestions) * 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">
          Question {currentQuestion} of {totalQuestions}
        </span>
        <span className="text-gray-500">{percentage}% complete</span>
      </div>
      <Progress value={percentage} className="h-2" />
      {sectionName && (
        <p className="text-sm text-gray-500 mt-1">Section: {sectionName}</p>
      )}
    </div>
  );
}
