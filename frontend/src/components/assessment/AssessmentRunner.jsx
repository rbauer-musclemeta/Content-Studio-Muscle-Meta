/**
 * AssessmentRunner - Reusable assessment questionnaire component
 *
 * Renders questions one at a time with progress, handles navigation,
 * and submits to the CRF API.
 */

import React, { useState, useCallback } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Progress } from '../ui/progress';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { cn } from '../../lib/utils';
import { BRAND } from '../../lib/brand';

/**
 * Question types supported:
 * - radio: Single select, options with value 0-4
 * - checkbox: Multi-select with optional cap on total points
 */

export function AssessmentRunner({
  title,
  description,
  questions,
  onComplete,
  onSubmit,
  isLoading = false,
  className,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const isLastQuestion = currentIndex === questions.length - 1;
  const currentAnswer = answers[currentQuestion?.id];

  const canProceed = currentAnswer !== undefined && currentAnswer !== null &&
    (currentQuestion?.type !== 'checkbox' ||
     (Array.isArray(currentAnswer) && currentAnswer.length > 0));

  const handleRadioChange = useCallback((value) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: parseInt(value, 10),
    }));
  }, [currentQuestion?.id]);

  const handleCheckboxChange = useCallback((optionValue, checked) => {
    setAnswers(prev => {
      const current = prev[currentQuestion.id] || [];
      const option = currentQuestion.options.find(o => o.value === optionValue);

      // Handle "none of the above" clearing other selections
      if (option?.isNone && checked) {
        return { ...prev, [currentQuestion.id]: [optionValue] };
      }

      // Clear "none" if selecting something else
      const filtered = current.filter(v => {
        const opt = currentQuestion.options.find(o => o.value === v);
        return !opt?.isNone;
      });

      if (checked) {
        return { ...prev, [currentQuestion.id]: [...filtered, optionValue] };
      } else {
        return { ...prev, [currentQuestion.id]: filtered.filter(v => v !== optionValue) };
      }
    });
  }, [currentQuestion?.id, currentQuestion?.options]);

  const handleNext = useCallback(() => {
    if (isLastQuestion) {
      onSubmit?.(answers);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  }, [isLastQuestion, answers, onSubmit]);

  const handlePrevious = useCallback(() => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  }, []);

  if (!currentQuestion) {
    return null;
  }

  return (
    <div className={cn('max-w-2xl mx-auto', className)}>
      {/* Progress indicator */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span
            className="text-xs font-medium uppercase tracking-wider"
            style={{ color: BRAND.teal }}
          >
            {title || 'Assessment'}
          </span>
          <span className="text-sm" style={{ color: BRAND.inkMuted }}>
            Question {currentIndex + 1} of {questions.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question card */}
      <Card
        className="border shadow-sm"
        style={{
          backgroundColor: BRAND.white,
          borderColor: BRAND.border,
        }}
      >
        <CardHeader>
          {currentQuestion.domain && (
            <p
              className="text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: BRAND.teal }}
            >
              {currentQuestion.domain}
            </p>
          )}
          <CardTitle
            className="text-xl font-semibold"
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              color: BRAND.ink,
            }}
          >
            {currentQuestion.text}
          </CardTitle>
          {currentQuestion.instruction && (
            <CardDescription style={{ color: BRAND.inkSoft }}>
              {currentQuestion.instruction}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent>
          {/* Radio question type */}
          {currentQuestion.type === 'radio' && (
            <RadioGroup
              value={currentAnswer?.toString()}
              onValueChange={handleRadioChange}
              className="space-y-3"
            >
              {currentQuestion.options.map((option) => (
                <div
                  key={option.value}
                  className={cn(
                    'flex items-center space-x-3 p-4 rounded-lg border transition-all cursor-pointer',
                    currentAnswer === option.value
                      ? 'border-2'
                      : 'border hover:border-gray-300'
                  )}
                  style={{
                    borderColor: currentAnswer === option.value ? BRAND.teal : BRAND.border,
                    backgroundColor: currentAnswer === option.value ? BRAND.tealMuted : BRAND.white,
                  }}
                  onClick={() => handleRadioChange(option.value.toString())}
                >
                  <RadioGroupItem
                    value={option.value.toString()}
                    id={`${currentQuestion.id}-${option.value}`}
                  />
                  <Label
                    htmlFor={`${currentQuestion.id}-${option.value}`}
                    className="flex-1 cursor-pointer"
                    style={{ color: BRAND.inkSoft }}
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {/* Checkbox question type */}
          {currentQuestion.type === 'checkbox' && (
            <div className="space-y-3">
              {currentQuestion.options.map((option) => {
                const isChecked = (currentAnswer || []).includes(option.value);
                return (
                  <div
                    key={option.value}
                    className={cn(
                      'flex items-center space-x-3 p-4 rounded-lg border transition-all cursor-pointer',
                      isChecked ? 'border-2' : 'border hover:border-gray-300'
                    )}
                    style={{
                      borderColor: isChecked ? BRAND.teal : BRAND.border,
                      backgroundColor: isChecked ? BRAND.tealMuted : BRAND.white,
                    }}
                    onClick={() => handleCheckboxChange(option.value, !isChecked)}
                  >
                    <Checkbox
                      id={`${currentQuestion.id}-${option.value}`}
                      checked={isChecked}
                      onCheckedChange={(checked) => handleCheckboxChange(option.value, checked)}
                    />
                    <Label
                      htmlFor={`${currentQuestion.id}-${option.value}`}
                      className="flex-1 cursor-pointer"
                      style={{ color: BRAND.inkSoft }}
                    >
                      {option.label}
                      {option.points !== undefined && option.points !== 0 && (
                        <span className="ml-2 text-xs" style={{ color: BRAND.inkMuted }}>
                          {option.points > 0 ? `+${option.points}` : option.points}
                        </span>
                      )}
                    </Label>
                  </div>
                );
              })}
              {currentQuestion.cap && (
                <p className="text-xs mt-2" style={{ color: BRAND.inkMuted }}>
                  Maximum contribution: {currentQuestion.cap} points
                </p>
              )}
            </div>
          )}

          {/* Tip/context */}
          {currentQuestion.tip && (
            <div
              className="mt-4 p-3 rounded-lg text-sm"
              style={{
                backgroundColor: BRAND.tealMuted,
                color: BRAND.inkSoft,
              }}
            >
              {currentQuestion.tip}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button
          variant="ghost"
          onClick={handlePrevious}
          disabled={currentIndex === 0 || isLoading}
          style={{ color: BRAND.inkSoft }}
        >
          Previous
        </Button>

        <Button
          onClick={handleNext}
          disabled={!canProceed || isLoading}
          className="min-w-[140px]"
          style={{
            backgroundColor: canProceed ? BRAND.teal : undefined,
            borderRadius: '999px',
          }}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Processing
            </span>
          ) : isLastQuestion ? (
            'View your results'
          ) : (
            'Continue'
          )}
        </Button>
      </div>

      {/* Encouragement for longer assessments */}
      {questions.length > 10 && currentIndex > 0 && currentIndex < questions.length - 1 && (
        <p
          className="text-center text-sm mt-4"
          style={{ color: BRAND.inkMuted }}
        >
          {questions.length - currentIndex - 1 === 1
            ? "You're doing great. One more."
            : `${questions.length - currentIndex - 1} more questions.`}
        </p>
      )}
    </div>
  );
}

export default AssessmentRunner;
