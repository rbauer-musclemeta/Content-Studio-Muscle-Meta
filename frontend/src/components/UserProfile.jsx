import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

const UserProfile = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (!user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Profile Header */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl">My Profile</CardTitle>
                <CardDescription>View and manage your account information</CardDescription>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Full Name</p>
              <p className="text-lg">{user.full_name}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="text-lg">{user.email}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">Account Status</p>
              <div className="flex gap-2 mt-1">
                {user.is_active ? (
                  <Badge variant="success" className="bg-green-100 text-green-800">Active</Badge>
                ) : (
                  <Badge variant="secondary">Inactive</Badge>
                )}
                {user.is_admin && (
                  <Badge variant="default">Admin</Badge>
                )}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">Member Since</p>
              <p className="text-lg">
                {new Date(user.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Enrolled Courses */}
        <Card>
          <CardHeader>
            <CardTitle>Enrolled Courses</CardTitle>
            <CardDescription>
              {user.enrolled_courses?.length || 0} course(s) enrolled
            </CardDescription>
          </CardHeader>
          <CardContent>
            {user.enrolled_courses && user.enrolled_courses.length > 0 ? (
              <div className="space-y-2">
                {user.enrolled_courses.map((courseId) => (
                  <div
                    key={courseId}
                    className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/courses/${courseId}`)}
                  >
                    <p className="font-medium capitalize">
                      {courseId.replace(/-/g, ' ')}
                    </p>
                    <Button
                      variant="link"
                      className="p-0 h-auto text-blue-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/courses/${courseId}`);
                      }}
                    >
                      View Course →
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No courses enrolled yet</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => navigate('/courses')}
                >
                  Browse Courses
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={() => navigate('/')}>
            Back to Home
          </Button>
          <Button onClick={() => navigate('/courses')}>
            Browse Courses
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
