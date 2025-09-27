import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { 
  Save, Plus, Trash2, Eye, ArrowLeft, ChevronDown, ChevronRight,
  Upload, Play, Volume2, FileText, Video, Headphones
} from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/use-toast';

const CourseEditor = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditing = courseId && courseId !== 'create';

  const [course, setCourse] = useState({
    title: '',
    subtitle: '',
    instructor: '',
    description: '',
    price: '',
    originalPrice: '',
    duration: '',
    level: 'All Levels',
    featured: false,
    pillars: [],
    modules: []
  });

  const [currentModule, setCurrentModule] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEditing) {
      loadCourse();
    }
  }, [courseId, isEditing]);

  const loadCourse = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/courses/${courseId}`);
      if (response.ok) {
        const courseData = await response.json();
        setCourse(courseData);
      }
    } catch (error) {
      console.error('Error loading course:', error);
      toast({
        title: "Error",
        description: "Failed to load course data",
        variant: "destructive"
      });
    }
  };

  const saveCourse = async () => {
    setSaving(true);
    try {
      const url = isEditing 
        ? `${process.env.REACT_APP_BACKEND_URL}/api/admin/courses/${courseId}`
        : `${process.env.REACT_APP_BACKEND_URL}/api/admin/courses`;
      
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(course)
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Course ${isEditing ? 'updated' : 'created'} successfully`
        });
        
        if (!isEditing) {
          const newCourse = await response.json();
          navigate(`/admin/courses/edit/${newCourse.id}`);
        }
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? 'update' : 'create'} course`,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const addModule = () => {
    const newModule = {
      id: Date.now().toString(),
      week: course.modules.length + 1,
      title: '',
      subtitle: '',
      description: '',
      lessons: []
    };
    setCourse(prev => ({
      ...prev,
      modules: [...prev.modules, newModule]
    }));
    setCurrentModule(newModule.id);
  };

  const updateModule = (moduleId, updates) => {
    setCourse(prev => ({
      ...prev,
      modules: prev.modules.map(m => 
        m.id === moduleId ? { ...m, ...updates } : m
      )
    }));
  };

  const deleteModule = (moduleId) => {
    setCourse(prev => ({
      ...prev,
      modules: prev.modules.filter(m => m.id !== moduleId)
    }));
    if (currentModule === moduleId) {
      setCurrentModule(null);
    }
  };

  const addLesson = (moduleId) => {
    const newLesson = {
      id: Date.now().toString(),
      title: '',
      content: '',
      duration: '',
      type: 'video', // video, text, audio, pdf
      resources: [],
      preview: false
    };

    updateModule(moduleId, {
      lessons: [
        ...course.modules.find(m => m.id === moduleId)?.lessons || [],
        newLesson
      ]
    });
  };

  const updateLesson = (moduleId, lessonId, updates) => {
    const module = course.modules.find(m => m.id === moduleId);
    if (module) {
      updateModule(moduleId, {
        lessons: module.lessons.map(l => 
          l.id === lessonId ? { ...l, ...updates } : l
        )
      });
    }
  };

  const deleteLesson = (moduleId, lessonId) => {
    const module = course.modules.find(m => m.id === moduleId);
    if (module) {
      updateModule(moduleId, {
        lessons: module.lessons.filter(l => l.id !== lessonId)
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/admin" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isEditing ? 'Edit Course' : 'Create Course'}
                </h1>
                <p className="text-gray-600">
                  {isEditing ? 'Modify course content and settings' : 'Build a new course from scratch'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {isEditing && (
                <Link to={`/courses/${courseId}`}>
                  <Button variant="outline">
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                </Link>
              )}
              <Button onClick={saveCourse} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Course'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Course Settings */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Course Settings</CardTitle>
                <CardDescription>Basic course information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="title">Course Title</Label>
                  <Input
                    id="title"
                    value={course.title}
                    onChange={(e) => setCourse(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="The 4-Week Sleep Optimization Blueprint"
                  />
                </div>

                <div>
                  <Label htmlFor="subtitle">Subtitle</Label>
                  <Input
                    id="subtitle"
                    value={course.subtitle}
                    onChange={(e) => setCourse(prev => ({ ...prev, subtitle: e.target.value }))}
                    placeholder="Reclaiming Your Rest & Vitality"
                  />
                </div>

                <div>
                  <Label htmlFor="instructor">Instructor</Label>
                  <Input
                    id="instructor"
                    value={course.instructor}
                    onChange={(e) => setCourse(prev => ({ ...prev, instructor: e.target.value }))}
                    placeholder="Randy Bauer, PT"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={course.description}
                    onChange={(e) => setCourse(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Course description..."
                    className="min-h-24"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Price ($)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={course.price}
                      onChange={(e) => setCourse(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="97.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="originalPrice">Original Price ($)</Label>
                    <Input
                      id="originalPrice"
                      type="number"
                      step="0.01"
                      value={course.originalPrice}
                      onChange={(e) => setCourse(prev => ({ ...prev, originalPrice: e.target.value }))}
                      placeholder="147.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="duration">Duration</Label>
                    <Input
                      id="duration"
                      value={course.duration}
                      onChange={(e) => setCourse(prev => ({ ...prev, duration: e.target.value }))}
                      placeholder="4 weeks"
                    />
                  </div>
                  <div>
                    <Label htmlFor="level">Level</Label>
                    <Select value={course.level} onValueChange={(value) => setCourse(prev => ({ ...prev, level: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Beginner">Beginner</SelectItem>
                        <SelectItem value="Intermediate">Intermediate</SelectItem>
                        <SelectItem value="Advanced">Advanced</SelectItem>
                        <SelectItem value="All Levels">All Levels</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="featured">Featured Course</Label>
                  <Switch
                    id="featured"
                    checked={course.featured}
                    onCheckedChange={(checked) => setCourse(prev => ({ ...prev, featured: checked }))}
                  />
                </div>

                <div>
                  <Label>Course Pillars</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {['Recovery', 'Nutrition', 'Training', 'Mindset'].map(pillar => (
                      <div key={pillar} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={pillar}
                          checked={course.pillars.includes(pillar)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCourse(prev => ({ ...prev, pillars: [...prev.pillars, pillar] }));
                            } else {
                              setCourse(prev => ({ ...prev, pillars: prev.pillars.filter(p => p !== pillar) }));
                            }
                          }}
                        />
                        <Label htmlFor={pillar} className="text-sm">{pillar}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Course Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Course Modules</CardTitle>
                    <CardDescription>Structure your course content into weekly modules</CardDescription>
                  </div>
                  <Button onClick={addModule} variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Module
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible value={currentModule} onValueChange={setCurrentModule}>
                  {course.modules.map((module) => (
                    <AccordionItem key={module.id} value={module.id} className="border rounded-lg mb-4">
                      <AccordionTrigger className="px-4 py-3 hover:no-underline">
                        <div className="flex items-center justify-between w-full">
                          <div className="text-left">
                            <div className="font-medium">
                              Week {module.week}: {module.title || 'Untitled Module'}
                            </div>
                            <div className="text-sm text-gray-600">{module.lessons?.length || 0} lessons</div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteModule(module.id);
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="space-y-4">
                          {/* Module Settings */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Module Title</Label>
                              <Input
                                value={module.title}
                                onChange={(e) => updateModule(module.id, { title: e.target.value })}
                                placeholder="The Foundations of Rest"
                              />
                            </div>
                            <div>
                              <Label>Week Number</Label>
                              <Input
                                type="number"
                                value={module.week}
                                onChange={(e) => updateModule(module.id, { week: parseInt(e.target.value) })}
                              />
                            </div>
                          </div>

                          <div>
                            <Label>Module Subtitle</Label>
                            <Input
                              value={module.subtitle}
                              onChange={(e) => updateModule(module.id, { subtitle: e.target.value })}
                              placeholder="Understanding & Optimizing Your Sleep Environment"
                            />
                          </div>

                          <div>
                            <Label>Module Description</Label>
                            <Textarea
                              value={module.description}
                              onChange={(e) => updateModule(module.id, { description: e.target.value })}
                              placeholder="This module covers..."
                              className="min-h-20"
                            />
                          </div>

                          {/* Lessons */}
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <Label>Lessons</Label>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => addLesson(module.id)}
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Add Lesson
                              </Button>
                            </div>

                            <div className="space-y-3">
                              {module.lessons?.map((lesson, lessonIndex) => (
                                <div key={lesson.id} className="p-4 border rounded-lg bg-gray-50">
                                  <div className="grid grid-cols-2 gap-4 mb-3">
                                    <div>
                                      <Label className="text-sm">Lesson Title</Label>
                                      <Input
                                        value={lesson.title}
                                        onChange={(e) => updateLesson(module.id, lesson.id, { title: e.target.value })}
                                        placeholder="Lesson title..."
                                        className="mt-1"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-sm">Duration</Label>
                                      <Input
                                        value={lesson.duration}
                                        onChange={(e) => updateLesson(module.id, lesson.id, { duration: e.target.value })}
                                        placeholder="18 min"
                                        className="mt-1"
                                      />
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-3 gap-4 mb-3">
                                    <div>
                                      <Label className="text-sm">Type</Label>
                                      <Select 
                                        value={lesson.type} 
                                        onValueChange={(value) => updateLesson(module.id, lesson.id, { type: value })}
                                      >
                                        <SelectTrigger className="mt-1">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="video">Video</SelectItem>
                                          <SelectItem value="audio">Audio</SelectItem>
                                          <SelectItem value="text">Text</SelectItem>
                                          <SelectItem value="pdf">PDF</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="flex items-center space-x-2 mt-6">
                                      <Switch
                                        id={`preview-${lesson.id}`}
                                        checked={lesson.preview}
                                        onCheckedChange={(checked) => updateLesson(module.id, lesson.id, { preview: checked })}
                                      />
                                      <Label htmlFor={`preview-${lesson.id}`} className="text-sm">Preview</Label>
                                    </div>
                                    <div className="flex items-center justify-end mt-6">
                                      <div className="flex space-x-2">
                                        <Button variant="ghost" size="sm">
                                          <Volume2 className="w-4 h-4" />
                                        </Button>
                                        <Button 
                                          variant="ghost" 
                                          size="sm"
                                          onClick={() => deleteLesson(module.id, lesson.id)}
                                          className="text-red-600"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>

                                  <div>
                                    <Label className="text-sm">Content</Label>
                                    <Textarea
                                      value={lesson.content}
                                      onChange={(e) => updateLesson(module.id, lesson.id, { content: e.target.value })}
                                      placeholder="Lesson content (supports HTML)..."
                                      className="mt-1 min-h-20"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>

                {course.modules.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No modules yet. Click "Add Module" to get started.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseEditor;