import React, { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import LessonViewer from "@/components/LessonViewer";
import StudyBuddyChat from "@/components/StudyBuddyChat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

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
        const res = await fetch(`http://localhost:3001/api/courses/${courseId}/lessons`, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error("Failed to load lessons");
        const data = await res.json();
        // API returns { lessons: [] } per server implementation
        const items = data?.lessons || [];
        setLessons(items);
        if (items.length > 0) setSelectedLesson(items[0]);
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
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
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
              <LessonViewer fileUrl={selectedLesson.fileUrl || (selectedLesson.filePath as any)} fileType={selectedLesson.fileType} fileName={selectedLesson.fileName} />
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
  );
}
