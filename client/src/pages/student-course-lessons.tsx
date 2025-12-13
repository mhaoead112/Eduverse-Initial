import React, { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import LessonViewer from "@/components/LessonViewer";
import StudyBuddyChat from "@/components/StudyBuddyChat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Loader2, 
  Megaphone, 
  BookOpen, 
  FileText, 
  Video, 
  Image, 
  File,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  PlayCircle,
  Clock,
  ArrowLeft,
  Sparkles,
  GraduationCap
} from "lucide-react";
import { apiEndpoint } from "@/lib/config";

interface Lesson {
  id: string;
  courseId: string;
  title: string;
  fileName?: string;
  fileType?: string;
  fileUrl?: string;
  createdAt?: string;
}

// Get file type icon based on file extension/type
const getFileTypeIcon = (fileType?: string, fileName?: string) => {
  const type = fileType?.toLowerCase() || '';
  const name = fileName?.toLowerCase() || '';
  
  if (type.includes('video') || name.endsWith('.mp4') || name.endsWith('.webm')) {
    return <Video className="h-4 w-4 text-purple-500" />;
  }
  if (type.includes('image') || name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg')) {
    return <Image className="h-4 w-4 text-green-500" />;
  }
  if (type.includes('pdf') || name.endsWith('.pdf')) {
    return <FileText className="h-4 w-4 text-red-500" />;
  }
  return <File className="h-4 w-4 text-blue-500" />;
};

// Get file type badge color
const getFileTypeBadge = (fileType?: string, fileName?: string) => {
  const type = fileType?.toLowerCase() || '';
  const name = fileName?.toLowerCase() || '';
  
  if (type.includes('video') || name.endsWith('.mp4') || name.endsWith('.webm')) {
    return <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 text-[10px]">Video</Badge>;
  }
  if (type.includes('image') || name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg')) {
    return <Badge variant="secondary" className="bg-green-500/20 text-green-400 text-[10px]">Image</Badge>;
  }
  if (type.includes('pdf') || name.endsWith('.pdf')) {
    return <Badge variant="secondary" className="bg-red-500/20 text-red-400 text-[10px]">PDF</Badge>;
  }
  if (name.endsWith('.doc') || name.endsWith('.docx')) {
    return <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 text-[10px]">Document</Badge>;
  }
  if (name.endsWith('.ppt') || name.endsWith('.pptx')) {
    return <Badge variant="secondary" className="bg-orange-500/20 text-orange-400 text-[10px]">Slides</Badge>;
  }
  return <Badge variant="secondary" className="bg-slate-500/20 text-slate-400 text-[10px]">File</Badge>;
};

export default function StudentCourseLessonsPage() {
  const [match, params] = useRoute("/student/courses/:courseId/lessons");
  const courseId = params?.courseId as string | undefined;
  const { getAuthHeaders, user } = useAuth();

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewedLessons, setViewedLessons] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!courseId) return;

    const fetchLessons = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const authHeaders = getAuthHeaders();
        const headers = (authHeaders as any).Authorization ? authHeaders : {};
        const res = await fetch(apiEndpoint(`/api/lessons/course/${courseId}`), { headers });
        if (!res.ok) throw new Error("Failed to load lessons");
        const data = await res.json();
        const items = data?.lessons || [];
        const lessonsWithUrls = items.map((lesson: Lesson) => ({
          ...lesson,
          fileUrl: apiEndpoint(`/api/lessons/${lesson.id}/download`)
        }));
        setLessons(lessonsWithUrls);
        if (lessonsWithUrls.length > 0) {
          setSelectedLesson(lessonsWithUrls[0]);
          setSelectedIndex(0);
        }
      } catch (err: any) {
        setError(err?.message || "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLessons();
  }, [courseId]);

  // Mark lesson as viewed when selected
  useEffect(() => {
    if (selectedLesson) {
      setViewedLessons(prev => {
        const newSet = new Set(Array.from(prev));
        newSet.add(selectedLesson.id);
        return newSet;
      });
    }
  }, [selectedLesson]);

  const handleSelectLesson = (lesson: Lesson, index: number) => {
    setSelectedLesson(lesson);
    setSelectedIndex(index);
  };

  const handlePreviousLesson = () => {
    if (selectedIndex > 0) {
      handleSelectLesson(lessons[selectedIndex - 1], selectedIndex - 1);
    }
  };

  const handleNextLesson = () => {
    if (selectedIndex < lessons.length - 1) {
      handleSelectLesson(lessons[selectedIndex + 1], selectedIndex + 1);
    }
  };

  const progressPercentage = lessons.length > 0 
    ? Math.round((viewedLessons.size / lessons.length) * 100) 
    : 0;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Card className="bg-slate-800/60 border-slate-700/50 rounded-2xl">
          <CardContent className="p-8 text-center">
            <GraduationCap className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <p className="text-slate-400">Please sign in to view class lessons.</p>
            <Link href="/login">
              <Button className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-semibold">
                Sign In
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-10 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/student/dashboard">
                <Button variant="ghost" size="sm" className="gap-2 text-slate-400 hover:text-white hover:bg-slate-800">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="h-6 w-px bg-slate-700" />
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Class Lessons
                </h1>
                <p className="text-sm text-slate-400">
                  {lessons.length} lesson{lessons.length !== 1 ? 's' : ''} available
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Progress indicator */}
              {lessons.length > 0 && (
                <div className="hidden sm:flex items-center gap-3 bg-slate-800/60 rounded-full px-4 py-2 border border-slate-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm font-medium text-white">
                      {viewedLessons.size}/{lessons.length}
                    </span>
                  </div>
                  <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-full transition-all"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400">{progressPercentage}%</span>
                </div>
              )}
              
              {courseId && (
                <Link href={`/student/courses/${courseId}/announcements`}>
                  <Button variant="outline" className="gap-2 border-slate-700 text-slate-300 hover:bg-slate-800">
                    <Megaphone className="h-4 w-4" />
                    <span className="hidden sm:inline">Announcements</span>
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-yellow-500 mx-auto mb-4" />
              <p className="text-slate-400">Loading lessons...</p>
            </div>
          </div>
        ) : error ? (
          <Card className="bg-red-500/10 border-red-500/50 rounded-2xl">
            <CardContent className="p-8 text-center">
              <p className="text-red-400">{error}</p>
              <Button 
                variant="outline" 
                className="mt-4 border-red-500/50 text-red-300 hover:bg-red-500/20"
                onClick={() => window.location.reload()}
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : lessons.length === 0 ? (
          <Card className="bg-slate-800/60 border-slate-700/50 rounded-2xl">
            <CardContent className="p-12 text-center">
              <BookOpen className="h-16 w-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Lessons Yet</h3>
              <p className="text-slate-400">This class doesn't have any lessons available yet. Check back later!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Lessons Sidebar */}
            <div className="lg:col-span-3">
              <Card className="bg-slate-800/60 border-slate-700/50 rounded-2xl overflow-hidden sticky top-32">
                <CardHeader className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BookOpen className="h-5 w-5" />
                    Lesson List
                  </CardTitle>
                  <p className="text-emerald-100 text-sm mt-1">
                    Click to navigate between lessons
                  </p>
                </CardHeader>
                <ScrollArea className="h-[calc(100vh-320px)] min-h-[300px]">
                  <div className="p-3 space-y-2">
                    {lessons.map((lesson, index) => {
                      const isSelected = selectedLesson?.id === lesson.id;
                      const isViewed = viewedLessons.has(lesson.id);
                      
                      return (
                        <button
                          key={lesson.id}
                          onClick={() => handleSelectLesson(lesson, index)}
                          className={`w-full text-left p-3 rounded-xl transition-all duration-200 group
                            ${isSelected 
                              ? 'bg-yellow-500/20 border-2 border-yellow-500/50' 
                              : 'bg-slate-900/50 hover:bg-slate-700/50 border border-slate-700/50 hover:border-slate-600'
                            }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Status indicator */}
                            <div className="flex-shrink-0 mt-0.5">
                              {isSelected ? (
                                <PlayCircle className="h-5 w-5 text-yellow-500" />
                              ) : isViewed ? (
                                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                              ) : (
                                <Circle className="h-5 w-5 text-slate-600 group-hover:text-slate-500" />
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium text-slate-500">
                                  {String(index + 1).padStart(2, '0')}
                                </span>
                                {getFileTypeBadge(lesson.fileType, lesson.fileName)}
                              </div>
                              <h4 className={`font-medium text-sm leading-tight truncate
                                ${isSelected ? 'text-yellow-400' : 'text-white'}`}>
                                {lesson.title || lesson.fileName || 'Untitled Lesson'}
                              </h4>
                              {lesson.createdAt && (
                                <div className="flex items-center gap-1 mt-1.5 text-xs text-slate-500">
                                  <Clock className="h-3 w-3" />
                                  {new Date(lesson.createdAt).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </Card>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-9 space-y-6">
              {/* Lesson Navigation */}
              {selectedLesson && (
                <div className="flex items-center justify-between bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
                  <Button
                    variant="ghost"
                    onClick={handlePreviousLesson}
                    disabled={selectedIndex === 0}
                    className="gap-2 text-slate-300 hover:text-white hover:bg-slate-700 disabled:text-slate-600"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  
                  <div className="text-center">
                    <p className="text-sm text-slate-500">
                      Lesson {selectedIndex + 1} of {lessons.length}
                    </p>
                    <h2 className="font-semibold text-white max-w-md truncate">
                      {selectedLesson.title || selectedLesson.fileName}
                    </h2>
                  </div>
                  
                  <Button
                    variant="ghost"
                    onClick={handleNextLesson}
                    disabled={selectedIndex === lessons.length - 1}
                    className="gap-2 text-slate-300 hover:text-white hover:bg-slate-700 disabled:text-slate-600"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Lesson Viewer */}
                <div className="xl:col-span-2">
                  {selectedLesson ? (
                    <div className="bg-slate-800/60 rounded-2xl border border-slate-700/50 overflow-hidden">
                      <LessonViewer 
                        key={selectedLesson.id}
                        fileUrl={selectedLesson.fileUrl} 
                        fileType={selectedLesson.fileType} 
                        fileName={selectedLesson.fileName} 
                      />
                    </div>
                  ) : (
                    <Card className="bg-slate-800/60 border-slate-700/50 rounded-2xl">
                      <CardContent className="p-12 text-center">
                        <FileText className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">Select a Lesson</h3>
                        <p className="text-slate-400">Choose a lesson from the sidebar to view its content.</p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* AI Study Buddy */}
                <div className="xl:col-span-1">
                  {selectedLesson ? (
                    <Card className="bg-slate-800/60 border-slate-700/50 rounded-2xl overflow-hidden h-[600px] flex flex-col">
                      <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 flex-shrink-0">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Sparkles className="h-4 w-4" />
                          AI Study Buddy
                        </CardTitle>
                        <p className="text-purple-100 text-xs mt-0.5">
                          Ask questions about this lesson
                        </p>
                      </CardHeader>
                      <div className="flex-1 overflow-hidden">
                        <StudyBuddyChat 
                          key={selectedLesson.id}
                          lessonId={selectedLesson.id} 
                          lessonTitle={selectedLesson.title || selectedLesson.fileName} 
                        />
                      </div>
                    </Card>
                  ) : (
                    <Card className="bg-slate-800/60 border-slate-700/50 rounded-2xl h-full">
                      <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Sparkles className="h-5 w-5" />
                          AI Study Buddy
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 text-center">
                        <Sparkles className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400 text-sm">
                          Select a lesson to chat with your AI study buddy about that specific content!
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
