import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LessonUploadForm } from "@/components/LessonUploadForm";
import { Loader2, BookOpen, Upload, Trash2, Download } from "lucide-react";

interface Course {
  id: string;
  title: string;
  description?: string;
}

interface Lesson {
  id: string;
  courseId: string;
  title: string;
  fileName: string;
  fileType: string;
  fileSize: string;
  createdAt: string;
}

export default function LessonManagementPage() {
  const { user, token, getAuthHeaders } = useAuth();
  const { toast } = useToast();
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [isLoadingLessons, setIsLoadingLessons] = useState(false);
  const [deletingLessonId, setDeletingLessonId] = useState<string | null>(null);

  // Mock courses data - in production, fetch from API
  useEffect(() => {
    const mockCourses: Course[] = [
      {
        id: "course-1",
        title: "Introduction to Mathematics",
        description: "Basic mathematics concepts for beginners"
      },
      {
        id: "course-2",
        title: "Advanced Physics",
        description: "Quantum mechanics and relativity"
      },
      {
        id: "course-3",
        title: "English Literature",
        description: "Classic and contemporary literary works"
      }
    ];
    
    setCourses(mockCourses);
    setIsLoadingCourses(false);
    
    if (mockCourses.length > 0) {
      setSelectedCourse(mockCourses[0].id);
    }
  }, []);

  // Fetch lessons for selected course
  useEffect(() => {
    if (selectedCourse) {
      fetchLessons(selectedCourse);
    }
  }, [selectedCourse]);

  const fetchLessons = async (courseId: string) => {
    setIsLoadingLessons(true);
    try {
      const response = await fetch(
        `http://localhost:3001/api/courses/${courseId}/lessons`,
        {
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setLessons(data.lessons || []);
      } else {
        throw new Error("Failed to fetch lessons");
      }
    } catch (error) {
      console.error("Error fetching lessons:", error);
      setLessons([]);
      toast({
        title: "Error",
        description: "Failed to load lessons",
        variant: "destructive",
      });
    } finally {
      setIsLoadingLessons(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm("Are you sure you want to delete this lesson?")) return;

    setDeletingLessonId(lessonId);
    try {
      const response = await fetch(
        `http://localhost:3001/api/lessons/${lessonId}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: "Lesson deleted successfully",
        });
        // Remove from local state
        setLessons(lessons.filter(l => l.id !== lessonId));
      } else {
        throw new Error("Failed to delete lesson");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete lesson",
        variant: "destructive",
      });
    } finally {
      setDeletingLessonId(null);
    }
  };

  const formatFileSize = (bytes: string): string => {
    try {
      const size = parseInt(bytes);
      if (size < 1024) return size + " B";
      if (size < 1024 * 1024) return (size / 1024).toFixed(2) + " KB";
      return (size / (1024 * 1024)).toFixed(2) + " MB";
    } catch {
      return bytes;
    }
  };

  const getFileIcon = (fileType: string): string => {
    if (fileType.includes("pdf")) return "📄";
    if (fileType.includes("word") || fileType.includes("document")) return "📝";
    if (fileType.includes("presentation") || fileType.includes("powerpoint")) return "📊";
    if (fileType.includes("image")) return "🖼️";
    if (fileType.includes("text")) return "📃";
    return "📦";
  };

  if (!user || user.role !== "teacher" && user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-96">
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <BookOpen className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600">
              Only teachers and administrators can access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-lg">
              <Upload className="text-white h-6 w-6" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Lesson Management</h1>
          </div>
          <p className="text-gray-600">
            Upload and manage course materials for your students
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Form */}
          <div className="lg:col-span-2">
            {isLoadingCourses ? (
              <Card className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </Card>
            ) : (
              <LessonUploadForm courses={courses} />
            )}
          </div>

          {/* Course Info Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-purple-600" />
                  Your Courses
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {courses.length > 0 ? (
                  courses.map((course) => (
                    <div
                      key={course.id}
                      onClick={() => setSelectedCourse(course.id)}
                      className={`p-3 rounded-lg cursor-pointer transition-all ${
                        selectedCourse === course.id
                          ? "bg-blue-100 border-2 border-blue-500"
                          : "bg-gray-50 border-2 border-transparent hover:bg-gray-100"
                      }`}
                    >
                      <p className="font-semibold text-gray-900 text-sm">
                        {course.title}
                      </p>
                      {course.description && (
                        <p className="text-xs text-gray-600 mt-1">
                          {course.description}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600 text-sm">No courses available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Lessons List */}
        {selectedCourse && (
          <Card>
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-green-600" />
                Lessons for {courses.find(c => c.id === selectedCourse)?.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {isLoadingLessons ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : lessons.length > 0 ? (
                <div className="space-y-3">
                  {lessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <span className="text-2xl">
                          {getFileIcon(lesson.fileType)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">
                            {lesson.title}
                          </p>
                          <p className="text-sm text-gray-600 truncate">
                            {lesson.fileName}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {formatFileSize(lesson.fileSize)}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {new Date(lesson.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          disabled={deletingLessonId === lesson.id}
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteLesson(lesson.id)}
                          disabled={deletingLessonId === lesson.id}
                        >
                          {deletingLessonId === lesson.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">
                    No lessons uploaded yet. Start by uploading your first lesson!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
