import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { CreateCourseForm } from '@/components/CreateCourseForm';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/DashboardLayout';
import { 
  ArrowLeft, Lock, ShieldAlert, CheckCircle, 
  ClipboardList, FileText, Rocket, Lightbulb, Check,
  BookOpen, Users, Video, Award, Sparkles, GraduationCap
} from 'lucide-react';

export default function CreateCoursePage() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [successMessage, setSuccessMessage] = useState(false);

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin mx-auto"></div>
            <BookOpen className="w-8 h-8 text-emerald-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-gray-600 mt-4 font-medium">Preparing your workspace...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-10 max-w-md w-full text-center border border-white/20">
          <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Access Denied</h1>
          <p className="text-gray-300 mb-8">
            You must be logged in as a teacher or administrator to create a course.
          </p>
          <Button
            onClick={() => setLocation('/demo')}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold py-6 rounded-xl shadow-lg"
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-10 max-w-md w-full text-center border border-white/20">
          <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-10 h-10 text-amber-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Insufficient Permissions</h1>
          <p className="text-gray-300 mb-2">
            Only teachers and administrators can create classes.
          </p>
          <p className="text-sm text-gray-400 mb-8">
            Your current role: <span className="font-semibold text-amber-400 capitalize">{user?.role}</span>
          </p>
          <Button
            onClick={() => setLocation('/teacher')}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold py-6 rounded-xl shadow-lg"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen relative">
        {/* Animated Background Elements */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-cyan-50"></div>
          <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-200/40 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-200/40 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-200/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Hero Header */}
          <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl p-8 md:p-12 shadow-2xl">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl transform translate-x-20 -translate-y-20"></div>
            <div className="absolute bottom-0 left-0 w-60 h-60 bg-white/10 rounded-full blur-2xl transform -translate-x-20 translate-y-10"></div>
            
            <div className="relative z-10">
              <Button
                variant="ghost"
                onClick={() => setLocation('/teacher')}
                className="mb-6 text-white/80 hover:text-white hover:bg-white/10 gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                    Create a New Course
                  </h1>
                  <p className="text-white/80 text-lg mt-1">
                    Design an engaging learning experience for your students
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Success Alert */}
          {successMessage && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 shadow-lg animate-in slide-in-from-top duration-500">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-green-900 text-lg">Course Created Successfully!</p>
                  <p className="text-green-700 mt-1">
                    Your new course has been created. Redirecting you to add lessons and content...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Form Section - Takes 2 columns */}
            <div className="lg:col-span-2">
              <CreateCourseForm
                onSuccess={() => {
                  setSuccessMessage(true);
                  setTimeout(() => {
                    setLocation('/teacher/courses');
                  }, 2500);
                }}
                onCancel={() => setLocation('/teacher/courses')}
              />
            </div>

            {/* Sidebar - Takes 1 column */}
            <div className="space-y-6">
              {/* Quick Tips Card */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 shadow-lg border border-amber-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
                    <Lightbulb className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900">Pro Tips</h3>
                </div>
                <ul className="space-y-3">
                  {[
                    'Use action verbs in your title',
                    'Outline clear learning outcomes',
                    'Keep descriptions concise but informative',
                    'Courses are unpublished by default',
                    'Add lessons after creation'
                  ].map((tip, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                      <Check className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              {/* What's Next Card */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Rocket className="w-5 h-5 text-purple-500" />
                  What's Next?
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-purple-50 border border-purple-100">
                    <div className="w-8 h-8 rounded-lg bg-purple-500 text-white flex items-center justify-center text-sm font-bold">1</div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Add Lessons</p>
                      <p className="text-xs text-gray-600">Create engaging content</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100">
                    <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center text-sm font-bold">2</div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Enroll Students</p>
                      <p className="text-xs text-gray-600">Invite learners to join</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center text-sm font-bold">3</div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Publish Course</p>
                      <p className="text-xs text-gray-600">Go live when ready</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Preview */}
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 shadow-lg text-white">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-400" />
                  Your Teaching Stats
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 rounded-xl bg-white/10">
                    <GraduationCap className="w-6 h-6 mx-auto mb-1 text-emerald-400" />
                    <p className="text-2xl font-bold">0</p>
                    <p className="text-xs text-gray-400">Courses</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-white/10">
                    <Users className="w-6 h-6 mx-auto mb-1 text-blue-400" />
                    <p className="text-2xl font-bold">0</p>
                    <p className="text-xs text-gray-400">Students</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 text-center mt-4">
                  Create your first course to start teaching!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
