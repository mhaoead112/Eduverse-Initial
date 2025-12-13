import React, { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import LessonViewer from "@/components/LessonViewer";
import StudyBuddyChat from "@/components/StudyBuddyChat";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Loader2, 
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
  Sparkles,
  MessageSquare,
  X,
  Maximize2,
  Minimize2
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
    return <Video className="h-4 w-4 text-purple-400" />;
  }
  if (type.includes('image') || name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg')) {
    return <Image className="h-4 w-4 text-emerald-400" />;
  }
  if (type.includes('pdf') || name.endsWith('.pdf')) {
    return <FileText className="h-4 w-4 text-red-400" />;
  }
  return <File className="h-4 w-4 text-blue-400" />;
};

// Get file type label
const getFileTypeLabel = (fileType?: string, fileName?: string) => {
  const type = fileType?.toLowerCase() || '';
  const name = fileName?.toLowerCase() || '';
  
  if (type.includes('video') || name.endsWith('.mp4') || name.endsWith('.webm')) {
    return "Video";
  }
  if (type.includes('image') || name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg')) {
    return "Image";
  }
  if (type.includes('pdf') || name.endsWith('.pdf')) {
    return "PDF";
  }
  if (name.endsWith('.doc') || name.endsWith('.docx')) {
    return "Document";
  }
  if (name.endsWith('.ppt') || name.endsWith('.pptx')) {
    return "Slides";
  }
  return "File";
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
  const [showAIChat, setShowAIChat] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

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
        <div className="bg-slate-800/40 backdrop-blur-sm rounded-2xl p-8 text-center border border-slate-700/50 shadow-xl">
          <span className="material-symbols-outlined text-5xl text-amber-400 mb-4 block">school</span>
          <p className="text-slate-300">Please sign in to view class lessons.</p>
          <Link href="/login">
            <Button className="mt-4 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 font-['Spline_Sans',_sans-serif]">
      {/* Top Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-slate-800/80 backdrop-blur-md border-b border-slate-700/50 z-50">
        <div className="h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={courseId ? `/student/courses/${courseId}` : "/student/dashboard"}>
              <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-slate-700/50 gap-2">
                <ChevronLeft className="h-4 w-4" />
                Back to Course
              </Button>
            </Link>
            <div className="h-6 w-px bg-slate-700" />
            <div>
              <h1 className="text-lg font-semibold text-white">Lesson Viewer</h1>
              <p className="text-xs text-slate-400">
                {lessons.length} lesson{lessons.length !== 1 ? 's' : ''} available
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Progress indicator */}
            {lessons.length > 0 && (
              <div className="flex items-center gap-3 bg-slate-700/40 rounded-full px-4 py-2 border border-slate-600/50">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-medium text-white">
                  {viewedLessons.size}/{lessons.length}
                </span>
                <div className="w-24 h-2 bg-slate-600 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400">{progressPercentage}%</span>
              </div>
            )}
            
            {/* AI Study Buddy Toggle */}
            <Button 
              onClick={() => setShowAIChat(!showAIChat)}
              className={`gap-2 ${showAIChat ? 'bg-purple-600 hover:bg-purple-700' : 'bg-slate-700 hover:bg-slate-600'} text-white`}
            >
              <Sparkles className="h-4 w-4" />
              AI Study Buddy
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="pt-16 h-screen flex">
        {/* Lessons Sidebar */}
        <div className="w-80 h-full bg-slate-800/40 border-r border-slate-700/50 flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-slate-700/50">
            <div className="flex items-center gap-2 text-amber-400 mb-2">
              <BookOpen className="h-5 w-5" />
              <span className="font-semibold">Lessons</span>
            </div>
            <p className="text-sm text-slate-400">Click to navigate</p>
          </div>
          
          {/* Lessons List */}
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
                </div>
              ) : lessons.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">No lessons yet</p>
                </div>
              ) : (
                lessons.map((lesson, index) => {
                  const isSelected = selectedLesson?.id === lesson.id;
                  const isViewed = viewedLessons.has(lesson.id);
                  
                  return (
                    <button
                      key={lesson.id}
                      onClick={() => handleSelectLesson(lesson, index)}
                      className={`w-full text-left p-3 rounded-xl transition-all duration-200 group
                        ${isSelected 
                          ? 'bg-amber-500/20 border border-amber-500/50 shadow-lg shadow-amber-500/10' 
                          : 'bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600/30 hover:border-slate-500/50'
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Status indicator */}
                        <div className="flex-shrink-0 mt-0.5">
                          {isSelected ? (
                            <PlayCircle className="h-5 w-5 text-amber-400" />
                          ) : isViewed ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                          ) : (
                            <Circle className="h-5 w-5 text-slate-500 group-hover:text-slate-400" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-slate-500">
                              {String(index + 1).padStart(2, '0')}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              getFileTypeLabel(lesson.fileType, lesson.fileName) === 'Video' 
                                ? 'bg-purple-500/20 text-purple-300' 
                                : getFileTypeLabel(lesson.fileType, lesson.fileName) === 'PDF'
                                  ? 'bg-red-500/20 text-red-300'
                                  : 'bg-blue-500/20 text-blue-300'
                            }`}>
                              {getFileTypeLabel(lesson.fileType, lesson.fileName)}
                            </span>
                          </div>
                          <h4 className={`font-medium text-sm leading-tight line-clamp-2
                            ${isSelected ? 'text-amber-300' : 'text-white'}`}>
                            {lesson.title || lesson.fileName || 'Untitled Lesson'}
                          </h4>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Content Area */}
        <div className={`flex-1 flex flex-col transition-all duration-300 ${showAIChat ? 'mr-96' : ''}`}>
          {/* Lesson Navigation Bar */}
          {selectedLesson && (
            <div className="h-14 bg-slate-800/60 border-b border-slate-700/50 flex items-center justify-between px-6">
              <Button
                variant="ghost"
                onClick={handlePreviousLesson}
                disabled={selectedIndex === 0}
                className="gap-2 text-slate-300 hover:text-white disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              
              <div className="text-center">
                <span className="text-xs text-slate-400 block">
                  Lesson {selectedIndex + 1} of {lessons.length}
                </span>
                <h2 className="font-semibold text-white text-sm max-w-md truncate">
                  {selectedLesson.title || selectedLesson.fileName}
                </h2>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="text-slate-300 hover:text-white p-2"
                >
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleNextLesson}
                  disabled={selectedIndex === lessons.length - 1}
                  className="gap-2 text-slate-300 hover:text-white disabled:opacity-30"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Lesson Viewer */}
          <div className="flex-1 overflow-hidden bg-slate-900/50">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-amber-400 mx-auto mb-4" />
                  <p className="text-slate-400">Loading lessons...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center max-w-md">
                  <span className="material-symbols-outlined text-4xl text-red-400 mb-4 block">error</span>
                  <p className="text-red-300 mb-4">{error}</p>
                  <Button 
                    className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30"
                    onClick={() => window.location.reload()}
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            ) : lessons.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <BookOpen className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Lessons Yet</h3>
                  <p className="text-slate-400">This class doesn't have any lessons available yet.</p>
                </div>
              </div>
            ) : selectedLesson ? (
              <div className="h-full p-4">
                <div className="h-full bg-slate-800/40 rounded-xl border border-slate-700/50 overflow-hidden">
                  <LessonViewer 
                    key={selectedLesson.id}
                    fileUrl={selectedLesson.fileUrl} 
                    fileType={selectedLesson.fileType} 
                    fileName={selectedLesson.fileName} 
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <FileText className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Select a Lesson</h3>
                  <p className="text-slate-400">Choose a lesson from the sidebar to view its content.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Study Buddy Panel */}
        {showAIChat && (
          <div className="fixed right-0 top-16 bottom-0 w-96 bg-slate-800/95 backdrop-blur-sm border-l border-slate-700/50 flex flex-col z-40 shadow-2xl">
            {/* Chat Header */}
            <div className="h-14 bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-white" />
                <span className="font-semibold text-white">AI Study Buddy</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowAIChat(false)}
                className="text-white/80 hover:text-white hover:bg-white/10 p-1"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Chat Content */}
            <div className="flex-1 overflow-hidden">
              {selectedLesson ? (
                <StudyBuddyChat 
                  key={selectedLesson.id}
                  lessonId={selectedLesson.id} 
                  lessonTitle={selectedLesson.title || selectedLesson.fileName} 
                />
              ) : (
                <div className="h-full flex items-center justify-center p-6 text-center">
                  <div>
                    <Sparkles className="h-12 w-12 text-purple-400/50 mx-auto mb-4" />
                    <p className="text-slate-400">
                      Select a lesson to chat with your AI study buddy about that specific content!
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
