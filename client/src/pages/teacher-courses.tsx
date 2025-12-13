import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiEndpoint } from "@/lib/config";
import { 
  Loader2, BookOpen, Plus, Eye, EyeOff, Edit, Trash2, 
  CheckCircle2, XCircle, Globe, Lock, Megaphone 
} from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Course {
  id: string;
  title: string;
  description?: string | null;
  teacherId: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt?: string | null;
  imageUrl?: string | null;
}

// Get course icon based on title
const getCourseStyle = (title: string) => {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('math') || lowerTitle.includes('algebra') || lowerTitle.includes('geometry')) {
    return { bg: 'bg-gradient-to-br from-amber-200 to-amber-300', icon: '📐' };
  }
  if (lowerTitle.includes('science') || lowerTitle.includes('physics') || lowerTitle.includes('chemistry') || lowerTitle.includes('biology')) {
    return { bg: 'bg-gradient-to-br from-green-200 to-green-300', icon: '🔬' };
  }
  if (lowerTitle.includes('english') || lowerTitle.includes('writing') || lowerTitle.includes('literature')) {
    return { bg: 'bg-gradient-to-br from-blue-200 to-blue-300', icon: '📚' };
  }
  if (lowerTitle.includes('history') || lowerTitle.includes('social')) {
    return { bg: 'bg-gradient-to-br from-orange-200 to-orange-300', icon: '🏛️' };
  }
  if (lowerTitle.includes('art') || lowerTitle.includes('music') || lowerTitle.includes('drama')) {
    return { bg: 'bg-gradient-to-br from-purple-200 to-purple-300', icon: '🎨' };
  }
  if (lowerTitle.includes('computer') || lowerTitle.includes('programming') || lowerTitle.includes('coding')) {
    return { bg: 'bg-gradient-to-br from-cyan-200 to-cyan-300', icon: '💻' };
  }
  return { bg: 'bg-gradient-to-br from-indigo-200 to-indigo-300', icon: '📖' };
};

export default function TeacherCoursesPage() {
  const { user, token, isAuthenticated, getAuthHeaders } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);

  const fetchCourses = async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(apiEndpoint("/api/courses/user"), {
        headers: getAuthHeaders(),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("Failed to fetch courses:", res.status, errorData);
        throw new Error(errorData.message || "Failed to load courses");
      }
      
      const data = await res.json();
      setCourses(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Failed to fetch courses:", err);
      setError(err?.message || "Unknown error");
      toast({
        title: "Error",
        description: "Failed to load your courses. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token && isAuthenticated) {
      fetchCourses();
    } else {
      setIsLoading(false);
    }
  }, [token, isAuthenticated]);

  const handleTogglePublish = async (courseId: string, currentStatus: boolean) => {
    setPublishingId(courseId);
    try {
      const res = await fetch(apiEndpoint(`/api/courses/${courseId}/publish`), {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ isPublished: !currentStatus })
      });

      if (!res.ok) {
        throw new Error("Failed to update course status");
      }

      const { course } = await res.json();
      
      // Update local state
      setCourses(courses.map(c => c.id === courseId ? course : c));
      
      toast({
        title: "Success",
        description: `Course ${course.isPublished ? 'published' : 'unpublished'} successfully`,
        variant: "default"
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to update course status",
        variant: "destructive"
      });
    } finally {
      setPublishingId(null);
    }
  };

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;
    
    setDeletingId(courseToDelete.id);
    try {
      const res = await fetch(`/api/courses/${courseToDelete.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!res.ok) {
        throw new Error("Failed to delete course");
      }

      // Remove from local state
      setCourses(courses.filter(c => c.id !== courseToDelete.id));
      
      toast({
        title: "Success",
        description: "Course deleted successfully",
        variant: "default"
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to delete course",
        variant: "destructive"
      });
    } finally {
      setDeletingId(null);
      setCourseToDelete(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-10">
        {/* Enhanced Header - Dark Theme */}
        <div className="bg-gradient-to-r from-slate-800 via-slate-800/95 to-slate-900 rounded-2xl p-6 shadow-xl border border-slate-700/50">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">My Classes</h1>
              <p className="text-slate-400">Create, manage, and publish your classes</p>
            </div>
            <Button 
              onClick={() => setLocation('/teacher/courses/create')}
              className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Class
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <BookOpen className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Total Courses</p>
                  <p className="text-2xl font-bold text-white">{courses.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Globe className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Published</p>
                  <p className="text-2xl font-bold text-white">{courses.filter(c => c.isPublished).length}</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <Lock className="h-5 w-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Drafts</p>
                  <p className="text-2xl font-bold text-white">{courses.filter(c => !c.isPublished).length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Courses List */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64 text-slate-400">
            <Loader2 className="mr-2 h-8 w-8 animate-spin text-yellow-500" />
            <span>Loading your courses...</span>
          </div>
        ) : error ? (
          <Card className="bg-red-500/10 border-red-500/30 shadow-xl">
            <CardContent className="py-8 text-center">
              <div className="flex items-center justify-center gap-2 text-red-400">
                <XCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        ) : courses.length === 0 ? (
          <Card className="bg-slate-800/50 border border-slate-700/50 shadow-xl rounded-2xl">
            <CardContent className="py-16 text-center">
              <BookOpen className="h-16 w-16 mx-auto text-slate-500 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                No courses yet
              </h3>
              <p className="text-slate-400 mb-6">
                Get started by creating your first course
              </p>
              <Button 
                onClick={() => setLocation('/teacher/courses/create')}
                className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Your First Course
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course, index) => {
              const courseStyle = getCourseStyle(course.title);
              return (
                <Card 
                  key={course.id} 
                  className="group bg-slate-800/50 border border-slate-700/50 shadow-xl rounded-2xl hover:shadow-2xl hover:border-slate-600/50 transition-all overflow-hidden opacity-0 animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s`, animationFillMode: 'forwards' }}
                >
                  {/* Course Image */}
                  <div className={`h-36 relative overflow-hidden ${!course.imageUrl ? 'bg-gradient-to-br from-slate-700 to-slate-800' : ''}`}>
                    {course.imageUrl && course.imageUrl.length > 0 ? (
                      <img 
                        src={course.imageUrl.startsWith('http') ? course.imageUrl : `/uploads/${course.imageUrl}`}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 bg-slate-600/50 rounded-xl flex items-center justify-center backdrop-blur-sm">
                          <span className="text-3xl">{courseStyle.icon}</span>
                        </div>
                      </div>
                    )}
                    {/* Status Badge Overlay */}
                    <div className="absolute top-3 right-3">
                      <Badge 
                        className={course.isPublished 
                          ? "bg-green-500/90 text-white hover:bg-green-500/90 border-0 shadow-md" 
                          : "bg-orange-500/90 text-white hover:bg-orange-500/90 border-0 shadow-md"
                        }
                      >
                        {course.isPublished ? (
                          <span className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            Published
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Lock className="h-3 w-3" />
                            Draft
                          </span>
                        )}
                      </Badge>
                    </div>
                  </div>
                  
                  <CardHeader className="pb-3 pt-4">
                    <CardTitle className="text-xl font-bold text-white line-clamp-2 group-hover:text-yellow-500 transition-colors">
                      {course.title}
                    </CardTitle>
                    <CardDescription className="mt-2 line-clamp-2 text-sm text-slate-400">
                      {course.description || "No description provided"}
                    </CardDescription>
                  </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="text-xs text-slate-400 flex items-center gap-1 bg-slate-700/50 rounded-lg p-2">
                    <CheckCircle2 className="h-3 w-3" />
                    Created: {formatDate(course.createdAt)}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => setLocation(`/teacher/courses/${course.id}`)}
                      className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 w-full"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Manage
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTogglePublish(course.id, course.isPublished)}
                      disabled={publishingId === course.id}
                      className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white"
                    >
                      {publishingId === course.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : course.isPublished ? (
                        <>
                          <EyeOff className="h-4 w-4 mr-1" />
                          Unpublish
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-1" />
                          Publish
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setCourseToDelete(course);
                    }}
                    disabled={deletingId === course.id}
                    className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    {deletingId === course.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete Course
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!courseToDelete} onOpenChange={(open) => !open && setCourseToDelete(null)}>
        <AlertDialogContent className="bg-slate-800 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This will permanently delete the course "{courseToDelete?.title}" and all its associated lessons and enrollments. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCourse}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Course
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
