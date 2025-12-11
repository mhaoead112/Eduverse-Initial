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
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 md:space-y-8 pb-6 sm:pb-8 md:pb-10 px-0 sm:px-2 relative">
        {/* Elegant Background Pattern - Hidden on mobile for performance */}
        <div className="hidden md:block fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50"></div>
          <div className="absolute top-0 left-0 w-full h-full opacity-30">
            <div className="absolute top-10 left-10 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl animate-float"></div>
            <div className="absolute top-40 right-20 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
            <div className="absolute bottom-20 left-1/3 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
          </div>
          <div className="absolute inset-0 bg-white/40 backdrop-blur-3xl"></div>
        </div>

        {/* Welcome Header */}
        <div className="animate-fade-in space-y-1">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.5rem] font-bold text-gray-900 leading-tight tracking-tight font-luxury">
            Welcome back, {user?.fullName?.split(' ')[0]}!
          </h1>
          <p className="text-sm sm:text-base text-gray-500 font-normal font-elegant">
            The beautiful thing about learning is that nobody can take it away from you.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
          <Button 
            variant="outline" 
            className="gap-2 bg-white hover:bg-gray-50 border-gray-300 text-gray-700 font-medium rounded-lg px-4 sm:px-5 py-2 sm:py-2.5 h-auto shadow-sm w-full sm:w-auto justify-center"
            onClick={() => setLocation('/student/courses')}
          >
            <Download className="h-4 w-4" />
            <span className="text-sm">Browse Courses</span>
          </Button>
          <Button 
            className="gap-2 bg-[#EAB308] hover:bg-[#D4A004] text-gray-900 font-medium rounded-lg px-4 sm:px-5 py-2 sm:py-2.5 h-auto shadow-sm border-0 w-full sm:w-auto justify-center"
            onClick={() => setLocation('/student/calendar')}
          >
            <Video className="h-4 w-4" />
            <span className="text-sm">View Schedule</span>
          </Button>
          <Button 
            className="gap-2 bg-[#FCD34D] hover:bg-[#EAB308] text-gray-900 font-medium rounded-lg px-4 sm:px-5 py-2 sm:py-2.5 h-auto shadow-sm border-0 w-full sm:w-auto justify-center"
            onClick={() => setLocation('/student/assignments')}
          >
            <Sparkles className="h-4 w-4" />
            <span className="text-sm">My Assignments</span>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
          {/* Course Completion */}
          <Card className="bg-white border-0 shadow-[0_2px_8px_rgba(0,0,0,0.08)] rounded-xl sm:rounded-2xl overflow-hidden">
            <CardContent className="p-4 sm:p-5 md:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 font-medium">Course Completion</p>
                  <h3 className="text-2xl sm:text-3xl md:text-[2rem] font-bold text-gray-900 leading-tight mb-0 font-premium">
                    {displayProgress >= 75 ? 'Good' : displayProgress >= 50 ? 'Fair' : 'Start'}
                  </h3>
                  <p className="text-2xl sm:text-3xl md:text-[2rem] font-bold text-gray-900 leading-tight">Progress</p>
                </div>
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-[88px] md:h-[88px] flex-shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="50%"
                      cy="50%"
                      r="36"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-gray-100"
                    />
                    <circle
                      cx="50%"
                      cy="50%"
                      r="36"
                      stroke="#D4AF37"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${(displayProgress / 100) * 226} 226`}
                      strokeLinecap="round"
                      className="transition-all duration-700"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-base sm:text-lg md:text-xl font-bold text-gray-900">{displayProgress}%</span>
                  </div>
                </div>
              </div>
              {/* Progress Details */}
              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100 space-y-1.5 sm:space-y-2">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Total Score</span>
                  <span className="font-semibold text-gray-900">
                    {overallProgress.totalScore.toFixed(1)} / {overallProgress.totalMaxScore}
                  </span>
                </div>
                {overallProgress.totalBonusPoints > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-green-600 flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      Bonus Points
                    </span>
                    <span className="font-semibold text-green-600">
                      +{overallProgress.totalBonusPoints.toFixed(1)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Graded Assignments</span>
                  <span className="font-semibold text-gray-900">
                    {overallProgress.assignmentsCompleted} / {overallProgress.totalAssignments}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Study Streak */}
          <Card className="bg-white border-0 shadow-[0_2px_8px_rgba(0,0,0,0.08)] rounded-xl sm:rounded-2xl overflow-hidden">
            <CardContent className="p-4 sm:p-5 md:p-6">
              <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 font-medium">Study Streak</p>
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-1 sm:gap-2">
                  <h3 className="text-4xl sm:text-5xl md:text-6xl lg:text-[3.75rem] font-bold text-gray-900 leading-none tracking-tight">{streakInfo.currentStreak}</h3>
                  <span className="text-base sm:text-lg md:text-xl text-gray-500 font-normal pb-1 sm:pb-2">Days</span>
                </div>
                <div className="relative">
                  <Flame 
                    className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-orange-500 animate-pulse" 
                    fill="currentColor"
                    style={{
                      filter: 'drop-shadow(0 0 8px rgba(249, 115, 22, 0.4))',
                      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite, flicker 3s ease-in-out infinite'
                    }}
                  />
                </div>
              </div>
              {streakInfo.longestStreak > 0 && (
                <p className="text-xs text-gray-500 mt-2">Best: {streakInfo.longestStreak} days</p>
              )}
            </CardContent>
          </Card>
          <style>{`
            @keyframes flicker {
              0%, 100% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.8; transform: scale(1.05); }
            }
          `}</style>

          {/* Weekly Study Goal */}
          <Card className="bg-white border-0 shadow-[0_2px_8px_rgba(0,0,0,0.08)] rounded-xl sm:rounded-2xl overflow-hidden">
            <CardContent className="p-4 sm:p-5 md:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <p className="text-xs sm:text-sm text-gray-600 font-medium">Weekly Study Goal</p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 text-xs"
                  onClick={() => setShowGoalDialog(true)}
                >
                  Edit
                </Button>
              </div>
              <div className="flex items-baseline gap-1 sm:gap-2">
                <h3 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.75rem] font-bold text-gray-900 leading-none tracking-tight">
                  {Math.round(streakInfo.currentWeekHours)}/{streakInfo.weeklyGoalHours}
                </h3>
                <span className="text-base sm:text-lg md:text-xl text-gray-500 font-normal pb-1 sm:pb-2">Hours</span>
              </div>
              <div className="mt-2 sm:mt-3">
                <Progress value={streakInfo.weeklyProgress} className="h-1.5 sm:h-2" />
                <p className="text-xs text-gray-500 mt-1">{streakInfo.weeklyProgress}% complete</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-4 sm:gap-5 md:gap-6">
          {/* My Courses Section */}
          <div className="space-y-3 sm:space-y-4 md:space-y-5">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-luxury">My Classes</h2>

            {enrollments.length === 0 ? (
              <Card className="border-0 shadow-[0_2px_8px_rgba(0,0,0,0.08)] rounded-xl sm:rounded-2xl">
                <CardContent className="pt-4 sm:pt-6">
                  <div className="text-center py-8 sm:py-12">
                    <BookOpen className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
                    <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 px-4">
                      No courses enrolled yet. Browse available courses to get started!
                    </p>
                    <Button onClick={() => setLocation('/student/courses')}>
                      Browse Courses
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-5">
                {enrollments.slice(0, 4).map((enrollment) => {
                  if (!enrollment.course) return null;
                  const Icon = getIconForCourse(enrollment.course.title);
                  const progress = courseProgress[enrollment.courseId] || 0;
                  
                  const isMath = enrollment.course.title?.toLowerCase().includes('math') || 
                                 enrollment.course.title?.toLowerCase().includes('algebra');
                  const isWriting = enrollment.course.title.toLowerCase().includes('writing') || 
                                   enrollment.course.title.toLowerCase().includes('creative');
                  
                  return (
                    <Link key={enrollment.courseId} href={`/student/courses/${enrollment.courseId}`}>
                      <Card className="border-0 shadow-[0_2px_8px_rgba(0,0,0,0.08)] rounded-2xl overflow-hidden hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-all duration-300 cursor-pointer group h-full">
                        <CardContent className="p-0">
                          {/* Course Cover */}
                          <div className={`h-[180px] relative overflow-hidden ${
                            enrollment.course.imageUrl ? '' :
                            isMath ? 'bg-[#DCC9A3]' :
                            isWriting ? 'bg-[#B8D4C4]' :
                            'bg-gradient-to-br from-blue-200 to-blue-300'
                          }`}>
                            {enrollment.course.imageUrl ? (
                              <img 
                                src={enrollment.course.imageUrl.startsWith('http') ? enrollment.course.imageUrl : `/uploads/${enrollment.course.imageUrl}`}
                                alt={enrollment.course.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="relative w-24 h-24 bg-white/40 rounded-lg flex items-center justify-center backdrop-blur-sm">
                                  {isMath ? (
                                    <div className="grid grid-cols-3 gap-1 w-16 h-16">
                                      {Array.from({ length: 9 }).map((_, i) => (
                                        <div key={i} className="bg-white/60 rounded-sm" />
                                      ))}
                                    </div>
                                  ) : isWriting ? (
                                    <div className="w-16 h-12 bg-white/60 rounded-lg relative">
                                      <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-12 h-8 bg-white/40 rounded" />
                                      </div>
                                    </div>
                                  ) : (
                                    <Icon className="h-16 w-16 text-white/60" />
                                  )}
                                </div>
                              </div>
                            )}
                            <div className="absolute top-5 left-5">
                              <p className="text-white/90 text-2xl font-handwriting italic tracking-wide drop-shadow-md">Class</p>
                            </div>
                          </div>

                          {/* Course Info */}
                          <div className="p-5">
                            <h3 className="font-bold text-gray-900 text-lg mb-3 group-hover:text-blue-600 transition-colors leading-tight">
                              {enrollment.course.title}
                            </h3>
                            
                            {/* Progress Bar */}
                            <div className="mb-3">
                              <div className="flex justify-between text-xs text-gray-500 mb-1.5 font-medium">
                                <span>{progress}% complete</span>
                              </div>
                              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all duration-700 ${
                                    isMath ? 'bg-[#D4AF37]' : 
                                    isWriting ? 'bg-[#D4AF37]' : 
                                    'bg-[#D4AF37]'
                                  }`}
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>

                            {/* Continue Button */}
                            <Button 
                              className="w-full bg-[#EAB308] hover:bg-[#D4A004] text-gray-900 font-semibold rounded-lg h-10 shadow-sm border-0"
                              size="sm"
                            >
                              Continue
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upcoming Tasks Sidebar */}
          <div className="space-y-3 sm:space-y-4 md:space-y-5">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-luxury">Upcoming Tasks</h2>

            <Card className="border-0 shadow-[0_2px_8px_rgba(0,0,0,0.08)] rounded-xl sm:rounded-2xl overflow-hidden">
              <CardContent className="p-4 sm:p-5">
                {assignments.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <Clock className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                    <p className="text-xs sm:text-sm text-gray-600">No upcoming tasks</p>
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-2.5">
                    {assignments.map((assignment) => {
                      const Icon = getTaskIcon(assignment.title);
                      const isCompleted = assignment.status === 'graded' || assignment.status === 'submitted';
                      const isGraded = assignment.status === 'graded';
                      
                      // Determine colors based on assignment type
                      let bg = 'bg-[#DBEAFE]';
                      let iconColor = 'text-[#2563EB]';
                      
                      if (assignment.title.toLowerCase().includes('lab')) {
                        bg = 'bg-[#FEE2E2]';
                        iconColor = 'text-[#DC2626]';
                      } else if (assignment.title.toLowerCase().includes('essay') || assignment.title.toLowerCase().includes('writing')) {
                        bg = 'bg-[#E9D5FF]';
                        iconColor = 'text-[#9333EA]';
                      } else if (assignment.title.toLowerCase().includes('quiz') || assignment.title.toLowerCase().includes('test')) {
                        bg = 'bg-[#FEF3C7]';
                        iconColor = 'text-[#D97706]';
                      }
                      
                      if (isCompleted) {
                        bg = 'bg-[#D1FAE5]';
                        iconColor = 'text-[#059669]';
                      }
                      
                      return (
                        <div 
                          key={assignment.id}
                          className={`flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group ${
                            isCompleted ? 'opacity-75' : ''
                          }`}
                        >
                          <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                            <Icon className={`h-5 w-5 ${iconColor}`} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className={`font-semibold text-sm mb-0.5 leading-tight ${
                              isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'
                            }`}>
                              {assignment.title}
                            </h4>
                            <p className={`text-xs font-medium ${
                              isCompleted ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              {isGraded ? 'Graded' : isCompleted ? 'Submitted' : formatDueDate(assignment.dueDate)}
                            </p>
                          </div>

                          {isGraded ? (
                            <CheckCircle2 className="h-5 w-5 text-[#10B981] flex-shrink-0" />
                          ) : isCompleted ? (
                            <Circle className="h-5 w-5 text-[#10B981] fill-[#10B981] flex-shrink-0" />
                          ) : (
                            assignment.priority === 'high' && (
                              <div className="w-2.5 h-2.5 bg-[#EF4444] rounded-full flex-shrink-0" />
                            )
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Weekly Goal Dialog */}
      <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Set Your Weekly Study Goal</DialogTitle>
            <DialogDescription>
              How many hours do you want to study this week? Setting a goal helps you stay motivated!
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="goal" className="text-right">
                Hours
              </Label>
              <Input
                id="goal"
                type="number"
                min="1"
                max="168"
                value={weeklyGoal}
                onChange={(e) => setWeeklyGoal(parseInt(e.target.value) || 10)}
                className="col-span-3"
              />
            </div>
            <div className="text-sm text-gray-500 px-1">
              💡 Tip: Start with a realistic goal like 5-15 hours per week
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGoalDialog(false)}>
              Skip
            </Button>
            <Button onClick={handleUpdateGoal}>
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
