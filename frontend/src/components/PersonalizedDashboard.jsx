import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import MatrixRadarChart from './MatrixRadarChart';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const ASSESSMENT_API = `${BACKEND_URL}/api/assessment`;

/**
 * Personalized Dashboard Component
 *
 * Main dashboard showing:
 * - Muscle-Meta Matrix radar chart
 * - Overall health score and risk level
 * - Pillar breakdowns with category details
 * - Personalized recommendations
 * - Priority areas for improvement
 * - Enrolled courses
 * - Progress tracking
 */
const PersonalizedDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, getAuthHeaders, isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [assessment, setAssessment] = useState(null);
  const [assessmentHistory, setAssessmentHistory] = useState([]);
  const [progressComparison, setProgressComparison] = useState(null);

  // Check if assessment was passed via navigation state
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login', { replace: true });
      return;
    }

    if (location.state?.assessment) {
      setAssessment(location.state.assessment);
      setLoading(false);
    } else {
      loadDashboardData();
    }
  }, [location, isAuthenticated]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Load latest assessment
      const assessmentResponse = await axios.get(
        `${ASSESSMENT_API}/user/${user.id}/latest`,
        { headers: getAuthHeaders() }
      );
      setAssessment(assessmentResponse.data);

      // Load assessment history
      const historyResponse = await axios.get(
        `${ASSESSMENT_API}/user/${user.id}/history`,
        { headers: getAuthHeaders() }
      );
      setAssessmentHistory(historyResponse.data);

      // Load progress comparison if there are multiple assessments
      if (historyResponse.data.length > 1) {
        const progressResponse = await axios.get(
          `${ASSESSMENT_API}/user/${user.id}/progress`,
          { headers: getAuthHeaders() }
        );
        setProgressComparison(progressResponse.data);
      }

    } catch (err) {
      console.error('Failed to load dashboard:', err);

      if (err.response?.status === 404) {
        // No assessment found, redirect to onboarding
        navigate('/onboarding');
      } else {
        setError(err.response?.data?.detail || 'Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskIcon = (riskLevel) => {
    switch (riskLevel) {
      case 'low':
        return '✓';
      case 'moderate':
        return '!';
      case 'high':
        return '⚠';
      case 'critical':
        return '✕';
      default:
        return '?';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <div className="text-center">
              <p className="text-lg">Loading your dashboard...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="mt-4 flex gap-2">
              <Button onClick={loadDashboardData}>Retry</Button>
              <Button variant="outline" onClick={() => navigate('/onboarding')}>
                Take Assessment
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Welcome to Muscle-Meta Matrix!</h2>
            <p className="text-gray-600 mb-6">
              Take a quick assessment to get your personalized health profile and recommendations.
            </p>
            <Button onClick={() => navigate('/onboarding')}>
              Start Assessment
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const baselineAssessment = assessmentHistory.length > 1 ? assessmentHistory[assessmentHistory.length - 1] : null;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Your Muscle-Meta Matrix Dashboard
          </h1>
          <p className="text-gray-600">
            Completed {new Date(assessment.completed_at).toLocaleDateString()}
          </p>
        </div>

        {/* Overall Score Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Overall Health Score</span>
              <Badge className={getRiskColor(assessment.overall_risk_level)}>
                {getRiskIcon(assessment.overall_risk_level)} {assessment.overall_risk_level.toUpperCase()} RISK
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-4xl font-bold">{assessment.overall_score}/100</span>
                  {progressComparison && (
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Since last assessment</p>
                      <p className={`text-2xl font-semibold ${progressComparison.overall_improvement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {progressComparison.overall_improvement >= 0 ? '+' : ''}{progressComparison.overall_improvement.toFixed(1)}
                      </p>
                    </div>
                  )}
                </div>
                <Progress value={assessment.overall_score} className="h-3" />
              </div>

              {progressComparison && progressComparison.achievements.length > 0 && (
                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-2">Recent Achievements</h4>
                  <ul className="space-y-1">
                    {progressComparison.achievements.map((achievement, index) => (
                      <li key={index} className="text-sm text-green-700 flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        {achievement}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different views */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="pillars">Pillars</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <MatrixRadarChart
              assessment={assessment}
              comparisonAssessment={baselineAssessment}
              showCategories={false}
              height={500}
            />

            {/* Priority Areas */}
            <Card>
              <CardHeader>
                <CardTitle>Priority Areas</CardTitle>
                <CardDescription>Focus on these areas for maximum impact</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {assessment.priority_areas.map((area, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg"
                    >
                      <span className="text-2xl">{index + 1}</span>
                      <span className="font-medium">{area}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pillars Tab */}
          <TabsContent value="pillars" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {assessment.pillar_scores.map((pillar) => (
                <Card key={pillar.pillar}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{pillar.pillar_name}</CardTitle>
                      <Badge className={getRiskColor(pillar.risk_level)}>
                        {pillar.risk_level}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-3xl font-bold">{pillar.score}/100</span>
                      <Progress value={pillar.score} className="flex-1" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-gray-700">Categories:</p>
                      {pillar.categories.map((category) => (
                        <div key={category.category_id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm">{category.category_name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{category.score}/100</span>
                            <Badge variant="outline" className={`text-xs ${getRiskColor(category.risk_level)}`}>
                              {category.risk_level}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Detailed Category Radar */}
            <MatrixRadarChart
              assessment={assessment}
              comparisonAssessment={baselineAssessment}
              showCategories={true}
              height={600}
            />
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personalized Recommendations</CardTitle>
                <CardDescription>
                  Based on your assessment, here's what we recommend
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assessment.recommendations.map((recommendation, index) => (
                    <div
                      key={index}
                      className="p-4 border-l-4 border-blue-500 bg-blue-50 rounded-r-lg"
                    >
                      <p className="text-gray-800">{recommendation}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <Button onClick={() => navigate('/courses')}>
                    Browse Recommended Courses
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Enrolled Courses */}
            {user.enrolled_courses && user.enrolled_courses.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Courses</CardTitle>
                  <CardDescription>Continue your learning journey</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {user.enrolled_courses.map((courseId) => (
                      <div
                        key={courseId}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate(`/courses/${courseId}`)}
                      >
                        <div>
                          <p className="font-medium capitalize">
                            {courseId.replace(/-/g, ' ')}
                          </p>
                          <p className="text-sm text-gray-500">Click to continue</p>
                        </div>
                        <Button variant="outline" size="sm">
                          Continue →
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-6">
            {progressComparison ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Progress Over Time</CardTitle>
                    <CardDescription>
                      Comparing your progress over {progressComparison.time_period_days} days
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Overall Improvement */}
                    <div>
                      <h4 className="font-semibold mb-3">Overall Improvement</h4>
                      <div className="flex items-center gap-4">
                        <div className={`text-3xl font-bold ${progressComparison.overall_improvement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {progressComparison.overall_improvement >= 0 ? '+' : ''}{progressComparison.overall_improvement.toFixed(1)} points
                        </div>
                      </div>
                    </div>

                    {/* Pillar Improvements */}
                    <div>
                      <h4 className="font-semibold mb-3">Pillar Improvements</h4>
                      <div className="space-y-2">
                        {Object.entries(progressComparison.pillar_improvements).map(([pillar, improvement]) => (
                          <div key={pillar} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                            <span className="capitalize">{pillar.replace(/_/g, ' ')}</span>
                            <span className={`font-semibold ${improvement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {improvement >= 0 ? '+' : ''}{improvement.toFixed(1)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Next Goals */}
                    <div>
                      <h4 className="font-semibold mb-3">Next Goals</h4>
                      <ul className="space-y-2">
                        {progressComparison.next_goals.map((goal, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-blue-500 mt-1">→</span>
                            <span>{goal}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* Comparison Radar Chart */}
                <MatrixRadarChart
                  assessment={assessment}
                  comparisonAssessment={baselineAssessment}
                  showCategories={false}
                  height={500}
                />
              </>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-gray-600 mb-4">
                    Complete another assessment to track your progress over time
                  </p>
                  <Button onClick={() => navigate('/onboarding')}>
                    Take Reassessment
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-4">
              <Button onClick={() => navigate('/onboarding')}>
                Retake Assessment
              </Button>
              <Button variant="outline" onClick={() => navigate('/courses')}>
                Browse Courses
              </Button>
              <Button variant="outline" onClick={() => navigate('/profile')}>
                View Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PersonalizedDashboard;
