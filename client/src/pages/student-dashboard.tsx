import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { 
  BookOpen, Clock, Search, Bell, Settings, LogOut, Menu,
  ChevronRight, Flame, TrendingUp, MoreHorizontal,
  Calculator, Palette, Book, FileText, Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  imageUrl?: string;
  code?: string;
}

interface Enrollment {
  courseId: string;
  course: Course;
}

interface Assignment {
  id: string;
  title: string;
  dueDate: string;
  courseId: string;
  courseName?: string;
  status?: 'pending' | 'submitted' | 'graded';
  type?: string;
}

interface Grade {
  id: string;
  assignmentTitle: string;
  courseName: string;
  score: number;
  maxScore: number;
  letterGrade: string;
  gradedAt: string;
  change?: number;
}

interface ScheduleEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  location?: string;
  instructor?: string;
  type: string;
}

export default function StudentDashboard() {
  const { user, token, isLoading: authLoading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [recentGrades, setRecentGrades] = useState<Grade[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [courseProgress, setCourseProgress] = useState<Record<string, number>>({});
  const [courseGrades, setCourseGrades] = useState<Record<string, string>>({});
  const [streakInfo, setStreakInfo] = useState({
    currentStreak: 0,
    longestStreak: 0,
    weeklyGoalHours: 30,
    currentWeekHours: 24,
    weeklyProgress: 80,
  });
  const [overallProgress, setOverallProgress] = useState({
    progressPercentage: 75,
    totalCredits: 120,
    earnedCredits: 90,
  });

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

      // Fetch enrolled courses
      const enrollmentsRes = await fetch(apiEndpoint("/api/enrollments/student"), {
        headers: authHeaders,
        credentials: "include",
      });

      if (enrollmentsRes.ok) {
        const enrollmentsData = await enrollmentsRes.json();
        const enrollmentsList = Array.isArray(enrollmentsData) ? enrollmentsData : [];
        setEnrollments(enrollmentsList.map((e: any) => ({
          courseId: e.courseId,
          course: {
            ...e.course,
            code: e.course?.title?.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 3) + ' ' + Math.floor(100 + Math.random() * 200)
          }
        })));

        // Fetch progress for each course
        const progress: Record<string, number> = {};
        const grades: Record<string, string> = {};
        
        for (const e of enrollmentsList) {
          try {
            const progressRes = await fetch(apiEndpoint(`/api/progress/course/${e.courseId}`), {
              headers: authHeaders,
              credentials: "include",
            });
            if (progressRes.ok) {
              const data = await progressRes.json();
              progress[e.courseId] = data.progressPercentage || 0;
              // Calculate letter grade based on progress
              const pct = data.progressPercentage || 0;
              grades[e.courseId] = pct >= 90 ? 'A' : pct >= 80 ? 'B+' : pct >= 70 ? 'B' : pct >= 60 ? 'C+' : 'C';
            }
          } catch (err) {
            console.error('Failed to fetch progress for course:', e.courseId);
          }
        }
        setCourseProgress(progress);
        setCourseGrades(grades);

        // Fetch assignments for enrolled courses
        const allAssignments: Assignment[] = [];
        for (const e of enrollmentsList) {
          try {
            const assignmentsRes = await fetch(
              apiEndpoint(`/api/assignments/courses/${e.courseId}/assignments`),
              { headers: authHeaders, credentials: "include" }
            );
            if (assignmentsRes.ok) {
              const data = await assignmentsRes.json();
              const courseAssignments = Array.isArray(data) ? data : [];
              
              for (const assignment of courseAssignments) {
                // Check submission status
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
                    courseId: e.courseId,
                    courseName: e.course?.title,
                    status: status,
                    type: assignment.type
                  });
                } catch (err) {
                  allAssignments.push({
                    id: assignment.id,
                    title: assignment.title,
                    dueDate: assignment.dueDate,
                    courseId: e.courseId,
                    courseName: e.course?.title,
                    status: 'pending',
                    type: assignment.type
                  });
                }
              }
            }
          } catch (err) {
            console.error('Failed to fetch assignments for course:', e.courseId);
          }
        }
        
        // Sort by due date and filter pending only
        allAssignments.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
        setAssignments(allAssignments.filter(a => a.status === 'pending').slice(0, 5));
      }

      // Fetch streak info
      try {
        const streakRes = await fetch(apiEndpoint('/api/streaks/me'), {
          headers: authHeaders,
          credentials: "include",
        });
        if (streakRes.ok) {
          const streakData = await streakRes.json();
          setStreakInfo({
            currentStreak: streakData.currentStreak || 0,
            longestStreak: streakData.longestStreak || 0,
            weeklyGoalHours: streakData.weeklyGoalHours || 30,
            currentWeekHours: streakData.currentWeekHours || 0,
            weeklyProgress: streakData.weeklyProgress || 0,
          });
        }
      } catch (err) {
        console.error('Failed to fetch streak info');
      }

      // Fetch overall progress
      try {
        const progressRes = await fetch(apiEndpoint('/api/progress/overall'), {
          headers: authHeaders,
          credentials: "include",
        });
        if (progressRes.ok) {
          const data = await progressRes.json();
          setOverallProgress({
            progressPercentage: data.progressPercentage || 0,
            totalCredits: 120,
            earnedCredits: Math.round((data.progressPercentage || 0) * 1.2),
          });
        }
      } catch (err) {
        console.error('Failed to fetch overall progress');
      }

      // Fetch recent grades
      try {
        const gradesRes = await fetch(apiEndpoint('/api/grades/my-grades'), {
          headers: authHeaders,
          credentials: "include",
        });
        if (gradesRes.ok) {
          const gradesData = await gradesRes.json();
          const grades = (gradesData.grades || []).slice(0, 3).map((g: any) => {
            const pct = (g.score / g.maxScore) * 100;
            return {
              id: g.id,
              assignmentTitle: g.assignmentTitle,
              courseName: g.courseName,
              score: g.score,
              maxScore: g.maxScore,
              letterGrade: pct >= 90 ? 'A' : pct >= 80 ? 'B' : pct >= 70 ? 'C' : 'D',
              gradedAt: g.gradedAt,
              change: Math.random() > 0.5 ? Math.floor(Math.random() * 5) + 1 : 0
            };
          });
          setRecentGrades(grades);
        }
      } catch (err) {
        console.error('Failed to fetch grades');
      }

      // Fetch schedule/events for today
      try {
        const today = new Date().toISOString().split('T')[0];
        const scheduleRes = await fetch(apiEndpoint(`/api/schedule/events?date=${today}`), {
          headers: authHeaders,
          credentials: "include",
        });
        if (scheduleRes.ok) {
          const data = await scheduleRes.json();
          setSchedule((data.events || []).slice(0, 3).map((e: any) => ({
            id: e.id,
            title: e.title,
            startTime: e.startTime,
            endTime: e.endTime,
            location: e.location || 'TBD',
            instructor: e.instructor || 'TBD',
            type: e.type || 'class'
          })));
        }
      } catch (err) {
        console.error('Failed to fetch schedule');
      }

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

  const formatDueDate = (dueDate: string) => {
    const date = new Date(dueDate);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) {
      return { text: `Due Today, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`, urgent: true };
    }
    if (diffDays === 1) return { text: 'Due Tomorrow', urgent: false };
    return { text: `Due in ${diffDays} days`, urgent: false };
  };

  const getAssignmentIcon = (title: string, type?: string) => {
    const lower = title.toLowerCase();
    if (lower.includes('reading') || lower.includes('chapter')) return { icon: Book, color: 'text-amber-400' };
    if (lower.includes('problem') || lower.includes('math') || lower.includes('calc')) return { icon: Calculator, color: 'text-blue-400' };
    if (lower.includes('essay') || lower.includes('art') || lower.includes('renaissance')) return { icon: Palette, color: 'text-purple-400' };
    return { icon: FileText, color: 'text-slate-400' };
  };

  const getActionLabel = (assignment: Assignment) => {
    const now = new Date();
    const due = new Date(assignment.dueDate);
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return 'Submit';
    if (diffDays <= 1) return 'Start';
    return 'Draft';
  };

  const navItems = [
    { icon: 'dashboard', label: 'Dashboard', href: '/student', active: true },
    { icon: 'book_2', label: 'Classes', href: '/student/courses' },
    { icon: 'chat_bubble', label: 'Messages', href: '/student/messages', badge: 3 },
    { icon: 'assignment', label: 'Assignments', href: '/student/assignments' },
    { icon: 'calendar_month', label: 'Calendar', href: '/student/calendar' },
    { icon: 'bar_chart', label: 'Report Cards', href: '/student/grades' },
  ];

  const pendingAssignmentsCount = assignments.filter(a => a.status === 'pending').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-slate-700 rounded-full animate-spin border-t-amber-400" />
          <p className="text-slate-400 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-900 text-white font-sans">
      {/* Sidebar */}
      <aside className={`
        fixed lg:relative inset-y-0 left-0 z-50 flex flex-col w-72 h-full 
        border-r border-slate-700 bg-slate-900 flex-shrink-0
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6">
          {/* Logo */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <BookOpen className="h-6 w-6 text-slate-900" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold leading-tight tracking-tight">Student LMS</h1>
              <p className="text-slate-400 text-xs font-normal">Spring Semester</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <a className={`
                  flex items-center gap-3 px-4 py-3 rounded-full transition-colors
                  ${item.active 
                    ? 'bg-white text-slate-900 shadow-md shadow-white/5' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                `}>
                  <span className="material-symbols-outlined">{item.icon}</span>
                  <span className={`text-sm ${item.active ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto bg-amber-400 text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </a>
              </Link>
            ))}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="mt-auto p-6 border-t border-slate-700">
          <Link href="/student/settings">
            <a className="flex items-center gap-3 px-4 py-2 rounded-full text-slate-400 hover:text-white transition-colors">
              <Settings className="h-5 w-5" />
              <span className="text-sm font-medium">Settings</span>
            </a>
          </Link>
          <button 
            onClick={() => logout()}
            className="flex items-center gap-3 px-4 py-2 rounded-full text-slate-400 hover:text-white transition-colors w-full"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-sm font-medium">Log out</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header */}
        <header className="flex items-center justify-between px-4 md:px-8 py-5 border-b border-slate-700 bg-slate-900 z-10">
          {/* Mobile menu button */}
          <button 
            className="lg:hidden p-2 rounded-lg hover:bg-slate-800 text-slate-400"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Search */}
          <div className="flex-1 max-w-lg mx-4">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400 group-focus-within:text-white" />
              </div>
              <Input 
                className="w-full pl-12 pr-4 py-3 bg-slate-800 border-none rounded-full text-sm text-white placeholder-slate-400 focus:ring-2 focus:ring-white focus:bg-slate-700 transition-all shadow-inner"
                placeholder="Search for classes, assignments, or teachers..."
              />
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4 md:gap-6">
            <button className="relative p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-amber-400 rounded-full border-2 border-slate-900"></span>
            </button>

            <div className="flex items-center gap-3 pl-4 md:pl-6 border-l border-slate-700">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-white">{user?.fullName || 'Student'}</p>
                <p className="text-xs text-slate-400">{user?.department || 'Computer Science'}</p>
              </div>
              <Avatar className="h-10 w-10 border-2 border-slate-700">
                <AvatarImage src={user?.profilePicture ? assetUrl(user.profilePicture) : undefined} />
                <AvatarFallback className="bg-slate-700 text-white">
                  {user?.fullName?.split(' ').map(n => n[0]).join('') || 'S'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-900">
          <div className="max-w-[1200px] mx-auto flex flex-col gap-8">
            
            {/* Hero Banner */}
            <div className="rounded-xl overflow-hidden relative min-h-[200px] md:min-h-[240px] flex items-end shadow-xl group">
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{
                  backgroundImage: 'linear-gradient(135deg, #0f4c3a 0%, #1a3a2a 50%, #0d3d2d 100%)'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent"></div>
              
              <div className="relative z-10 p-6 md:p-8 w-full flex flex-col md:flex-row items-end justify-between gap-4 md:gap-6">
                <div className="max-w-2xl">
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2">
                    Welcome back, {user?.fullName?.split(' ')[0] || 'Student'}!
                  </h2>
                  <p className="text-slate-400 text-base md:text-lg">
                    You have <span className="text-amber-400 font-bold">{pendingAssignmentsCount} assignments</span> due soon. Keep up the momentum!
                  </p>
                </div>
                <Button 
                  onClick={() => setLocation('/student/assignments')}
                  className="bg-white hover:bg-gray-100 text-slate-900 px-6 py-3 rounded-full font-bold text-sm transition-transform hover:scale-105 active:scale-95 flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                >
                  <span>View Assignments</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column - 2/3 */}
              <div className="lg:col-span-2 flex flex-col gap-8">
                
                {/* My Classes Section */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">My Classes</h3>
                    <button 
                      onClick={() => setLocation('/student/courses')}
                      className="text-sm text-amber-400 font-medium hover:text-white transition-colors hover:underline"
                    >
                      View All
                    </button>
                  </div>

                  {enrollments.length === 0 ? (
                    <div className="bg-slate-800 p-8 rounded-xl text-center">
                      <BookOpen className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400">No courses enrolled yet.</p>
                      <Button 
                        onClick={() => setLocation('/student/courses')}
                        className="mt-4 bg-amber-400 hover:bg-amber-500 text-slate-900"
                      >
                        Browse Courses
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {enrollments.slice(0, 3).map((enrollment) => {
                        const progress = courseProgress[enrollment.courseId] || 0;
                        const grade = courseGrades[enrollment.courseId] || 'N/A';
                        
                        return (
                          <Link key={enrollment.courseId} href={`/student/courses/${enrollment.courseId}`}>
                            <div className="bg-slate-800 p-4 rounded-xl hover:bg-slate-700 transition-colors group cursor-pointer border border-transparent hover:border-slate-600 shadow-lg shadow-black/20">
                              <div 
                                className="h-32 rounded-lg bg-cover bg-center mb-4 relative overflow-hidden"
                                style={{
                                  backgroundImage: enrollment.course.imageUrl 
                                    ? `url(${enrollment.course.imageUrl.startsWith('http') ? enrollment.course.imageUrl : assetUrl(enrollment.course.imageUrl)})`
                                    : 'linear-gradient(135deg, #334155 0%, #1e293b 100%)'
                                }}
                              >
                                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold text-white">
                                  {enrollment.course.code || 'CRS'}
                                </div>
                              </div>
                              <h4 className="font-bold text-white mb-1 group-hover:text-amber-400 transition-colors truncate">
                                {enrollment.course.title}
                              </h4>
                              <div className="flex justify-between items-center text-xs text-slate-400 mb-3">
                                <span>{progress}% Complete</span>
                                <span>{grade}</span>
                              </div>
                              <div className="w-full bg-slate-700 rounded-full h-1.5">
                                <div 
                                  className="bg-amber-400 h-1.5 rounded-full transition-all duration-500"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </section>

                {/* Upcoming Due Dates */}
                <section>
                  <h3 className="text-xl font-bold text-white mb-4">Upcoming Due Dates</h3>
                  
                  {assignments.length === 0 ? (
                    <div className="bg-slate-800 p-8 rounded-xl text-center">
                      <Clock className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400">No upcoming assignments.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {assignments.map((assignment) => {
                        const { icon: Icon, color } = getAssignmentIcon(assignment.title, assignment.type);
                        const dueInfo = formatDueDate(assignment.dueDate);
                        
                        return (
                          <div 
                            key={assignment.id}
                            className="bg-slate-800 p-4 rounded-xl flex items-center justify-between hover:bg-slate-700 transition-colors border border-transparent hover:border-slate-600 shadow-sm"
                          >
                            <div className="flex items-center gap-4">
                              <div className="bg-slate-700 p-3 rounded-xl">
                                <Icon className={`h-5 w-5 ${color}`} />
                              </div>
                              <div>
                                <h4 className="text-base font-bold text-white">{assignment.title}</h4>
                                <p className="text-sm text-slate-400">
                                  {assignment.courseName} • <span className={dueInfo.urgent ? 'text-red-400 font-medium' : 'text-slate-400'}>{dueInfo.text}</span>
                                </p>
                              </div>
                            </div>
                            <Button 
                              onClick={() => setLocation(`/student/assignments/${assignment.id}`)}
                              className="px-5 py-2 bg-slate-700 hover:bg-white hover:text-slate-900 text-white text-sm font-bold rounded-full transition-colors"
                            >
                              {getActionLabel(assignment)}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              </div>

              {/* Right Column - Performance Insights */}
              <div className="flex flex-col gap-8">
                
                {/* Performance Insights */}
                <section>
                  <h3 className="text-xl font-bold text-white mb-4">Performance Insights</h3>
                  
                  <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg shadow-black/20 flex flex-col gap-6">
                    
                    {/* Weekly Study Time */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-bold text-white">Weekly Study Time</h4>
                        <p className="text-sm text-slate-400">{Math.round(streakInfo.currentWeekHours)}h / {streakInfo.weeklyGoalHours}h</p>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2 mb-2">
                        <div 
                          className="bg-amber-400 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(streakInfo.weeklyProgress, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Mon</span>
                        <span>Tue</span>
                        <span>Wed</span>
                        <span>Thu</span>
                        <span>Fri</span>
                        <span>Sat</span>
                        <span>Sun</span>
                      </div>
                      <div className="w-full h-8 rounded-lg mt-2 overflow-hidden bg-slate-700">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-400/30 via-amber-400/70 to-amber-400"
                          style={{ width: `${Math.min(streakInfo.weeklyProgress, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Major Progress */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-bold text-white">Major Progress</h4>
                        <p className="text-sm text-slate-400">{overallProgress.progressPercentage}% Complete</p>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2 mb-2">
                        <div 
                          className="bg-blue-400 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${overallProgress.progressPercentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-400">
                        Accumulated {overallProgress.earnedCredits} out of {overallProgress.totalCredits} credits
                      </p>
                    </div>

                    {/* Streak */}
                    <div className="bg-gradient-to-br from-amber-400/20 to-amber-400/5 p-4 rounded-xl border border-amber-400/20 flex items-center justify-center text-center shadow-lg shadow-black/20">
                      <div className="flex items-center gap-3">
                        <Flame className="h-10 w-10 text-amber-400" fill="currentColor" />
                        <div>
                          <p className="text-3xl font-bold text-white">{streakInfo.currentStreak}</p>
                          <p className="text-sm text-slate-400">Day Streak!</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Recent Grades */}
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg shadow-black/20">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-white">Recent Grades</h3>
                    <button className="text-slate-400 hover:text-white">
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                  </div>
                  
                  {recentGrades.length === 0 ? (
                    <p className="text-slate-400 text-center py-4">No grades yet.</p>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {recentGrades.map((grade, index) => {
                        const pct = Math.round((grade.score / grade.maxScore) * 100);
                        const bgColor = pct >= 90 ? 'bg-green-500/20' : pct >= 80 ? 'bg-yellow-500/20' : 'bg-blue-500/20';
                        const textColor = pct >= 90 ? 'text-green-400' : pct >= 80 ? 'text-yellow-400' : 'text-blue-400';
                        
                        return (
                          <div 
                            key={grade.id}
                            className={`flex items-center justify-between ${index < recentGrades.length - 1 ? 'pb-4 border-b border-slate-700' : ''}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full ${bgColor} flex items-center justify-center ${textColor} font-bold`}>
                                {grade.letterGrade}
                              </div>
                              <div>
                                <p className="text-white font-medium text-sm">{grade.assignmentTitle}</p>
                                <p className="text-slate-400 text-xs">{grade.courseName}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-white font-bold">{pct}%</p>
                              {grade.change && grade.change > 0 && (
                                <p className="text-amber-400 text-xs flex items-center justify-end">
                                  <TrendingUp className="h-3 w-3 mr-1" /> +{grade.change}%
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Today's Schedule */}
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg shadow-black/20">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-white">Today's Schedule</h3>
                    <div className="text-amber-400 text-sm font-bold bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
                      {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  
                  {schedule.length === 0 ? (
                    <p className="text-slate-400 text-center py-4">No events scheduled for today.</p>
                  ) : (
                    <div className="relative pl-4 border-l-2 border-slate-700 space-y-6">
                      {schedule.map((event, index) => (
                        <div key={event.id} className="relative">
                          <div className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full ${index === 0 ? 'bg-amber-400' : 'bg-slate-700'} ring-4 ring-slate-800`}></div>
                          <p className="text-xs text-slate-400 font-mono mb-1">
                            {new Date(event.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - {new Date(event.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <div className={`${index === 0 ? 'bg-slate-700' : 'border border-slate-700'} p-3 rounded-lg`}>
                            <p className="text-white font-bold text-sm">{event.title}</p>
                            <p className="text-slate-400 text-xs mt-1">{event.location} • {event.instructor}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Versa Chat */}
      <VersaFloatingChat />
    </div>
  );
}
