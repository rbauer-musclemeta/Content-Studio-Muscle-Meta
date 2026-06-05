/**
 * Content Recommendation Engine
 *
 * Maps assessment results (tier, top concerns, pillar scores) to
 * relevant courses and newsletters from the product catalog.
 */

import { PILLARS } from './brand';

/**
 * Recommendation priorities by tier
 * Lower tiers get maintenance content, higher tiers get intervention content
 */
const TIER_CONTENT_FOCUS = {
  1: { type: 'optimization', urgency: 'low', cta: 'Maintain your edge' },
  2: { type: 'enhancement', urgency: 'low', cta: 'Level up your routine' },
  3: { type: 'intervention', urgency: 'medium', cta: 'Start your recovery roadmap' },
  4: { type: 'intensive', urgency: 'high', cta: 'Begin your structured program' },
  5: { type: 'clinical', urgency: 'critical', cta: 'Connect with a specialist' },
};

/**
 * Map pillar names to content tags used in the course/newsletter database
 */
const PILLAR_TO_TAGS = {
  'Exercise & Mobility': ['exercise', 'mobility', 'strength', 'sarcopenia', 'movement'],
  'Nutrition & Metabolism': ['nutrition', 'metabolism', 'protein', 'gut', 'metabolic'],
  'Recovery & Stress': ['recovery', 'sleep', 'stress', 'cortisol', 'hrv'],
  'Balance & Brain Health': ['balance', 'brain', 'cognitive', 'fall-risk', 'bone'],
};

/**
 * Map common concerns to content tags
 */
const CONCERN_TO_TAGS = {
  'low protein intake': ['protein', 'nutrition', 'muscle'],
  'sedentary lifestyle': ['exercise', 'mobility', 'vilpa'],
  'poor sleep': ['sleep', 'recovery', 'circadian'],
  'high stress': ['stress', 'cortisol', 'recovery'],
  'metabolic inflexibility': ['metabolism', 'metabolic', 'insulin'],
  'muscle weakness': ['strength', 'sarcopenia', 'resistance'],
  'balance concerns': ['balance', 'fall-risk', 'stability'],
  'cognitive decline': ['brain', 'cognitive', 'neuroplasticity'],
  'bone loss': ['bone', 'osteoporosis', 'calcium'],
  'inflammation': ['inflammation', 'gut', 'anti-inflammatory'],
};

/**
 * Generate content recommendations from assessment results
 *
 * @param {Object} assessmentResult - CRF API response
 * @param {Array} availableCourses - Courses from MongoDB
 * @param {Array} availableNewsletters - Newsletters from MongoDB (optional)
 * @returns {Object} Recommendations with courses, newsletters, and CTAs
 */
export function generateRecommendations(assessmentResult, availableCourses = [], availableNewsletters = []) {
  const riskPercentage = assessmentResult.risk_score?.percentage ||
    assessmentResult.exploratory_composite?.risk_percentage || 50;
  const tier = getTierFromRisk(riskPercentage);
  const tierFocus = TIER_CONTENT_FOCUS[tier];

  const topConcerns = assessmentResult.exploratory_composite?.top_concerns || [];
  const validatedSummary = assessmentResult.validated_summary || {};

  // Build tag set from concerns
  const relevantTags = new Set();

  topConcerns.forEach(concern => {
    const lowerConcern = concern.toLowerCase();
    Object.entries(CONCERN_TO_TAGS).forEach(([key, tags]) => {
      if (lowerConcern.includes(key) || key.split(' ').some(word => lowerConcern.includes(word))) {
        tags.forEach(tag => relevantTags.add(tag));
      }
    });
  });

  // Add tags based on validated instrument results
  if (validatedSummary.sarcopenia_screen?.includes('positive') ||
      validatedSummary.sarcopenia_confirmed?.includes('sarcopenia')) {
    ['sarcopenia', 'strength', 'protein', 'resistance'].forEach(t => relevantTags.add(t));
  }

  if (validatedSummary.malnutrition_risk === 'High risk' ||
      validatedSummary.malnutrition_risk === 'Medium risk') {
    ['nutrition', 'protein', 'calories'].forEach(t => relevantTags.add(t));
  }

  // Score and sort courses by relevance
  const scoredCourses = availableCourses.map(course => {
    let score = 0;
    const courseTags = (course.pillars || []).map(p => p.toLowerCase());

    // Match by pillar
    courseTags.forEach(tag => {
      if (relevantTags.has(tag)) score += 3;
    });

    // Match by title/description keywords
    const titleLower = (course.title || '').toLowerCase();
    const descLower = (course.description || '').toLowerCase();
    relevantTags.forEach(tag => {
      if (titleLower.includes(tag)) score += 2;
      if (descLower.includes(tag)) score += 1;
    });

    // Boost featured courses slightly
    if (course.featured) score += 1;

    return { ...course, relevanceScore: score };
  });

  // Sort by relevance, take top 3
  const recommendedCourses = scoredCourses
    .filter(c => c.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 3);

  // Score newsletters similarly
  const scoredNewsletters = availableNewsletters.map(newsletter => {
    let score = 0;
    const topics = (newsletter.topics || []).map(t => t.toLowerCase());

    topics.forEach(topic => {
      if (relevantTags.has(topic)) score += 2;
    });

    const titleLower = (newsletter.title || '').toLowerCase();
    relevantTags.forEach(tag => {
      if (titleLower.includes(tag)) score += 1;
    });

    return { ...newsletter, relevanceScore: score };
  });

  const recommendedNewsletters = scoredNewsletters
    .filter(n => n.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 2);

  // Generate personalized headline
  const headline = generateHeadline(tier, topConcerns);

  return {
    tier,
    tierLabel: getTierLabel(tier),
    urgency: tierFocus.urgency,
    headline,
    primaryCta: tierFocus.cta,
    courses: recommendedCourses,
    newsletters: recommendedNewsletters,
    topConcerns: topConcerns.slice(0, 3),
    matchedTags: Array.from(relevantTags),
  };
}

/**
 * Get tier number from risk percentage
 */
function getTierFromRisk(riskPercentage) {
  if (riskPercentage <= 20) return 1;
  if (riskPercentage <= 40) return 2;
  if (riskPercentage <= 60) return 3;
  if (riskPercentage <= 80) return 4;
  return 5;
}

/**
 * Get tier label
 */
function getTierLabel(tier) {
  const labels = ['Optimized', 'Functional', 'Declining', 'At Risk', 'Critical'];
  return labels[tier - 1] || 'Unknown';
}

/**
 * Generate personalized headline based on tier and concerns
 */
function generateHeadline(tier, concerns) {
  if (tier <= 2) {
    return "You're in a strong position. Here's how to maintain your edge.";
  }

  if (tier === 3) {
    if (concerns.some(c => c.toLowerCase().includes('muscle') || c.toLowerCase().includes('strength'))) {
      return "Your strength profile shows room for growth. Start here.";
    }
    if (concerns.some(c => c.toLowerCase().includes('sleep') || c.toLowerCase().includes('recovery'))) {
      return "Recovery is your highest-leverage area. These resources can help.";
    }
    return "This is your window for meaningful change. Here's your roadmap.";
  }

  if (tier === 4) {
    return "Multiple areas need attention. A structured approach makes the difference.";
  }

  return "We recommend clinical guidance alongside these foundational resources.";
}

/**
 * Fetch courses from API and generate recommendations
 * (Call this from React components)
 */
export async function fetchRecommendationsForResult(assessmentResult, backendUrl = '') {
  try {
    // Fetch available courses
    const coursesRes = await fetch(`${backendUrl}/api/courses`);
    const courses = coursesRes.ok ? await coursesRes.json() : [];

    // Newsletters endpoint may not exist yet - gracefully handle
    let newsletters = [];
    try {
      const newslettersRes = await fetch(`${backendUrl}/api/newsletters`);
      if (newslettersRes.ok) {
        newsletters = await newslettersRes.json();
      }
    } catch {
      // Newsletters endpoint not implemented yet
    }

    return generateRecommendations(assessmentResult, courses, newsletters);
  } catch (error) {
    console.error('Failed to fetch recommendations:', error);
    return generateRecommendations(assessmentResult, [], []);
  }
}
