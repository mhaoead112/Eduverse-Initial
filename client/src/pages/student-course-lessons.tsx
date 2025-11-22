import React, { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import LessonViewer from "@/components/LessonViewer";
import StudyBuddyChat from "@/components/StudyBuddyChat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Megaphone } from "lucide-react";

interface Lesson {
  id: string;
  courseId: string;
  title: string;
  fileName?: string;
  fileType?: string;
  fileUrl?: string; // expected to be provided by the API in future
  createdAt?: string;
}

export default function StudentCourseLessonsPage() {
  const [match, params] = useRoute("/student/courses/:courseId/lessons");
  const courseId = params?.courseId as string | undefined;
  const { getAuthHeaders, user } = useAuth();

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId) return;

    const fetchLessons = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const authHeaders = getAuthHeaders();
        const headers = authHeaders.Authorization ? authHeaders : {};
        const res = await fetch(`/api/lessons/course/${courseId}`, { headers });
        if (!res.ok) throw new Error("Failed to load lessons");
        const data = await res.json();
        // API returns { lessons: [] } per server implementation
        const items = data?.lessons || [];
        // Add download URL to each lesson
        const lessonsWithUrls = items.map((lesson: Lesson) => ({
          ...lesson,
          fileUrl: `/api/lessons/${lesson.id}/download`
        }));
        setLessons(lessonsWithUrls);
        if (lessonsWithUrls.length > 0) setSelectedLesson(lessonsWithUrls[0]);
      } catch (err: any) {
        setError(err?.message || "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLessons();
  }, [courseId]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent>
            <p>Please sign in to view course lessons.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="pt-24 min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Announcements Button */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Course Lessons</h1>
          {courseId && (
            <Link href={`/student/courses/${courseId}/announcements`}>
              <Button variant="outline" className="gap-2">
                <Megaphone className="h-4 w-4" />
                View Announcements
              </Button>
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Lessons list */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Lessons</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center p-6">
                  <Loader2 className="animate-spin" />
                </div>
              ) : error ? (
                <div className="p-4 text-sm text-red-600">{error}</div>
              ) : lessons.length === 0 ? (
                <div className="p-4 text-sm text-gray-600">No lessons available for this course.</div>
              ) : (
                <div className="space-y-2">
                  {lessons.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => setSelectedLesson(l)}
                      className={`w-full text-left p-3 rounded-md border ${selectedLesson?.id === l.id ? 'border-blue-500 bg-blue-50' : 'border-transparent hover:bg-gray-50'}`}>
                      <div className="font-semibold">{l.title || l.fileName}</div>
                      <div className="text-xs text-gray-500">{l.createdAt ? new Date(l.createdAt).toLocaleString() : ''}</div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Viewer + chat main area */}
        <div className="lg:col-span-3 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {selectedLesson ? (
              <LessonViewer fileUrl={selectedLesson.fileUrl} fileType={selectedLesson.fileType} fileName={selectedLesson.fileName} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Select a lesson</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Choose a lesson from the left to preview the document and start the AI Study Buddy session.</p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-1">
            {selectedLesson ? (
              <StudyBuddyChat lessonId={selectedLesson.id} lessonTitle={selectedLesson.title || selectedLesson.fileName} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>AI Study Buddy</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Select a lesson to start an AI-assisted study session that is pre-loaded with that lesson's context.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
