import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { 
  Lightbulb, Wand2, FileText, Code, Eye, Download, Upload,
  ChevronRight, Sparkles, Brain, Layout, Palette
} from 'lucide-react';

const CourseAgent = ({ onTemplateApply, courseData, onContentUpdate }) => {
  const [agentMode, setAgentMode] = useState('suggest');
  const [coursePrompt, setCoursePrompt] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const courseTemplates = {
    'wellness-4week': {
      name: '4-Week Wellness Program',
      description: 'Structured wellness course with progressive modules',
      modules: [
        {
          week: 1,
          title: 'Foundation & Assessment',
          subtitle: 'Building Your Baseline',
          lessons: [
            { title: 'Welcome & Program Overview', type: 'video', duration: '15 min' },
            { title: 'Initial Assessment & Goal Setting', type: 'interactive', duration: '20 min' },
            { title: 'Understanding Your Current State', type: 'text', duration: '10 min' },
            { title: 'Week 1 Action Plan', type: 'pdf', duration: '5 min' }
          ]
        },
        {
          week: 2,
          title: 'Knowledge & Skills',
          subtitle: 'Learning Core Concepts',
          lessons: [
            { title: 'Core Principles Deep Dive', type: 'video', duration: '25 min' },
            { title: 'Practical Application Workshop', type: 'interactive', duration: '30 min' },
            { title: 'Common Mistakes to Avoid', type: 'text', duration: '12 min' },
            { title: 'Week 2 Implementation Guide', type: 'pdf', duration: '8 min' }
          ]
        },
        {
          week: 3,
          title: 'Advanced Techniques',
          subtitle: 'Mastering Advanced Methods',
          lessons: [
            { title: 'Advanced Strategies & Techniques', type: 'video', duration: '30 min' },
            { title: 'Personalization Workshop', type: 'interactive', duration: '25 min' },
            { title: 'Troubleshooting Common Issues', type: 'text', duration: '15 min' },
            { title: 'Week 3 Optimization Plan', type: 'pdf', duration: '10 min' }
          ]
        },
        {
          week: 4,
          title: 'Integration & Mastery',
          subtitle: 'Long-term Success & Sustainability',
          lessons: [
            { title: 'Creating Your Long-term Plan', type: 'video', duration: '20 min' },
            { title: 'Final Assessment & Progress Review', type: 'interactive', duration: '25 min' },
            { title: 'Maintaining Your Progress', type: 'text', duration: '18 min' },
            { title: 'Graduation & Next Steps', type: 'video', duration: '12 min' }
          ]
        }
      ]
    },
    'masterclass-intensive': {
      name: 'Intensive Masterclass',
      description: 'Deep-dive masterclass with expert-level content',
      modules: [
        {
          week: 1,
          title: 'Expert Foundations',
          subtitle: 'Advanced Baseline Knowledge',
          lessons: [
            { title: 'Expert Introduction & Philosophy', type: 'video', duration: '20 min' },
            { title: 'Advanced Concepts Overview', type: 'text', duration: '25 min' },
            { title: 'Industry Insights & Case Studies', type: 'interactive', duration: '35 min' }
          ]
        },
        {
          week: 2,
          title: 'Deep Implementation',
          subtitle: 'Advanced Application Methods',
          lessons: [
            { title: 'Advanced Implementation Strategies', type: 'video', duration: '40 min' },
            { title: 'Real-world Application Workshop', type: 'interactive', duration: '45 min' },
            { title: 'Expert Tips & Secrets', type: 'text', duration: '20 min' }
          ]
        }
      ]
    }
  };

  const htmlTemplates = {
    'interactive-course-full': {
      name: 'Full Interactive Course Template',
      html: `<!-- Complete Interactive Course Template -->
<div class="course-container">
  <section class="hero">
    <h1>{COURSE_TITLE}</h1>
    <p>{COURSE_DESCRIPTION}</p>
    <button class="hero__cta-button">Begin Your Journey</button>
  </section>

  <section class="stats">
    <div class="stat-card">
      <span class="stat-card__number">{MODULE_COUNT}</span>
      <span class="stat-card__label">Modules</span>
    </div>
    <div class="stat-card">
      <span class="stat-card__number">{LESSON_COUNT}</span>
      <span class="stat-card__label">Lessons</span>
    </div>
  </section>

  <section class="modules">
    <h2>Course Modules</h2>
    
    <div class="module-card">
      <div class="module-card__header" data-module="1" tabindex="0" role="button">
        <div class="module-card__info">
          <h3>Week 1: {MODULE_1_TITLE}</h3>
          <p>{MODULE_1_SUBTITLE}</p>
        </div>
        <svg class="module-card__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <polyline points="6,9 12,15 18,9"></polyline>
        </svg>
      </div>
      <div class="module-card__content" data-content="1">
        <div class="module-content">
          <p>{MODULE_1_DESCRIPTION}</p>
          <ul class="lesson-list">
            <li class="lesson-item">
              <div class="lesson-info">
                <h4>{LESSON_1_1_TITLE}</h4>
                <div class="lesson-meta">
                  <span>{LESSON_1_1_DURATION}</span>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</div>

<style>
:root {
  --color-primary: #4f46e5;
  --color-surface: #ffffff;
  --color-border: #d1d5db;
  --color-text: #111827;
  --radius-base: 8px;
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.course-container { max-width: 1200px; margin: 0 auto; padding: 20px; }
.hero { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 60px 40px; border-radius: 8px; margin-bottom: 40px; text-align: center; }
.stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 40px; }
.stat-card { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center; }
.module-card { background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px; overflow: hidden; }
.module-card__header { padding: 25px 30px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
.module-card__content { max-height: 0; overflow: hidden; transition: max-height 0.3s ease; }
</style>

<script>
// Your JavaScript functionality will be automatically included
</script>`
    },
    'lesson-interactive': {
      name: 'Interactive Lesson Template',
      html: `<div class="lesson-container">
  <div class="lesson-header">
    <h2 class="lesson-title">{LESSON_TITLE}</h2>
    <div class="lesson-meta">
      <span class="duration">{DURATION}</span>
      <span class="difficulty">{DIFFICULTY}</span>
    </div>
  </div>
  
  <div class="lesson-content">
    <div class="learning-objectives">
      <h3>Learning Objectives</h3>
      <ul>
        <li>{OBJECTIVE_1}</li>
        <li>{OBJECTIVE_2}</li>
        <li>{OBJECTIVE_3}</li>
      </ul>
    </div>
    
    <div class="main-content">
      {MAIN_CONTENT}
    </div>
    
    <div class="interactive-elements">
      <div class="knowledge-check">
        <h4>Knowledge Check</h4>
        <div class="question">
          <p>{QUESTION_TEXT}</p>
          <div class="options">
            <label><input type="radio" name="q1" value="a"> {OPTION_A}</label>
            <label><input type="radio" name="q1" value="b"> {OPTION_B}</label>
            <label><input type="radio" name="q1" value="c"> {OPTION_C}</label>
          </div>
        </div>
      </div>
      
      <div class="action-items">
        <h4>Action Items</h4>
        <ul class="checklist">
          <li><input type="checkbox"> {ACTION_1}</li>
          <li><input type="checkbox"> {ACTION_2}</li>
          <li><input type="checkbox"> {ACTION_3}</li>
        </ul>
      </div>
    </div>
  </div>
  
  <div class="lesson-navigation">
    <button class="btn-previous">← Previous Lesson</button>
    <button class="btn-next">Next Lesson →</button>
  </div>
</div>

<style>
.lesson-container { max-width: 800px; margin: 0 auto; padding: 20px; }
.lesson-header { border-bottom: 2px solid #e5e5e5; padding-bottom: 15px; margin-bottom: 25px; }
.lesson-title { font-size: 28px; color: #2d3748; margin-bottom: 10px; }
.lesson-meta span { background: #4299e1; color: white; padding: 5px 12px; border-radius: 15px; margin-right: 10px; font-size: 12px; }
.learning-objectives { background: #f7fafc; padding: 20px; border-radius: 8px; margin-bottom: 25px; }
.interactive-elements { margin-top: 30px; }
.knowledge-check, .action-items { background: #fff5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #f56565; }
.options label { display: block; margin: 8px 0; padding: 8px; background: white; border-radius: 4px; cursor: pointer; }
.checklist li { margin: 10px 0; }
.lesson-navigation { text-align: center; margin-top: 40px; }
.btn-previous, .btn-next { background: #4299e1; color: white; padding: 12px 24px; border: none; border-radius: 6px; margin: 0 10px; cursor: pointer; }
</style>`
    },
    'module-overview': {
      name: 'Module Overview Template',
      html: `<div class="module-overview">
  <div class="module-header">
    <div class="module-badge">Week {WEEK_NUMBER}</div>
    <h1 class="module-title">{MODULE_TITLE}</h1>
    <h2 class="module-subtitle">{MODULE_SUBTITLE}</h2>
  </div>
  
  <div class="module-description">
    <p>{MODULE_DESCRIPTION}</p>
  </div>
  
  <div class="module-stats">
    <div class="stat">
      <span class="stat-number">{LESSON_COUNT}</span>
      <span class="stat-label">Lessons</span>
    </div>
    <div class="stat">
      <span class="stat-number">{TOTAL_DURATION}</span>
      <span class="stat-label">Total Time</span>
    </div>
    <div class="stat">
      <span class="stat-number">{DIFFICULTY}</span>
      <span class="stat-label">Difficulty</span>
    </div>
  </div>
  
  <div class="lessons-preview">
    <h3>What You'll Learn</h3>
    <div class="lesson-grid">
      {LESSON_PREVIEWS}
    </div>
  </div>
  
  <div class="module-cta">
    <button class="start-module-btn">Start This Module</button>
  </div>
</div>

<style>
.module-overview { max-width: 900px; margin: 0 auto; padding: 30px; }
.module-header { text-align: center; margin-bottom: 30px; }
.module-badge { background: linear-gradient(45deg, #667eea 0%, #764ba2 100%); color: white; padding: 8px 20px; border-radius: 20px; display: inline-block; font-size: 14px; font-weight: bold; }
.module-title { font-size: 36px; color: #2d3748; margin: 20px 0 10px; }
.module-subtitle { font-size: 20px; color: #718096; margin-bottom: 20px; }
.module-description { font-size: 18px; line-height: 1.6; color: #4a5568; text-align: center; margin-bottom: 40px; }
.module-stats { display: flex; justify-content: center; gap: 40px; margin-bottom: 40px; }
.stat { text-align: center; }
.stat-number { display: block; font-size: 24px; font-weight: bold; color: #667eea; }
.stat-label { font-size: 14px; color: #718096; }
.lessons-preview h3 { font-size: 24px; margin-bottom: 20px; text-align: center; }
.lesson-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 40px; }
.module-cta { text-align: center; }
.start-module-btn { background: linear-gradient(45deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; border: none; border-radius: 30px; font-size: 18px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); }
</style>`
    }
  };

  const generateCourseSuggestions = (prompt) => {
    // AI-like suggestions based on prompt keywords
    const suggestions = [];
    
    if (prompt.toLowerCase().includes('sleep') || prompt.toLowerCase().includes('recovery')) {
      suggestions.push({
        type: 'structure',
        title: 'Sleep Course Structure',
        content: 'Consider organizing into: Environment → Habits → Optimization → Troubleshooting'
      });
      suggestions.push({
        type: 'interactive',
        title: 'Sleep Assessment Tool',
        content: 'Add an interactive sleep quality assessment with personalized recommendations'
      });
    }
    
    if (prompt.toLowerCase().includes('nutrition') || prompt.toLowerCase().includes('diet')) {
      suggestions.push({
        type: 'template',
        title: 'Meal Planning Module',
        content: 'Include downloadable meal planning templates and macro calculators'
      });
    }
    
    if (prompt.toLowerCase().includes('fitness') || prompt.toLowerCase().includes('exercise')) {
      suggestions.push({
        type: 'interactive',
        title: 'Exercise Video Library',
        content: 'Embed demonstration videos with progress tracking checkboxes'
      });
    }
    
    // General suggestions
    suggestions.push({
      type: 'engagement',
      title: 'Progress Tracking',
      content: 'Add weekly check-ins with self-reflection questions and progress photos'
    });
    
    suggestions.push({
      type: 'community',
      title: 'Community Features',
      content: 'Include discussion forums or peer accountability partnerships'
    });
    
    setSuggestions(suggestions);
  };

  const applyTemplate = (templateKey) => {
    const template = courseTemplates[templateKey];
    if (template && onTemplateApply) {
      onTemplateApply(template);
    }
  };

  const insertHtmlTemplate = (templateKey) => {
    const template = htmlTemplates[templateKey];
    if (template && onContentUpdate) {
      onContentUpdate(template.html);
    }
  };

  return (
    <div className="course-agent-container">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Brain className="w-6 h-6 text-purple-600" />
            <CardTitle>Course Development Agent</CardTitle>
          </div>
          <CardDescription>
            AI-powered assistant to help design engaging course layouts and interactive content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Agent Mode Selection */}
            <div>
              <Label>Agent Mode</Label>
              <Select value={agentMode} onValueChange={setAgentMode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="suggest">💡 Course Suggestions</SelectItem>
                  <SelectItem value="template">📋 Apply Templates</SelectItem>
                  <SelectItem value="html">💻 HTML Editor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Course Suggestions Mode */}
            {agentMode === 'suggest' && (
              <div className="space-y-4">
                <div>
                  <Label>Describe Your Course Concept</Label>
                  <Textarea
                    placeholder="E.g., I want to create a 4-week sleep optimization course that helps people improve their sleep quality through science-based methods..."
                    value={coursePrompt}
                    onChange={(e) => setCoursePrompt(e.target.value)}
                    className="min-h-24"
                  />
                </div>
                <Button 
                  onClick={() => generateCourseSuggestions(coursePrompt)}
                  className="bg-purple-600 hover:bg-purple-700"
                  disabled={!coursePrompt.trim()}
                >
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Generate Suggestions
                </Button>

                {suggestions.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center">
                      <Sparkles className="w-4 h-4 mr-2 text-purple-600" />
                      AI Suggestions
                    </h4>
                    {suggestions.map((suggestion, index) => (
                      <Card key={index} className="border-l-4 border-purple-500">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <Badge variant="secondary" className="mb-2">
                                {suggestion.type}
                              </Badge>
                              <h5 className="font-medium text-gray-900">{suggestion.title}</h5>
                              <p className="text-sm text-gray-600 mt-1">{suggestion.content}</p>
                            </div>
                            <Button variant="ghost" size="sm">
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Template Mode */}
            {agentMode === 'template' && (
              <div className="space-y-4">
                <div>
                  <Label>Course Templates</Label>
                  <p className="text-sm text-gray-600 mb-4">
                    Choose a pre-built template to jumpstart your course structure
                  </p>
                </div>

                <div className="grid gap-4">
                  {Object.entries(courseTemplates).map(([key, template]) => (
                    <Card key={key} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-2">{template.name}</h4>
                            <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>{template.modules.length} modules</span>
                              <span>{template.modules.reduce((total, mod) => total + mod.lessons.length, 0)} lessons</span>
                            </div>
                          </div>
                          <Button 
                            onClick={() => applyTemplate(key)}
                            className="bg-indigo-600 hover:bg-indigo-700"
                          >
                            <Layout className="w-4 h-4 mr-2" />
                            Apply
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* HTML Editor Mode */}
            {agentMode === 'html' && (
              <div className="space-y-4">
                <div>
                  <Label>HTML Templates</Label>
                  <p className="text-sm text-gray-600 mb-4">
                    Professional HTML templates for interactive course content
                  </p>
                </div>

                <Accordion type="single" collapsible>
                  {Object.entries(htmlTemplates).map(([key, template]) => (
                    <AccordionItem key={key} value={key} className="border rounded-lg mb-2">
                      <AccordionTrigger className="px-4">
                        <div className="flex items-center space-x-2">
                          <Code className="w-4 h-4 text-blue-600" />
                          <span>{template.name}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="space-y-3">
                          <div className="bg-gray-50 p-3 rounded text-xs font-mono max-h-32 overflow-y-auto">
                            {template.html.substring(0, 200)}...
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              onClick={() => insertHtmlTemplate(key)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Upload className="w-4 h-4 mr-1" />
                              Insert
                            </Button>
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4 mr-1" />
                              Preview
                            </Button>
                            <Button variant="outline" size="sm">
                              <Download className="w-4 h-4 mr-1" />
                              Download
                            </Button>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-3">
                    Upload custom HTML files for your course modules
                  </p>
                  <Button variant="outline">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload HTML File
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CourseAgent;