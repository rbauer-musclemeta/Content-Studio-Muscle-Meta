import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Bell, Camera, FileText, Check } from 'lucide-react';

export function ProgressTracking({ currentScore, expectedImprovement, nextAssessmentDate }) {
  const [trackingEnabled, setTrackingEnabled] = useState(false);

  const features = [
    { icon: Bell, label: 'Monthly email reminders', enabled: true },
    { icon: Calendar, label: 'Symptom tracking tools', enabled: true },
    { icon: Camera, label: 'Photo comparison', enabled: true },
    { icon: FileText, label: 'Provider communication templates', enabled: true },
  ];

  const expectedScore = Math.max(0, currentScore - expectedImprovement);

  const formattedNextDate = nextAssessmentDate
    ? new Date(nextAssessmentDate).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.7 }}
      className="bg-white rounded-2xl shadow-lg p-6"
    >
      <h3 className="text-xl font-bold text-gray-800 mb-4">TRACK YOUR PROGRESS</h3>

      <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-600">Your Next Assessment</p>
            <p className="text-lg font-bold text-gray-800">{formattedNextDate}</p>
            <p className="text-sm text-gray-500">(30 days from now)</p>
          </div>
          <Calendar className="w-12 h-12 text-teal-600" />
        </div>

        <div className="border-t border-teal-200 pt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">
            Expected Improvements with Action Plan:
          </p>
          <ul className="space-y-1 text-sm text-gray-600">
            <li>
              • Risk Score: {currentScore} → {expectedScore} (
              {Math.round((expectedImprovement / currentScore) * 100)}% reduction)
            </li>
            <li>• Sit-to-Stand: 16.2s → 13.5s</li>
            <li>• Muscle Preservation: 95%+</li>
          </ul>
        </div>
      </div>

      {/* Feature List */}
      <div className="border border-gray-200 rounded-xl p-4 mb-4">
        <h4 className="font-semibold text-gray-800 mb-3">SET UP PROGRESS TRACKING</h4>
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-3 text-gray-600">
              <Check className="w-5 h-5 text-green-500" />
              {feature.label}
            </li>
          ))}
        </ul>
      </div>

      {/* Enable Tracking CTA */}
      {!trackingEnabled ? (
        <button
          onClick={() => setTrackingEnabled(true)}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
        >
          Enable Tracking - Free
        </button>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <Check className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="font-medium text-green-700">Progress Tracking Enabled!</p>
          <p className="text-sm text-green-600">
            You'll receive your first reminder in 7 days.
          </p>
        </div>
      )}
    </motion.div>
  );
}

export default ProgressTracking;
