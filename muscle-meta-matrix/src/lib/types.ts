import type { User, Assessment, ScoringResult, AssessmentResponse, UserNote } from '@prisma/client';

// Extended types with relations
export interface UserWithRelations extends User {
  assessments?: AssessmentWithRelations[];
  notes?: UserNote[];
}

export interface AssessmentWithRelations extends Assessment {
  user?: User;
  responses?: AssessmentResponse[];
  scoring?: ScoringResult | null;
  assessmentType?: {
    code: string;
    name: string;
    maxScore: number;
  };
}

// Risk tier configuration
export const RISK_TIERS = {
  CRITICAL: { label: 'Critical Risk', color: '#DC2626', bgColor: 'bg-red-100', textColor: 'text-red-700', threshold: 81 },
  HIGH: { label: 'High Risk', color: '#EA580C', bgColor: 'bg-orange-100', textColor: 'text-orange-700', threshold: 61 },
  MODERATE: { label: 'Moderate Risk', color: '#CA8A04', bgColor: 'bg-yellow-100', textColor: 'text-yellow-700', threshold: 41 },
  LOW: { label: 'Low Risk', color: '#2563EB', bgColor: 'bg-blue-100', textColor: 'text-blue-700', threshold: 21 },
  MINIMAL: { label: 'Minimal Risk', color: '#16A34A', bgColor: 'bg-green-100', textColor: 'text-green-700', threshold: 0 },
} as const;

export type RiskTierKey = keyof typeof RISK_TIERS;

// Assessment types
export interface AssessmentQuestion {
  id: string;
  type: 'select' | 'checkbox_multiple' | 'numeric_input' | 'date' | 'text';
  required: boolean;
  text: string;
  helpText?: string;
  options?: QuestionOption[];
  scoringRules?: NumericScoringRule[];
  conditionalRules?: ConditionalRule[];
  unit?: string;
  min?: number;
  max?: number;
}

export interface QuestionOption {
  value: string;
  label: string;
  score: number;
}

export interface NumericScoringRule {
  gender?: 'male' | 'female';
  min: number;
  max: number;
  score: number;
}

export interface ConditionalRule {
  type: 'show_if' | 'hide_if' | 'require_if';
  conditions: Condition[];
  logic: 'AND' | 'OR';
}

export interface Condition {
  questionId: string;
  operator: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'includes' | 'excludes';
  value: string | number | string[];
}

export interface AssessmentSection {
  id: string;
  title: string;
  description?: string;
  maxScore: number;
  questions: AssessmentQuestion[];
}

export interface AssessmentConfig {
  id: string;
  version: string;
  title: string;
  description: string;
  totalQuestions: number;
  maxScore: number;
  sections: AssessmentSection[];
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Session types
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
}

// Dashboard stats
export interface DashboardStats {
  totalUsers: number;
  completedAssessments: number;
  highRiskUsers: number;
  averageScore: number;
}

// Recent activity
export interface ActivityItem {
  id: string;
  type: 'assessment_completed' | 'user_registered' | 'email_sent' | 'note_added';
  userId: string;
  userName: string;
  details: string;
  riskTier?: RiskTierKey;
  score?: number;
  createdAt: Date;
}
