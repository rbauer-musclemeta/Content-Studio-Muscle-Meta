import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Heart, Zap, Moon, Activity, TrendingUp, Timer, CheckCircle, Clock, Users, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const HIITNewsletter = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Muscle-Meta Matrix</h1>
                <p className="text-gray-600">Advanced metabolic insights for longevity</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Back to Hub</span>
              </Link>
              <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                Issue #43
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Unlocking Longevity: The Metabolic Magic of High-Intensity Interval Training
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Discover how short bursts of intense exercise, known as HIIT, can profoundly impact your metabolic health, 
              boost energy levels, and enhance anti-aging pathways. This guide breaks down the science and offers practical 
              steps to integrate HIIT safely into your routine for powerful longevity benefits.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Metabolic Enhancement</h3>
              <p className="text-gray-600 text-sm">Dramatically improve insulin sensitivity and glucose metabolism</p>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Cellular Rejuvenation</h3>
              <p className="text-gray-600 text-sm">Boost mitochondrial function and anti-aging processes</p>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Timer className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Time Efficient</h3>
              <p className="text-gray-600 text-sm">Maximum benefits in 15-20 minute sessions</p>
            </Card>
          </div>
        </section>

        {/* Main Topics Section */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">The Science Behind HIIT's Longevity Benefits</h2>
            <p className="text-lg text-gray-600">Explore the three key mechanisms that make HIIT a powerful anti-aging tool</p>
          </div>

          <Accordion type="single" collapsible className="space-y-6">
            {/* Topic 1: Metabolic Powerhouse */}
            <AccordionItem value="metabolic" className="border rounded-lg shadow-sm bg-white">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex items-center space-x-4 text-left">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Metabolic Powerhouse: Insulin Sensitivity & Glucose Control</h3>
                    <p className="text-gray-600 mt-1">Transform your body's ability to process glucose and prevent diabetes</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Insulin Sensitivity Revolution</h4>
                    <p className="text-gray-700 mb-4">
                      HIIT dramatically improves the body's ability to use insulin effectively, reducing blood sugar spikes 
                      and creating a more stable metabolic environment. This enhanced insulin sensitivity is one of the 
                      most powerful predictors of healthy aging and longevity.
                    </p>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <h5 className="font-medium text-orange-800 mb-2">Key Research Findings:</h5>
                      <ul className="text-orange-700 space-y-1">
                        <li>• 23% improvement in insulin sensitivity after 2 weeks of HIIT</li>
                        <li>• 50% better glucose tolerance compared to steady-state cardio</li>
                        <li>• Reduced risk of type 2 diabetes by up to 34%</li>
                        <li>• Lower HbA1c levels in just 6 weeks</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Glucose Metabolism Optimization</h4>
                    <p className="text-gray-700 mb-4">
                      Studies show that even short periods of HIIT can lead to better glucose tolerance than longer, 
                      moderate exercise sessions. The intense intervals create a metabolic demand that forces muscle 
                      cells to become more efficient at glucose uptake.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Fighting Metabolic Syndrome</h4>
                    <p className="text-gray-700">
                      This makes HIIT a potent tool in the fight against metabolic syndrome and age-related insulin 
                      resistance. The combination of improved insulin sensitivity and enhanced glucose metabolism 
                      creates a powerful defense against the metabolic decline that typically accompanies aging.
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Topic 2: Cellular Rejuvenation */}
            <AccordionItem value="cellular" className="border rounded-lg shadow-sm bg-white">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex items-center space-x-4 text-left">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Zap className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Cellular Rejuvenation: Mitochondrial Biogenesis</h3>
                    <p className="text-gray-600 mt-1">Supercharge your cellular powerhouses for enhanced energy and longevity</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">The Mitochondrial Connection</h4>
                    <p className="text-gray-700 mb-4">
                      Mitochondria are the "powerhouses" of our cells, and their decline is a hallmark of aging. 
                      As we age, both the number and efficiency of mitochondria decrease, leading to reduced energy 
                      production, increased oxidative stress, and accelerated cellular aging.
                    </p>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <h5 className="font-medium text-red-800 mb-2">HIIT's Mitochondrial Benefits:</h5>
                      <ul className="text-red-700 space-y-1">
                        <li>• Increases mitochondrial density by up to 40%</li>
                        <li>• Enhances mitochondrial enzyme activity</li>
                        <li>• Improves cellular oxygen utilization</li>
                        <li>• Reduces cellular oxidative stress</li>
                        <li>• Activates longevity genes (SIRT1, PGC-1α)</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Creating New Mitochondria</h4>
                    <p className="text-gray-700 mb-4">
                      HIIT is a powerful stimulus for mitochondrial biogenesis – the creation of new mitochondria. 
                      The intense exercise intervals create a cellular stress that triggers adaptive responses, 
                      including the production of new, more efficient mitochondria.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Enhanced Anti-Aging Mechanisms</h4>
                    <p className="text-gray-700">
                      More efficient mitochondria mean more energy, better cellular repair mechanisms, and enhanced 
                      anti-aging processes. This translates to improved physical performance, better cognitive function, 
                      and increased resistance to age-related diseases.
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Topic 3: Body Composition & Efficiency */}
            <AccordionItem value="composition" className="border rounded-lg shadow-sm bg-white">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex items-center space-x-4 text-left">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Timer className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Lean Muscle & Fat Loss: Body Composition Benefits</h3>
                    <p className="text-gray-600 mt-1">Optimize your physique with time-efficient, adaptable protocols</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Muscle Preservation & Fat Loss</h4>
                    <p className="text-gray-700 mb-4">
                      While not primarily a muscle-building workout, HIIT helps preserve lean muscle mass, especially 
                      when combined with resistance training. This is crucial for maintaining metabolic rate and 
                      functional capacity as we age.
                    </p>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h5 className="font-medium text-yellow-800 mb-2">The EPOC Effect:</h5>
                      <ul className="text-yellow-700 space-y-1">
                        <li>• Excess Post-exercise Oxygen Consumption</li>
                        <li>• Elevated metabolism for up to 24 hours post-workout</li>
                        <li>• 6-15% more calories burned compared to steady cardio</li>
                        <li>• Enhanced fat oxidation during recovery</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Time Efficiency Revolution</h4>
                    <p className="text-gray-700 mb-4">
                      A typical HIIT session can be as short as 15-20 minutes, including warm-up and cool-down. 
                      This makes it ideal for busy individuals looking to maximize health benefits in minimal time, 
                      removing the biggest barrier to exercise consistency.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Universal Adaptability</h4>
                    <p className="text-gray-700">
                      HIIT protocols can be adapted using various exercises (cycling, running, bodyweight movements) 
                      and intensity levels, making it suitable for beginners to advanced exercisers. This adaptability 
                      ensures that anyone can harness the longevity benefits of HIIT, regardless of their current fitness level.
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* Actionable Takeaways */}
        <section className="mb-16">
          <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-gray-900 flex items-center justify-center space-x-2">
                <Activity className="w-6 h-6 text-orange-600" />
                <span>Your HIIT Longevity Action Plan</span>
              </CardTitle>
              <CardDescription className="text-gray-600">
                Evidence-based steps to safely integrate HIIT into your longevity routine
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-orange-600" />
                    <span>Getting Started (Week 1-2)</span>
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                      <p className="text-gray-700">Begin with 20-second intervals, 40-second rest periods</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                      <p className="text-gray-700">Start with 6-8 intervals, 2 sessions per week</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                      <p className="text-gray-700">Focus on proper form over intensity initially</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-orange-600" />
                    <span>Advanced Protocol (Week 4+)</span>
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                      <p className="text-gray-700">Progress to 30-second intervals, 30-second rest</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                      <p className="text-gray-700">Increase to 10-12 intervals, 2-3 sessions per week</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                      <p className="text-gray-700">Combine with 2 resistance training sessions weekly</p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />
              
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 text-center mb-4">Essential Success Principles</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <p className="text-gray-700"><strong>Listen to Your Body:</strong> Allow 48 hours recovery between HIIT sessions</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <p className="text-gray-700"><strong>Consistency Over Perfection:</strong> Regular adherence beats perfect execution</p>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />
              
              <div className="text-center">
                <Button className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-lg font-medium">
                  Start Your HIIT Journey
                </Button>
                <p className="text-sm text-gray-600 mt-2">
                  Track your progress and share your transformation
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Footer */}
        <footer className="text-center border-t pt-8">
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <Activity className="w-5 h-5 text-orange-600" />
              <span className="text-gray-600">Powered by cutting-edge longevity research</span>
            </div>
            <p className="text-sm text-gray-500">
              Muscle-Meta Matrix • Issue #43 • February 2024
            </p>
            <div className="flex justify-center space-x-6 text-sm">
              <Link to="/" className="text-orange-600 hover:text-orange-700">Back to Hub</Link>
              <a href="#" className="text-orange-600 hover:text-orange-700">Archive</a>
              <a href="#" className="text-orange-600 hover:text-orange-700">Share Article</a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default HIITNewsletter;