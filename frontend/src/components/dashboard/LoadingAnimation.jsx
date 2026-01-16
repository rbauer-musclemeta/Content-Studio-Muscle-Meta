import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function LoadingAnimation({ onComplete, duration = 3000 }) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    'Analyzing your responses...',
    'Calculating risk scores...',
    'Generating personalized insights...',
    'Preparing your action plan...',
  ];

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setTimeout(onComplete, 500);
          return 100;
        }
        return prev + 2;
      });
    }, duration / 50);

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, duration / steps.length);

    return () => {
      clearInterval(progressInterval);
      clearInterval(stepInterval);
    };
  }, [duration, onComplete, steps.length]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center"
      >
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>

        <h2 className="text-2xl font-bold text-gray-800 mb-4">Assessment Complete!</h2>

        <p className="text-gray-600 mb-6">{steps[currentStep]}</p>

        {/* Progress Bar */}
        <div className="w-64 h-2 bg-gray-200 rounded-full mx-auto overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-teal-500 to-orange-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <p className="text-sm text-gray-500 mt-2">{progress}%</p>
      </motion.div>
    </div>
  );
}

export default LoadingAnimation;
