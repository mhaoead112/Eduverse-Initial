import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
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
  const { user, token, isAuthenticated } = useAuth();
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
      console.log("No token available yet");
      setIsLoading(false);
      return;
    }
    
    console.log("Fetching courses for user:", user?.username, "Role:", user?.role);
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:3001/api/courses/user", {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("Failed to fetch courses:", res.status, errorData);
        throw new Error(errorData.message || "Failed to load courses");
      }
      
      const data = await res.json();
      console.log("Courses fetched:", data);
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
        console.log(`Toggling publish status for course ${courseId} to ${!currentStatus}`);
      const res = await fetch(`http://localhost:3001/api/courses/${courseId}/publish`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
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
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              My Courses
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage your courses, publish them for students, and track enrollments
            </p>
          </div>
          <Link href="/teacher/courses/create">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create New Course
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Courses
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {courses.length}
                  </p>
                </div>
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Published
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {courses.filter(c => c.isPublished).length}
                  </p>
                </div>
                <Globe className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Drafts
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    {courses.filter(c => !c.isPublished).length}
                  </p>
                </div>
                <Lock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Courses List */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            Loading your courses...
          </div>
        ) : error ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-6">
              <div className="flex items-center gap-2 text-red-700">
                <XCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        ) : courses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No courses yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Get started by creating your first course
              </p>
              <Link href="/teacher/courses/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Course
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Card key={course.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg line-clamp-2">
                        {course.title}
                      </CardTitle>
                      <CardDescription className="mt-2 line-clamp-3">
                        {course.description || "No description provided"}
                      </CardDescription>
                    </div>
                    <Badge 
                      variant={course.isPublished ? "default" : "secondary"}
                      className="shrink-0"
                    >
                      {course.isPublished ? (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
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
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col justify-between">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                    Created: {formatDate(course.createdAt)}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={course.isPublished ? "outline" : "default"}
                      onClick={() => handleTogglePublish(course.id, course.isPublished)}
                      disabled={publishingId === course.id}
                      className="flex-1"
                    >
                      {publishingId === course.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          {course.isPublished ? 'Unpublishing...' : 'Publishing...'}
                        </>
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
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setLocation(`/courses/${course.id}/announcements`)}
                      title="Manage announcements"
                    >
                      <Megaphone className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setLocation(`/teacher/courses/${course.id}/edit`)}
                      title="Edit course"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setCourseToDelete(course)}
                      disabled={deletingId === course.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      title="Delete course"
                    >
                      {deletingId === course.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
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
