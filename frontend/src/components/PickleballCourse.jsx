import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { 
  Clock, Users, Star, CheckCircle, ArrowLeft, Play, Lock, 
  TrendingUp, Shield, Trophy, Target, Activity, Zap
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/use-toast';

const PickleballCourse = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEnrolling, setIsEnrolling] = useState(false);

  const courseData = {
    id: 'pickleball-3p-system',
    title: 'The Science Behind the 3P System',
    subtitle: 'Preparation, Prevention, and Performance for Pickleball Excellence',
    instructor: 'Randy Bauer, PT',
    credentials: 'Physical Therapist & Performance Specialist',
    description: 'Revolutionary Evidence-Based Approach to Pickleball Training. This comprehensive framework addresses the sport\'s unique challenges through three interconnected pillars, built on cutting-edge research in muscle-metabolic health, injury prevention science, and performance optimization.',
    price: 197.00,
    originalPrice: 297.00,
    rating: 4.9,
    students: 2847,
    duration: '4 modules',
    lessons: 16,
    stats: {
      injuryReduction: '70%',
      performanceImprovement: '25-40%',
      annualInjuryRate: '68.5%',
      averageInjuryCost: '$2,400'
    }
  };

  const modules = [
    {
      id: 1,
      title: 'Foundation Assessment & The Muscle-Meta Matrix',
      subtitle: 'Master the comprehensive assessment framework and understand the four pillars of muscle-metabolic health',
      description: 'Learn to conduct comprehensive self-assessments including grip strength, balance testing, functional movement screening, and metabolic flexibility evaluation. Deep dive into the 4-Pillar Muscle-Meta Matrix Framework and create your personalized training roadmap.',
      lessons: [
        { title: 'Complete Movement & Fitness Assessment', duration: '25 min', type: 'video', preview: true },
        { title: 'The 4-Pillar Muscle-Meta Matrix Framework', duration: '30 min', type: 'video', preview: false },
        { title: 'Risk Stratification & Tier Classification', duration: '20 min', type: 'interactive', preview: false },
        { title: 'Personal Foundation Blueprint Creation', duration: '15 min', type: 'pdf', preview: false }
      ],
      resources: ['Assessment Workbook', 'Movement Screening Checklist']
    },
    {
      id: 2,
      title: 'PREPARATION - Building Your Pickleball Foundation',
      subtitle: '4-6 week systematic preparation protocols for injury-resistant play and optimal performance readiness',
      description: 'Restore pickleball-specific joint mobility and master fundamental movement patterns before high-intensity play. Build posterior chain strength, core stability, and movement competency using progressive loading principles.',
      lessons: [
        { title: 'Joint Mobility & Movement Pattern Mastery', duration: '35 min', type: 'video', preview: false },
        { title: 'Strength Foundation Development', duration: '40 min', type: 'video', preview: false },
        { title: 'VILPA Integration & Metabolic Base Building', duration: '20 min', type: 'interactive', preview: false },
        { title: 'Progressive Loading Toward Sport Participation', duration: '25 min', type: 'video', preview: false }
      ],
      resources: ['Foundation Training Guide', 'VILPA Activity Progressions']
    },
    {
      id: 3,
      title: 'PREVENTION - Your Insurance Policy',
      subtitle: 'Smart load management and movement quality protocols for documented 70% injury reduction',
      description: 'Ongoing screening protocols to identify movement limitations and injury risk factors before they cause problems. Balance training stress with recovery capacity using evidence-based monitoring.',
      lessons: [
        { title: 'Risk Screening & Movement Quality Assessment', duration: '30 min', type: 'video', preview: false },
        { title: 'Load Management & Recovery Protocols', duration: '25 min', type: 'interactive', preview: false },
        { title: 'Pre-Play Preparation Routines', duration: '20 min', type: 'video', preview: false },
        { title: 'Environmental & Equipment Optimization', duration: '15 min', type: 'text', preview: false }
      ],
      resources: ['Prevention Protocol Handbook', 'Load Management Tracker']
    },
    {
      id: 4,
      title: 'PERFORMANCE - Optimizing Your Game',
      subtitle: 'Sport-specific training protocols for 25-40% performance improvement and competitive excellence',
      description: 'Plyometric training, explosive strength development, and power transfer for enhanced shot-making ability. Unpredictable stimulus-response training and competition preparation protocols.',
      lessons: [
        { title: 'Power Development & Explosive Training', duration: '35 min', type: 'video', preview: false },
        { title: 'Reactive Agility & Court Movement', duration: '30 min', type: 'video', preview: false },
        { title: 'Endurance Integration & Energy Systems', duration: '25 min', type: 'interactive', preview: false },
        { title: 'Competition Preparation & Peak Performance', duration: '20 min', type: 'video', preview: false }
      ],
      resources: ['Performance Training Manual', 'Competition Readiness Checklist']
    }
  ];

  const handleEnrollment = async () => {
    setIsEnrolling(true);
    
    try {
      const currentUrl = window.location.origin;
      const successUrl = `${currentUrl}/courses/pickleball-3p-system/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${currentUrl}/courses/pickleball-3p-system`;

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/payments/checkout/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          course_id: courseData.id,
          success_url: successUrl,
          cancel_url: cancelUrl,
          metadata: {
            course_title: courseData.title,
            instructor: courseData.instructor,
            source: 'pickleball_course_page'
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create checkout session');
      }

      const data = await response.json();
      
      if (data.url) {
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

  const getTypeIcon = (type) => {
    switch (type) {
      case 'video': return <Play className="w-4 h-4 text-blue-600" />;
      case 'interactive': return <Activity className="w-4 h-4 text-green-600" />;
      case 'text': return <CheckCircle className="w-4 h-4 text-purple-600" />;
      case 'pdf': return <CheckCircle className="w-4 h-4 text-orange-600" />;
      default: return <CheckCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-700 rounded-xl flex items-center justify-center">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Muscle-Meta</h1>
                <p className="text-gray-600">Evidence-Based Movement Solutions</p>
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
                    <Badge className="mb-3 bg-green-100 text-green-700">Pickleball Training</Badge>
                    <CardTitle className="text-3xl text-gray-900 mb-2">{courseData.title}</CardTitle>
                    <CardDescription className="text-xl text-gray-600 font-medium mb-4">
                      {courseData.subtitle}
                    </CardDescription>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                      <span>Instructor: <span className="font-medium">{courseData.instructor}</span></span>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="font-medium">{courseData.rating}</span>
                        <span>({courseData.students} students)</span>
                      </div>
                    </div>
                    <p className="text-gray-600">{courseData.credentials}</p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <p className="text-gray-700 leading-relaxed mb-6">
                  {courseData.description}
                </p>
                
                {/* Course Stats */}
                <div className="grid md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600 mb-1">{courseData.stats.injuryReduction}</div>
                    <div className="text-sm text-gray-600">Injury Reduction</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 mb-1">{courseData.stats.performanceImprovement}</div>
                    <div className="text-sm text-gray-600">Performance Gain</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600 mb-1">{courseData.stats.annualInjuryRate}</div>
                    <div className="text-sm text-gray-600">Annual Injury Rate</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 mb-1">{courseData.stats.averageInjuryCost}</div>
                    <div className="text-sm text-gray-600">Avg. Injury Cost</div>
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
              </CardContent>
            </Card>

            {/* Course Curriculum */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-gray-900">Course Curriculum</CardTitle>
                <CardDescription>4 comprehensive modules with interactive elements</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="space-y-4">
                  {modules.map((module) => (
                    <AccordionItem key={module.id} value={`module-${module.id}`} className="border rounded-lg">
                      <AccordionTrigger className="px-6 py-4 hover:no-underline">
                        <div className="flex items-center justify-between w-full">
                          <div className="text-left">
                            <div className="font-semibold text-gray-900">
                              Module {module.id}: {module.title}
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
                                  <Play className="w-4 h-4 text-green-600" />
                                ) : (
                                  <Lock className="w-4 h-4 text-gray-400" />
                                )}
                                <div className="flex items-center space-x-2">
                                  {getTypeIcon(lesson.type)}
                                </div>
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
                        
                        {module.resources.length > 0 && (
                          <div className="mt-4 pt-4 border-t">
                            <h5 className="font-medium text-gray-900 mb-2">Module Resources:</h5>
                            <div className="flex flex-wrap gap-2">
                              {module.resources.map((resource, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {resource}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
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
                  <div className="w-20 h-20 bg-gradient-to-r from-green-600 to-emerald-700 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                    RB
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{courseData.instructor}</h3>
                    <p className="text-gray-600 mb-2">{courseData.credentials}</p>
                    <p className="text-gray-700 mb-4">
                      Randy Bauer is a licensed Physical Therapist and Performance Specialist with extensive experience in sports medicine 
                      and injury prevention. He has developed the revolutionary 3P System based on years of clinical practice and research 
                      in muscle-metabolic health, helping thousands of pickleball players optimize their performance while minimizing injury risk.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">Licensed Physical Therapist</Badge>
                      <Badge variant="secondary">Performance Specialist</Badge>
                      <Badge variant="secondary">Injury Prevention Expert</Badge>
                      <Badge variant="secondary">2,800+ Students Trained</Badge>
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
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-4 text-lg font-medium mb-4"
                >
                  {isEnrolling ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Trophy className="w-5 h-5 mr-2" />
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
                      <span className="text-sm text-gray-700">16 comprehensive lessons</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700">Interactive assessments & tools</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700">8 downloadable resource guides</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700">Progressive training protocols</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700">70% injury reduction guarantee</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700">Lifetime access to updates</span>
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

export default PickleballCourse;