/**
 * CatabolicRiskAssessment - Sample implementation
 *
 * Demonstrates the AssessmentRunner and RiskTierCard components
 * with a subset of CRA questions.
 */

import React, { useState, useCallback } from 'react';
import { AssessmentRunner } from './AssessmentRunner';
import { RiskTierCard } from './RiskTierCard';
import { submitQuickScreen, buildPatientData } from '../../lib/assessmentApi';
import { Button } from '../ui/button';
import { BRAND } from '../../lib/brand';

// Sample questions following CLAUDE.md schema
const SAMPLE_QUESTIONS = [
  {
    id: 'activity-level',
    domain: 'Lifestyle',
    text: 'How would you describe your current activity level?',
    type: 'radio',
    options: [
      { value: 0, label: 'Very active (structured exercise 5+ days/week)' },
      { value: 1, label: 'Active (structured exercise 3-4 days/week)' },
      { value: 2, label: 'Moderately active (some regular movement)' },
      { value: 3, label: 'Lightly active (occasional walks)' },
      { value: 4, label: 'Sedentary (minimal physical activity)' },
    ],
  },
  {
    id: 'protein-intake',
    domain: 'Nutrition',
    text: 'How often do you include protein (meat, fish, eggs, legumes) in your meals?',
    type: 'radio',
    options: [
      { value: 0, label: 'Every meal includes adequate protein' },
      { value: 1, label: 'Most meals include protein' },
      { value: 2, label: 'Some meals include protein' },
      { value: 3, label: 'Rarely eat protein-rich foods' },
      { value: 4, label: 'Very limited protein intake' },
    ],
    tip: 'Adults over 50 need 1.0-1.2g protein per kg body weight daily to maintain muscle mass.',
  },
  {
    id: 'sleep-quality',
    domain: 'Recovery',
    text: 'How would you rate your sleep quality?',
    type: 'radio',
    options: [
      { value: 0, label: 'Excellent - wake refreshed, 7-8 hours consistently' },
      { value: 1, label: 'Good - generally restful, occasional disruption' },
      { value: 2, label: 'Fair - some difficulty falling or staying asleep' },
      { value: 3, label: 'Poor - frequent disruption, rarely feel rested' },
      { value: 4, label: 'Very poor - chronic sleep issues affecting daily function' },
    ],
  },
  {
    id: 'grip-strength',
    domain: 'Functional capacity',
    text: 'Do you have difficulty opening jars or carrying groceries?',
    type: 'radio',
    options: [
      { value: 0, label: 'No difficulty at all' },
      { value: 1, label: 'Slight difficulty occasionally' },
      { value: 2, label: 'Some difficulty regularly' },
      { value: 3, label: 'Significant difficulty' },
      { value: 4, label: 'Unable to do these tasks' },
    ],
  },
  {
    id: 'medical-conditions',
    domain: 'Medical history',
    text: 'Have you been diagnosed with any of the following?',
    instruction: 'Select all that apply',
    type: 'checkbox',
    cap: 4,
    options: [
      { value: 'diabetes', label: 'Type 2 diabetes or prediabetes', points: 3 },
      { value: 'osteoporosis', label: 'Osteoporosis or osteopenia', points: 3 },
      { value: 'thyroid', label: 'Thyroid disorder', points: 2 },
      { value: 'arthritis', label: 'Arthritis', points: 1 },
      { value: 'heart', label: 'Heart disease', points: 3 },
      { value: 'none', label: 'None of the above', points: 0, isNone: true },
    ],
  },
];

export function CatabolicRiskAssessment() {
  const [stage, setStage] = useState('intro'); // intro | questions | loading | results
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleStart = useCallback(() => {
    setStage('questions');
    setError(null);
  }, []);

  const handleSubmit = useCallback(async (answers) => {
    setStage('loading');
    setError(null);

    try {
      // Build patient data from answers
      // In production, you'd collect profile data from the user
      const patientData = buildPatientData(
        {
          id: `cra_${Date.now()}`,
          dateOfBirth: '1960-01-01', // Demo - would come from user input
          sex: 'male',
          heightCm: 175,
          weightKg: 80,
        },
        answers,
        {
          activityLevel: mapActivityLevel(answers['activity-level']),
          sleepHours: mapSleepHours(answers['sleep-quality']),
          conditions: extractConditions(answers['medical-conditions']),
        }
      );

      const response = await submitQuickScreen(patientData);
      setResults(response);
      setStage('results');
    } catch (err) {
      setError(err.message || 'Assessment failed. Please try again.');
      setStage('questions');
    }
  }, []);

  const handleRestart = useCallback(() => {
    setStage('intro');
    setResults(null);
    setError(null);
  }, []);

  // Intro screen
  if (stage === 'intro') {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ backgroundColor: BRAND.surface }}
      >
        <div className="max-w-md text-center">
          <p
            className="text-xs font-semibold uppercase tracking-wider mb-4"
            style={{ color: BRAND.teal }}
          >
            Catabolic risk assessment
          </p>
          <h1
            className="text-3xl font-bold mb-4"
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              color: BRAND.ink,
            }}
          >
            Discover where you stand
          </h1>
          <p className="mb-8" style={{ color: BRAND.inkSoft }}>
            This brief assessment helps identify your catabolic risk factors
            and creates a personalized path to preserve muscle and vitality.
            Takes about 3 minutes.
          </p>
          <Button
            onClick={handleStart}
            className="px-8 py-3"
            style={{
              backgroundColor: BRAND.teal,
              borderRadius: '999px',
            }}
          >
            Take the assessment
          </Button>
        </div>
      </div>
    );
  }

  // Questions
  if (stage === 'questions' || stage === 'loading') {
    return (
      <div
        className="min-h-screen py-12 px-6"
        style={{ backgroundColor: BRAND.surface }}
      >
        {error && (
          <div
            className="max-w-2xl mx-auto mb-6 p-4 rounded-lg text-center"
            style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}
          >
            {error}
          </div>
        )}
        <AssessmentRunner
          title="Catabolic risk assessment"
          questions={SAMPLE_QUESTIONS}
          onSubmit={handleSubmit}
          isLoading={stage === 'loading'}
        />
      </div>
    );
  }

  // Results
  if (stage === 'results' && results) {
    return (
      <div
        className="min-h-screen py-12 px-6"
        style={{ backgroundColor: BRAND.surface }}
      >
        <RiskTierCard
          riskScore={results.risk_score}
          validatedInstruments={results.validated_instruments || []}
          validatedSummary={results.validated_summary}
          exploratoryComposite={results.exploratory_composite}
          recommendation={results.recommendation}
          disclaimer={results.disclaimer}
        />
        <div className="text-center mt-8">
          <Button
            variant="ghost"
            onClick={handleRestart}
            style={{ color: BRAND.teal }}
          >
            Take assessment again
          </Button>
        </div>
      </div>
    );
  }

  return null;
}

// Helper functions to map answers to API format
function mapActivityLevel(value) {
  const map = {
    0: 'very_active',
    1: 'active',
    2: 'moderate',
    3: 'light',
    4: 'sedentary',
  };
  return map[value] || 'sedentary';
}

function mapSleepHours(value) {
  const map = { 0: 8, 1: 7, 2: 6, 3: 5, 4: 4 };
  return map[value] || 6;
}

function extractConditions(selected) {
  if (!Array.isArray(selected)) return [];
  return selected.filter(v => v !== 'none').map(v => {
    const labels = {
      diabetes: 'Type 2 Diabetes',
      osteoporosis: 'Osteoporosis',
      thyroid: 'Thyroid disorder',
      arthritis: 'Arthritis',
      heart: 'Heart disease',
    };
    return labels[v] || v;
  });
}

export default CatabolicRiskAssessment;
