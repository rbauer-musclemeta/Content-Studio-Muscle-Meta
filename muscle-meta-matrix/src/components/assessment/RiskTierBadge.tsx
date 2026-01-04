"use client";

import { Badge } from "@/components/ui/badge";
import { RISK_TIERS, type RiskTierKey } from "@/lib/types";

interface RiskTierBadgeProps {
  tier: RiskTierKey;
  score?: number;
  maxScore?: number;
  showPercentage?: boolean;
  size?: "sm" | "md" | "lg";
}

export function RiskTierBadge({
  tier,
  score,
  maxScore = 400,
  showPercentage = false,
  size = "md",
}: RiskTierBadgeProps) {
  const tierConfig = RISK_TIERS[tier];

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-0.5",
    lg: "text-base px-3 py-1",
  };

  const variantMap: Record<RiskTierKey, "critical" | "high" | "moderate" | "low" | "minimal"> = {
    CRITICAL: "critical",
    HIGH: "high",
    MODERATE: "moderate",
    LOW: "low",
    MINIMAL: "minimal",
  };

  let label = tierConfig.label.replace(" Risk", "").toUpperCase();
  if (score !== undefined) {
    label += ` (${score}`;
    if (showPercentage && maxScore > 0) {
      label += ` - ${Math.round((score / maxScore) * 100)}%`;
    }
    label += ")";
  }

  return (
    <Badge variant={variantMap[tier]} className={sizeClasses[size]}>
      {label}
    </Badge>
  );
}

// Score visualization component
export function RiskScoreVisual({
  score,
  maxScore = 400,
}: {
  score: number;
  maxScore?: number;
}) {
  const percentage = Math.round((score / maxScore) * 100);
  const tier = getRiskTierFromScore(percentage);
  const tierConfig = RISK_TIERS[tier];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">Risk Score</span>
        <span className="text-gray-600">
          {score}/{maxScore} ({percentage}%)
        </span>
      </div>
      <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 transition-all duration-500"
          style={{
            width: `${percentage}%`,
            backgroundColor: tierConfig.color,
          }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>MINIMAL</span>
        <span>LOW</span>
        <span>MODERATE</span>
        <span>HIGH</span>
        <span>CRITICAL</span>
      </div>
    </div>
  );
}

function getRiskTierFromScore(percentScore: number): RiskTierKey {
  if (percentScore >= 81) return "CRITICAL";
  if (percentScore >= 61) return "HIGH";
  if (percentScore >= 41) return "MODERATE";
  if (percentScore >= 21) return "LOW";
  return "MINIMAL";
}
