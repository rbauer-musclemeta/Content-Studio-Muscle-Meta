import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Circle, AlertCircle, Download, Calendar } from 'lucide-react';

const CATEGORY_COLORS = {
  medical: 'text-red-600 bg-red-100',
  nutrition: 'text-green-600 bg-green-100',
  exercise: 'text-blue-600 bg-blue-100',
  monitoring: 'text-purple-600 bg-purple-100',
};

export function ActionPlan({ actionPlan = [], onDownloadPDF }) {
  const [completedTasks, setCompletedTasks] = useState(new Set());
  const [expandedDay, setExpandedDay] = useState(1);

  const toggleTask = (taskId) => {
    const newCompleted = new Set(completedTasks);
    if (newCompleted.has(taskId)) {
      newCompleted.delete(taskId);
    } else {
      newCompleted.add(taskId);
    }
    setCompletedTasks(newCompleted);
  };

  if (!actionPlan || actionPlan.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6 }}
      className="bg-white rounded-2xl shadow-lg p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800">
          YOUR 7-DAY QUICK-START ACTION PLAN
        </h3>
        {onDownloadPDF && (
          <button
            onClick={onDownloadPDF}
            className="flex items-center gap-2 bg-teal-100 hover:bg-teal-200 text-teal-700 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Download className="w-5 h-5" />
            Download PDF
          </button>
        )}
      </div>

      <div className="space-y-4">
        {actionPlan.slice(0, 3).map((day) => (
          <motion.div
            key={day.day}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            {/* Day Header */}
            <button
              onClick={() => setExpandedDay(expandedDay === day.day ? 0 : day.day)}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold">
                  {day.day}
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-gray-800">
                    DAY {day.day}: {day.focus}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {day.tasks?.filter((t) => completedTasks.has(t.id)).length || 0}/
                    {day.tasks?.length || 0} tasks completed
                  </p>
                </div>
              </div>
              <Calendar
                className={`w-5 h-5 text-gray-400 transition-transform ${
                  expandedDay === day.day ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Tasks */}
            {expandedDay === day.day && day.tasks && (
              <div className="p-4 space-y-3">
                {day.tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                      completedTasks.has(task.id) ? 'bg-green-50' : 'bg-gray-50'
                    }`}
                  >
                    <button onClick={() => toggleTask(task.id)} className="mt-0.5">
                      {completedTasks.has(task.id) ? (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      ) : (
                        <Circle className="w-6 h-6 text-gray-300 hover:text-gray-400" />
                      )}
                    </button>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {task.urgent && <AlertCircle className="w-4 h-4 text-red-500" />}
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            CATEGORY_COLORS[task.category] || 'text-gray-600 bg-gray-100'
                          }`}
                        >
                          {task.category}
                        </span>
                        <span className="text-xs text-gray-500">{task.time_required}</span>
                      </div>
                      <p
                        className={`text-gray-700 ${
                          completedTasks.has(task.id) ? 'line-through text-gray-400' : ''
                        }`}
                      >
                        {task.action}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* View Full Plan Link */}
      <button className="w-full mt-4 text-teal-600 hover:text-teal-700 font-medium flex items-center justify-center gap-2">
        View Complete 7-Day Plan →
      </button>
    </motion.div>
  );
}

export default ActionPlan;
