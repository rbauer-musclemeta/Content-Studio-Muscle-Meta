import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  RiskHeader,
  PillarRadarChart,
  SectionBreakdown,
  CriticalAlerts,
  PathwayRecommendations,
  ActionPlan,
  ProgressTracking,
  EmailGate,
  LoadingAnimation,
} from './dashboard';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export function AssessmentResults() {
  const { assessmentId } = useParams();
  const [searchParams] = useSearchParams();

  // Use mock data if mock=true in URL params
  const useMock = searchParams.get('mock') === 'true';
  const mockRiskLevel = searchParams.get('risk') || 'moderate-high';

  const [viewState, setViewState] = useState('loading'); // 'loading' | 'email-gate' | 'dashboard'
  const [results, setResults] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [error, setError] = useState(null);

  const fetchResults = useCallback(async () => {
    try {
      let endpoint;
      if (useMock) {
        endpoint = `${API}/assessment/mock/${mockRiskLevel}`;
      } else {
        endpoint = `${API}/assessment/results/${assessmentId}`;
      }

      const response = await axios.get(endpoint);

      if (response.data.success) {
        setResults(response.data.results);
        setViewState('dashboard');
      } else {
        setError('Failed to load results');
      }
    } catch (err) {
      console.error('Failed to fetch results:', err);
      setError('Failed to load assessment results. Please try again.');
      setViewState('dashboard'); // Show error state
    }
  }, [assessmentId, useMock, mockRiskLevel]);

  useEffect(() => {
    // Check if email already captured (from localStorage)
    const savedEmail = localStorage.getItem(`email_${assessmentId}`);
    if (savedEmail || useMock) {
      setUserEmail(savedEmail || 'mock@example.com');
    }
  }, [assessmentId, useMock]);

  const handleLoadingComplete = () => {
    // Check if we have email or using mock
    if (userEmail || useMock) {
      fetchResults();
    } else {
      setViewState('email-gate');
    }
  };

  const handleEmailSubmit = async (email) => {
    try {
      // Capture email
      await axios.post(`${API}/assessment/email/capture`, {
        email,
        assessment_id: assessmentId,
      });

      // Save to localStorage
      localStorage.setItem(`email_${assessmentId}`, email);
      setUserEmail(email);

      // Fetch and show results
      await fetchResults();
    } catch (err) {
      console.error('Email capture failed:', err);
      throw err;
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await axios.post(`${API}/assessment/pdf/generate`, null, {
        params: { assessment_id: assessmentId || 'mock-assessment' },
      });

      if (response.data.success) {
        const { pdf, filename } = response.data;

        // Convert base64 to blob and download
        const byteCharacters = atob(pdf);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });

        // Trigger download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || `Assessment-Results-${assessmentId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('PDF download failed:', err);
      alert('Failed to download PDF. Please try again.');
    }
  };

  // Calculate next assessment date (30 days from now)
  const nextAssessmentDate = new Date();
  nextAssessmentDate.setDate(nextAssessmentDate.getDate() + 30);

  // Loading State
  if (viewState === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingAnimation onComplete={handleLoadingComplete} duration={3000} />
      </div>
    );
  }

  // Email Gate
  if (viewState === 'email-gate') {
    return (
      <div className="min-h-screen bg-gray-50">
        <EmailGate onEmailSubmit={handleEmailSubmit} allowSkip={false} />
      </div>
    );
  }

  // Error State
  if (error && !results) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Oops!</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-6 rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Loading results
  if (!results) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading results...</p>
      </div>
    );
  }

  // Dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Risk Header */}
        <RiskHeader
          totalScore={results.total_score}
          maxScore={results.max_score}
          riskLevel={results.risk_level}
          percentile={results.percentile}
          userName="Friend"
          personalizedMessage={results.personalized_message}
          assessmentDate={results.assessment_date}
        />

        {/* Two Column Layout */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Pillar Radar Chart */}
          <PillarRadarChart pillarScores={results.pillar_scores} />

          {/* Section Breakdown */}
          <SectionBreakdown
            sectionScores={results.section_scores}
            criticalFlags={results.critical_flags}
            highFlags={results.high_flags}
          />
        </div>

        {/* Critical Alerts */}
        {results.critical_alerts && results.critical_alerts.length > 0 && (
          <div className="mb-8">
            <CriticalAlerts alerts={results.critical_alerts} />
          </div>
        )}

        {/* Pathway Recommendations */}
        {results.pathways && results.pathways.length > 0 && (
          <div className="mb-8">
            <PathwayRecommendations
              pathways={results.pathways}
              riskLevel={results.risk_level}
            />
          </div>
        )}

        {/* Two Column: Action Plan & Progress Tracking */}
        <div className="grid md:grid-cols-2 gap-6">
          <ActionPlan actionPlan={results.action_plan} onDownloadPDF={handleDownloadPDF} />

          <ProgressTracking
            currentScore={results.total_score}
            expectedImprovement={Math.round(results.total_score * 0.34)}
            nextAssessmentDate={nextAssessmentDate}
          />
        </div>
      </div>
    </div>
  );
}

export default AssessmentResults;
