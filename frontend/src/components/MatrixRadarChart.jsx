import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

/**
 * Muscle-Meta Matrix Radar Chart Component
 *
 * Visualizes user's scores across the 4 Pillars using a radar/spider chart
 *
 * @param {Object} assessment - User assessment object with pillar scores
 * @param {Object} comparisonAssessment - Optional: Previous assessment for comparison
 * @param {boolean} showCategories - Show 12 categories instead of 4 pillars
 */
const MatrixRadarChart = ({
  assessment,
  comparisonAssessment = null,
  showCategories = false,
  height = 400
}) => {
  if (!assessment) {
    return (
      <Card>
        <CardContent className="p-8">
          <p className="text-center text-gray-500">No assessment data available</p>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for radar chart
  const prepareChartData = () => {
    if (showCategories) {
      // Show all 12 categories
      const categoryData = [];

      assessment.pillar_scores.forEach((pillar) => {
        pillar.categories.forEach((category) => {
          const dataPoint = {
            subject: category.category_name,
            current: category.score,
            fullMark: 100
          };

          // Add comparison if available
          if (comparisonAssessment) {
            const comparisonPillar = comparisonAssessment.pillar_scores.find(
              p => p.pillar === pillar.pillar
            );
            if (comparisonPillar) {
              const comparisonCategory = comparisonPillar.categories.find(
                c => c.category_id === category.category_id
              );
              if (comparisonCategory) {
                dataPoint.baseline = comparisonCategory.score;
              }
            }
          }

          categoryData.push(dataPoint);
        });
      });

      return categoryData;
    } else {
      // Show 4 pillars
      const pillarData = assessment.pillar_scores.map((pillar) => {
        const dataPoint = {
          subject: pillar.pillar_name,
          current: pillar.score,
          fullMark: 100
        };

        // Add comparison if available
        if (comparisonAssessment) {
          const comparisonPillar = comparisonAssessment.pillar_scores.find(
            p => p.pillar === pillar.pillar
          );
          if (comparisonPillar) {
            dataPoint.baseline = comparisonPillar.score;
          }
        }

        return dataPoint;
      });

      return pillarData;
    }
  };

  const chartData = prepareChartData();

  // Get risk level color
  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'low':
        return '#10b981'; // Green
      case 'moderate':
        return '#f59e0b'; // Amber
      case 'high':
        return '#ef4444'; // Red
      case 'critical':
        return '#991b1b'; // Dark Red
      default:
        return '#6b7280'; // Gray
    }
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border rounded-lg shadow-lg">
          <p className="font-semibold">{payload[0].payload.subject}</p>
          <p className="text-blue-600">
            Current: {payload[0].value.toFixed(1)}/100
          </p>
          {payload[0].payload.baseline !== undefined && (
            <p className="text-gray-600">
              Previous: {payload[0].payload.baseline.toFixed(1)}/100
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {showCategories ? 'Detailed Category Analysis' : 'Muscle-Meta Matrix Profile'}
        </CardTitle>
        <CardDescription>
          {showCategories
            ? 'Your scores across all 12 categories'
            : 'Your overall health profile across the 4 Pillars'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <RadarChart data={chartData}>
            <PolarGrid />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: '#374151', fontSize: 12 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: '#6b7280', fontSize: 10 }}
            />

            {/* Current scores */}
            <Radar
              name="Current Score"
              dataKey="current"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.6}
            />

            {/* Baseline/comparison scores (if available) */}
            {comparisonAssessment && (
              <Radar
                name="Previous Score"
                dataKey="baseline"
                stroke="#9ca3af"
                fill="#9ca3af"
                fillOpacity={0.3}
              />
            )}

            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>

        {/* Risk Level Legend */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {assessment.pillar_scores.map((pillar) => (
            <div key={pillar.pillar} className="text-center">
              <div
                className="w-4 h-4 rounded-full mx-auto mb-1"
                style={{ backgroundColor: getRiskColor(pillar.risk_level) }}
              />
              <p className="text-xs font-medium text-gray-700">
                {pillar.pillar_name.split(' & ')[0]}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {pillar.risk_level} Risk
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MatrixRadarChart;
