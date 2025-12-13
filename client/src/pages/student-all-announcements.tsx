import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Megaphone, Pin, BookOpen, Filter, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiEndpoint } from "@/lib/config";
import StudentLayout from "@/components/StudentLayout";

interface Announcement {
  id: number;
  courseId: number;
  teacherId: number;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  courseName?: string;
}

interface Enrollment {
  courseId: number;
  course: {
    id: number;
    title: string;
  };
}

export default function StudentAllAnnouncementsPage() {
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [courses, setCourses] = useState<{ id: number; title: string }[]>([]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    fetchAllAnnouncements();
  }, []);

  const fetchAllAnnouncements = async () => {
    try {
      setLoading(true);

      // Fetch enrollments first
      const enrollmentsRes = await fetch(apiEndpoint("/api/enrollments/student"), {
        headers: getAuthHeaders(),
      });
      
      let enrolledCourses: Enrollment[] = [];
      if (enrollmentsRes.ok) {
        const enrollmentsData = await enrollmentsRes.json();
        // API returns array directly
        enrolledCourses = Array.isArray(enrollmentsData) ? enrollmentsData : [];
        
        // Extract unique courses
        const uniqueCourses = enrolledCourses.map(e => ({
          id: e.courseId,
          title: e.course?.title || `Course ${e.courseId}`
        }));
        setCourses(uniqueCourses);
      }

      // Fetch announcements for each enrolled course
      const allAnnouncements: Announcement[] = [];
      
      for (const enrollment of enrolledCourses) {
        try {
          const announcementsRes = await fetch(
            apiEndpoint(`/api/courses/${enrollment.courseId}/announcements`),
            { headers: getAuthHeaders() }
          );
          
          if (announcementsRes.ok) {
            const data = await announcementsRes.json();
            const courseAnnouncements = (data.announcements || []).map((a: Announcement) => ({
              ...a,
              courseName: enrollment.course?.title || `Course ${enrollment.courseId}`
            }));
            allAnnouncements.push(...courseAnnouncements);
          }
        } catch (error) {
          console.error(`Failed to fetch announcements for course ${enrollment.courseId}`);
        }
      }

      // Sort: pinned first, then by date
      const sorted = allAnnouncements.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      setAnnouncements(sorted);
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

  // Filter announcements
  const filteredAnnouncements = announcements.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         a.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCourse = selectedCourse === "all" || a.courseId.toString() === selectedCourse;
    return matchesSearch && matchesCourse;
  });

  const pinnedCount = announcements.filter(a => a.isPinned).length;

  return (
    <StudentLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/20 flex items-center justify-center">
                <Megaphone className="h-5 w-5 text-amber-400" />
              </div>
              All Announcements
            </h1>
            <p className="text-slate-400 mt-1">Stay updated with announcements from all your courses</p>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search announcements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 w-full lg:w-72"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Megaphone className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{announcements.length}</p>
                <p className="text-xs text-slate-400">Total</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Pin className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{pinnedCount}</p>
                <p className="text-xs text-slate-400">Pinned</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{courses.length}</p>
                <p className="text-xs text-slate-400">Courses</p>
              </div>
            </div>
          </div>
        </div>

        {/* Course Filter */}
        {courses.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
            <button
              onClick={() => setSelectedCourse("all")}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCourse === "all"
                  ? "bg-amber-500 text-slate-900"
                  : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-white border border-slate-700/50"
              }`}
            >
              All Courses
            </button>
            {courses.map(course => (
              <button
                key={course.id}
                onClick={() => setSelectedCourse(course.id.toString())}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCourse === course.id.toString()
                    ? "bg-amber-500 text-slate-900"
                    : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-white border border-slate-700/50"
                }`}
              >
                {course.title}
              </button>
            ))}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-amber-500 border-t-transparent"></div>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredAnnouncements.length === 0 && (
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
              <Megaphone className="h-8 w-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No Announcements</h3>
            <p className="text-slate-400 text-sm">
              {searchQuery || selectedCourse !== "all"
                ? "No announcements match your criteria"
                : "There are no announcements from your courses yet."}
            </p>
          </div>
        )}

        {/* Announcements List */}
        {!loading && filteredAnnouncements.length > 0 && (
          <div className="space-y-4">
            {filteredAnnouncements.map((announcement) => (
              <div
                key={announcement.id}
                className={`bg-slate-800/40 border rounded-2xl p-5 transition-all hover:bg-slate-800/60 ${
                  announcement.isPinned 
                    ? "border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/5" 
                    : "border-slate-700/50"
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      announcement.isPinned 
                        ? "bg-amber-500/20" 
                        : "bg-slate-700/50"
                    }`}>
                      {announcement.isPinned ? (
                        <Pin className="h-5 w-5 text-amber-400" />
                      ) : (
                        <Megaphone className="h-5 w-5 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{announcement.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="text-blue-400">{announcement.courseName}</span>
                        <span>•</span>
                        <span>{formatDate(announcement.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {announcement.isPinned && (
                    <span className="px-2.5 py-1 rounded-lg text-xs font-medium text-amber-400 bg-amber-500/20 border border-amber-500/30">
                      Pinned
                    </span>
                  )}
                </div>
                
                {/* Content */}
                <div className="text-slate-300 text-sm leading-relaxed line-clamp-3 whitespace-pre-wrap">
                  {announcement.content}
                </div>
                
                {/* View Course Link */}
                <Link href={`/student/course/${announcement.courseId}`}>
                  <button className="mt-4 text-sm text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1">
                    View Course
                    <BookOpen className="h-4 w-4" />
                  </button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
