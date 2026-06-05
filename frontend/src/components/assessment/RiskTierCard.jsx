/**
 * RiskTierCard - Results visualization component
 *
 * Displays assessment results with tier badge, wellness score,
 * validated instrument results, and recommendations.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';
import { BRAND, riskToWellness, tierForRisk } from '../../lib/brand';

/**
 * Tier badge with dot indicator
 */
function TierBadge({ tier, size = 'default' }) {
  const textColor = tier.tier <= 2 ? tier.color : darkenColor(tier.color, 0.3);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-semibold uppercase tracking-wide',
        size === 'lg' ? 'px-4 py-2 text-sm' : 'px-3 py-1.5 text-xs'
      )}
      style={{
        backgroundColor: tier.muted,
        color: textColor,
        border: `1px solid ${tier.color}`,
        borderRadius: '999px',
      }}
    >
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: tier.color }}
      />
      {tier.label}
    </span>
  );
}

/**
 * Validated instrument result row
 */
function InstrumentResult({ instrument }) {
  if (!instrument.applicable) {
    return (
      <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: BRAND.border }}>
        <span className="font-medium" style={{ color: BRAND.inkSoft }}>{instrument.instrument}</span>
        <span className="text-sm" style={{ color: BRAND.inkMuted }}>Not assessable</span>
      </div>
    );
  }

  const isPositive = instrument.category?.toLowerCase().includes('positive') ||
    instrument.category?.toLowerCase().includes('high') ||
    instrument.category?.toLowerCase().includes('confirmed');

  return (
    <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: BRAND.border }}>
      <div>
        <span className="font-medium" style={{ color: BRAND.ink }}>{instrument.instrument}</span>
        <p className="text-xs" style={{ color: BRAND.inkMuted }}>{instrument.citation}</p>
      </div>
      <span
        className="text-sm font-medium"
        style={{ color: isPositive ? '#dc2626' : BRAND.teal }}
      >
        {instrument.category}
      </span>
    </div>
  );
}

/**
 * Main RiskTierCard component
 */
export function RiskTierCard({
  riskScore,
  validatedInstruments = [],
  validatedSummary = {},
  exploratoryComposite = {},
  recommendation,
  recommendations = null,
  disclaimer,
  className,
}) {
  // Convert risk percentage to wellness score and get tier
  const riskPercentage = riskScore?.percentage ?? exploratoryComposite?.risk_percentage ?? 50;
  const wellnessScore = riskToWellness(riskPercentage);
  const tier = tierForRisk(riskPercentage);

  const hasValidatedResults = validatedInstruments.some(i => i.applicable);

  return (
    <div className={cn('max-w-2xl mx-auto space-y-6', className)}>
      {/* Main results card */}
      <Card
        className="border-2 shadow-lg overflow-hidden"
        style={{ borderColor: tier.color }}
      >
        <CardHeader
          className="text-center pb-2"
          style={{ backgroundColor: tier.muted }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-wider mb-3"
            style={{ color: BRAND.teal }}
          >
            Your assessment results
          </p>
          <TierBadge tier={tier} size="lg" />
        </CardHeader>

        <CardContent className="pt-6">
          {/* Wellness score display */}
          <div className="text-center mb-6">
            <div
              className="text-6xl font-bold mb-1"
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                color: tier.color,
              }}
            >
              {wellnessScore}
            </div>
            <p className="text-sm" style={{ color: BRAND.inkMuted }}>
              Wellness score (higher is better)
            </p>
          </div>

          {/* Tier description */}
          <div
            className="p-4 rounded-lg mb-6 text-center"
            style={{ backgroundColor: BRAND.surface }}
          >
            <p style={{ color: BRAND.inkSoft }}>
              {tier.tier === 1 && "You're in a strong position. Your profile indicates well-maintained function across key areas."}
              {tier.tier === 2 && "You have a solid foundation. Targeted optimizations can help you reach peak performance."}
              {tier.tier === 3 && "This is your highest-leverage window. Measurable improvements are achievable with focused intervention."}
              {tier.tier === 4 && "Multiple systems need attention. A structured protocol can help you rebuild."}
              {tier.tier === 5 && "We recommend connecting with a clinician to build your recovery roadmap."}
            </p>
          </div>

          {/* Top concerns if available */}
          {exploratoryComposite?.top_concerns?.length > 0 && (
            <div className="mb-6">
              <h4
                className="text-sm font-semibold uppercase tracking-wide mb-3"
                style={{ color: BRAND.ink }}
              >
                Key areas for focus
              </h4>
              <ul className="space-y-2">
                {exploratoryComposite.top_concerns.slice(0, 3).map((concern, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm"
                    style={{ color: BRAND.inkSoft }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                      style={{ backgroundColor: tier.color }}
                    />
                    {concern}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Validated instruments card */}
      {hasValidatedResults && (
        <Card
          className="border shadow-sm"
          style={{ borderColor: BRAND.border }}
        >
          <CardHeader className="pb-2">
            <CardTitle
              className="text-lg"
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                color: BRAND.ink,
              }}
            >
              Validated screening instruments
            </CardTitle>
            <CardDescription style={{ color: BRAND.inkMuted }}>
              Peer-reviewed tools used in clinical practice
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y" style={{ borderColor: BRAND.border }}>
              {validatedInstruments.map((instrument, i) => (
                <InstrumentResult key={i} instrument={instrument} />
              ))}
            </div>

            {/* Summary */}
            {validatedSummary?.any_positive && (
              <div
                className="mt-4 p-3 rounded-lg text-sm"
                style={{ backgroundColor: '#fef3c7', color: '#92400e' }}
              >
                One or more validated instruments flagged a concern.
                Consider discussing these results with a healthcare provider.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recommendation */}
      {recommendation && (
        <Card
          className="border shadow-sm"
          style={{
            borderColor: BRAND.teal,
            backgroundColor: BRAND.tealMuted,
          }}
        >
          <CardContent className="py-4">
            <h4
              className="text-sm font-semibold uppercase tracking-wide mb-2"
              style={{ color: BRAND.teal }}
            >
              Recommended next step
            </h4>
            <p style={{ color: BRAND.inkSoft }}>{recommendation}</p>
          </CardContent>
        </Card>
      )}

      {/* Recommended courses */}
      {recommendations?.courses?.length > 0 && (
        <Card className="border shadow-sm" style={{ borderColor: BRAND.border }}>
          <CardHeader className="pb-2">
            <p
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: BRAND.teal }}
            >
              {recommendations.headline || 'Recommended for you'}
            </p>
            <CardTitle
              className="text-lg"
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                color: BRAND.ink,
              }}
            >
              Your personalized path
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.courses.map((course, i) => (
                <a
                  key={course.id || i}
                  href={`/courses/${course.id}`}
                  className="block p-4 rounded-lg border transition-all hover:shadow-md"
                  style={{
                    borderColor: BRAND.border,
                    backgroundColor: BRAND.white,
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4
                        className="font-semibold mb-1"
                        style={{ color: BRAND.ink }}
                      >
                        {course.title}
                      </h4>
                      {course.subtitle && (
                        <p className="text-sm" style={{ color: BRAND.inkMuted }}>
                          {course.subtitle}
                        </p>
                      )}
                    </div>
                    {course.price && (
                      <span
                        className="text-sm font-semibold"
                        style={{ color: BRAND.teal }}
                      >
                        ${course.price}
                      </span>
                    )}
                  </div>
                </a>
              ))}
            </div>
            {recommendations.primaryCta && (
              <button
                className="w-full mt-4 py-3 font-medium transition-all"
                style={{
                  backgroundColor: BRAND.teal,
                  color: BRAND.white,
                  borderRadius: '999px',
                }}
                onClick={() => window.location.href = '/courses'}
              >
                {recommendations.primaryCta}
              </button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Disclaimer */}
      {disclaimer && (
        <div
          className="text-xs text-center px-4 py-3 rounded"
          style={{
            backgroundColor: BRAND.surface,
            color: BRAND.inkMuted,
          }}
        >
          {disclaimer}
        </div>
      )}
    </div>
  );
}

/**
 * Darken a hex color by a factor (0-1)
 */
function darkenColor(hex, factor) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.floor((num >> 16) * (1 - factor));
  const g = Math.floor(((num >> 8) & 0x00ff) * (1 - factor));
  const b = Math.floor((num & 0x0000ff) * (1 - factor));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export default RiskTierCard;
