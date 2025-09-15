import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Moon, Clock, Users, Star, CheckCircle, ArrowLeft, Play, Lock, CreditCard, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '../hooks/use-toast';

const SleepCourse = () => {
  const [isEnrolling, setIsEnrolling] = useState(false);
  const { toast } = useToast();

  const courseData = {
    title: 'The 4-Week Sleep Optimization Blueprint',
    subtitle: 'Reclaiming Your Rest & Vitality',
    instructor: 'Randy Bauer, PT',
    price: 97.00,
    originalPrice: 147.00,
    rating: 4.9,
    students: 1247,
    duration: '4 weeks',
    lessons: 16,
    modules: [
      {
        week: 1,
        title: 'The Foundations of Rest',
        subtitle: 'Understanding & Optimizing Your Sleep Environment',
        description: 'This module dives into the fundamental science of sleep, drawing insights from "Why We Sleep" by Matthew Walker. Learn baseline assessment and environmental optimization.',
        lessons: [
          { title: 'Decoding Sleep: Why Quality Rest Matters for Recovery and Brain Health', duration: '18 min', preview: true },
          { title: 'Baseline Assessment & Objective Tracking: Utilizing Oura Ring and Sleep Logs', duration: '22 min', preview: false },
          { title: 'The Sanctuary: Optimizing Your Bedroom Environment (Light, Temperature, Sound)', duration: '25 min', preview: false },
          { title: 'Taming the Light: Blue Light Filters and Evening Screen Boundaries', duration: '16 min', preview: false }
        ]
      },
      {
        week: 2,
        title: 'Mastering Your Circadian Rhythm',
        subtitle: 'Daytime Habits for Nighttime Success',
        description: 'Building on Dr. Andrew Huberman\'s sleep protocols, this module focuses on leveraging your body\'s natural circadian rhythm.',
        lessons: [
          { title: 'The Power of Dawn: Morning Light Exposure & Circadian Alignment', duration: '20 min', preview: false },
          { title: 'Fueling Sleep: Nutrition Timing and the Impact of Caffeine & Alcohol', duration: '24 min', preview: false },
          { title: 'The Evening Wind-Down: Crafting a Pre-Sleep Routine for Rapid Onset', duration: '19 min', preview: false },
          { title: 'Navigating Social Sleep: Aligning Routines with Partners and Family', duration: '17 min', preview: false }
        ]
      },
      {
        week: 3,
        title: 'Lifestyle Pillars',
        subtitle: 'Exercise, Nutrition, and Stress for Deeper Sleep',
        description: 'Examine how holistic lifestyle choices significantly influence sleep quality and recovery.',
        lessons: [
          { title: 'Exercise & Sleep: Timing Workouts for Maximum Recovery and Endurance', duration: '23 min', preview: false },
          { title: 'Sleep-Supporting Nutrition: Macronutrients, Micronutrients, and Evening Meals', duration: '26 min', preview: false },
          { title: 'Mindful Moments: Relaxation Techniques for Stress Management Before Bed', duration: '21 min', preview: false },
          { title: 'Breaking the Cycle: Addressing Pre-Sleep Anxiety and Racing Thoughts', duration: '18 min', preview: false }
        ]
      },
      {
        week: 4,
        title: 'Sustaining Success',
        subtitle: 'Data-Driven Adjustments & Long-Term Optimization',
        description: 'Consolidate learnings by analyzing sleep tracking data and creating sustainable protocols.',
        lessons: [
          { title: 'Interpreting Your Sleep Data: Leveraging Oura Ring for Insights and Adjustments', duration: '28 min', preview: false },
          { title: 'Troubleshooting Common Sleep Disruptors: When to Adjust Your Protocols', duration: '22 min', preview: false },
          { title: 'Sustaining the Gains: Building Resilience and Preventing Relapse', duration: '20 min', preview: false },
          { title: 'Future Horizons: Exploring Advanced Tools and Supplements for Continued Optimization', duration: '24 min', preview: false }
        ]
      }
    ]
  };

  const handleEnrollment = async () => {
    setIsEnrolling(true);
    
    try {
      // Get current URL for success and cancel URLs
      const currentUrl = window.location.origin;
      const successUrl = `${currentUrl}/courses/sleep-optimization/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${currentUrl}/courses/sleep-optimization`;

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/payments/checkout/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          course_id: 'sleep-optimization',
          success_url: successUrl,
          cancel_url: cancelUrl,
          metadata: {
            course_title: courseData.title,
            instructor: courseData.instructor,
            source: 'course_page'
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create checkout session');
      }

      const data = await response.json();
      
      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Enrollment error:', error);
      toast({
        title: "Enrollment Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsEnrolling(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center">
                <Moon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Sleep Optimization Course</h1>
                <p className="text-gray-600">Master the recovery pillar</p>
              </div>
            </div>
            <Link to="/courses" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to Courses</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Course Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Course Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <Badge className="mb-3 bg-blue-100 text-blue-700">Pillar: Recovery</Badge>
                    <CardTitle className="text-3xl text-gray-900 mb-2">{courseData.title}</CardTitle>
                    <CardDescription className="text-xl text-gray-600 font-medium mb-4">
                      {courseData.subtitle}
                    </CardDescription>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>Instructor: <span className="font-medium">{courseData.instructor}</span></span>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="font-medium">{courseData.rating}</span>
                        <span>({courseData.students} students)</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-3 gap-4 mt-6">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{courseData.duration}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Play className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{courseData.lessons} lessons</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">All levels</span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <p className="text-gray-700 leading-relaxed mb-6">
                  This comprehensive 4-week course is designed to empower individuals to significantly improve their sleep quality, 
                  energy levels, and overall well-being. Drawing on cutting-edge sleep science, practical environmental adjustments, 
                  and personalized routine development, participants will learn to identify and overcome common sleep obstacles.
                </p>
                
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">Learning Objectives:</h4>
                  <div className="space-y-2">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Evaluate current sleep patterns and identify key areas for improvement using self-assessment and objective tracking methods</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Implement evidence-based strategies to optimize sleep environment and fall asleep within 15 minutes consistently</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Develop consistent sleep habits enabling natural awakening 5+ days per week with 7+/10 morning energy</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Achieve 7-8/10 sleep quality rating consistently, improving recovery and cognitive function</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Analyze objective sleep data (Oura Ring) to make informed, data-driven protocol adjustments</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Course Curriculum */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-gray-900">Course Curriculum</CardTitle>
                <CardDescription>16 comprehensive lessons across 4 strategic modules</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="space-y-4">
                  {courseData.modules.map((module, moduleIndex) => (
                    <AccordionItem key={moduleIndex} value={`module-${moduleIndex}`} className="border rounded-lg">
                      <AccordionTrigger className="px-6 py-4 hover:no-underline">
                        <div className="flex items-center justify-between w-full">
                          <div className="text-left">
                            <div className="font-semibold text-gray-900">
                              Week {module.week}: {module.title}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">{module.subtitle}</div>
                          </div>
                          <Badge variant="secondary" className="ml-4">
                            {module.lessons.length} lessons
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-6">
                        <p className="text-gray-700 mb-4">{module.description}</p>
                        <div className="space-y-3">
                          {module.lessons.map((lesson, lessonIndex) => (
                            <div key={lessonIndex} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-3">
                                {lesson.preview ? (
                                  <Play className="w-4 h-4 text-blue-600" />
                                ) : (
                                  <Lock className="w-4 h-4 text-gray-400" />
                                )}
                                <div>
                                  <div className="font-medium text-gray-900">{lesson.title}</div>
                                  <div className="text-sm text-gray-600">{lesson.duration}</div>
                                </div>
                              </div>
                              {lesson.preview && (
                                <Badge className="bg-green-100 text-green-700 text-xs">Preview</Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>

            {/* Instructor Bio */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-gray-900">About Your Instructor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start space-x-6">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                    RB
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{courseData.instructor}</h3>
                    <p className="text-gray-700 mb-4">
                      Randy Bauer is the founder of Muscle-Meta Matrix and a licensed Physical Therapist with over 15 years 
                      of experience in metabolic health optimization. He specializes in the intersection of sleep science, 
                      recovery protocols, and performance enhancement, having helped thousands of clients achieve optimal 
                      sleep quality and metabolic health.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">Licensed Physical Therapist</Badge>
                      <Badge variant="secondary">Sleep Optimization Specialist</Badge>
                      <Badge variant="secondary">Recovery Expert</Badge>
                      <Badge variant="secondary">3,200+ Students Trained</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enrollment Card */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader className="text-center">
                <div className="mb-6">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <span className="text-4xl font-bold text-gray-900">${courseData.price}</span>
                    <span className="text-xl text-gray-500 line-through">${courseData.originalPrice}</span>
                  </div>
                  <Badge className="bg-red-100 text-red-700">Save ${courseData.originalPrice - courseData.price}</Badge>
                  <p className="text-sm text-gray-600 mt-2">Limited time offer</p>
                </div>

                <Button 
                  onClick={handleEnrollment}
                  disabled={isEnrolling}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 text-lg font-medium mb-4"
                >
                  {isEnrolling ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5 mr-2" />
                      Enroll Now
                    </>
                  )}
                </Button>

                <div className="flex items-center justify-center space-x-2 mb-4">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-600">30-day money-back guarantee</span>
                </div>
                
                <Separator className="mb-6" />
                
                <div className="text-left space-y-4">
                  <h5 className="font-medium text-gray-900 text-center mb-4">This course includes:</h5>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700">16 comprehensive video lessons</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700">Downloadable sleep tracking templates</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700">Oura Ring optimization guide</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700">Evening routine checklists</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700">Weekly progress assessments</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700">Lifetime access to updates</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700">Community access & support</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700">Mobile & desktop access</span>
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-2">Secure payment powered by Stripe</p>
                  <div className="flex justify-center space-x-2 text-xs text-gray-400">
                    <span>SSL Encrypted</span>
                    <span>•</span>
                    <span>Safe & Secure</span>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SleepCourse;