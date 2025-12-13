import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { 
  BookOpen, Clock, Download, Video, Sparkles,
  FlaskConical, FileEdit, Calculator, BookOpenCheck,
  Loader2, CheckCircle2, Circle, Megaphone, FileText, Calendar, Flame,
  ChevronRight, TrendingUp, Award, BarChart3, GraduationCap, MoreHorizontal
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import VersaFloatingChat from "@/components/VersaFloatingChat";
import { apiEndpoint, assetUrl } from '@/lib/config';

// Weekly Study Time Bar Chart Component
function WeeklyStudyChart({ data }: { data: number[] }) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const maxVal = Math.max(...data, 1);
  
  return (
    <div className="flex items-end justify-between gap-1.5 h-16 mt-2">
      {data.map((val, i) => (
        <div key={i} className="flex flex-col items-center flex-1">
          <div 
            className={`w-full rounded-t transition-all duration-300 ${
              val > 0 ? 'bg-gradient-to-t from-yellow-500 to-yellow-400' : 'bg-slate-700'
            }`}
            style={{ height: `${Math.max((val / maxVal) * 100, 8)}%`, minHeight: '4px' }}
          />
          <span className="text-[10px] text-slate-500 mt-1">{days[i]}</span>
        </div>
      ))}
    </div>
  );
}

interface Course {
  id: string;
  title: string;
  description: string;
  teacherId: string;
  status: string;
}

interface Enrollment {
  courseId: string;
  course: Course;
}

interface Announcement {
  id: string;
  courseId: string;
  teacherId: string;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  courseName?: string;
}

interface Assignment {
  id: string;
  title: string;
  dueDate: string;
  courseId: string;
  courseName?: string;
  status?: 'pending' | 'submitted' | 'graded';
  priority?: 'high' | 'medium' | 'low';
}

export default function StudentDashboard() {
  const { user, token, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [courseProgress, setCourseProgress] = useState<Record<string, number>>({});
  const [overallProgress, setOverallProgress] = useState({
    totalScore: 0,
    totalMaxScore: 0,
    progressPercentage: 0,
    totalBonusPoints: 0,
    assignmentsCompleted: 0,
    totalAssignments: 0,
  });
  const [streakInfo, setStreakInfo] = useState({
    currentStreak: 0,
    longestStreak: 0,
    totalActiveDays: 0,
    weeklyGoalHours: 10,
    currentWeekHours: 0,
    weeklyProgress: 0,
  });
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [weeklyGoal, setWeeklyGoal] = useState(10);

  const getAuthHeaders = (): Record<string, string> => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    if (!authLoading && token) {
      fetchDashboardData();
    }
  }, [authLoading, token]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const authHeaders = getAuthHeaders();

      // Fetch enrolled courses for the student using enrollments API
      const enrollmentsRes = await fetch(apiEndpoint("/api/enrollments/student"), {
        headers: authHeaders,
        credentials: "include",
      });

      if (!enrollmentsRes.ok) {
        throw new Error("Failed to fetch enrolled courses");
      }

      const enrollmentsData = await enrollmentsRes.json();
      const enrollmentsList = Array.isArray(enrollmentsData) ? enrollmentsData : [];
      
      // Extract courses from enrollments
      const enrolledCourses: Course[] = enrollmentsList
        .filter((e: any) => e.course)
        .map((e: any) => ({
          id: e.course.id,
          title: e.course.title,
          description: e.course.description,
          teacherId: e.course.teacherId,
          isPublished: e.course.isPublished,
        }));

      // Set enrollments state
      setEnrollments(enrollmentsList.map((e: any) => ({
        courseId: e.courseId,
        course: e.course
      })));

      // Fetch announcements only for enrolled courses
      const allAnnouncements: Announcement[] = [];
      for (const course of enrolledCourses) {
        try {
          const announcementsRes = await fetch(
            apiEndpoint(`/api/announcements/course/${course.id}`),
            { headers: authHeaders, credentials: "include" }
          );

          if (announcementsRes.ok) {
            const data = await announcementsRes.json();
            const courseAnnouncements = Array.isArray(data.announcements) ? data.announcements : [];
            
            courseAnnouncements.forEach((announcement: Announcement) => {
              allAnnouncements.push({
                ...announcement,
                courseName: course.title,
              });
            });
          }
        } catch (error) {
          console.error(`Failed to fetch announcements for course ${course.id}:`, error);
        }
      }

      // Sort announcements: pinned first, then by date
      allAnnouncements.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      setAnnouncements(allAnnouncements.slice(0, 5)); // Limit to 5 most recent

      // Fetch assignments only for enrolled courses
      const allAssignments: Assignment[] = [];
      for (const course of enrolledCourses) {
        try {
          const assignmentsRes = await fetch(
            apiEndpoint(`/api/assignments/courses/${course.id}/assignments`),
            { headers: authHeaders, credentials: "include" }
          );
          if (assignmentsRes.ok) {
            const data = await assignmentsRes.json();
            const courseAssignments = Array.isArray(data) ? data : [];
            
            // Fetch student's submissions to check completion status
            for (const assignment of courseAssignments) {
              try {
                const submissionRes = await fetch(
                  apiEndpoint(`/api/assignments/${assignment.id}/my-submission`),
                  { headers: authHeaders, credentials: "include" }
                );
                
                let status: 'pending' | 'submitted' | 'graded' = 'pending';
                if (submissionRes.ok) {
                  const submissionData = await submissionRes.json();
                  if (submissionData.submission) {
                    status = submissionData.grade ? 'graded' : 'submitted';
                  }
                }
                
                allAssignments.push({
                  id: assignment.id,
                  title: assignment.title,
                  dueDate: assignment.dueDate,
                  courseId: course.id,
                  courseName: course.title,
                  status: status,
                  priority: new Date(assignment.dueDate).getTime() - Date.now() < 86400000 * 2 ? 'high' : 'medium'
                });
              } catch (error) {
                console.error(`Failed to fetch submission for assignment ${assignment.id}:`, error);
                allAssignments.push({
                  id: assignment.id,
                  title: assignment.title,
                  dueDate: assignment.dueDate,
                  courseId: course.id,
                  courseName: course.title,
                  status: 'pending',
                  priority: new Date(assignment.dueDate).getTime() - Date.now() < 86400000 * 2 ? 'high' : 'medium'
                });
              }
            }
          }
        } catch (error) {
          console.error(`Failed to fetch assignments for course ${course.id}:`, error);
        }
      }
      
      // Sort by due date
      allAssignments.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
      setAssignments(allAssignments.slice(0, 4)); // Top 4 upcoming

      // Fetch overall progress
      try {
        const progressRes = await fetch(apiEndpoint('/api/progress/overall'), {
          headers: authHeaders,
          credentials: "include",
        });
        if (progressRes.ok) {
          const progressData = await progressRes.json();
          setOverallProgress(progressData);
        }
      } catch (error) {
        console.error('Failed to fetch overall progress:', error);
      }

      // Fetch course progress
      try {
        const courseProgressRes = await fetch(apiEndpoint('/api/progress/courses'), {
          headers: authHeaders,
          credentials: "include",
        });
        if (courseProgressRes.ok) {
          const courseProgressData = await courseProgressRes.json();
          const progress: Record<string, number> = {};
          courseProgressData.forEach((cp: any) => {
            progress[cp.courseId] = cp.progressPercentage;
          });
          setCourseProgress(progress);
        }
      } catch (error) {
        console.error('Failed to fetch course progress:', error);
      }

      // Fetch streak information
      try {
        const streakRes = await fetch(apiEndpoint('/api/streaks/me'), {
          headers: authHeaders,
          credentials: "include",
        });
        if (streakRes.ok) {
          const streakData = await streakRes.json();
          setStreakInfo(streakData);
          
          // Check if we should prompt for weekly goal (every Monday or if not set)
          checkWeeklyGoalPrompt(streakData);
        }
      } catch (error) {
        console.error('Failed to fetch streak info:', error);
      }

      // Fetch lessons count only for enrolled courses
      let totalLessons = 0;
      for (const course of enrolledCourses) {
        try {
          const lessonsRes = await fetch(
            apiEndpoint(`/api/lessons/course/${course.id}`),
            { headers: authHeaders, credentials: "include" }
          );
          if (lessonsRes.ok) {
            const lessonsData = await lessonsRes.json();
            totalLessons += Array.isArray(lessonsData) ? lessonsData.length : 0;
          }
        } catch (error) {
          console.error(`Failed to fetch lessons for course ${course.id}:`, error);
        }
      }
      setLessons(Array(totalLessons).fill({})); // Just for count

    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkWeeklyGoalPrompt = (streakData: any) => {
    const lastPrompted = localStorage.getItem('lastWeeklyGoalPrompt');
    const today = new Date();
    const isMonday = today.getDay() === 1;
    
    // Prompt if it's Monday and we haven't prompted this week
    if (isMonday && (!lastPrompted || isNewWeek(lastPrompted))) {
      setWeeklyGoal(streakData.weeklyGoalHours || 10);
      setTimeout(() => setShowGoalDialog(true), 1500);
    }
  };

  const isNewWeek = (lastPromptDate: string): boolean => {
    const last = new Date(lastPromptDate);
    const today = new Date();
    
    // Get Monday of last prompt week
    const lastMonday = new Date(last);
    lastMonday.setDate(last.getDate() - last.getDay() + 1);
    
    // Get Monday of current week
    const thisMonday = new Date(today);
    thisMonday.setDate(today.getDate() - today.getDay() + 1);
    
    return thisMonday.getTime() > lastMonday.getTime();
  };

  const handleUpdateGoal = async () => {
    try {
      const authHeaders = getAuthHeaders();
      const response = await fetch(apiEndpoint('/api/streaks/weekly-goal'), {
        method: 'PUT',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json',
        },
        credentials: "include",
        body: JSON.stringify({ goalHours: weeklyGoal }),
      });

      if (response.ok) {
        const data = await response.json();
        setStreakInfo(data.streak);
        localStorage.setItem('lastWeeklyGoalPrompt', new Date().toISOString());
        setShowGoalDialog(false);
        toast({
          title: 'Goal Updated',
          description: `Your weekly study goal is now ${weeklyGoal} hours`,
        });
      }
    } catch (error) {
      console.error('Failed to update weekly goal:', error);
      toast({
        title: 'Error',
        description: 'Failed to update weekly goal',
        variant: 'destructive',
      });
    }
  };

  const getIconForCourse = (title: string) => {
    const lower = title.toLowerCase();
    if (lower.includes('math') || lower.includes('algebra') || lower.includes('calculus')) {
      return Calculator;
    }
    if (lower.includes('science') || lower.includes('chemistry') || lower.includes('physics')) {
      return FlaskConical;
    }
    if (lower.includes('writing') || lower.includes('english') || lower.includes('literature')) {
      return FileEdit;
    }
    return BookOpen;
  };

  const getTaskIcon = (title: string) => {
    const lower = title.toLowerCase();
    if (lower.includes('lab')) return FlaskConical;
    if (lower.includes('essay') || lower.includes('writing')) return FileEdit;
    if (lower.includes('quiz') || lower.includes('test') || lower.includes('exam')) return Calculator;
    if (lower.includes('reading')) return BookOpenCheck;
    return Circle;
  };

  const getTaskColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-600';
      case 'medium': return 'bg-purple-100 text-purple-600';
      case 'low': return 'bg-blue-100 text-blue-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const formatDueDate = (dueDate: string) => {
    const date = new Date(dueDate);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Due: Today';
    if (diffDays === 1) return 'Due: Tomorrow, ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    if (diffDays < 7) return `Due: In ${diffDays} days`;
    return 'Due: ' + date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const quickActions = [
    {
      title: 'View Announcements',
      description: 'Check latest updates',
      icon: Megaphone,
      color: 'blue' as const,
      onClick: () => setLocation('/student/announcements'),
      badge: announcements.length > 0 ? `${announcements.length}` : undefined
    },
    {
      title: 'My Classes',
      description: 'Browse your enrolled classes',
      icon: BookOpen,
      color: 'green' as const,
      onClick: () => setLocation('/student/courses')
    },
    {
      title: 'Lessons',
      description: 'Access course materials',
      icon: FileText,
      color: 'purple' as const,
      onClick: () => setLocation('/student/courses')
    },
    {
      title: 'View Schedule',
      description: 'Check upcoming classes',
      icon: Calendar,
      color: 'orange' as const,
      onClick: () => setLocation('/student/courses')
    }
  ];

  // Use the overall progress from API (calculated from total scores / total max scores)
  const displayProgress = Math.round(overallProgress.progressPercentage);

  // Generate mock weekly study data based on streak info
  const weeklyStudyData = [
    Math.round(streakInfo.currentWeekHours * 0.12),
    Math.round(streakInfo.currentWeekHours * 0.18),
    Math.round(streakInfo.currentWeekHours * 0.22),
    Math.round(streakInfo.currentWeekHours * 0.15),
    Math.round(streakInfo.currentWeekHours * 0.20),
    Math.round(streakInfo.currentWeekHours * 0.08),
    Math.round(streakInfo.currentWeekHours * 0.05),
  ];

  // Mock recent grades data
  const recentGrades = [
    { title: 'Final Project', course: 'Art History', grade: 95, change: '+2%', color: 'text-green-400' },
    { title: 'Midterm Exam', course: 'Physics 101', grade: 88, change: '', color: 'text-blue-400' },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-8 relative">
        {/* Welcome Header Banner */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl">
          {/* Gradient Background with Wave Pattern */}
          <div className="absolute inset-0 bg-gradient-to-r from-teal-600 via-emerald-500 to-cyan-500" />
          <div className="absolute inset-0 opacity-30">
            <svg className="w-full h-full" viewBox="0 0 1200 200" preserveAspectRatio="none">
              <path fill="rgba(255,255,255,0.1)" d="M0,100 C300,150 600,50 900,100 C1050,130 1150,80 1200,100 L1200,200 L0,200 Z" />
              <path fill="rgba(255,255,255,0.05)" d="M0,120 C200,160 400,80 600,120 C800,160 1000,100 1200,140 L1200,200 L0,200 Z" />
            </svg>
          </div>
          
          <div className="relative px-6 sm:px-8 py-8 sm:py-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">
                  Welcome back, {user?.fullName?.split(' ')[0]}!
                </h1>
                <p className="text-base sm:text-lg text-white/90">
                  You have <span className="text-yellow-300 font-bold">{assignments.filter(a => a.status === 'pending').length} assignments</span> due today. Keep up the momentum!
                </p>
              </div>
              <Button 
                className="gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold rounded-xl px-5 py-2.5 h-auto border border-white/20 w-fit transition-all"
                onClick={() => setLocation('/student/assignments')}
              >
                <span>View Assignments</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
          {/* Left Column - Classes and Due Dates */}
          <div className="space-y-6">
            {/* My Classes Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-bold text-white">My Classes</h2>
                <Button 
                  variant="link" 
                  className="text-blue-400 hover:text-blue-300 text-sm font-medium p-0 h-auto"
                  onClick={() => setLocation('/student/courses')}
                >
                  View All
                </Button>
              </div>

              {enrollments.length === 0 ? (
                <Card className="bg-slate-800/60 border-slate-700/50 rounded-2xl backdrop-blur-sm">
                  <CardContent className="pt-6">
                    <div className="text-center py-12">
                      <BookOpen className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                      <p className="text-base text-slate-400 mb-4 px-4">
                        No courses enrolled yet. Browse available courses to get started!
                      </p>
                      <Button 
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => setLocation('/student/courses')}
                      >
                        Browse Courses
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {enrollments.slice(0, 3).map((enrollment, index) => {
                    if (!enrollment.course) return null;
                    const Icon = getIconForCourse(enrollment.course.title);
                    const progress = courseProgress[enrollment.courseId] || Math.floor(40 + Math.random() * 55);
                    
                    // Generate course code from title
                    const words = enrollment.course.title.split(' ');
                    const courseCode = words.map(w => w[0]).join('').toUpperCase().slice(0,3) + ' ' + (101 + index * 100);
                    
                    // Calculate letter grade
                    const letterGrade = progress >= 90 ? 'A' : progress >= 80 ? 'B+' : progress >= 70 ? 'B' : progress >= 60 ? 'C+' : 'C';
                    
                    // Course images array for demo
                    const courseImages = [
                      'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=250&fit=crop', // Science/Chemistry
                      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=250&fit=crop', // Art/Sculpture
                      'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=250&fit=crop', // Math
                    ];
                    
                    return (
                      <Link key={enrollment.courseId} href={`/student/courses/${enrollment.courseId}`}>
                        <Card className="bg-slate-800/60 border-slate-700/50 rounded-2xl overflow-hidden hover:border-slate-600 hover:shadow-xl hover:shadow-black/20 transition-all duration-300 cursor-pointer group h-full">
                          <CardContent className="p-0">
                            {/* Course Cover Image */}
                            <div className="h-32 sm:h-36 relative overflow-hidden">
                              <img 
                                src={enrollment.course.imageUrl 
                                  ? (enrollment.course.imageUrl.startsWith('http') ? enrollment.course.imageUrl : `/uploads/${enrollment.course.imageUrl}`)
                                  : courseImages[index % courseImages.length]
                                }
                                alt={enrollment.course.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                              
                              {/* Course Code Badge */}
                              <div className="absolute top-3 left-3">
                                <span className="bg-slate-900/70 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-md">
                                  {courseCode}
                                </span>
                              </div>
                            </div>

                            {/* Course Info */}
                            <div className="p-4 space-y-3">
                              <h3 className="font-bold text-white text-base group-hover:text-blue-400 transition-colors line-clamp-1">
                                {enrollment.course.title}
                              </h3>
                              
                              {/* Progress Bar */}
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-slate-400">{progress}% Complete</span>
                                  <span className="text-slate-300 font-semibold">{letterGrade}</span>
                                </div>
                                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-700"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Upcoming Due Dates Section */}
            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-white">Upcoming Due Dates</h2>

              <div className="space-y-3">
                {assignments.length === 0 ? (
                  <Card className="bg-slate-800/60 border-slate-700/50 rounded-2xl backdrop-blur-sm">
                    <CardContent className="p-6">
                      <div className="text-center py-8">
                        <Clock className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                        <p className="text-sm text-slate-400">No upcoming tasks</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  assignments.map((assignment) => {
                    const Icon = getTaskIcon(assignment.title);
                    const isCompleted = assignment.status === 'graded' || assignment.status === 'submitted';
                    const dueDate = new Date(assignment.dueDate);
                    const isToday = new Date().toDateString() === dueDate.toDateString();
                    const isTomorrow = new Date(Date.now() + 86400000).toDateString() === dueDate.toDateString();
                    
                    // Icon background colors
                    const iconColors = ['bg-amber-500/20', 'bg-blue-500/20', 'bg-purple-500/20', 'bg-pink-500/20'];
                    const iconTextColors = ['text-amber-400', 'text-blue-400', 'text-purple-400', 'text-pink-400'];
                    const colorIndex = Math.abs(assignment.title.charCodeAt(0)) % 4;
                    
                    return (
                      <Card 
                        key={assignment.id}
                        className={`bg-slate-800/60 border-slate-700/50 rounded-2xl overflow-hidden hover:border-slate-600 transition-all cursor-pointer backdrop-blur-sm ${
                          isCompleted ? 'opacity-60' : ''
                        }`}
                        onClick={() => setLocation('/student/assignments')}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            {/* Icon */}
                            <div className={`w-12 h-12 rounded-xl ${iconColors[colorIndex]} flex items-center justify-center flex-shrink-0`}>
                              <Icon className={`h-5 w-5 ${iconTextColors[colorIndex]}`} />
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <h4 className={`font-semibold text-sm mb-0.5 ${
                                isCompleted ? 'text-slate-500 line-through' : 'text-white'
                              }`}>
                                {assignment.title}
                              </h4>
                              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                                <span>{assignment.courseName}</span>
                                <span className="text-slate-600">•</span>
                                <span className={isToday ? 'text-red-400 font-medium' : ''}>
                                  {isToday ? 'Due Today, ' : isTomorrow ? 'Due Tomorrow' : ''}
                                  {isToday && dueDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                </span>
                              </p>
                            </div>

                            {/* Action Button */}
                            <Button 
                              size="sm"
                              className={`rounded-xl text-xs h-9 px-4 font-semibold ${
                                isCompleted 
                                  ? 'bg-slate-700 text-slate-400 hover:bg-slate-600' 
                                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setLocation('/student/assignments');
                              }}
                            >
                              {isCompleted ? 'Done' : 'Submit'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Performance Insights */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Performance Insights</h2>

            {/* Weekly Study Time */}
            <Card className="bg-slate-800/60 border-slate-700/50 rounded-2xl backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400 font-medium">Weekly Study Time</span>
                  <span className="text-sm font-bold text-white">
                    {Math.round(streakInfo.currentWeekHours)}h / {streakInfo.weeklyGoalHours}h
                  </span>
                </div>
                <WeeklyStudyChart data={weeklyStudyData} />
              </CardContent>
            </Card>

            {/* Major Progress */}
            <Card className="bg-slate-800/60 border-slate-700/50 rounded-2xl backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-slate-400 font-medium">Major Progress</span>
                  <span className="text-sm font-bold text-white">{displayProgress}% Complete</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-2">
                  <div 
                    className="h-full bg-gradient-to-r from-yellow-500 to-amber-400 rounded-full transition-all duration-700"
                    style={{ width: `${displayProgress}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Accumulated {overallProgress.totalScore.toFixed(0)} out of {overallProgress.totalMaxScore} credits
                </p>
              </CardContent>
            </Card>

            {/* Day Streak */}
            <Card className="bg-gradient-to-br from-amber-900/40 to-orange-900/30 border-amber-700/30 rounded-2xl backdrop-blur-sm">
              <CardContent className="p-5 text-center">
                <div className="flex items-center justify-center gap-3 mb-1">
                  <Flame 
                    className="w-8 h-8 text-amber-400" 
                    fill="currentColor"
                    style={{ filter: 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.5))' }}
                  />
                  <span className="text-4xl font-bold text-white">{streakInfo.currentStreak}</span>
                </div>
                <p className="text-sm text-amber-200/80">Day Streak!</p>
              </CardContent>
            </Card>

            {/* Recent Grades */}
            <Card className="bg-slate-800/60 border-slate-700/50 rounded-2xl backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-slate-400 font-medium">Recent Grades</span>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-500 hover:text-white">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-3">
                  {recentGrades.map((grade, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                        grade.grade >= 90 ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {grade.grade >= 90 ? 'A' : 'B'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{grade.title}</p>
                        <p className="text-xs text-slate-500">{grade.course}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-white">{grade.grade}%</p>
                        {grade.change && (
                          <p className="text-xs text-green-400">{grade.change}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Weekly Goal Dialog - Dark Theme */}
      <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
        <DialogContent className="sm:max-w-[425px] bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Set Your Weekly Study Goal</DialogTitle>
            <DialogDescription className="text-slate-400">
              How many hours do you want to study this week? Setting a goal helps you stay motivated!
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="goal" className="text-right text-slate-300">
                Hours
              </Label>
              <Input
                id="goal"
                type="number"
                min="1"
                max="168"
                value={weeklyGoal}
                onChange={(e) => setWeeklyGoal(parseInt(e.target.value) || 10)}
                className="col-span-3 bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="text-sm text-slate-400 px-1">
              💡 Tip: Start with a realistic goal like 5-15 hours per week
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGoalDialog(false)} className="border-slate-600 text-slate-300 hover:bg-slate-700">
              Skip
            </Button>
            <Button onClick={handleUpdateGoal} className="bg-yellow-500 hover:bg-yellow-600 text-slate-900">
              Set Goal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floating Versa Chat */}
      <VersaFloatingChat />
    </DashboardLayout>
  );
}
