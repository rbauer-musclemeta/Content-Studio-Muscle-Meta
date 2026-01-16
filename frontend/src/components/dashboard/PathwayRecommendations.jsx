import React from 'react';
import { motion } from 'framer-motion';
import { Clock, TrendingUp, ChevronRight, Star } from 'lucide-react';

export function PathwayRecommendations({ pathways = [], riskLevel }) {
  if (!pathways || pathways.length === 0) return null;

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 1:
        return { border: 'border-teal-500', bg: 'bg-teal-50', badge: 'PRIORITY 1' };
      case 2:
        return { border: 'border-blue-400', bg: 'bg-blue-50', badge: 'PRIORITY 2' };
      case 3:
        return { border: 'border-gray-400', bg: 'bg-gray-50', badge: 'PRIORITY 3' };
      default:
        return { border: 'border-gray-300', bg: 'bg-gray-50', badge: `PRIORITY ${priority}` };
    }
  };

  const formatPillarName = (pillar) => {
    return pillar
      .replace(/_/g, ' & ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const primaryPathway = pathways[0];
  const secondaryPathways = pathways.slice(1, 3);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="bg-white rounded-2xl shadow-lg p-6"
    >
      <h3 className="text-xl font-bold text-gray-800 mb-2">
        YOUR PERSONALIZED MUSCLE-META MATRIX PATHWAYS
      </h3>
      <p className="text-gray-600 mb-6">
        Based on your assessment, we recommend focusing on:
      </p>

      {/* Primary Pathway - Featured */}
      {primaryPathway && (
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          className="border-2 border-teal-500 bg-gradient-to-br from-teal-50 to-white rounded-xl p-6 mb-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-teal-600 text-white font-bold px-3 py-1 rounded-full text-sm">
              PRIORITY 1: {formatPillarName(primaryPathway.pillar)}
            </span>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1">
              <p className="text-sm text-gray-600">Your Score:</p>
              <p className="text-lg font-bold text-gray-800">
                {primaryPathway.risk_score}/100
                <span className="text-orange-500 text-sm ml-2">
                  ({riskLevel?.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())} Risk)
                </span>
              </p>
            </div>
          </div>

          <div className="mb-4">
            <h4 className="font-semibold text-gray-800 mb-2">Why This Matters:</h4>
            <p className="text-gray-600">{primaryPathway.description}</p>
          </div>

          <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-2">
              Your Pathway: {primaryPathway.pathway}
            </h4>
            <ul className="space-y-2 text-gray-600 text-sm">
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-600" />
                {primaryPathway.timeframe}
              </li>
              <li className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-600" />
                Expected: {primaryPathway.expected_outcome}
              </li>
            </ul>
          </div>

          {/* CTA Button */}
          {primaryPathway.course_cta && (
            <button className="w-full bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 shadow-lg">
              <Star className="w-5 h-5" />
              Start {primaryPathway.course_cta.title} -
              <span className="line-through opacity-75">${primaryPathway.course_cta.original_price}</span>
              <span className="text-xl">${primaryPathway.course_cta.launch_price}</span>
              <span className="bg-orange-500 text-xs px-2 py-1 rounded ml-2">LAUNCH SPECIAL</span>
            </button>
          )}
        </motion.div>
      )}

      {/* Secondary Pathways */}
      <div className="space-y-4">
        {secondaryPathways.map((pathway, index) => {
          const style = getPriorityStyle(pathway.priority);

          return (
            <motion.div
              key={pathway.pillar}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className={`border ${style.border} rounded-lg p-4 ${style.bg}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-500">{style.badge}</span>
                  <h4 className="font-semibold text-gray-800">
                    {formatPillarName(pathway.pillar)}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Your Score: {pathway.risk_score}/100
                  </p>
                </div>
                <button className="flex items-center gap-1 text-teal-600 hover:text-teal-700 font-medium text-sm">
                  Learn More <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

export default PathwayRecommendations;
