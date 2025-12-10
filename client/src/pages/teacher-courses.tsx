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
}

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
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 shadow-lg border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Courses</h1>
              <p className="text-gray-600">Create, manage, and publish your courses</p>
            </div>
            <Button 
              onClick={() => setLocation('/teacher/courses/create')}
              className="bg-blue-600 hover:bg-blue-700 gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Course
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Courses</p>
                  <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Globe className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Published</p>
                  <p className="text-2xl font-bold text-gray-900">{courses.filter(c => c.isPublished).length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Lock className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Drafts</p>
                  <p className="text-2xl font-bold text-gray-900">{courses.filter(c => !c.isPublished).length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Courses List */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <Loader2 className="mr-2 h-8 w-8 animate-spin" />
            <span>Loading your courses...</span>
          </div>
        ) : error ? (
          <Card className="border-red-100 bg-red-50 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
            <CardContent className="py-8 text-center">
              <div className="flex items-center justify-center gap-2 text-red-700">
                <XCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        ) : courses.length === 0 ? (
          <Card className="border-0 shadow-[0_2px_8px_rgba(0,0,0,0.08)] rounded-2xl">
            <CardContent className="py-16 text-center">
              <BookOpen className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No courses yet
              </h3>
              <p className="text-gray-600 mb-6">
                Get started by creating your first course
              </p>
              <Button 
                onClick={() => setLocation('/teacher/courses/create')}
                className="bg-blue-600 hover:bg-blue-700 gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Your First Course
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Card 
                key={course.id} 
                className="group border-0 shadow-[0_2px_8px_rgba(0,0,0,0.08)] rounded-2xl hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-all overflow-hidden"
              >
                <div className="h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                      <BookOpen className="h-6 w-6 text-blue-600" />
                    </div>
                    <Badge 
                      className={course.isPublished 
                        ? "bg-green-100 text-green-700 hover:bg-green-100 border-0" 
                        : "bg-orange-100 text-orange-700 hover:bg-orange-100 border-0"
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
                  <CardTitle className="text-xl font-bold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {course.title}
                  </CardTitle>
                  <CardDescription className="mt-2 line-clamp-2 text-sm">
                    {course.description || "No description provided"}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="text-xs text-gray-500 flex items-center gap-1 bg-gray-50 rounded-lg p-2">
                    <CheckCircle2 className="h-3 w-3" />
                    Created: {formatDate(course.createdAt)}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => setLocation(`/teacher/courses/${course.id}`)}
                      className="bg-blue-600 hover:bg-blue-700 w-full"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Manage
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTogglePublish(course.id, course.isPublished)}
                      disabled={publishingId === course.id}
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
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
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
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!courseToDelete} onOpenChange={(open) => !open && setCourseToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the course "{courseToDelete?.title}" and all its associated lessons and enrollments. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
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
