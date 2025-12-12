import React, { useEffect, useState } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiEndpoint, assetUrl } from "@/lib/config";
import {
  Loader2,
  BookOpen,
  FileText,
  Video,
  Image,
  File,
  Megaphone,
  CheckCircle2,
  Circle,
  PlayCircle,
  Clock,
  ArrowLeft,
  GraduationCap,
  ClipboardList,
  Users,
  Calendar,
  ChevronRight,
  Sparkles,
  Trophy,
  Target,
  TrendingUp
} from "lucide-react";

interface Course {
  id: string;
  title: string;
  description: string;
  teacherId: string;
  teacherName?: string;
  isPublished: boolean;
  imageUrl?: string;
  createdAt: string;
}

interface Lesson {
  id: string;
  courseId: string;
  title: string;
  fileName?: string;
  fileType?: string;
  createdAt?: string;
}

interface Assignment {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  maxScore?: string;
  isPublished: boolean;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
}

// Get file type icon
const getFileTypeIcon = (fileType?: string, fileName?: string) => {
  const type = fileType?.toLowerCase() || '';
  const name = fileName?.toLowerCase() || '';
  
  if (type.includes('video') || name.endsWith('.mp4') || name.endsWith('.webm')) {
    return <Video className="h-4 w-4 text-purple-500" />;
  }
  if (type.includes('image') || name.endsWith('.png') || name.endsWith('.jpg')) {
    return <Image className="h-4 w-4 text-green-500" />;
  }
  if (type.includes('pdf') || name.endsWith('.pdf')) {
    return <FileText className="h-4 w-4 text-red-500" />;
  }
  return <File className="h-4 w-4 text-blue-500" />;
};

export default function StudentCourseDetailPage() {
  const [match, params] = useRoute("/student/courses/:courseId");
  const courseId = params?.courseId;
  const [, setLocation] = useLocation();
  const { user, token } = useAuth();
  const { toast } = useToast();

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const getAuthHeaders = (): Record<string, string> => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    if (!courseId) return;
    fetchCourseData();
  }, [courseId, token]);

  const fetchCourseData = async () => {
    setIsLoading(true);
    try {
      const headers = getAuthHeaders();

      // Fetch course details
      const courseRes = await fetch(apiEndpoint(`/api/courses/${courseId}`), { headers });
      if (courseRes.ok) {
        const courseData = await courseRes.json();
        setCourse(courseData.course || courseData);
      }

      // Fetch lessons
      const lessonsRes = await fetch(apiEndpoint(`/api/lessons/course/${courseId}`), { headers });
      if (lessonsRes.ok) {
        const lessonsData = await lessonsRes.json();
        setLessons(lessonsData.lessons || []);
      }

      // Fetch assignments
      const assignmentsRes = await fetch(apiEndpoint(`/api/assignments/courses/${courseId}/assignments`), { headers });
      if (assignmentsRes.ok) {
        const assignmentsData = await assignmentsRes.json();
        setAssignments(assignmentsData.assignments || assignmentsData || []);
      }

      // Fetch announcements
      const announcementsRes = await fetch(apiEndpoint(`/api/announcements/course/${courseId}`), { headers });
      if (announcementsRes.ok) {
        const announcementsData = await announcementsRes.json();
        setAnnouncements(announcementsData.announcements || announcementsData || []);
      }

      // Fetch student progress for this course
      const progressRes = await fetch(apiEndpoint(`/api/progress/course/${courseId}`), { headers });
      if (progressRes.ok) {
        const progressData = await progressRes.json();
        setProgress(progressData.progressPercentage || 0);
      }
    } catch (error) {
      console.error("Error fetching course data:", error);
      toast({
        title: "Error",
        description: "Failed to load course data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-500 mx-auto mb-4" />
            <p className="text-gray-500">Loading class...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!course) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="max-w-md">
            <CardContent className="pt-6 text-center">
              <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Class Not Found</h2>
              <p className="text-gray-500 mb-4">This class doesn't exist or you don't have access to it.</p>
              <Button onClick={() => setLocation('/student/courses')}>
                Browse Classes
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const pendingAssignments = assignments.filter(a => a.isPublished);
  const pinnedAnnouncements = announcements.filter(a => a.isPinned);

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="gap-2 text-gray-600 hover:text-gray-900 -ml-2"
          onClick={() => setLocation('/student/dashboard')}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>

        {/* Course Header */}
        <div className="relative rounded-2xl overflow-hidden">
          {/* Cover Image or Gradient */}
          <div 
            className={`h-48 md:h-64 relative ${
              course.imageUrl 
                ? '' 
                : 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500'
            }`}
          >
            {course.imageUrl && (
              <img 
                src={assetUrl(course.imageUrl)} 
                alt={course.title}
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            
            {/* Course Title Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <Badge className="bg-white/20 text-white border-0 mb-3">
                <BookOpen className="h-3 w-3 mr-1" />
                Class
              </Badge>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">{course.title}</h1>
              {course.teacherName && (
                <p className="text-white/80 flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  {course.teacherName}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{lessons.length}</p>
              <p className="text-sm text-gray-500">Lessons</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-purple-50 to-pink-50">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <ClipboardList className="h-6 w-6 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{assignments.length}</p>
              <p className="text-sm text-gray-500">Assignments</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Target className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{progress}%</p>
              <p className="text-sm text-gray-500">Progress</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-amber-50 to-orange-50">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Megaphone className="h-6 w-6 text-amber-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{announcements.length}</p>
              <p className="text-sm text-gray-500">Announcements</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border shadow-sm p-1 rounded-xl w-full justify-start overflow-x-auto">
            <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-indigo-500 data-[state=active]:text-white">
              Overview
            </TabsTrigger>
            <TabsTrigger value="lessons" className="rounded-lg data-[state=active]:bg-indigo-500 data-[state=active]:text-white">
              Lessons
            </TabsTrigger>
            <TabsTrigger value="assignments" className="rounded-lg data-[state=active]:bg-indigo-500 data-[state=active]:text-white">
              Assignments
            </TabsTrigger>
            <TabsTrigger value="announcements" className="rounded-lg data-[state=active]:bg-indigo-500 data-[state=active]:text-white">
              Announcements
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Description & Progress */}
              <div className="lg:col-span-2 space-y-6">
                {/* Description */}
                <Card className="border-0 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg">About This Class</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 leading-relaxed">
                      {course.description || "No description available for this class."}
                    </p>
                  </CardContent>
                </Card>

                {/* Progress */}
                <Card className="border-0 shadow-md overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Your Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-gray-600">Overall Completion</span>
                      <span className="text-2xl font-bold text-indigo-600">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-3 mb-4" />
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-green-600">{Math.floor(lessons.length * (progress/100))}</p>
                        <p className="text-xs text-gray-500">Completed</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-amber-600">{lessons.length - Math.floor(lessons.length * (progress/100))}</p>
                        <p className="text-xs text-gray-500">Remaining</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-600">{lessons.length}</p>
                        <p className="text-xs text-gray-500">Total</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Continue Learning */}
                <Card className="border-0 shadow-md bg-gradient-to-r from-indigo-50 to-purple-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center">
                          <Sparkles className="h-7 w-7 text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Continue Learning</h3>
                          <p className="text-sm text-gray-500">
                            {lessons.length > 0 ? lessons[0].title : 'Start your first lesson'}
                          </p>
                        </div>
                      </div>
                      <Button 
                        className="bg-indigo-600 hover:bg-indigo-700"
                        onClick={() => setLocation(`/student/courses/${courseId}/lessons`)}
                      >
                        <PlayCircle className="h-4 w-4 mr-2" />
                        Start
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Pinned Announcements */}
                {pinnedAnnouncements.length > 0 && (
                  <Card className="border-0 shadow-md border-l-4 border-l-amber-500">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2 text-amber-600">
                        <Megaphone className="h-4 w-4" />
                        Pinned Announcement
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <h4 className="font-medium text-gray-900 mb-1">{pinnedAnnouncements[0].title}</h4>
                      <p className="text-sm text-gray-500 line-clamp-2">{pinnedAnnouncements[0].content}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Upcoming Assignments */}
                <Card className="border-0 shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-purple-500" />
                      Upcoming Assignments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {pendingAssignments.length === 0 ? (
                      <p className="text-sm text-gray-500 py-4 text-center">No assignments yet</p>
                    ) : (
                      <div className="space-y-3">
                        {pendingAssignments.slice(0, 3).map(assignment => (
                          <div key={assignment.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                              <ClipboardList className="h-4 w-4 text-purple-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{assignment.title}</p>
                              {assignment.dueDate && (
                                <p className="text-xs text-gray-500">
                                  Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="border-0 shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start gap-2"
                      onClick={() => setLocation(`/student/courses/${courseId}/lessons`)}
                    >
                      <FileText className="h-4 w-4" />
                      View All Lessons
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start gap-2"
                      onClick={() => setLocation(`/student/courses/${courseId}/announcements`)}
                    >
                      <Megaphone className="h-4 w-4" />
                      View Announcements
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start gap-2"
                      onClick={() => setActiveTab('assignments')}
                    >
                      <ClipboardList className="h-4 w-4" />
                      View Assignments
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Lessons Tab */}
          <TabsContent value="lessons" className="animate-fadeIn">
            <Card className="border-0 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Class Lessons</CardTitle>
                <Button onClick={() => setLocation(`/student/courses/${courseId}/lessons`)}>
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Open Lesson Viewer
                </Button>
              </CardHeader>
              <CardContent>
                {lessons.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No lessons available yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {lessons.map((lesson, index) => (
                      <button
                        key={lesson.id}
                        onClick={() => setLocation(`/student/courses/${courseId}/lessons`)}
                        className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors text-left group"
                      >
                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                          {getFileTypeIcon(lesson.fileType, lesson.fileName)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-gray-400">
                              {String(index + 1).padStart(2, '0')}
                            </span>
                            <h4 className="font-medium text-gray-900 truncate">
                              {lesson.title || lesson.fileName}
                            </h4>
                          </div>
                          {lesson.createdAt && (
                            <p className="text-xs text-gray-500">
                              Added {new Date(lesson.createdAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assignments Tab */}
          <TabsContent value="assignments" className="animate-fadeIn">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>Class Assignments</CardTitle>
              </CardHeader>
              <CardContent>
                {assignments.length === 0 ? (
                  <div className="text-center py-12">
                    <ClipboardList className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No assignments available yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {assignments.map(assignment => (
                      <div
                        key={assignment.id}
                        className="flex items-center gap-4 p-4 rounded-xl border hover:border-indigo-200 hover:bg-indigo-50/50 transition-colors"
                      >
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                          <ClipboardList className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900">{assignment.title}</h4>
                          {assignment.description && (
                            <p className="text-sm text-gray-500 line-clamp-1">{assignment.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                            {assignment.dueDate && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Due: {new Date(assignment.dueDate).toLocaleDateString()}
                              </span>
                            )}
                            {assignment.maxScore && (
                              <span className="flex items-center gap-1">
                                <Trophy className="h-3 w-3" />
                                {assignment.maxScore} points
                              </span>
                            )}
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setLocation('/student/assignments')}
                        >
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Announcements Tab */}
          <TabsContent value="announcements" className="animate-fadeIn">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>Class Announcements</CardTitle>
              </CardHeader>
              <CardContent>
                {announcements.length === 0 ? (
                  <div className="text-center py-12">
                    <Megaphone className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No announcements yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {announcements.map(announcement => (
                      <div
                        key={announcement.id}
                        className={`p-4 rounded-xl border ${
                          announcement.isPinned 
                            ? 'border-amber-200 bg-amber-50' 
                            : 'border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            announcement.isPinned ? 'bg-amber-100' : 'bg-blue-100'
                          }`}>
                            <Megaphone className={`h-5 w-5 ${
                              announcement.isPinned ? 'text-amber-600' : 'text-blue-600'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-gray-900">{announcement.title}</h4>
                              {announcement.isPinned && (
                                <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-xs">
                                  Pinned
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{announcement.content}</p>
                            <p className="text-xs text-gray-400">
                              Posted {new Date(announcement.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </DashboardLayout>
  );
}
