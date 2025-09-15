import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Heart, Activity, Calendar, ArrowRight, Users, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const NewsletterHub = () => {
  const newsletters = [
    {
      id: 1,
      title: "Unlock Your Muscle's Metabolic Potential",
      description: "Deep dive into the science of muscle metabolic health with evidence-based strategies for optimizing your body's energy systems.",
      issue: "#42",
      date: "February 2024",
      topics: ["Metabolic Nutrition", "Exercise Protocols", "Recovery & Sleep"],
      icon: Heart,
      color: "emerald",
      route: "/",
      featured: false
    },
    {
      id: 2,
      title: "Unlocking Longevity: The Metabolic Magic of HIIT",
      description: "Discover how short bursts of intense exercise can profoundly impact your metabolic health, boost energy levels, and enhance anti-aging pathways.",
      issue: "#43",
      date: "February 2024",
      topics: ["Insulin Sensitivity", "Mitochondrial Health", "Time-Efficient Training"],
      icon: Activity,
      color: "orange",
      route: "/hiit-longevity",
      featured: true
    }
  ];

  const getColorClasses = (color) => {
    const colorMap = {
      emerald: {
        bg: "bg-emerald-100",
        text: "text-emerald-600",
        button: "bg-emerald-600 hover:bg-emerald-700",
        badge: "bg-emerald-100 text-emerald-700"
      },
      orange: {
        bg: "bg-orange-100", 
        text: "text-orange-600",
        button: "bg-orange-600 hover:bg-orange-700",
        badge: "bg-orange-100 text-orange-700"
      }
    };
    return colorMap[color] || colorMap.emerald;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-slate-800 to-gray-900 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-3xl font-bold text-gray-900">Muscle-Meta Matrix</h1>
                <p className="text-gray-600">Advanced insights for metabolic health & longevity</p>
              </div>
            </div>
            
            <div className="flex items-center justify-center space-x-8 mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">2.4K+</div>
                <div className="text-sm text-gray-600">Active Readers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">43</div>
                <div className="text-sm text-gray-600">Issues Published</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">95%</div>
                <div className="text-sm text-gray-600">Satisfaction Rate</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Welcome Section */}
        <section className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Your Metabolic Health Hub
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Explore our comprehensive newsletter series designed to unlock the secrets of muscle metabolism, 
            longevity, and optimal health through evidence-based insights and actionable strategies.
          </p>
        </section>

        {/* Featured Newsletter */}
        <section className="mb-12">
          <div className="flex items-center space-x-2 mb-6">
            <Badge className="bg-yellow-100 text-yellow-800">Featured</Badge>
            <h3 className="text-xl font-semibold text-gray-900">Latest Issue</h3>
          </div>
          
          {newsletters.filter(n => n.featured).map((newsletter) => {
            const colors = getColorClasses(newsletter.color);
            const IconComponent = newsletter.icon;
            
            return (
              <Card key={newsletter.id} className="hover:shadow-xl transition-all duration-300 border-2 hover:border-orange-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-16 h-16 ${colors.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <IconComponent className={`w-8 h-8 ${colors.text}`} />
                      </div>
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          <Badge className={colors.badge}>Issue {newsletter.issue}</Badge>
                          <span className="text-sm text-gray-500 flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{newsletter.date}</span>
                          </span>
                        </div>
                        <CardTitle className="text-2xl text-gray-900 mb-2">{newsletter.title}</CardTitle>
                        <CardDescription className="text-gray-600 text-base">
                          {newsletter.description}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Key Topics Covered:</h4>
                      <div className="flex flex-wrap gap-2">
                        {newsletter.topics.map((topic, index) => (
                          <Badge key={index} variant="secondary" className="bg-gray-100 text-gray-700">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4">
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>8 min read</span>
                        </span>
                      </div>
                      
                      <Link to={newsletter.route}>
                        <Button className={`${colors.button} text-white font-medium px-6 py-2 rounded-lg flex items-center space-x-2`}>
                          <span>Read Issue</span>
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>

        {/* Newsletter Archive */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold text-gray-900">Newsletter Archive</h3>
            <Button variant="outline" className="text-gray-600 border-gray-300">
              View All Issues
            </Button>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {newsletters.filter(n => !n.featured).map((newsletter) => {
              const colors = getColorClasses(newsletter.color);
              const IconComponent = newsletter.icon;
              
              return (
                <Card key={newsletter.id} className="hover:shadow-lg transition-all duration-300 hover:border-emerald-200">
                  <CardHeader>
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <IconComponent className={`w-6 h-6 ${colors.text}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge className={colors.badge}>Issue {newsletter.issue}</Badge>
                          <span className="text-xs text-gray-500">{newsletter.date}</span>
                        </div>
                        <CardTitle className="text-lg text-gray-900 mb-1">{newsletter.title}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <CardDescription className="text-gray-600 mb-4">
                      {newsletter.description}
                    </CardDescription>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {newsletter.topics.slice(0, 2).map((topic, index) => (
                          <Badge key={index} variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                            {topic}
                          </Badge>
                        ))}
                        {newsletter.topics.length > 2 && (
                          <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                            +{newsletter.topics.length - 2} more
                          </Badge>
                        )}
                      </div>
                      
                      <Link to={newsletter.route}>
                        <Button variant="ghost" className="text-gray-600 hover:text-gray-900 p-2">
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Newsletter Stats */}
        <section className="mb-16">
          <Card className="bg-gradient-to-r from-gray-50 to-slate-100 border-gray-200">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-gray-900">Why Join Our Community?</CardTitle>
              <CardDescription className="text-gray-600">
                Thousands of health enthusiasts trust our evidence-based insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-8 text-center">
                <div>
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-8 h-8 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Evidence-Based</h4>
                  <p className="text-gray-600 text-sm">Every recommendation backed by peer-reviewed research</p>
                </div>
                
                <div>
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Community Driven</h4>
                  <p className="text-gray-600 text-sm">Join thousands of like-minded health enthusiasts</p>
                </div>
                
                <div>
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Activity className="w-8 h-8 text-purple-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Actionable</h4>
                  <p className="text-gray-600 text-sm">Practical strategies you can implement immediately</p>
                </div>
              </div>
              
              <div className="text-center mt-8">
                <Button className="bg-gray-800 hover:bg-gray-900 text-white px-8 py-3 rounded-lg font-medium">
                  Subscribe for Updates
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Footer */}
        <footer className="text-center border-t pt-8">
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <TrendingUp className="w-5 h-5 text-gray-600" />
              <span className="text-gray-600">Building healthier, stronger communities</span>
            </div>
            <p className="text-sm text-gray-500">
              Muscle-Meta Matrix • February 2024 • Your trusted source for metabolic health insights
            </p>
            <div className="flex justify-center space-x-6 text-sm">
              <a href="#" className="text-gray-600 hover:text-gray-900">About</a>
              <a href="#" className="text-gray-600 hover:text-gray-900">Archive</a>
              <a href="#" className="text-gray-600 hover:text-gray-900">Subscribe</a>
              <a href="#" className="text-gray-600 hover:text-gray-900">Contact</a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default NewsletterHub;