import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Check, ArrowRight, Loader2 } from 'lucide-react';

export function EmailGate({ onEmailSubmit, onSkip, allowSkip = false }) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const benefits = [
    'View your complete analysis',
    'Download your PDF action plan',
    'Get your personalized pathway',
    'Receive progress tracking tips',
  ];

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    try {
      await onEmailSubmit(email);
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-teal-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Your Results Are Ready!
          </h2>
          <p className="text-gray-600">Enter your email to access your personalized report</p>
        </div>

        {/* Benefits List */}
        <ul className="space-y-3 mb-6">
          {benefits.map((benefit, index) => (
            <motion.li
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3 text-gray-700"
            >
              <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
              {benefit}
            </motion.li>
          ))}
        </ul>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isSubmitting}
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Show My Results
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Privacy Note */}
        <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-500">
          <Lock className="w-4 h-4" />
          Your privacy matters. Unsubscribe anytime.
        </div>

        {/* Skip Option */}
        {allowSkip && onSkip && (
          <button
            onClick={onSkip}
            className="w-full mt-4 text-gray-500 hover:text-gray-700 text-sm"
          >
            Skip for now →
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}

export default EmailGate;
