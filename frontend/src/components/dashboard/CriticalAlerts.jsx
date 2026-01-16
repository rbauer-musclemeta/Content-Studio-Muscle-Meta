import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, AlertCircle, Info, ArrowRight } from 'lucide-react';

export function CriticalAlerts({ alerts = [] }) {
  if (!alerts || alerts.length === 0) return null;

  const getAlertStyle = (severity) => {
    switch (severity) {
      case 'critical':
        return {
          bg: 'bg-red-50',
          border: 'border-red-500',
          icon: <AlertTriangle className="w-6 h-6 text-red-600" />,
          badge: 'bg-red-600',
          badgeText: 'URGENT',
        };
      case 'urgent':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-500',
          icon: <AlertCircle className="w-6 h-6 text-orange-600" />,
          badge: 'bg-orange-600',
          badgeText: 'WARNING',
        };
      default:
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-500',
          icon: <Info className="w-6 h-6 text-yellow-600" />,
          badge: 'bg-yellow-600',
          badgeText: 'ATTENTION',
        };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4 }}
      className="bg-white rounded-2xl shadow-lg p-6"
    >
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <AlertTriangle className="w-6 h-6 text-red-500" />
        CRITICAL ALERTS REQUIRING ATTENTION
      </h3>

      <div className="space-y-4">
        {alerts.map((alert, index) => {
          const style = getAlertStyle(alert.severity);

          return (
            <motion.div
              key={alert.id || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className={`${style.bg} border-l-4 ${style.border} rounded-r-lg p-4`}
            >
              <div className="flex items-start gap-3">
                {style.icon}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`${style.badge} text-white text-xs font-bold px-2 py-1 rounded`}>
                      {style.badgeText}
                    </span>
                    <span className="font-semibold text-gray-800">{alert.category}</span>
                  </div>

                  <p className="text-gray-700 mb-3">{alert.message}</p>

                  <div className="flex items-center text-sm text-gray-600">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    <span className="font-medium">{alert.action}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

export default CriticalAlerts;
