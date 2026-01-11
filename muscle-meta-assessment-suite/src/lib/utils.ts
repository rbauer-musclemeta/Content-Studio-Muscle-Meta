import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | number): string {
  const d = typeof date === "number" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatScore(score: number, maxScore: number): string {
  return `${score} / ${maxScore}`;
}

export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

export function getRiskLevelColor(riskLevel: string): {
  bg: string;
  text: string;
  border: string;
} {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    MINIMAL: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
    LOW_MODERATE: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
    MODERATE_HIGH: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
    HIGH: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
    CRITICAL: { bg: "bg-red-100", text: "text-red-800", border: "border-red-300" },
  };
  return colors[riskLevel] || colors.MODERATE_HIGH;
}

export function generateInvitationToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
