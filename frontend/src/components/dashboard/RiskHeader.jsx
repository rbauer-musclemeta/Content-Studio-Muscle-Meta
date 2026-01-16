import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';

const RISK_COLORS = {
  'minimal': '#10B981',
  'low-moderate': '#FBBF24',
  'moderate-high': '#F97316',
  'high': '#EF4444',
  'critical': '#7F1D1D',
};

const RISK_LABELS = {
  'minimal': 'Minimal Risk',
  'low-moderate': 'Low-Moderate Risk',
  'moderate-high': 'Moderate-High Risk',
  'high': 'High Risk',
  'critical': 'Critical Risk',
};

export function RiskHeader({
  totalScore,
  maxScore,
  riskLevel,
  percentile,
  userName = 'Friend',
  personalizedMessage,
  assessmentDate,
}) {
  const riskColor = RISK_COLORS[riskLevel] || '#6B7280';
  const riskLabel = RISK_LABELS[riskLevel] || 'Unknown Risk';

  const getIcon = () => {
    switch (riskLevel) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="w-8 h-8" />;
      case 'moderate-high':
        return <AlertCircle className="w-8 h-8" />;
      default:
        return <CheckCircle className="w-8 h-8" />;
    }
  };

  const getBorderStyle = () => {
    if (riskLevel === 'critical' || riskLevel === 'high') {
      return 'border-red-500 bg-red-50';
    }
    if (riskLevel === 'moderate-high') {
      return 'border-orange-500 bg-orange-50';
    }
    return 'border-teal-500 bg-teal-50';
  };

  const formattedDate = assessmentDate
    ? new Date(assessmentDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg p-8 mb-8"
    >
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          YOUR CATABOLIC RISK ASSESSMENT RESULTS
        </h1>
        {formattedDate && (
          <p className="text-gray-500">Assessment Date: {formattedDate}</p>
        )}
      </div>

      {/* Risk Level Badge */}
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className={`mx-auto max-w-md rounded-xl border-2 p-6 text-center mb-6 ${getBorderStyle()}`}
      >
        <div className="flex justify-center mb-3" style={{ color: riskColor }}>
          {getIcon()}
        </div>

        <h2 className="text-2xl font-bold mb-2" style={{ color: riskColor }}>
          {(riskLevel === 'critical' || riskLevel === 'high') && '⚠️ '}
          {riskLabel.toUpperCase()}
        </h2>

        <p className="text-3xl font-bold text-gray-800 mb-2">
          Total Score: {totalScore}/{maxScore}
        </p>

        <p className="text-gray-600">
          You scored higher than {percentile}% of your age group
          {riskLevel !== 'minimal' && ' - intervention recommended'}
        </p>
      </motion.div>

      {/* Personalized Message */}
      {personalizedMessage && (
        <div className="bg-gray-50 rounded-xl p-6 text-center max-w-2xl mx-auto">
          <p className="text-gray-700 text-lg leading-relaxed">
            "{personalizedMessage}"
          </p>
        </div>
      )}
    </motion.div>
  );
}

export default RiskHeader;
