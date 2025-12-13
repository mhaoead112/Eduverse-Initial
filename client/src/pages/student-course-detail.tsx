import React, { useEffect, useState } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiEndpoint, assetUrl } from "@/lib/config";
import StudentLayout from "@/components/StudentLayout";
import {
  BookOpen,
  FileText,
  Video,
  Image,
  File,
  Megaphone,
  CheckCircle2,
  PlayCircle,
  Clock,
  ChevronRight,
  Download,
  Users,
  Calendar,
  Mail,
  ExternalLink
} from "lucide-react";

interface Course {
  id: number;
  title: string;
  description: string;
  teacherId: number;
  teacherName?: string;
  isPublished: boolean;
  imageUrl?: string;
  createdAt: string;
  teacher?: {
    id: number;
    fullName: string;
    email?: string;
  };
}

interface Lesson {
  id: number;
  courseId: number;
  title: string;
  fileName?: string;
  fileType?: string;
  createdAt?: string;
}

interface Assignment {
  id: number;
  title: string;
  description?: string;
  dueDate?: string;
  maxScore?: number;
  isPublished: boolean;
}

interface Announcement {
  id: number;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
}

interface Resource {
  id: number;
  name: string;
  type: 'pdf' | 'zip' | 'link';
  url: string;
}

export default function StudentCourseDetailPage() {
  const [match, params] = useRoute("/student/course/:courseId");
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
  const [activeTab, setActiveTab] = useState<'lessons' | 'assignments' | 'announcements'>('lessons');

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

  // Mock resources (would come from API)
  const resources: Resource[] = [
    { id: 1, name: 'Course Syllabus.pdf', type: 'pdf', url: '#' },
    { id: 2, name: 'Week 1-4 Datasets.zip', type: 'zip', url: '#' },
    { id: 3, name: 'Pandas Documentation', type: 'link', url: 'https://pandas.pydata.org/docs/' },
  ];

  const modulesRemaining = lessons.length - Math.floor(lessons.length * (progress / 100));

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (isLoading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-amber-500 border-t-transparent"></div>
        </div>
      </StudentLayout>
    );
  }

  if (!course) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-8 text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-slate-500" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Course Not Found</h2>
            <p className="text-slate-400 mb-6">This course doesn't exist or you don't have access to it.</p>
            <Link href="/student/courses">
              <button className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium rounded-xl transition-colors">
                Browse Courses
              </button>
            </Link>
          </div>
        </div>
      </StudentLayout>
    );
  }

  const upcomingAssignment = assignments.filter(a => a.isPublished && a.dueDate).sort((a, b) => 
    new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()
  )[0];

  return (
    <StudentLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm">
          <Link href="/student/dashboard">
            <span className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer">Dashboard</span>
          </Link>
          <span className="text-slate-600">/</span>
          <Link href="/student/courses">
            <span className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer">My Courses</span>
          </Link>
          <span className="text-slate-600">/</span>
          <span className="text-slate-400">{course.title}</span>
        </nav>

        {/* Course Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-2">{course.title}</h1>
            <p className="text-slate-400 flex items-center gap-2">
              <Users className="h-4 w-4" />
              {course.teacher?.fullName || course.teacherName || 'Unknown Instructor'}
            </p>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-3 mt-6">
              <Link href={`/student/course/${courseId}/lessons`}>
                <button className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium rounded-xl transition-colors">
                  <PlayCircle className="h-5 w-5" />
                  Continue Learning
                </button>
              </Link>
              <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl border border-slate-700 transition-colors">
                <Download className="h-5 w-5" />
                Syllabus
              </button>
            </div>
          </div>

          {/* Progress Card */}
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 w-full lg:w-72">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-400 text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Course Progress
              </span>
              <span className="text-2xl font-bold text-amber-400">{progress}%</span>
            </div>
            <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden mb-3">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-slate-500">{modulesRemaining} Modules remaining</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 border-b border-slate-700/50">
          {[
            { id: 'lessons', label: 'Lessons', icon: BookOpen },
            { id: 'assignments', label: 'Assignments', icon: FileText },
            { id: 'announcements', label: 'Announcements', icon: Megaphone },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 pb-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-amber-500 text-white'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* About This Course */}
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">About this Course</h2>
              <p className="text-slate-300 leading-relaxed mb-6">
                {course.description || "No description available for this course."}
              </p>
              
              {/* What You'll Learn */}
              <h3 className="text-white font-medium mb-3">WHAT YOU'LL LEARN</h3>
              <div className="grid md:grid-cols-2 gap-3">
                {[
                  'Python for Data Analysis',
                  'Statistical Methods & Probability',
                  'Data Visualization Techniques',
                  'Machine Learning Basics'
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span className="text-slate-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Instructor */}
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Your Instructor</h2>
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-amber-400">
                    {(course.teacher?.fullName || course.teacherName || 'U')[0]}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold">{course.teacher?.fullName || course.teacherName || 'Unknown Instructor'}</h3>
                  <p className="text-blue-400 text-sm mb-2">Lead Instructor</p>
                  <p className="text-slate-400 text-sm mb-4">
                    Experienced educator with a passion for making complex topics accessible to everyone.
                  </p>
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors">
                      <Mail className="h-4 w-4" />
                      Contact
                    </button>
                    <button className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors">
                      <Calendar className="h-4 w-4" />
                      Office Hours
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Deadline */}
            {upcomingAssignment && (
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-amber-400 text-xs font-medium uppercase tracking-wider flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Upcoming Deadline
                  </span>
                </div>
                <h3 className="text-white font-semibold mb-1">{upcomingAssignment.title}</h3>
                <p className="text-slate-400 text-sm mb-4">
                  Due: {formatDate(upcomingAssignment.dueDate)}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-1 rounded">
                    {upcomingAssignment.maxScore ? `${upcomingAssignment.maxScore}% of Grade` : '25% of Grade'}
                  </span>
                  <Link href={`/student/assignment/${upcomingAssignment.id}`}>
                    <span className="text-blue-400 text-sm hover:text-blue-300 transition-colors cursor-pointer">
                      View Details
                    </span>
                  </Link>
                </div>
              </div>
            )}

            {/* Announcements */}
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">Announcements</h3>
                {announcements.length > 0 && (
                  <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-medium rounded">
                    {announcements.length} NEW
                  </span>
                )}
              </div>
              
              {announcements.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4">No announcements yet</p>
              ) : (
                <div className="space-y-4">
                  {announcements.slice(0, 2).map((announcement) => (
                    <div key={announcement.id} className="border-b border-slate-700/50 last:border-0 pb-3 last:pb-0">
                      <h4 className="text-white text-sm font-medium mb-1">{announcement.title}</h4>
                      <p className="text-slate-400 text-xs line-clamp-2 mb-1">{announcement.content}</p>
                      <span className="text-slate-500 text-xs">{formatRelativeTime(announcement.createdAt)}</span>
                    </div>
                  ))}
                </div>
              )}
              
              <Link href={`/student/courses/${courseId}/announcements`}>
                <button className="w-full mt-4 py-2 text-sm text-blue-400 hover:text-blue-300 border border-slate-700/50 rounded-xl transition-colors">
                  View All Announcements
                </button>
              </Link>
            </div>

            {/* Course Resources */}
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5">
              <h3 className="text-white font-semibold mb-4">Course Resources</h3>
              <div className="space-y-3">
                {resources.map((resource) => (
                  <a
                    key={resource.id}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-700/30 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                      {resource.type === 'pdf' && <FileText className="h-4 w-4 text-amber-400" />}
                      {resource.type === 'zip' && <File className="h-4 w-4 text-amber-400" />}
                      {resource.type === 'link' && <ExternalLink className="h-4 w-4 text-amber-400" />}
                    </div>
                    <span className="text-slate-300 text-sm group-hover:text-white transition-colors">
                      {resource.name}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
