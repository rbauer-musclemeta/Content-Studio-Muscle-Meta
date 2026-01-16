import React from 'react';
import { motion } from 'framer-motion';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';

export function PillarRadarChart({ pillarScores }) {
  const data = [
    {
      pillar: 'Exercise & Mobility',
      score: pillarScores?.exercise_mobility || 0,
      fullMark: 100,
    },
    {
      pillar: 'Nutrition & Metabolism',
      score: pillarScores?.nutrition_metabolism || 0,
      fullMark: 100,
    },
    {
      pillar: 'Recovery & Stress',
      score: pillarScores?.recovery_stress || 0,
      fullMark: 100,
    },
    {
      pillar: 'Balance & Brain',
      score: pillarScores?.balance_brain || 0,
      fullMark: 100,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="bg-white rounded-2xl shadow-lg p-6"
    >
      <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
        YOUR 4-PILLAR RISK PROFILE
      </h3>

      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis
              dataKey="pillar"
              tick={{ fill: '#374151', fontSize: 11 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: '#9CA3AF', fontSize: 10 }}
            />
            <Radar
              name="Risk Score"
              dataKey="score"
              stroke="#009090"
              fill="#009090"
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>Low (0-25)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span>Moderate (26-55)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span>High (56-85)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>Critical (86+)</span>
        </div>
      </div>
    </motion.div>
  );
}

export default PillarRadarChart;
