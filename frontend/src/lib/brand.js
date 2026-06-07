/**
 * Muscle-Meta Matrix Brand Tokens
 *
 * Source of truth for all brand colors, tiers, and framework constants.
 * Import this instead of hardcoding values.
 */

export const BRAND = {
  teal: '#009090',
  tealDark: '#006b6b',
  tealLight: '#00b3b3',
  tealMuted: '#e6f5f5',
  gold: '#D4AF37',
  goldDark: '#B5952F',
  goldMuted: '#faf6e8',
  purple: '#7c3aed',
  purpleMuted: '#f3f0fd',
  green: '#16a34a',
  greenMuted: '#f0fdf4',
  ink: '#1a2332',
  inkSoft: '#344256',
  inkMuted: '#6b7b8f',
  surface: '#f7f6f3',
  border: '#e8e6e1',
  white: '#ffffff',
};

export const TIERS = [
  { tier: 1, label: 'Optimized', color: '#009090', muted: '#e6f5f5', minWellness: 80 },
  { tier: 2, label: 'Functional', color: '#3b82f6', muted: '#eff6ff', minWellness: 60 },
  { tier: 3, label: 'Declining', color: '#f59e0b', muted: '#fef3c7', minWellness: 40 },
  { tier: 4, label: 'At Risk', color: '#f97316', muted: '#ffedd5', minWellness: 20 },
  { tier: 5, label: 'Critical', color: '#dc2626', muted: '#fee2e2', minWellness: 0 },
];

/**
 * Convert CRF API risk percentage to wellness score (high = good)
 */
export function riskToWellness(riskPercentage) {
  return Math.round(100 - riskPercentage);
}

/**
 * Get tier object for a wellness score (0-100, high = good)
 */
export function tierForWellness(wellnessScore) {
  if (wellnessScore >= 80) return TIERS[0];
  if (wellnessScore >= 60) return TIERS[1];
  if (wellnessScore >= 40) return TIERS[2];
  if (wellnessScore >= 20) return TIERS[3];
  return TIERS[4];
}

/**
 * Get tier object directly from CRF API risk percentage
 */
export function tierForRisk(riskPercentage) {
  return tierForWellness(riskToWellness(riskPercentage));
}

export const PILLARS = [
  {
    id: 1,
    name: 'Exercise & Mobility',
    letter: 'E',
    color: BRAND.teal,
    muted: BRAND.tealMuted,
    icon: 'force',
    categories: ['Joint Health', 'Functional Independence', 'Strength & Endurance'],
  },
  {
    id: 2,
    name: 'Nutrition & Metabolism',
    letter: 'N',
    color: BRAND.gold,
    muted: BRAND.goldMuted,
    icon: 'cellular',
    categories: ['Metabolic Flexibility', 'Gut Microbiome', 'Nutrient Density'],
  },
  {
    id: 3,
    name: 'Recovery & Stress',
    letter: 'R',
    color: BRAND.purple,
    muted: BRAND.purpleMuted,
    icon: 'wave',
    categories: ['Sleep Quality', 'HRV Baseline', 'Cortisol Regulation'],
  },
  {
    id: 4,
    name: 'Balance & Brain Health',
    letter: 'B',
    color: BRAND.green,
    muted: BRAND.greenMuted,
    icon: 'neural',
    categories: ['Dual-Task Processing', 'Bone Density', 'Cognitive Reserve'],
  },
];

export const GMMBB_AXES = [
  { letter: 'G', name: 'Gut', fullName: 'Gut Health Axis', angle: -90 },
  { letter: 'M', name: 'Muscle', fullName: 'Muscle Integrity Axis', angle: -18 },
  { letter: 'M', name: 'Metabolic', fullName: 'Metabolic Function Axis', angle: 54 },
  { letter: 'B', name: 'Brain', fullName: 'Brain Health Axis', angle: 126 },
  { letter: 'B', name: 'Bone', fullName: 'Bone-Balance Axis', angle: 198 },
];
