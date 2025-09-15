import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { CheckCircle, Clock, Book, Users, ArrowRight } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useToast } from '../hooks/use-toast';

const CourseSuccess = () => {
  const [searchParams] = useSearchParams();
  const [paymentStatus, setPaymentStatus] = useState('checking');
  const [enrollmentData, setEnrollmentData] = useState(null);
  const { toast } = useToast();

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      checkPaymentStatus(sessionId);
    } else {
      setPaymentStatus('error');
      toast({
        title: "Invalid Access",
        description: "No session ID found. Please try enrolling again.",
        variant: "destructive"
      });
    }
  }, [sessionId, toast]);

  const checkPaymentStatus = async (sessionId, attempts = 0) => {
    const maxAttempts = 5;
    const pollInterval = 2000;

    if (attempts >= maxAttempts) {
      setPaymentStatus('timeout');
      toast({
        title: "Payment Status Check Timeout",
        description: "Please check your email for confirmation or contact support.",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/payments/checkout/status/${sessionId}`);
      
      if (!response.ok) {
        throw new Error('Failed to check payment status');
      }

      const data = await response.json();
      
      if (data.payment_status === 'paid') {
        setPaymentStatus('success');
        setEnrollmentData({
          courseTitle: data.metadata?.course_title || 'Sleep Optimization Course',
          instructor: data.metadata?.instructor || 'Randy Bauer, PT',
          amount: data.amount_total ? (data.amount_total / 100).toFixed(2) : '97.00',
          currency: data.currency?.toUpperCase() || 'USD'
        });
        
        toast({
          title: "Enrollment Successful!",
          description: "Welcome to the Sleep Optimization Blueprint. Check your email for access details.",
        });
        return;
      } else if (data.status === 'expired') {
        setPaymentStatus('expired');
        toast({
          title: "Payment Session Expired",
          description: "Please try enrolling again.",
          variant: "destructive"
        });
        return;
      }

      // If payment is still pending, continue polling
      setTimeout(() => checkPaymentStatus(sessionId, attempts + 1), pollInterval);
    } catch (error) {
      console.error('Error checking payment status:', error);
      setPaymentStatus('error');
      toast({
        title: "Error Checking Payment",
        description: "Please contact support if you completed the payment.",
        variant: "destructive"
      });
    }
  };

  if (paymentStatus === 'checking') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Confirming Your Enrollment</h2>
            <p className="text-gray-600">Please wait while we verify your payment...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentStatus === 'error' || paymentStatus === 'expired' || paymentStatus === 'timeout') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">❌</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Enrollment Issue</h2>
            <p className="text-gray-600 mb-6">
              {paymentStatus === 'expired' && "Your payment session has expired."}
              {paymentStatus === 'timeout' && "Payment verification timed out."}
              {paymentStatus === 'error' && "There was an issue processing your enrollment."}
            </p>
            <div className="space-y-3">
              <Link to="/courses/sleep-optimization">
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                  Try Again
                </Button>
              </Link>
              <Link to="/courses">
                <Button variant="outline" className="w-full">
                  Back to Courses
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to the Course!</h1>
          <p className="text-xl text-gray-600">
            You've successfully enrolled in the Sleep Optimization Blueprint
          </p>
        </div>

        {/* Enrollment Details */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-900">Enrollment Confirmed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Course Details:</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-600">Course:</label>
                    <p className="font-medium text-gray-900">{enrollmentData?.courseTitle}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Instructor:</label>
                    <p className="font-medium text-gray-900">{enrollmentData?.instructor}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Amount Paid:</label>
                    <p className="font-medium text-gray-900">
                      ${enrollmentData?.amount} {enrollmentData?.currency}
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">What's Next:</h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Check your email for access credentials</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Download the course materials</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Join the exclusive community</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Start with Week 1 lessons</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="text-center p-6">
            <Clock className="w-8 h-8 text-blue-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">4 Weeks</h3>
            <p className="text-sm text-gray-600">Complete transformation program</p>
          </Card>
          
          <Card className="text-center p-6">
            <Book className="w-8 h-8 text-green-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">16 Lessons</h3>
            <p className="text-sm text-gray-600">Comprehensive video content</p>
          </Card>
          
          <Card className="text-center p-6">
            <Users className="w-8 h-8 text-purple-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">Community</h3>
            <p className="text-sm text-gray-600">Join 1,200+ students</p>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="text-center space-y-4">
          <div className="space-x-4">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3">
              Access Course Now
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Link to="/courses">
              <Button variant="outline" className="px-8 py-3">
                Browse More Courses
              </Button>
            </Link>
          </div>
          
          <p className="text-sm text-gray-600">
            Need help? Contact our support team at{' '}
            <a href="mailto:support@muscle-metamatrix.com" className="text-indigo-600 hover:text-indigo-700">
              support@muscle-metamatrix.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CourseSuccess;