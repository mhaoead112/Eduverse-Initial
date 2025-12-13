import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { 
  BookOpen, Clock, Download, Video, Sparkles,
  FlaskConical, FileEdit, Calculator, BookOpenCheck,
  Loader2, CheckCircle2, Circle, Megaphone, FileText, Calendar, Flame
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
      <div className="space-y-5 sm:space-y-6 md:space-y-8 pb-6 sm:pb-8 md:pb-10 px-0 sm:px-0 relative">
        {/* Welcome Header - Dark Theme */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-800/80 to-slate-900/80 border border-slate-700/50 p-6 sm:p-8">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-full blur-3xl" />
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight tracking-tight">
                Welcome back, {user?.fullName?.split(' ')[0]}!
              </h1>
              <p className="text-sm sm:text-base text-slate-400">
                You have <span className="text-yellow-500 font-semibold">{assignments.filter(a => a.status === 'pending').length} assignments</span> due today. Keep up the momentum!
              </p>
            </div>
            <Button 
              className="gap-2 bg-white hover:bg-slate-100 text-slate-900 font-semibold rounded-xl px-5 py-2.5 h-auto shadow-lg border-0 w-fit"
              onClick={() => setLocation('/student/assignments')}
            >
              <span>View Assignments</span>
              <span className="ml-1">→</span>
            </Button>
          </div>
        </div>

        {/* Stats Cards - Dark Theme */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {/* Course Completion */}
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-2xl overflow-hidden backdrop-blur-sm">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-slate-400 mb-3 font-medium">Course Completion</p>
                  <h3 className="text-2xl sm:text-3xl font-bold text-white leading-tight mb-1">
                    {displayProgress >= 75 ? 'Good' : displayProgress >= 50 ? 'Fair' : 'Start'}
                  </h3>
                  <p className="text-2xl sm:text-3xl font-bold text-white leading-tight">Progress</p>
                </div>
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="50%"
                      cy="50%"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-slate-700"
                    />
                    <circle
                      cx="50%"
                      cy="50%"
                      r="40"
                      stroke="#EAB308"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${(displayProgress / 100) * 251} 251`}
                      strokeLinecap="round"
                      className="transition-all duration-700"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg sm:text-xl font-bold text-white">{displayProgress}%</span>
                  </div>
                </div>
              </div>
              {/* Progress Details */}
              <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Total Score</span>
                  <span className="font-semibold text-white">
                    {overallProgress.totalScore.toFixed(1)} / {overallProgress.totalMaxScore}
                  </span>
                </div>
                {overallProgress.totalBonusPoints > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      Bonus Points
                    </span>
                    <span className="font-semibold text-emerald-400">
                      +{overallProgress.totalBonusPoints.toFixed(1)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Graded Assignments</span>
                  <span className="font-semibold text-white">
                    {overallProgress.assignmentsCompleted} / {overallProgress.totalAssignments}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Study Streak - Dark Theme */}
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-2xl overflow-hidden backdrop-blur-sm">
            <CardContent className="p-5 sm:p-6">
              <p className="text-sm text-slate-400 mb-4 font-medium">Study Streak</p>
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <h3 className="text-5xl sm:text-6xl font-bold text-white leading-none tracking-tight">{streakInfo.currentStreak}</h3>
                  <span className="text-lg sm:text-xl text-slate-400 font-normal pb-2">Days</span>
                </div>
                <div className="relative">
                  <Flame 
                    className="w-14 h-14 sm:w-16 sm:h-16 text-orange-500" 
                    fill="currentColor"
                    style={{
                      filter: 'drop-shadow(0 0 12px rgba(249, 115, 22, 0.5))',
                      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                    }}
                  />
                </div>
              </div>
              {streakInfo.longestStreak > 0 && (
                <p className="text-xs text-slate-500 mt-3">Best: {streakInfo.longestStreak} days</p>
              )}
            </CardContent>
          </Card>

          {/* Weekly Study Goal - Dark Theme */}
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-2xl overflow-hidden backdrop-blur-sm">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-slate-400 font-medium">Weekly Study Goal</p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 text-xs text-slate-400 hover:text-white hover:bg-slate-700"
                  onClick={() => setShowGoalDialog(true)}
                >
                  Edit
                </Button>
              </div>
              <div className="flex items-baseline gap-2">
                <h3 className="text-5xl sm:text-6xl font-bold text-white leading-none tracking-tight">
                  {Math.round(streakInfo.currentWeekHours)}/{streakInfo.weeklyGoalHours}
                </h3>
                <span className="text-lg sm:text-xl text-slate-400 font-normal pb-2">Hours</span>
              </div>
              <div className="mt-4">
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 transition-all duration-700 rounded-full"
                    style={{ width: `${Math.min(streakInfo.weeklyProgress, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">{streakInfo.weeklyProgress}% complete</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid - Dark Theme */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-5 sm:gap-6">
          {/* My Courses Section */}
          <div className="space-y-4 sm:space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-bold text-white">My Classes</h2>
              <Button 
                variant="ghost" 
                className="text-blue-400 hover:text-blue-300 hover:bg-slate-800 text-sm font-medium"
                onClick={() => setLocation('/student/courses')}
              >
                View All
              </Button>
            </div>

            {enrollments.length === 0 ? (
              <Card className="bg-slate-800/50 border-slate-700/50 rounded-2xl">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {enrollments.slice(0, 3).map((enrollment) => {
                  if (!enrollment.course) return null;
                  const Icon = getIconForCourse(enrollment.course.title);
                  const progress = courseProgress[enrollment.courseId] || 0;
                  
                  // Generate course code from title
                  const courseCode = enrollment.course.title.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,3) + ' ' + Math.floor(100 + Math.random() * 200);
                  
                  return (
                    <Link key={enrollment.courseId} href={`/student/courses/${enrollment.courseId}`}>
                      <Card className="bg-slate-800/50 border-slate-700/50 rounded-2xl overflow-hidden hover:border-slate-600 transition-all duration-300 cursor-pointer group h-full">
                        <CardContent className="p-0">
                          {/* Course Cover */}
                          <div className="h-[140px] relative overflow-hidden bg-gradient-to-br from-slate-700 to-slate-800">
                            {enrollment.course.imageUrl && enrollment.course.imageUrl.length > 0 ? (
                              <img 
                                src={enrollment.course.imageUrl.startsWith('http') ? enrollment.course.imageUrl : `/uploads/${enrollment.course.imageUrl}`}
                                alt={enrollment.course.title}
                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Icon className="h-12 w-12 text-slate-500" />
                              </div>
                            )}
                            {/* Course Code Badge */}
                            <div className="absolute top-3 right-3">
                              <span className="bg-slate-900/80 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-600/50">
                                {courseCode}
                              </span>
                            </div>
                          </div>

                          {/* Course Info */}
                          <div className="p-4">
                            <h3 className="font-bold text-white text-base mb-2 group-hover:text-blue-400 transition-colors leading-tight line-clamp-1">
                              {enrollment.course.title}
                            </h3>
                            
                            {/* Progress */}
                            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                              <span>{progress}% Complete</span>
                              <span className="font-semibold">{progress >= 90 ? 'A' : progress >= 80 ? 'B+' : progress >= 70 ? 'B' : 'C+'}</span>
                            </div>
                            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 transition-all duration-700 rounded-full"
                                style={{ width: `${progress}%` }}
                              />
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

          {/* Upcoming Due Dates Sidebar - Dark Theme */}
          <div className="space-y-4 sm:space-y-5">
            <h2 className="text-xl sm:text-2xl font-bold text-white">Upcoming Due Dates</h2>

            <div className="space-y-3">
              {assignments.length === 0 ? (
                <Card className="bg-slate-800/50 border-slate-700/50 rounded-2xl">
                  <CardContent className="p-5">
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
                  
                  return (
                    <Card 
                      key={assignment.id}
                      className={`bg-slate-800/50 border-slate-700/50 rounded-2xl overflow-hidden hover:border-slate-600 transition-all cursor-pointer ${
                        isCompleted ? 'opacity-60' : ''
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-slate-700/50 flex items-center justify-center flex-shrink-0">
                            <Icon className="h-5 w-5 text-slate-300" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className={`font-semibold text-sm mb-1 leading-tight ${
                              isCompleted ? 'text-slate-500 line-through' : 'text-white'
                            }`}>
                              {assignment.title}
                            </h4>
                            <p className="text-xs text-slate-400">
                              {assignment.courseName}
                            </p>
                            <p className={`text-xs mt-1 font-medium ${
                              isToday ? 'text-red-400' : 'text-slate-500'
                            }`}>
                              {isToday ? 'Due Today, ' : ''}{dueDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            </p>
                          </div>

                          <Button 
                            size="sm"
                            className={`rounded-lg text-xs h-8 px-4 ${
                              isCompleted 
                                ? 'bg-slate-700 text-slate-400 hover:bg-slate-600' 
                                : 'bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-semibold'
                            }`}
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
