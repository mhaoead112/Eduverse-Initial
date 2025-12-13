import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { ArrowLeft, Megaphone, Pin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiEndpoint } from "@/lib/config";
import { DashboardLayout } from "@/components/DashboardLayout";

interface Announcement {
  id: number;
  courseId: number;
  teacherId: number;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Course {
  id: number;
  title: string;
}

export default function StudentAnnouncementsPage() {
  const [, params] = useRoute("/student/courses/:courseId/announcements");
  const courseId = params?.courseId;
  const { toast } = useToast();

  const [course, setCourse] = useState<Course | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem("token");
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    if (courseId) {
      fetchCourse();
      fetchAnnouncements();
    }
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      const response = await fetch(apiEndpoint(`/api/courses/${courseId}`), {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setCourse(data);
      }
    } catch (error) {
      console.error("Failed to fetch course:", error);
    }
  };

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const response = await fetch(apiEndpoint(`/api/courses/${courseId}/announcements`), {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        // Sort: pinned first, then by date
        const sorted = (data.announcements || []).sort((a: Announcement, b: Announcement) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        setAnnouncements(sorted);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load announcements",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back Button & Header */}
        <div className="flex items-center gap-4">
          <Link href={`/student/course/${courseId}`}>
            <button className="p-2 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border border-yellow-500/20 flex items-center justify-center">
                <Megaphone className="h-5 w-5 text-yellow-400" />
              </div>
              Announcements
            </h1>
            {course && (
              <p className="text-slate-400 mt-1">{course.title}</p>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-yellow-500 border-t-transparent"></div>
          </div>
        )}

        {/* Empty State */}
        {!loading && announcements.length === 0 && (
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
              <Megaphone className="h-8 w-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No Announcements</h3>
            <p className="text-slate-400 text-sm">
              There are no announcements for this course yet.
            </p>
          </div>
        )}

        {/* Announcements List */}
        {!loading && announcements.length > 0 && (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className={`bg-slate-800/50 border rounded-2xl p-5 transition-all ${
                  announcement.isPinned 
                    ? "border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5" 
                    : "border-slate-700/50"
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      announcement.isPinned 
                        ? "bg-yellow-500/20" 
                        : "bg-slate-700/50"
                    }`}>
                      {announcement.isPinned ? (
                        <Pin className="h-5 w-5 text-yellow-400" />
                      ) : (
                        <Megaphone className="h-5 w-5 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{announcement.title}</h3>
                      <p className="text-xs text-slate-500">{formatDate(announcement.createdAt)}</p>
                    </div>
                  </div>
                  
                  {announcement.isPinned && (
                    <span className="px-2.5 py-1 rounded-lg text-xs font-medium text-yellow-400 bg-yellow-500/20 border border-yellow-500/30">
                      Pinned
                    </span>
                  )}
                </div>
                
                {/* Content */}
                <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {announcement.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
