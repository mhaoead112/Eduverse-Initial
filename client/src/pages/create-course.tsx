import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { CreateCourseForm } from '@/components/CreateCourseForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function CreateCoursePage() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [successMessage, setSuccessMessage] = useState(false);

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            You must be logged in as a teacher or administrator to create a course.
          </p>
          <Button
            onClick={() => setLocation('/demo')}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  // Check if user has proper role
  if (user?.role !== 'teacher' && user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">⛔</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Insufficient Permissions</h1>
          <p className="text-gray-600 mb-2">
            Only teachers and administrators can create courses.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Your current role: <span className="font-semibold capitalize">{user?.role}</span>
          </p>
          <Button
            onClick={() => setLocation('/teacher')}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Go to Teacher Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Button
            variant="ghost"
            onClick={() => setLocation('/teacher')}
            className="flex items-center gap-2 mb-4 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create a New Course</h1>
            <p className="mt-2 text-gray-600">
              Add a new course to your curriculum and start teaching.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Alert */}
        {successMessage && (
          <div className="mb-8 p-4 bg-green-50 border border-green-300 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <p className="font-semibold text-green-900">Course Created!</p>
                <p className="text-sm text-green-700 mt-1">
                  Your new course has been created successfully. You can now add lessons and enroll students.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Form Card */}
        <CreateCourseForm
          onSuccess={() => {
            setSuccessMessage(true);
            setTimeout(() => {
              setLocation('/teacher');
            }, 2500);
          }}
          onCancel={() => setLocation('/teacher')}
        />

        {/* Information Cards */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="text-3xl mb-3">📋</div>
            <h3 className="font-semibold text-gray-900 mb-2">Course Title</h3>
            <p className="text-sm text-gray-600">
              Give your course a clear, descriptive title that helps students understand what they'll learn.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-indigo-500">
            <div className="text-3xl mb-3">📝</div>
            <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-sm text-gray-600">
              Provide a detailed description of course content, learning outcomes, and what students should expect.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
            <div className="text-3xl mb-3">🚀</div>
            <h3 className="font-semibold text-gray-900 mb-2">Ready to Go</h3>
            <p className="text-sm text-gray-600">
              After creating your course, you can add lessons, manage content, and enroll students.
            </p>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">💡 Quick Tips</h2>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>✓ Course titles can be up to 255 characters</li>
            <li>✓ Descriptions can be up to 2000 characters</li>
            <li>✓ Courses are created as unpublished by default</li>
            <li>✓ You can edit your course details at any time</li>
            <li>✓ Add lessons to your course after creation</li>
            <li>✓ Publish your course when ready for students</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
