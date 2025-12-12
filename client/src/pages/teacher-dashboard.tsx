import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { 
  BookOpen, Clock, Users, Sparkles, FileText, Calendar,
  Loader2, CheckCircle2, Circle, Megaphone, TrendingUp,
  MessageSquare, UserPlus, BarChart3, Bell, Video, Download,
  ChevronLeft, ChevronRight, GraduationCap
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import VersaFloatingChat from "@/components/VersaFloatingChat";
import { apiEndpoint } from "@/lib/config";

interface Course {
  id: string;
  title: string;
  description: string;
  teacherId: string;
  status: string;
}

interface Assignment {
  id: string;
  title: string;
  dueDate: string;
  courseId: string;
  courseName?: string;
  submissionsCount?: number;
  totalStudents?: number;
}

export default function TeacherDashboard() {
  const { user, getAuthHeaders, token, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    pendingGrading: 0,
    activeStudents: 0,
  });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() &&
           currentDate.getMonth() === today.getMonth() &&
           currentDate.getFullYear() === today.getFullYear();
  };

  const hasAssignment = (day: number) => {
    return assignments.some(assignment => {
      const dueDate = new Date(assignment.dueDate);
      return day === dueDate.getDate() &&
             currentDate.getMonth() === dueDate.getMonth() &&
             currentDate.getFullYear() === dueDate.getFullYear();
    });
  };

  useEffect(() => {
    if (token && isAuthenticated) {
      fetchDashboardData();
    }
  }, [token, isAuthenticated]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const authHeaders = getAuthHeaders();

      // Fetch teacher's OWN courses only (using /user endpoint for teacher's courses)
      const coursesRes = await fetch(apiEndpoint("/api/courses/user"), {
        headers: authHeaders,
      });

      if (!coursesRes.ok) {
        throw new Error("Failed to fetch courses");
      }

      const coursesData = await coursesRes.json();
      const allCourses = Array.isArray(coursesData) ? coursesData : [];
      setCourses(allCourses);

      // Fetch assignments and calculate stats
      const allAssignments: Assignment[] = [];
      const uniqueStudentIds = new Set<string>();
      let pendingGrading = 0;

      for (const course of allCourses) {
        // Fetch enrollments to count students
        try {
          const enrollmentsRes = await fetch(
            apiEndpoint(`/api/enrollments/course/${course.id}`),
            { headers: authHeaders }
          );
          if (enrollmentsRes.ok) {
            const enrollmentData = await enrollmentsRes.json();
            if (Array.isArray(enrollmentData)) {
              enrollmentData.forEach((e: any) => {
                if (e.studentId) uniqueStudentIds.add(e.studentId);
              });
            }
          }
        } catch (error) {
          // Silently handle enrollment fetch errors
        }

        try {
          const assignmentsRes = await fetch(
            apiEndpoint(`/api/assignments/courses/${course.id}/assignments`),
            { headers: authHeaders }
          );
          
          if (assignmentsRes.ok) {
            const data = await assignmentsRes.json();
            const courseAssignments = Array.isArray(data) ? data : [];
            
            for (const assignment of courseAssignments) {
              try {
                const submissionsRes = await fetch(
                  apiEndpoint(`/api/assignments/${assignment.id}/submissions`),
                  { headers: authHeaders }
                );
                
                if (submissionsRes.ok) {
                  const submissionData = await submissionsRes.json();
                  const submissions = Array.isArray(submissionData) ? submissionData : 
                                     (submissionData.submissions ? submissionData.submissions : []);
                  const ungradedCount = submissions.filter((s: any) => !s.grade).length;
                  pendingGrading += ungradedCount;
                  
                  allAssignments.push({
                    id: assignment.id,
                    title: assignment.title,
                    dueDate: assignment.dueDate,
                    courseId: course.id,
                    courseName: course.title,
                    submissionsCount: submissions.length,
                    totalStudents: submissions.length,
                  });
                }
              } catch (error) {
                // Silently handle submission fetch errors
              }
            }
          }
        } catch (error) {
          // Silently handle assignment fetch errors
        }
      }

      allAssignments.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
      setAssignments(allAssignments.slice(0, 5));

      const totalStudents = uniqueStudentIds.size;
      setStats({
        totalCourses: allCourses.length,
        totalStudents: totalStudents,
        pendingGrading: pendingGrading,
        activeStudents: totalStudents,
      });

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

  const getIconForCourse = (title: string) => {
    const lower = title.toLowerCase();
    if (lower.includes('math') || lower.includes('algebra') || lower.includes('calculus')) {
      return '📐';
    }
    if (lower.includes('science') || lower.includes('chemistry') || lower.includes('physics')) {
      return '🧪';
    }
    if (lower.includes('writing') || lower.includes('english') || lower.includes('literature')) {
      return '✍️';
    }
    if (lower.includes('history')) {
      return '📜';
    }
    return '📚';
  };

  const formatDueDate = (dueDate: string) => {
    const date = new Date(dueDate);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Due: Today';
    if (diffDays === 1) return 'Due: Tomorrow';
    if (diffDays < 7) return `Due: In ${diffDays} days`;
    return 'Due: ' + date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-10 px-2 relative">
        {/* Elegant Background Pattern */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-blue-50"></div>
          <div className="absolute top-0 left-0 w-full h-full opacity-30">
            <div className="absolute top-10 left-10 w-96 h-96 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl animate-float"></div>
            <div className="absolute top-40 right-20 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
            <div className="absolute bottom-20 left-1/3 w-96 h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
          </div>
          <div className="absolute inset-0 bg-white/40 backdrop-blur-3xl"></div>
        </div>

        {/* Enhanced Welcome Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl p-8 shadow-xl">
          <div className="absolute inset-0 bg-black/5"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-20 -translate-y-20"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl transform -translate-x-16 translate-y-10"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <span className="text-3xl">👋</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white leading-tight tracking-tight">
                  Welcome back, {user?.fullName?.split(' ')[0]}!
                </h1>
                <p className="text-white/80 font-medium">
                  Inspiring minds and shaping futures, one lesson at a time.
                </p>
              </div>
            </div>
            
            {/* Action Buttons in Header */}
            <div className="flex flex-wrap gap-3 mt-6">
              <Button 
                className="gap-2 bg-white text-emerald-700 hover:bg-white/90 font-semibold rounded-xl px-6 py-3 h-auto shadow-lg border-0"
                onClick={() => setLocation('/teacher/courses/create')}
              >
                <BookOpen className="h-5 w-5" />
                <span>Create Class</span>
              </Button>
              <Button 
                className="gap-2 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-xl px-6 py-3 h-auto shadow-lg border-0 backdrop-blur-sm"
                onClick={() => setLocation('/teacher/assignments')}
              >
                <FileText className="h-5 w-5" />
                <span>Create Assignment</span>
              </Button>
              <Button 
                className="gap-2 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-xl px-6 py-3 h-auto shadow-lg border-0 backdrop-blur-sm"
                onClick={() => setLocation('/teacher/students')}
              >
                <Users className="h-5 w-5" />
                <span>View Students</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards with Modern Design */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Courses */}
          <Card className="group bg-white border-0 shadow-[0_4px_20px_rgba(0,0,0,0.08)] rounded-3xl overflow-hidden hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-1 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-500 mb-2 font-medium uppercase tracking-wide">Your Classes</p>
                  <h3 className="text-5xl font-bold text-gray-900 leading-none tracking-tight mb-1">
                    {stats.totalCourses}
                  </h3>
                  <p className="text-sm text-emerald-600 font-medium flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    Active Courses
                  </p>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <BookOpen className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Grading */}
          <Card className="group bg-white border-0 shadow-[0_4px_20px_rgba(0,0,0,0.08)] rounded-3xl overflow-hidden hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-1 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-500 mb-2 font-medium uppercase tracking-wide">Pending Reviews</p>
                  <h3 className="text-5xl font-bold text-gray-900 leading-none tracking-tight mb-1">
                    {stats.pendingGrading}
                  </h3>
                  <p className="text-sm text-orange-600 font-medium flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    To Grade
                  </p>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <FileText className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Students */}
          <Card className="group bg-white border-0 shadow-[0_4px_20px_rgba(0,0,0,0.08)] rounded-3xl overflow-hidden hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-1 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-500 mb-2 font-medium uppercase tracking-wide">Your Students</p>
                  <h3 className="text-5xl font-bold text-gray-900 leading-none tracking-tight mb-1">
                    {stats.activeStudents}
                  </h3>
                  <p className="text-sm text-blue-600 font-medium flex items-center gap-1">
                    <GraduationCap className="h-4 w-4" />
                    Enrolled
                  </p>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
          {/* My Courses Section */}
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 font-luxury">My Classes</h2>
              <Button 
                variant="ghost" 
                className="text-sm text-gray-600 hover:text-gray-900"
                onClick={() => setLocation('/teacher/courses')}
              >
                View All →
              </Button>
            </div>

            {courses.length === 0 ? (
              <Card className="border-0 shadow-[0_2px_8px_rgba(0,0,0,0.08)] rounded-2xl">
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">
                      No courses yet. Create your first course to get started!
                    </p>
                    <Button onClick={() => setLocation('/teacher/courses/create')}>
                      Create Class
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {courses.slice(0, 4).map((course) => {
                  const emoji = getIconForCourse(course.title);
                  
                  return (
                    <Link key={course.id} href={`/teacher/courses/${course.id}`}>
                      <Card className="border-0 shadow-[0_2px_8px_rgba(0,0,0,0.08)] rounded-2xl overflow-hidden hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-all duration-300 cursor-pointer group h-full">
                        <CardContent className="p-0">
                          {/* Course Cover */}
                          <div className="h-[180px] relative overflow-hidden bg-gradient-to-br from-green-200 to-teal-300">
                            {course.imageUrl && course.imageUrl.length > 0 ? (
                              <img 
                                src={course.imageUrl.startsWith('http') ? course.imageUrl : `/uploads/${course.imageUrl}`}
                                alt={course.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-7xl opacity-80">
                                  {emoji}
                                </div>
                              </div>
                            )}
                            <div className="absolute top-5 left-5">
                              <p className="text-white/90 text-2xl font-handwriting italic tracking-wide drop-shadow-md">Class</p>
                            </div>
                          </div>

                          {/* Course Info */}
                          <div className="p-5">
                            <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-green-600 transition-colors leading-tight">
                              {course.title}
                            </h3>
                            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                              {course.description || 'No description available'}
                            </p>

                            {/* Manage Button */}
                            <Button 
                              className="w-full bg-[#10B981] hover:bg-[#059669] text-white font-semibold rounded-lg h-10 shadow-sm border-0"
                              size="sm"
                            >
                              Manage Course
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

          {/* Recent Assignments Sidebar */}
          <div className="space-y-5">
            {/* Calendar Widget */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 font-luxury mb-4">Calendar</h2>
              <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
                <CardContent className="p-5">
                  {/* Calendar Header */}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg">
                      {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h3>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => navigateMonth('prev')}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => navigateMonth('next')}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                      <div key={day} className="text-center text-xs font-semibold text-gray-500 py-2">
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: getFirstDayOfMonth(currentDate) }).map((_, index) => (
                      <div key={`empty-${index}`} className="aspect-square" />
                    ))}
                    {Array.from({ length: getDaysInMonth(currentDate) }).map((_, index) => {
                      const day = index + 1;
                      const today = isToday(day);
                      const hasEvent = hasAssignment(day);
                      
                      return (
                        <button
                          key={day}
                          onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                          className={`
                            aspect-square rounded-lg text-sm font-medium transition-all
                            ${today 
                              ? 'bg-green-600 text-white hover:bg-green-700' 
                              : hasEvent
                              ? 'bg-blue-100 text-blue-900 hover:bg-blue-200'
                              : 'text-gray-700 hover:bg-gray-100'
                            }
                            ${selectedDate?.getDate() === day && !today ? 'ring-2 ring-green-500' : ''}
                          `}
                        >
                          {day}
                          {hasEvent && !today && (
                            <div className="w-1 h-1 bg-blue-600 rounded-full mx-auto mt-0.5" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Today's Events */}
                  {assignments.filter(a => {
                    const dueDate = new Date(a.dueDate);
                    const today = new Date();
                    return dueDate.toDateString() === today.toDateString();
                  }).length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Today's Deadlines:</p>
                      <div className="space-y-2">
                        {assignments.filter(a => {
                          const dueDate = new Date(a.dueDate);
                          const today = new Date();
                          return dueDate.toDateString() === today.toDateString();
                        }).map(assignment => (
                          <div key={assignment.id} className="text-xs flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                            <span className="flex-1 font-medium text-gray-900">{assignment.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 font-luxury">Recent Assignments</h2>

            <Card className="border-0 shadow-[0_2px_8px_rgba(0,0,0,0.08)] rounded-2xl overflow-hidden">
              <CardContent className="p-5">
                {assignments.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm text-gray-600">No assignments yet</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {assignments.map((assignment) => {
                      const submissionRate = assignment.totalStudents 
                        ? Math.round((assignment.submissionsCount || 0) / assignment.totalStudents * 100)
                        : 0;
                      
                      return (
                        <div 
                          key={assignment.id}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group"
                          onClick={() => setLocation(`/teacher/assignments/${assignment.id}`)}
                        >
                          <div className="w-12 h-12 rounded-xl bg-[#DBEAFE] flex items-center justify-center flex-shrink-0">
                            <FileText className="h-5 w-5 text-[#2563EB]" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm mb-0.5 leading-tight text-gray-900">
                              {assignment.title}
                            </h4>
                            <p className="text-xs text-gray-600 mb-1">
                              {assignment.courseName}
                            </p>
                            <div className="flex items-center gap-2">
                              <Progress value={submissionRate} className="h-1 flex-1" />
                              <span className="text-xs text-gray-500 font-medium">
                                {assignment.submissionsCount || 0}/{assignment.totalStudents || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="border-0 shadow-[0_2px_8px_rgba(0,0,0,0.08)] rounded-2xl overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-luxury">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-12 bg-white hover:bg-gray-50"
                  onClick={() => setLocation('/teacher/students')}
                >
                  <Users className="h-5 w-5 text-blue-600" />
                  <span>Manage Students</span>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-12 bg-white hover:bg-gray-50"
                  onClick={() => setLocation('/teacher/calendar')}
                >
                  <Calendar className="h-5 w-5 text-green-600" />
                  <span>View Calendar</span>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-12 bg-white hover:bg-gray-50"
                  onClick={() => setLocation('/teacher/messages')}
                >
                  <MessageSquare className="h-5 w-5 text-purple-600" />
                  <span>Messages</span>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <VersaFloatingChat />
    </DashboardLayout>
  );
}
