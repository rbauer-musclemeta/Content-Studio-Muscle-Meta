import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { 
  BookOpen, Users, DollarSign, FileText, Plus, Edit, Eye, Trash2, 
  Upload, Play, Pause, Volume2, Download, Settings, BarChart3,
  ChevronDown, ChevronRight, Save, X
} from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const [courses, setCourses] = useState([]);
  const [newsletters, setNewsletters] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load courses, newsletters, and transactions
      const [coursesRes, transactionsRes] = await Promise.all([
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/courses`),
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/payments/transactions`)
      ]);

      const coursesData = coursesRes.ok ? await coursesRes.json() : [];
      const transactionsData = transactionsRes.ok ? await transactionsRes.json() : [];

      setCourses(coursesData);
      setTransactions(transactionsData);

      // Calculate stats
      const totalRevenue = transactionsData
        .filter(t => t.payment_status === 'paid')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      setStats({
        totalCourses: coursesData.length,
        totalStudents: transactionsData.filter(t => t.payment_status === 'paid').length,
        totalRevenue: totalRevenue,
        pendingPayments: transactionsData.filter(t => t.payment_status === 'pending').length
      });

      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-indigo-700 rounded-xl flex items-center justify-center">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-600">Muscle-Meta Matrix Content Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/admin/research" className="text-teal-600 hover:text-teal-800 font-medium">
                Research Library
              </Link>
              <Link to="/admin/assets" className="text-teal-600 hover:text-teal-800 font-medium">
                Asset Library
              </Link>
              <Link to="/" className="text-gray-600 hover:text-gray-900">← Back to Site</Link>
              <Badge className="bg-green-100 text-green-700">Admin Mode</Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Courses</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalCourses}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">${stats.totalRevenue?.toFixed(2) || '0.00'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pending Payments</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingPayments}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Tabs */}
        <Tabs defaultValue="courses" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="newsletters">Newsletters</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="content">Content Tools</TabsTrigger>
          </TabsList>

          {/* Courses Management */}
          <TabsContent value="courses" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Course Management</CardTitle>
                    <CardDescription>Create and manage your course catalog</CardDescription>
                  </div>
                  <Link to="/admin/courses/create">
                    <Button className="bg-indigo-600 hover:bg-indigo-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Course
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {courses.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No courses found. Create your first course!</p>
                  ) : (
                    courses.map((course) => (
                      <div key={course.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{course.title}</h3>
                            <p className="text-sm text-gray-600">{course.instructor} • ${course.price}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant={course.featured ? "default" : "secondary"}>
                                {course.featured ? "Featured" : "Standard"}
                              </Badge>
                              <Badge variant="outline">{course.lessons} lessons</Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Link to={`/admin/courses/edit/${course.id}`}>
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Link to={`/courses/${course.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button variant="outline" size="sm" className="text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Newsletters Management */}
          <TabsContent value="newsletters" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Newsletter Management</CardTitle>
                    <CardDescription>Create and manage newsletter issues</CardDescription>
                  </div>
                  <Link to="/admin/newsletters/create">
                    <Button className="bg-indigo-600 hover:bg-indigo-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Issue
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Existing newsletters would be displayed here */}
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className="bg-emerald-100 text-emerald-700">Issue #42</Badge>
                        <Badge variant="secondary">Published</Badge>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">Unlock Your Muscle's Metabolic Potential</h3>
                      <p className="text-sm text-gray-600 mb-3">3 main topics with dropdown content</p>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Volume2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className="bg-orange-100 text-orange-700">Issue #43</Badge>
                        <Badge className="bg-green-100 text-green-700">Featured</Badge>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">Unlocking Longevity: The Metabolic Magic of HIIT</h3>
                      <p className="text-sm text-gray-600 mb-3">HIIT training for longevity benefits</p>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Volume2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions */}
          <TabsContent value="transactions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Transactions</CardTitle>
                <CardDescription>Monitor course enrollments and payments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transactions.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No transactions found.</p>
                  ) : (
                    transactions.slice(0, 10).map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">
                            {transaction.metadata?.course_title || 'Unknown Course'}
                          </p>
                          <p className="text-sm text-gray-600">
                            Session: {transaction.session_id?.substring(0, 20)}...
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(transaction.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">${transaction.amount}</p>
                          <Badge 
                            variant={transaction.payment_status === 'paid' ? 'default' : 
                                   transaction.payment_status === 'pending' ? 'secondary' : 'destructive'}
                          >
                            {transaction.payment_status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Tools */}
          <TabsContent value="content" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Text-to-Speech</CardTitle>
                  <CardDescription>Generate audio for courses and newsletters</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea 
                    placeholder="Enter text to convert to speech..."
                    className="min-h-32"
                  />
                  <div className="flex items-center space-x-4">
                    <Select>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select voice" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male-professional">Male Professional</SelectItem>
                        <SelectItem value="female-professional">Female Professional</SelectItem>
                        <SelectItem value="male-casual">Male Casual</SelectItem>
                        <SelectItem value="female-casual">Female Casual</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button>
                      <Volume2 className="w-4 h-4 mr-2" />
                      Generate Audio
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Resource Manager</CardTitle>
                  <CardDescription>Upload and manage course resources</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">Drag & drop files or click to upload</p>
                    <p className="text-xs text-gray-500">Supports: PDF, MP4, MP3, PPT, DOCX</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-700">sample-lesson.pdf</span>
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;