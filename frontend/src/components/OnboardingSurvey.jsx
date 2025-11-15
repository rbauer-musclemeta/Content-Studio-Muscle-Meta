import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const ASSESSMENT_API = `${BACKEND_URL}/api/assessment`;

/**
 * Onboarding Survey Component
 * Multi-step assessment to determine user's Muscle-Meta Matrix profile
 */
const OnboardingSurvey = () => {
  const navigate = useNavigate();
  const { user, getAuthHeaders } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});

  const [framework, setFramework] = useState(null);

  // Load questions and framework on mount
  useEffect(() => {
    loadAssessmentData();
  }, []);

  const loadAssessmentData = async () => {
    try {
      setLoading(true);

      // Load framework
      const frameworkResponse = await axios.get(`${ASSESSMENT_API}/framework`);
      setFramework(frameworkResponse.data.framework);

      // Load questions
      const questionsResponse = await axios.get(`${ASSESSMENT_API}/questions`);
      setQuestions(questionsResponse.data.questions);

    } catch (err) {
      console.error('Failed to load assessment:', err);
      setError('Failed to load assessment questions');
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleAnswer = (value) => {
    setAnswers({
      ...answers,
      [currentQuestion.id]: value
    });
  };

  const handleNext = () => {
    if (!answers[currentQuestion.id]) {
      setError('Please select an answer before continuing');
      return;
    }

    setError('');

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      submitAssessment();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setError('');
    }
  };

  const submitAssessment = async () => {
    try {
      setSubmitting(true);
      setError('');

      // Transform answers to match backend format
      const assessmentAnswers = questions.map((question, index) => {
        const answer = answers[question.id];
        const score = question.scoring_map[answer] || 0;

        return {
          question_id: question.id,
          answer: answer,
          score: score
        };
      });

      // Submit to backend
      const response = await axios.post(
        `${ASSESSMENT_API}/submit`,
        {
          user_id: user.id,
          assessment_type: 'initial',
          answers: assessmentAnswers
        },
        {
          headers: getAuthHeaders()
        }
      );

      // Redirect to personalized dashboard
      navigate('/dashboard', { state: { assessment: response.data } });

    } catch (err) {
      console.error('Failed to submit assessment:', err);
      setError(err.response?.data?.detail || 'Failed to submit assessment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8">
            <div className="text-center">
              <p className="text-lg">Loading assessment...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8">
            <Alert variant="destructive">
              <AlertDescription>Failed to load questions</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get pillar information for context
  const pillarInfo = framework ? framework[currentQuestion.pillar] : null;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Muscle-Meta Matrix Assessment
          </h1>
          <p className="text-gray-600">
            Help us understand your current health profile across the 4 Pillars
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <Card className="mb-6">
          <CardHeader>
            {pillarInfo && (
              <div className="mb-4">
                <div className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {pillarInfo.name}
                </div>
              </div>
            )}
            <CardTitle className="text-2xl">{currentQuestion.question_text}</CardTitle>
            {pillarInfo && (
              <CardDescription className="mt-2">
                {pillarInfo.description}
              </CardDescription>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Question Type: Multiple Choice */}
            {currentQuestion.question_type === 'multiple_choice' && (
              <RadioGroup
                value={answers[currentQuestion.id] || ''}
                onValueChange={handleAnswer}
              >
                {currentQuestion.options.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <RadioGroupItem value={option.id} id={option.id} />
                    <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                      {option.text}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {/* Question Type: Yes/No */}
            {currentQuestion.question_type === 'yes_no' && (
              <RadioGroup
                value={answers[currentQuestion.id] || ''}
                onValueChange={handleAnswer}
              >
                <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value="yes" id="yes" />
                  <Label htmlFor="yes" className="flex-1 cursor-pointer">
                    Yes
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value="no" id="no" />
                  <Label htmlFor="no" className="flex-1 cursor-pointer">
                    No
                  </Label>
                </div>
              </RadioGroup>
            )}

            {/* Question Type: Scale (1-10) */}
            {currentQuestion.question_type === 'scale' && (
              <RadioGroup
                value={answers[currentQuestion.id] || ''}
                onValueChange={handleAnswer}
              >
                <div className="grid grid-cols-5 gap-3">
                  {[...Array(10)].map((_, i) => {
                    const value = (i + 1).toString();
                    return (
                      <div
                        key={value}
                        className="flex items-center justify-center p-4 border-2 rounded-lg hover:bg-blue-50 cursor-pointer"
                        onClick={() => handleAnswer(value)}
                      >
                        <RadioGroupItem value={value} id={`scale-${value}`} className="sr-only" />
                        <Label htmlFor={`scale-${value}`} className="text-xl font-semibold cursor-pointer">
                          {value}
                        </Label>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-sm text-gray-500 mt-2">
                  <span>1 (Low)</span>
                  <span>10 (High)</span>
                </div>
              </RadioGroup>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0 || submitting}
          >
            Previous
          </Button>

          <Button
            onClick={handleNext}
            disabled={!answers[currentQuestion.id] || submitting}
          >
            {submitting ? 'Submitting...' : currentQuestionIndex === questions.length - 1 ? 'Complete Assessment' : 'Next'}
          </Button>
        </div>

        {/* Skip Link (optional) */}
        <div className="mt-4 text-center">
          <button
            onClick={() => navigate('/courses')}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Skip assessment for now
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingSurvey;
