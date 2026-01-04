import { RiskTier } from '@prisma/client';
import craConfig from './cra-config.json';

export interface ResponseValue {
  questionId: string;
  sectionId: string;
  value: string | string[] | number;
  score: number;
}

export interface SectionScore {
  sectionId: string;
  sectionName: string;
  score: number;
  maxScore: number;
  percentScore: number;
}

export interface ScoringResult {
  totalScore: number;
  maxScore: number;
  percentScore: number;
  riskTier: RiskTier;
  sectionScores: Record<string, SectionScore>;
  criticalFlags: string[];
  highFlags: string[];
  protectiveFactors: string[];
}

export interface Recommendations {
  immediate: string[];
  shortTerm: string[];
  resources: string[];
}

// Risk tier thresholds
const RISK_THRESHOLDS = {
  CRITICAL: 81,
  HIGH: 61,
  MODERATE: 41,
  LOW: 21,
  MINIMAL: 0,
};

// Calculate risk tier from percentage score
function determineRiskTier(percentScore: number): RiskTier {
  if (percentScore >= RISK_THRESHOLDS.CRITICAL) return 'CRITICAL';
  if (percentScore >= RISK_THRESHOLDS.HIGH) return 'HIGH';
  if (percentScore >= RISK_THRESHOLDS.MODERATE) return 'MODERATE';
  if (percentScore >= RISK_THRESHOLDS.LOW) return 'LOW';
  return 'MINIMAL';
}

// Calculate section scores from responses
function calculateSectionScores(responses: ResponseValue[]): Record<string, SectionScore> {
  const sectionScores: Record<string, SectionScore> = {};

  // Initialize section scores from config
  for (const section of craConfig.sections) {
    sectionScores[section.id] = {
      sectionId: section.id,
      sectionName: section.title,
      score: 0,
      maxScore: section.maxScore,
      percentScore: 0,
    };
  }

  // Sum scores for each section
  for (const response of responses) {
    if (sectionScores[response.sectionId]) {
      sectionScores[response.sectionId].score += response.score;
    }
  }

  // Calculate percentages
  for (const sectionId in sectionScores) {
    const section = sectionScores[sectionId];
    if (section.maxScore > 0) {
      section.percentScore = Math.round((section.score / section.maxScore) * 100);
    }
    // Ensure score doesn't exceed max
    section.score = Math.min(section.score, section.maxScore);
  }

  return sectionScores;
}

// Identify critical flags requiring immediate attention
function identifyCriticalFlags(responses: ResponseValue[]): string[] {
  const criticalFlags: string[] = [];
  const responseMap = new Map(responses.map(r => [r.questionId, r.value]));

  // Check for hospitalization
  const hospitalization = responseMap.get('CRA-D-04');
  if (hospitalization && hospitalization !== 'no') {
    criticalFlags.push('RECENT_HOSPITALIZATION');
  }

  // Check for significant weight loss
  const weightLoss = responseMap.get('CRA-A-01');
  if (weightLoss === 'significant_loss') {
    criticalFlags.push('SIGNIFICANT_WEIGHT_LOSS');
  }

  // Check for rapid weight loss
  const weightLossRate = responseMap.get('CRA-A-02');
  if (weightLossRate === 'under_1_month') {
    criticalFlags.push('RAPID_WEIGHT_LOSS');
  }

  // Check for falls with injury
  const falls = responseMap.get('CRA-B-05');
  if (falls === 'fall_with_injury') {
    criticalFlags.push('FALLS_WITH_INJURY');
  }

  // Check for severe osteoporosis
  const osteoporosis = responseMap.get('CRA-C-01');
  if (osteoporosis === 'severe_osteoporosis') {
    criticalFlags.push('SEVERE_OSTEOPOROSIS');
  }

  // Check for cancer
  const conditions = responseMap.get('CRA-D-03');
  if (Array.isArray(conditions) && conditions.includes('cancer')) {
    criticalFlags.push('ACTIVE_CANCER');
  }

  return criticalFlags;
}

// Identify high-priority flags
function identifyHighFlags(responses: ResponseValue[], sectionScores: Record<string, SectionScore>): string[] {
  const highFlags: string[] = [];
  const responseMap = new Map(responses.map(r => [r.questionId, r.value]));

  // Functional capacity concerns
  if (sectionScores.functional_capacity?.percentScore >= 40) {
    highFlags.push('FUNCTIONAL_LIMITATIONS');
  }

  // Muscle loss concerns
  const muscleLoss = responseMap.get('CRA-A-04');
  if (muscleLoss === 'moderate' || muscleLoss === 'significant') {
    highFlags.push('MUSCLE_LOSS');
  }

  // Sedentary lifestyle
  const activityLevel = responseMap.get('CRA-F-03');
  if (activityLevel === 'sedentary') {
    highFlags.push('SEDENTARY_LIFESTYLE');
  }

  // Low protein intake
  const proteinIntake = responseMap.get('CRA-G-02');
  if (proteinIntake === 'low' || proteinIntake === 'very_low') {
    highFlags.push('LOW_PROTEIN_INTAKE');
  }

  // GLP-1 with significant weight loss
  const glp1Duration = responseMap.get('CRA-E-05');
  const glp1WeightLoss = responseMap.get('CRA-E-06');
  if (glp1Duration !== 'no' && (glp1WeightLoss === '20_to_40' || glp1WeightLoss === 'over_40')) {
    highFlags.push('GLP1_SIGNIFICANT_WEIGHT_LOSS');
  }

  // Multiple falls
  const falls = responseMap.get('CRA-B-05');
  if (falls === 'multiple_no_injury') {
    highFlags.push('MULTIPLE_FALLS');
  }

  // Poor sleep
  const sleep = responseMap.get('CRA-F-04');
  if (sleep === 'poor') {
    highFlags.push('POOR_SLEEP');
  }

  return highFlags;
}

// Identify protective factors
function identifyProtectiveFactors(responses: ResponseValue[]): string[] {
  const protectiveFactors: string[] = [];
  const responseMap = new Map(responses.map(r => [r.questionId, r.value]));

  // Supplements
  const supplements = responseMap.get('CRA-G-03');
  if (Array.isArray(supplements)) {
    if (supplements.includes('protein')) protectiveFactors.push('PROTEIN_SUPPLEMENT');
    if (supplements.includes('creatine')) protectiveFactors.push('CREATINE');
    if (supplements.includes('hmb')) protectiveFactors.push('HMB');
  }

  // Resistance training
  const resistanceTraining = responseMap.get('CRA-F-01');
  if (resistanceTraining === '3_plus' || resistanceTraining === '1_2_times') {
    protectiveFactors.push('RESISTANCE_TRAINING');
  }

  // HRT/TRT
  const hrt = responseMap.get('CRA-E-03');
  if (hrt === 'yes') {
    protectiveFactors.push('HORMONE_THERAPY');
  }

  // Male on TRT
  const lowT = responseMap.get('CRA-E-04');
  if (lowT === 'yes_treated') {
    protectiveFactors.push('TRT');
  }

  // High protein intake
  const protein = responseMap.get('CRA-G-02');
  if (protein === 'high') {
    protectiveFactors.push('HIGH_PROTEIN_INTAKE');
  }

  // Good activity level
  const activityLevel = responseMap.get('CRA-F-03');
  if (activityLevel === 'very_active') {
    protectiveFactors.push('VERY_ACTIVE');
  }

  return protectiveFactors;
}

// Main scoring function
export function calculateCRAScore(responses: ResponseValue[]): ScoringResult {
  const maxScore = craConfig.maxScore;

  // Calculate section scores
  const sectionScores = calculateSectionScores(responses);

  // Calculate total score (sum of all sections, allowing for negative scores from protective factors)
  let totalScore = Object.values(sectionScores).reduce(
    (sum, section) => sum + section.score,
    0
  );

  // Ensure score is within bounds
  totalScore = Math.max(0, Math.min(totalScore, maxScore));

  // Calculate percentage
  const percentScore = Math.round((totalScore / maxScore) * 100);

  // Determine risk tier
  const riskTier = determineRiskTier(percentScore);

  // Identify flags
  const criticalFlags = identifyCriticalFlags(responses);
  const highFlags = identifyHighFlags(responses, sectionScores);
  const protectiveFactors = identifyProtectiveFactors(responses);

  return {
    totalScore,
    maxScore,
    percentScore,
    riskTier,
    sectionScores,
    criticalFlags,
    highFlags,
    protectiveFactors,
  };
}

// Generate personalized recommendations based on scoring result
export function generateRecommendations(result: ScoringResult): Recommendations {
  const recommendations: Recommendations = {
    immediate: [],
    shortTerm: [],
    resources: [],
  };

  // Critical/High risk immediate actions
  if (result.riskTier === 'CRITICAL' || result.riskTier === 'HIGH') {
    recommendations.immediate.push('Consult with your healthcare provider before starting any exercise program');
    recommendations.immediate.push('Consider evaluation by a physical therapist for personalized guidance');
  }

  // Based on critical flags
  if (result.criticalFlags.includes('RECENT_HOSPITALIZATION')) {
    recommendations.immediate.push('Focus on post-hospitalization recovery protocol');
    recommendations.resources.push('Post-Hospital Recovery Course');
  }

  if (result.criticalFlags.includes('SIGNIFICANT_WEIGHT_LOSS') || result.criticalFlags.includes('RAPID_WEIGHT_LOSS')) {
    recommendations.immediate.push('Medical evaluation for underlying cause of weight loss');
    recommendations.immediate.push('Increase protein intake immediately to 1.2-1.6g per kg body weight');
  }

  if (result.criticalFlags.includes('FALLS_WITH_INJURY')) {
    recommendations.immediate.push('Fall risk assessment with healthcare provider');
    recommendations.immediate.push('Home safety evaluation');
    recommendations.resources.push('Balance and Stability Program');
  }

  // Based on high flags
  if (result.highFlags.includes('LOW_PROTEIN_INTAKE')) {
    recommendations.shortTerm.push('Increase protein to 1.2-1.6g per kg body weight daily');
    recommendations.shortTerm.push('Consider protein supplementation (whey or plant-based)');
    recommendations.resources.push('Protein Optimization Guide');
  }

  if (result.highFlags.includes('SEDENTARY_LIFESTYLE')) {
    recommendations.shortTerm.push('Begin with daily 10-15 minute walks');
    recommendations.shortTerm.push('Reduce sitting time - stand or move every 30 minutes');
    recommendations.resources.push('Beginner Movement Program');
  }

  if (result.highFlags.includes('FUNCTIONAL_LIMITATIONS')) {
    recommendations.shortTerm.push('Functional strength training 2-3x per week');
    recommendations.shortTerm.push('Focus on chair stands, balance exercises, and stair climbing');
    recommendations.resources.push('Functional Fitness for Beginners');
  }

  if (result.highFlags.includes('GLP1_SIGNIFICANT_WEIGHT_LOSS')) {
    recommendations.immediate.push('Increase protein to 1.6-2.0g per kg body weight');
    recommendations.shortTerm.push('Add resistance training 3x per week to preserve muscle');
    recommendations.resources.push('GLP-1 Muscle Preservation Protocol');
  }

  if (result.highFlags.includes('MUSCLE_LOSS')) {
    recommendations.shortTerm.push('Progressive resistance training program');
    recommendations.shortTerm.push('Consider creatine monohydrate supplementation (5g daily)');
    recommendations.resources.push('Muscle Rebuilding Program');
  }

  if (result.highFlags.includes('POOR_SLEEP')) {
    recommendations.shortTerm.push('Establish consistent sleep schedule (7-9 hours)');
    recommendations.shortTerm.push('Create sleep-promoting environment');
    recommendations.resources.push('Sleep Optimization Guide');
  }

  // Section-specific recommendations
  const sectionScores = result.sectionScores;

  if (sectionScores.bone_health && sectionScores.bone_health.percentScore >= 30) {
    recommendations.shortTerm.push('Ensure adequate calcium (1200mg) and Vitamin D (2000 IU) daily');
    recommendations.shortTerm.push('Weight-bearing exercise for bone health');
  }

  if (sectionScores.nutrition && sectionScores.nutrition.percentScore >= 30) {
    recommendations.shortTerm.push('Eat protein with every meal (20-30g per meal)');
    recommendations.resources.push('Muscle-Building Nutrition Guide');
  }

  // Add protective factors acknowledgment
  if (result.protectiveFactors.includes('RESISTANCE_TRAINING')) {
    recommendations.shortTerm.push('Continue your resistance training routine - this is protective!');
  }

  // Default resources for all
  if (recommendations.resources.length === 0) {
    recommendations.resources.push('Muscle-Meta Matrix Foundation Course');
    recommendations.resources.push('Weekly Exercise Templates');
  }

  // Remove duplicates
  recommendations.immediate = [...new Set(recommendations.immediate)];
  recommendations.shortTerm = [...new Set(recommendations.shortTerm)];
  recommendations.resources = [...new Set(recommendations.resources)];

  return recommendations;
}

// Get priority areas based on section scores
export function getPriorityAreas(sectionScores: Record<string, SectionScore>): string[] {
  return Object.values(sectionScores)
    .filter(s => s.percentScore > 0)
    .sort((a, b) => b.percentScore - a.percentScore)
    .slice(0, 3)
    .map(s => s.sectionName);
}
