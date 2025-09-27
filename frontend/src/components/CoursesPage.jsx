import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Book, Clock, Users, Star, Award, CheckCircle, ArrowRight, Moon, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const CoursesPage = () => {
  const courses = [
    {
      id: 'sleep-optimization',
      title: 'The 4-Week Sleep Optimization Blueprint',
      subtitle: 'Reclaiming Your Rest & Vitality',
      instructor: 'Randy Bauer, PT',
      description: 'Transform your sleep from a struggle into a consistent source of recovery, brain health, and stress resilience through cutting-edge sleep science and personalized protocols.',
      price: 97.00,
      originalPrice: 147.00,
      duration: '4 weeks',
      lessons: 16,
      students: 1247,
      rating: 4.9,
      level: 'All Levels',
      featured: false,
      pillars: ['Recovery', 'Brain Health', 'Stress Management'],
      outcomes: [
        'Fall asleep within 15 minutes consistently',
        'Wake up naturally 5+ days per week',
        'Achieve 7-8/10 sleep quality rating',
        'Boost morning energy to 7+/10',
        'Master data-driven sleep optimization'
      ],
      modules: [
        {
          week: 1,
          title: 'The Foundations of Rest',
          subtitle: 'Understanding & Optimizing Your Sleep Environment',
          lessons: 4
        },
        {
          week: 2,
          title: 'Mastering Your Circadian Rhythm',
          subtitle: 'Daytime Habits for Nighttime Success',
          lessons: 4
        },
        {
          week: 3,
          title: 'Lifestyle Pillars',
          subtitle: 'Exercise, Nutrition, and Stress for Deeper Sleep',
          lessons: 4
        },
        {
          week: 4,
          title: 'Sustaining Success',
          subtitle: 'Data-Driven Adjustments & Long-Term Optimization',
          lessons: 4
        }
      ],
      route: '/courses/sleep-optimization'
    },
    {
      id: 'pickleball-3p-system',
      title: 'The Science Behind the 3P System',
      subtitle: 'Preparation, Prevention, and Performance for Pickleball Excellence',
      instructor: 'Randy Bauer, PT',
      description: 'Revolutionary Evidence-Based Approach to Pickleball Training. This comprehensive framework addresses the sport\'s unique challenges through three interconnected pillars, built on cutting-edge research in muscle-metabolic health, injury prevention science, and performance optimization.',
      price: 197.00,
      originalPrice: 297.00,
      duration: '4 modules',
      lessons: 16,
      students: 2847,
      rating: 4.9,
      level: 'All Levels',
      featured: true,
      pillars: ['Movement', 'Performance', 'Prevention'],
      outcomes: [
        '70% injury reduction guarantee',
        '25-40% performance improvement',
        'Complete movement assessment mastery',
        'Sport-specific training protocols',
        'Competition preparation strategies'
      ],
      modules: [
        {
          week: 1,
          title: 'Foundation Assessment & The Muscle-Meta Matrix',
          subtitle: 'Master the comprehensive assessment framework',
          lessons: 4
        },
        {
          week: 2,
          title: 'PREPARATION - Building Your Foundation',
          subtitle: '4-6 week systematic preparation protocols',
          lessons: 4
        },
        {
          week: 3,
          title: 'PREVENTION - Your Insurance Policy',
          subtitle: 'Smart load management and movement quality protocols',
          lessons: 4
        },
        {
          week: 4,
          title: 'PERFORMANCE - Optimizing Your Game',
          subtitle: 'Sport-specific training protocols for competitive excellence',
          lessons: 4
        }
      ],
      route: '/courses/pickleball-3p-system'
    }
  ];

  const stats = [
    { label: 'Active Students', value: '3,200+', icon: Users },
    { label: 'Course Completion', value: '94%', icon: Award },
    { label: 'Average Rating', value: '4.8/5', icon: Star }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-700 rounded-xl flex items-center justify-center">
                <Book className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Muscle-Meta Matrix Courses</h1>
                <p className="text-gray-600">Master the 4 Pillars of Metabolic Health</p>
              </div>
            </div>
            <Link to="/" className="text-gray-600 hover:text-gray-900 transition-colors">
              ← Back to Hub
            </Link>
          </div>
        </div>
      </header>

      {/* Stats Section */}
      <section className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid md:grid-cols-3 gap-6">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <Card key={index} className="text-center p-6">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <IconComponent className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-gray-600 text-sm">{stat.label}</div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 pb-12">
        {/* Featured Course */}
        <section className="mb-12">
          <div className="flex items-center space-x-2 mb-6">
            <Badge className="bg-yellow-100 text-yellow-800">Featured Course</Badge>
            <h2 className="text-2xl font-bold text-gray-900">Master Sleep Optimization</h2>
          </div>

          {courses.filter(c => c.featured).map((course) => (
            <div key={course.id} className="grid lg:grid-cols-3 gap-8">
              {/* Course Info */}
              <div className="lg:col-span-2">
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
                          <Moon className="w-8 h-8 text-blue-600" />
                        </div>
                        <div>
                          <Badge variant="secondary" className="mb-2">Pillar: Recovery</Badge>
                          <CardTitle className="text-2xl text-gray-900 mb-1">{course.title}</CardTitle>
                          <CardDescription className="text-lg text-gray-600 font-medium">
                            {course.subtitle}
                          </CardDescription>
                          <p className="text-sm text-gray-500 mt-2">
                            Instructor: <span className="font-medium">{course.instructor}</span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-1 mb-2">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="font-medium text-gray-900">{course.rating}</span>
                          <span className="text-gray-500">({course.students} students)</span>
                        </div>
                        <Badge variant="outline">{course.level}</Badge>
                      </div>
                    </div>

                    <p className="text-gray-700 leading-relaxed mb-6">
                      {course.description}
                    </p>

                    <div className="grid md:grid-cols-3 gap-4 mb-6">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{course.duration}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Book className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{course.lessons} lessons</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">94% completion rate</span>
                      </div>
                    </div>

                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3">What You'll Achieve:</h4>
                      <div className="grid md:grid-cols-2 gap-2">
                        {course.outcomes.map((outcome, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{outcome}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Course Modules:</h4>
                      <div className="space-y-3">
                        {course.modules.map((module, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <div className="font-medium text-gray-900">
                                Week {module.week}: {module.title}
                              </div>
                              <div className="text-sm text-gray-600">{module.subtitle}</div>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {module.lessons} lessons
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </div>

              {/* Purchase Card */}
              <div className="lg:col-span-1">
                <Card className="sticky top-6">
                  <CardHeader className="text-center">
                    <div className="mb-4">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <span className="text-3xl font-bold text-gray-900">${course.price}</span>
                        <span className="text-lg text-gray-500 line-through">${course.originalPrice}</span>
                      </div>
                      <Badge className="bg-red-100 text-red-700">Save ${course.originalPrice - course.price}</Badge>
                    </div>

                    <Link to={course.route}>
                      <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 text-lg font-medium mb-4">
                        Enroll Now
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </Link>

                    <p className="text-sm text-gray-600 mb-4">
                      30-day money-back guarantee
                    </p>
                    
                    <Separator className="mb-4" />
                    
                    <div className="text-left space-y-3">
                      <h5 className="font-medium text-gray-900 mb-2">This course includes:</h5>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-gray-700">16 comprehensive video lessons</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-gray-700">Downloadable sleep tracking templates</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-gray-700">Oura Ring optimization guide</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-gray-700">Evening routine checklists</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-gray-700">Lifetime access to updates</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-gray-700">Community access & support</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </div>
            </div>
          ))}
        </section>

        {/* About the Instructor */}
        <section className="mb-12">
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900 mb-4">Meet Your Instructor</CardTitle>
              <div className="flex items-start space-x-6">
                <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  RB
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Randy Bauer, PT</h3>
                  <p className="text-gray-700 mb-4">
                    Founder of Muscle-Meta Matrix and licensed Physical Therapist with over 15 years of experience 
                    in metabolic health optimization. Randy specializes in the intersection of sleep science, 
                    recovery protocols, and performance enhancement.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Licensed PT</Badge>
                    <Badge variant="secondary">Sleep Specialist</Badge>
                    <Badge variant="secondary">Recovery Expert</Badge>
                    <Badge variant="secondary">3,200+ Students</Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>
        </section>

        {/* The 4 Pillars */}
        <section className="mb-12">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-gray-900 mb-4">The 4 Pillars of Muscle-Meta Matrix</CardTitle>
              <CardDescription className="text-gray-600 mb-6">
                Comprehensive courses covering every aspect of metabolic health optimization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center p-4 border rounded-lg">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Moon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Recovery</h4>
                  <p className="text-sm text-gray-600">Sleep optimization & stress management</p>
                  <Badge className="mt-2 bg-green-100 text-green-700">Available Now</Badge>
                </div>
                
                <div className="text-center p-4 border rounded-lg opacity-60">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Book className="w-6 h-6 text-gray-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Nutrition</h4>
                  <p className="text-sm text-gray-600">Metabolic nutrition strategies</p>
                  <Badge className="mt-2" variant="secondary">Coming Soon</Badge>
                </div>
                
                <div className="text-center p-4 border rounded-lg opacity-60">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="w-6 h-6 text-gray-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Training</h4>
                  <p className="text-sm text-gray-600">Exercise protocols & periodization</p>
                  <Badge className="mt-2" variant="secondary">Coming Soon</Badge>
                </div>
                
                <div className="text-center p-4 border rounded-lg opacity-60">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users className="w-6 h-6 text-gray-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Mindset</h4>
                  <p className="text-sm text-gray-600">Psychology of habit formation</p>
                  <Badge className="mt-2" variant="secondary">Coming Soon</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Footer */}
        <footer className="text-center border-t pt-8">
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <Book className="w-5 h-5 text-indigo-600" />
              <span className="text-gray-600">Transform your health through evidence-based education</span>
            </div>
            <p className="text-sm text-gray-500">
              Muscle-Meta Matrix Courses • Expert-led training programs for optimal metabolic health
            </p>
            <div className="flex justify-center space-x-6 text-sm">
              <Link to="/" className="text-indigo-600 hover:text-indigo-700">Newsletter Hub</Link>
              <a href="#" className="text-indigo-600 hover:text-indigo-700">Support</a>
              <a href="#" className="text-indigo-600 hover:text-indigo-700">Terms</a>
              <a href="#" className="text-indigo-600 hover:text-indigo-700">Privacy</a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default CoursesPage;