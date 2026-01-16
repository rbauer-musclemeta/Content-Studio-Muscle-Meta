import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, AlertTriangle, AlertCircle, Info } from 'lucide-react';

const SECTION_CONFIG = [
  { key: 'medical_events', label: 'Recent Medical Events', maxScore: 85, description: 'Hospitalizations, surgeries, or prolonged illness' },
  { key: 'weight_loss', label: 'Weight Loss Pattern', maxScore: 85, description: 'Unintentional weight changes and rate of loss' },
  { key: 'medications', label: 'Medications', maxScore: 95, description: 'Medications affecting muscle metabolism' },
  { key: 'neurological', label: 'Neurological Factors', maxScore: 85, description: 'Cognitive and neurological health indicators' },
  { key: 'functional', label: 'Functional Performance', maxScore: 85, description: 'Physical capability and daily function' },
  { key: 'muscle_balance', label: 'Muscle Balance', maxScore: 75, description: 'Strength symmetry and muscle quality' },
  { key: 'strength', label: 'Strength Indicators', maxScore: 65, description: 'Grip strength and overall power' },
  { key: 'bone_health', label: 'Bone Health', maxScore: 75, description: 'Bone density and fracture risk' },
  { key: 'energy_sleep', label: 'Energy & Sleep', maxScore: 60, description: 'Fatigue levels and sleep quality' },
  { key: 'warning_signs', label: 'Warning Signs', maxScore: 75, description: 'Early indicators of catabolic risk' },
];

export function SectionBreakdown({ sectionScores, criticalFlags = [], highFlags = [] }) {
  const [expanded, setExpanded] = useState(false);

  const getSeverityIcon = (score, maxScore) => {
    const percent = (score / maxScore) * 100;
    if (percent >= 70) return <AlertTriangle className="w-5 h-5 text-red-500" />;
    if (percent >= 50) return <AlertCircle className="w-5 h-5 text-orange-500" />;
    if (percent >= 30) return <Info className="w-5 h-5 text-yellow-500" />;
    return null;
  };

  const getBarColor = (score, maxScore) => {
    const percent = (score / maxScore) * 100;
    if (percent >= 70) return 'bg-red-500';
    if (percent >= 50) return 'bg-orange-500';
    if (percent >= 30) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const visibleSections = expanded ? SECTION_CONFIG : SECTION_CONFIG.slice(0, 4);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="bg-white rounded-2xl shadow-lg p-6"
    >
      <h3 className="text-xl font-bold text-gray-800 mb-6">
        DETAILED RISK ANALYSIS
      </h3>

      <div className="space-y-4">
        {visibleSections.map((section, index) => {
          const score = sectionScores?.[section.key] || 0;
          const percent = (score / section.maxScore) * 100;

          return (
            <motion.div
              key={section.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-700">{section.label}</span>
                  {getSeverityIcon(score, section.maxScore)}
                </div>
                <span className="text-sm font-semibold text-gray-600">
                  {score} pts
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${getBarColor(score, section.maxScore)}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                />
              </div>

              <p className="text-xs text-gray-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {section.description}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Expand/Collapse Button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full mt-6 py-2 text-teal-600 hover:text-teal-700 font-medium flex items-center justify-center gap-2"
      >
        {expanded ? (
          <>
            <ChevronUp className="w-5 h-5" />
            Show Less
          </>
        ) : (
          <>
            <ChevronDown className="w-5 h-5" />
            View Complete Breakdown
          </>
        )}
      </button>
    </motion.div>
  );
}

export default SectionBreakdown;
