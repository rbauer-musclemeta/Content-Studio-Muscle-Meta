import { ConditionalRule, Condition, AssessmentQuestion } from '../types';

export type ResponseMap = Record<string, string | string[] | number | null>;

// Evaluate a single condition
function evaluateCondition(condition: Condition, responses: ResponseMap): boolean {
  const responseValue = responses[condition.questionId];

  // If the question hasn't been answered yet, condition is not met
  if (responseValue === undefined || responseValue === null) {
    return false;
  }

  switch (condition.operator) {
    case '==':
      if (Array.isArray(responseValue)) {
        return responseValue.includes(condition.value as string);
      }
      return responseValue === condition.value;

    case '!=':
      if (Array.isArray(responseValue)) {
        return !responseValue.includes(condition.value as string);
      }
      return responseValue !== condition.value;

    case '>':
      return Number(responseValue) > Number(condition.value);

    case '<':
      return Number(responseValue) < Number(condition.value);

    case '>=':
      return Number(responseValue) >= Number(condition.value);

    case '<=':
      return Number(responseValue) <= Number(condition.value);

    case 'includes':
      if (Array.isArray(responseValue)) {
        if (Array.isArray(condition.value)) {
          return condition.value.some(v => responseValue.includes(v));
        }
        return responseValue.includes(condition.value as string);
      }
      return false;

    case 'excludes':
      if (Array.isArray(responseValue)) {
        if (Array.isArray(condition.value)) {
          return !condition.value.some(v => responseValue.includes(v));
        }
        return !responseValue.includes(condition.value as string);
      }
      return true;

    default:
      return false;
  }
}

// Evaluate all conditions for a rule
function evaluateRule(rule: ConditionalRule, responses: ResponseMap): boolean {
  if (rule.logic === 'AND') {
    return rule.conditions.every(condition => evaluateCondition(condition, responses));
  } else {
    return rule.conditions.some(condition => evaluateCondition(condition, responses));
  }
}

// Determine if a question should be shown
export function shouldShowQuestion(
  question: AssessmentQuestion,
  responses: ResponseMap
): boolean {
  // If no conditional rules, always show
  if (!question.conditionalRules || question.conditionalRules.length === 0) {
    return true;
  }

  // Evaluate each rule
  for (const rule of question.conditionalRules) {
    const conditionsMet = evaluateRule(rule, responses);

    if (rule.type === 'show_if') {
      // Only show if conditions are met
      if (!conditionsMet) return false;
    } else if (rule.type === 'hide_if') {
      // Hide if conditions are met
      if (conditionsMet) return false;
    }
    // require_if is handled separately during validation
  }

  return true;
}

// Determine if a question is required based on conditions
export function isQuestionRequired(
  question: AssessmentQuestion,
  responses: ResponseMap
): boolean {
  // If inherently required, always required
  if (question.required) {
    return shouldShowQuestion(question, responses);
  }

  // Check for require_if rules
  if (!question.conditionalRules) return false;

  for (const rule of question.conditionalRules) {
    if (rule.type === 'require_if' && evaluateRule(rule, responses)) {
      return true;
    }
  }

  return false;
}

// Get all visible questions for current responses
export function getVisibleQuestions(
  allQuestions: AssessmentQuestion[],
  responses: ResponseMap
): AssessmentQuestion[] {
  return allQuestions.filter(question => shouldShowQuestion(question, responses));
}

// Count visible questions for progress calculation
export function countVisibleQuestions(
  allQuestions: AssessmentQuestion[],
  responses: ResponseMap
): number {
  return getVisibleQuestions(allQuestions, responses).length;
}

// Check if all required visible questions are answered
export function validateResponses(
  allQuestions: AssessmentQuestion[],
  responses: ResponseMap
): { isValid: boolean; missingQuestions: string[] } {
  const visibleQuestions = getVisibleQuestions(allQuestions, responses);
  const missingQuestions: string[] = [];

  for (const question of visibleQuestions) {
    const isRequired = isQuestionRequired(question, responses);
    const hasResponse = responses[question.id] !== undefined && responses[question.id] !== null;

    // For checkbox_multiple, empty array counts as no response
    if (isRequired && Array.isArray(responses[question.id])) {
      if ((responses[question.id] as string[]).length === 0) {
        missingQuestions.push(question.id);
        continue;
      }
    }

    if (isRequired && !hasResponse) {
      missingQuestions.push(question.id);
    }
  }

  return {
    isValid: missingQuestions.length === 0,
    missingQuestions,
  };
}

// Get the next unanswered required question
export function getNextUnansweredQuestion(
  allQuestions: AssessmentQuestion[],
  responses: ResponseMap
): AssessmentQuestion | null {
  const visibleQuestions = getVisibleQuestions(allQuestions, responses);

  for (const question of visibleQuestions) {
    const isRequired = isQuestionRequired(question, responses);
    const hasResponse = responses[question.id] !== undefined && responses[question.id] !== null;

    if (isRequired && !hasResponse) {
      return question;
    }

    // For checkbox, check if it's an empty array
    if (isRequired && Array.isArray(responses[question.id])) {
      if ((responses[question.id] as string[]).length === 0) {
        return question;
      }
    }
  }

  return null;
}
