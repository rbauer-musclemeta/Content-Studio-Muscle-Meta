import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Heart, Zap, Moon, Apple, Dumbbell, Target, CheckCircle, Clock, Users } from 'lucide-react';

const Newsletter = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">MetaboFit Weekly</h1>
                <p className="text-gray-600">Your guide to muscle metabolic health</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
              Issue #42
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Unlock Your Muscle's Metabolic Potential
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              This week, we're diving deep into the science of muscle metabolic health. 
              Discover evidence-based strategies to optimize your body's energy systems and build lasting strength.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">3 Key Topics</h3>
              <p className="text-gray-600 text-sm">In-depth coverage of essential metabolic health areas</p>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Actionable Insights</h3>
              <p className="text-gray-600 text-sm">Practical takeaways you can implement today</p>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Expert Backed</h3>
              <p className="text-gray-600 text-sm">Research-based recommendations from leading scientists</p>
            </Card>
          </div>
        </section>

        {/* Main Topics Section */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">This Week's Deep Dive</h2>
            <p className="text-lg text-gray-600">Explore the three pillars of muscle metabolic health</p>
          </div>

          <Accordion type="single" collapsible className="space-y-6">
            {/* Topic 1: Nutrition */}
            <AccordionItem value="nutrition" className="border rounded-lg shadow-sm bg-white">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex items-center space-x-4 text-left">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Apple className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Metabolic Nutrition Strategies</h3>
                    <p className="text-gray-600 mt-1">Fuel your muscles for optimal energy production</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Protein Timing & Quality</h4>
                    <p className="text-gray-700 mb-4">
                      Recent studies show that consuming 25-30g of high-quality protein every 3-4 hours 
                      maximizes muscle protein synthesis rates. The key is leucine content - aim for 2.5-3g 
                      per meal to trigger the mTOR pathway effectively.
                    </p>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h5 className="font-medium text-green-800 mb-2">Top Leucine Sources:</h5>
                      <ul className="text-green-700 space-y-1">
                        <li>• Whey protein (3.2g per 30g serving)</li>
                        <li>• Chicken breast (2.8g per 100g)</li>
                        <li>• Greek yogurt (2.1g per cup)</li>
                        <li>• Eggs (1.0g per large egg)</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Carbohydrate Periodization</h4>
                    <p className="text-gray-700 mb-4">
                      Strategic carb intake around workouts enhances muscle glycogen replenishment and 
                      metabolic flexibility. The "fuel for the work required" approach optimizes both 
                      performance and body composition.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Micronutrient Optimization</h4>
                    <p className="text-gray-700">
                      Magnesium, zinc, and vitamin D play crucial roles in muscle metabolism. 
                      Consider supplementation if blood levels are suboptimal, as deficiencies 
                      can impair protein synthesis and energy production.
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Topic 2: Exercise */}
            <AccordionItem value="exercise" className="border rounded-lg shadow-sm bg-white">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex items-center space-x-4 text-left">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Dumbbell className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Exercise Protocols for Metabolic Health</h3>
                    <p className="text-gray-600 mt-1">Training strategies that enhance muscle metabolism</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">High-Intensity Interval Training (HIIT)</h4>
                    <p className="text-gray-700 mb-4">
                      HIIT protocols boost mitochondrial biogenesis and improve insulin sensitivity more 
                      effectively than steady-state cardio. The key is the intensity - aim for 85-95% 
                      max heart rate during work intervals.
                    </p>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h5 className="font-medium text-blue-800 mb-2">Sample HIIT Protocol:</h5>
                      <ul className="text-blue-700 space-y-1">
                        <li>• Warm-up: 5 minutes easy pace</li>
                        <li>• Work: 30 seconds all-out effort</li>
                        <li>• Rest: 90 seconds easy recovery</li>
                        <li>• Repeat: 8-12 cycles</li>
                        <li>• Cool-down: 5 minutes easy pace</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Resistance Training Variables</h4>
                    <p className="text-gray-700 mb-4">
                      Progressive overload remains king, but manipulating tempo, rest periods, and 
                      training frequency can enhance metabolic adaptations. Focus on compound movements 
                      that recruit multiple muscle groups simultaneously.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Zone 2 Training</h4>
                    <p className="text-gray-700">
                      Long-duration, moderate-intensity exercise (60-70% max HR) improves mitochondrial 
                      efficiency and fat oxidation. Aim for 2-3 sessions per week, 45-90 minutes each.
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Topic 3: Recovery */}
            <AccordionItem value="recovery" className="border rounded-lg shadow-sm bg-white">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex items-center space-x-4 text-left">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Moon className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Recovery & Sleep Optimization</h3>
                    <p className="text-gray-600 mt-1">When muscle building and repair actually happen</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Sleep Architecture & Muscle Recovery</h4>
                    <p className="text-gray-700 mb-4">
                      Deep sleep (Stage 3 NREM) is when growth hormone peaks, driving muscle protein 
                      synthesis and tissue repair. Even one night of poor sleep can reduce protein 
                      synthesis by up to 18% and increase muscle protein breakdown.
                    </p>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h5 className="font-medium text-purple-800 mb-2">Sleep Optimization Checklist:</h5>
                      <ul className="text-purple-700 space-y-1">
                        <li>• 7-9 hours total sleep time</li>
                        <li>• Room temperature 65-68°F (18-20°C)</li>
                        <li>• Complete darkness (blackout curtains)</li>
                        <li>• No screens 1 hour before bed</li>
                        <li>• Consistent sleep/wake times</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Active Recovery Strategies</h4>
                    <p className="text-gray-700 mb-4">
                      Light movement on rest days enhances blood flow and nutrient delivery to muscles 
                      without adding significant stress. Walking, yoga, or gentle swimming are excellent options.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Stress Management</h4>
                    <p className="text-gray-700">
                      Chronic stress elevates cortisol, which can impair muscle protein synthesis and 
                      promote muscle breakdown. Incorporate stress-reduction techniques like meditation, 
                      deep breathing, or nature walks into your routine.
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* Actionable Takeaways */}
        <section className="mb-16">
          <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-gray-900 flex items-center justify-center space-x-2">
                <Target className="w-6 h-6 text-emerald-600" />
                <span>This Week's Action Items</span>
              </CardTitle>
              <CardDescription className="text-gray-600">
                Simple steps you can implement starting today
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-emerald-600" />
                    <span>Quick Wins (5-10 minutes)</span>
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                      <p className="text-gray-700">Track your protein intake for 3 days using a food app</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                      <p className="text-gray-700">Set a consistent bedtime and wake time for this week</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                      <p className="text-gray-700">Add 10 minutes of walking after lunch daily</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-emerald-600" />
                    <span>This Week's Challenge</span>
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                      <p className="text-gray-700">Try one HIIT session using the protocol above</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                      <p className="text-gray-700">Implement a 30-minute "digital sunset" before bed</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                      <p className="text-gray-700">Practice 5 minutes of deep breathing daily</p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />
              
              <div className="text-center">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-lg font-medium">
                  Share Your Progress
                </Button>
                <p className="text-sm text-gray-600 mt-2">
                  Tag us @MetaboFit with your week's accomplishments
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Footer */}
        <footer className="text-center border-t pt-8">
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <Heart className="w-5 h-5 text-emerald-600" />
              <span className="text-gray-600">Made with science and care</span>
            </div>
            <p className="text-sm text-gray-500">
              MetaboFit Weekly • Issue #42 • February 2024
            </p>
            <div className="flex justify-center space-x-6 text-sm">
              <a href="#" className="text-emerald-600 hover:text-emerald-700">Archive</a>
              <a href="#" className="text-emerald-600 hover:text-emerald-700">Unsubscribe</a>
              <a href="#" className="text-emerald-600 hover:text-emerald-700">Forward to Friend</a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Newsletter;