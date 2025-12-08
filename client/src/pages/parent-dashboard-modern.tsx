import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { apiEndpoint } from "@/lib/config";
import { 
  TrendingUp, Calendar,
  AlertTriangle, CheckCircle2, Clock, BookOpen,
  BarChart3, Users, FileText, Activity, Target,
  Sparkles, ArrowRight, Bell,
  Star, Zap, ChevronRight,
  RefreshCw, AlertCircle
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ChildData {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
  stats: {
    progressPercentage: number;
    currentStreak: number;
    weeklyGoalHours: number;
    currentWeekHours: number;
    courses: number;
    assignments: number;
    totalScore: number;
    totalMaxScore: number;
  };
  recentGrades: Array<{
    course: string;
    grade: string;
    date: string;
  }>;
  upcomingAssignments: Array<{
    id: string;
    title: string;
    course: string;
    dueDate: string;
    status: string;
  }>;
  alerts: Array<{
    type: 'warning' | 'success' | 'info';
    message: string;
  }>;
}

interface DashboardData {
  children: ChildData[];
  summary: {
    totalChildren: number;
    totalCourses: number;
    upcomingAssignments: number;
    averageProgress: number;
  };
  recentActivity: Array<{
    childName: string;
    action: string;
    timestamp: string;
  }>;
}

export default function ParentDashboardModern() {
  const { token } = useAuth();
  const [, setLocation] = useLocation();
  const [data, setData] = useState<DashboardData | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>("0");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const fetchDashboardData = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    
    try {
      setRefreshing(true);
      const response = await fetch(apiEndpoint('/api/parent/dashboard/overview'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const dashboardData = await response.json();
        
        // Normalize data to match student dashboard fields
        // Backend returns progress/streak data, we map to consistent naming
        const normalizedData = {
          children: (dashboardData.children || []).map((child: any) => ({
            ...child,
            stats: {
              progressPercentage: child.stats?.progressPercentage || 0,
              currentStreak: child.stats?.currentStreak || 0,
              weeklyGoalHours: child.stats?.weeklyGoalHours || 10,
              currentWeekHours: child.stats?.currentWeekHours || 0,
              courses: child.stats?.coursesEnrolled || child.stats?.courses || 0,
              assignments: child.stats?.assignmentsDue || child.stats?.assignments || 0,
              totalScore: child.stats?.totalScore || 0,
              totalMaxScore: child.stats?.totalMaxScore || 100
            },
            recentGrades: (child.recentGrades || []).map((g: any) => ({
              course: g.courseName || g.course || 'Unknown',
              grade: g.percentage ? `${g.percentage}%` : g.grade || 'N/A',
              date: g.gradedAt ? new Date(g.gradedAt).toLocaleDateString() : g.date || ''
            })),
            upcomingAssignments: (child.upcomingAssignments || []).map((a: any) => ({
              id: a.id,
              title: a.title,
              course: a.courseName || a.course || 'Unknown',
              dueDate: a.dueDate ? new Date(a.dueDate).toLocaleDateString() : '',
              status: a.status || 'pending'
            })),
            alerts: (child.alerts || []).map((alert: any) => ({
              type: alert.severity === 'warning' ? 'warning' : alert.severity === 'info' ? 'info' : 'success',
              message: alert.message
            }))
          })),
          summary: {
            totalChildren: dashboardData.summary?.totalChildren || 0,
            averageProgress: dashboardData.summary?.averageProgress || dashboardData.children?.reduce((sum: number, c: any) => sum + (c.stats?.progressPercentage || 0), 0) / (dashboardData.children?.length || 1) || 0,
            totalCourses: dashboardData.summary?.totalCourses || dashboardData.children?.reduce((sum: number, c: any) => sum + (c.stats?.coursesEnrolled || 0), 0) || 0,
            upcomingAssignments: dashboardData.summary?.upcomingAssignments || dashboardData.children?.reduce((sum: number, c: any) => sum + (c.stats?.assignmentsDue || 0), 0) || 0
          },
          recentActivity: (dashboardData.recentActivity || []).map((a: any) => ({
            childName: a.childName,
            action: a.message || a.action || '',
            timestamp: a.timestamp ? new Date(a.timestamp).toLocaleDateString() : ''
          }))
        };
        
        setData(normalizedData);
        if (normalizedData.children?.length > 0 && !selectedTab) {
          setSelectedTab("0");
        }
      } else if (response.status === 401) {
        setLocation('/login');
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return 'text-green-600';
    if (progress >= 50) return 'text-blue-600';
    if (progress >= 25) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressBadgeColor = (progress: number) => {
    if (progress >= 75) return 'bg-green-100 text-green-700 border-green-200';
    if (progress >= 50) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (progress >= 25) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-red-100 text-red-700 border-red-200';
  };

  const getProgressLabel = (progress: number) => {
    if (progress >= 75) return 'Good Progress';
    if (progress >= 50) return 'Fair Progress';
    return 'Getting Started';
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'success': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      default: return <AlertCircle className="h-4 w-4 text-blue-600" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'warning': return 'border-l-yellow-500 bg-yellow-50';
      case 'success': return 'border-l-green-500 bg-green-50';
      default: return 'border-l-blue-500 bg-blue-50';
    }
  };

  // Loading skeleton component
  const DashboardSkeleton = () => (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="rounded-2xl bg-gradient-to-br from-purple-600 via-pink-500 to-purple-700 p-8">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-64 bg-white/20 mb-2" />
            <Skeleton className="h-5 w-48 bg-white/20" />
          </div>
          <Skeleton className="h-10 w-24 bg-white/20" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 bg-white/20 rounded-lg" />
                <div>
                  <Skeleton className="h-4 w-16 bg-white/20 mb-1" />
                  <Skeleton className="h-8 w-12 bg-white/20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs Skeleton */}
      <Skeleton className="h-12 w-full bg-gradient-to-r from-purple-50 to-pink-50" />

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-5 w-5 rounded" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-20 mb-2" />
              <Skeleton className="h-3 w-16 mb-2" />
              <Skeleton className="h-6 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Two Column Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="border-2">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-6 w-12" />
                </div>
              ))}
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions Skeleton */}
      <Card className="border-2 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  if (!data || data.children.length === 0) {
    return (
      <DashboardLayout>
        <Card className="mt-8">
          <CardContent className="py-16 text-center">
            <Users className="h-20 w-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Children Linked</h3>
            <p className="text-gray-600 mb-6">
              Link your child's account to start monitoring their academic progress
            </p>
            <Button onClick={() => setLocation('/parent/children')} size="lg">
              <Users className="h-4 w-4 mr-2" />
              Link a Child
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Header with Gradient */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-pink-500 to-purple-700 p-8 text-white shadow-xl">
          <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                  <Sparkles className="h-8 w-8" />
                  Welcome Back, Parent!
                </h1>
                <p className="text-purple-100 text-lg">
                  Here's how your {data.children.length > 1 ? 'children are' : 'child is'} doing today
                </p>
              </div>
              <Button
                variant="secondary"
                onClick={fetchDashboardData}
                disabled={refreshing}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-purple-100">Children</p>
                    <p className="text-2xl font-bold">{data.summary?.totalChildren || 0}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-purple-100">Avg Progress</p>
                    <p className="text-2xl font-bold">{Math.round(data.summary?.averageProgress || 0)}%</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-purple-100">Total Courses</p>
                    <p className="text-2xl font-bold">{data.summary?.totalCourses || 0}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-purple-100">Due Soon</p>
                    <p className="text-2xl font-bold">{data.summary?.upcomingAssignments || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Children Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className={`grid w-full bg-gradient-to-r from-purple-50 to-pink-50 p-1 rounded-lg ${data.children.length === 1 ? 'grid-cols-1' : data.children.length === 2 ? 'grid-cols-2' : data.children.length === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
            {data.children.map((child, index) => (
              <TabsTrigger
                key={child.id}
                value={index.toString()}
                className="data-[state=active]:bg-white data-[state=active]:shadow-md rounded-md transition-all"
              >
                <Avatar className="h-6 w-6 mr-2">
                  <AvatarImage src={child.profilePicture} />
                  <AvatarFallback className="text-xs bg-purple-100 text-purple-700">
                    {child.name?.split(' ').map(n => n[0]).join('') || '?'}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{child.name?.split(' ')[0] || 'Child'}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {data.children.map((child, index) => (
            <TabsContent key={child.id} value={index.toString()} className="space-y-6 mt-6">
              {/* Student Stats Cards - Matching Student Dashboard */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Course Completion - Same as Student Dashboard */}
                <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-all hover:scale-105">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-400/20 to-transparent rounded-bl-full"></div>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-gray-600">Course Completion</CardTitle>
                      <Target className="h-5 w-5 text-amber-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className={`text-2xl font-bold ${getProgressColor(child.stats?.progressPercentage || 0)} mb-0`}>
                          {getProgressLabel(child.stats?.progressPercentage || 0)}
                        </h3>
                      </div>
                      <div className="relative w-[72px] h-[72px] flex-shrink-0">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="36" cy="36" r="28" stroke="currentColor" strokeWidth="8" fill="none" className="text-gray-100" />
                          <circle cx="36" cy="36" r="28" stroke="#D4AF37" strokeWidth="8" fill="none"
                            strokeDasharray={`${((child.stats?.progressPercentage || 0) / 100) * 176} 176`}
                            strokeLinecap="round" className="transition-all duration-700" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg font-bold text-gray-900">{Math.round(child.stats?.progressPercentage || 0)}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500">
                      <div className="flex items-center justify-between">
                        <span>Total Score</span>
                        <span className="font-semibold">{(child.stats?.totalScore || 0).toFixed(1)} / {child.stats?.totalMaxScore || 100}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Study Streak - Same as Student Dashboard */}
                <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-all hover:scale-105">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-400/20 to-transparent rounded-bl-full"></div>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-gray-600">Study Streak</CardTitle>
                      <Sparkles className="h-5 w-5 text-orange-500" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-gray-900">{child.stats?.currentStreak || 0}</span>
                        <span className="text-lg text-gray-500">Days</span>
                      </div>
                      <div className="text-3xl">🔥</div>
                    </div>
                    <div className="mt-3">
                      <Progress value={Math.min(((child.stats?.currentWeekHours || 0) / (child.stats?.weeklyGoalHours || 10)) * 100, 100)} className="h-2" />
                      <p className="text-xs text-gray-500 mt-1">
                        Weekly: {Math.round(child.stats?.currentWeekHours || 0)}/{child.stats?.weeklyGoalHours || 10} hours
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Courses */}
                <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-all hover:scale-105">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-transparent rounded-bl-full"></div>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-gray-600">Courses</CardTitle>
                      <BookOpen className="h-5 w-5 text-purple-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-purple-600 mb-2">
                      {child.stats?.courses || 0}
                    </div>
                    <p className="text-xs text-gray-500">Active enrollments</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 w-full"
                      onClick={() => setLocation('/parent/courses')}
                    >
                      View Courses <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </CardContent>
                </Card>

                {/* Assignments */}
                <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-all hover:scale-105">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-transparent rounded-bl-full"></div>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-gray-600">Assignments Due</CardTitle>
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-blue-600 mb-2">
                      {child.stats?.assignments || 0}
                    </div>
                    <p className="text-xs text-gray-500">Due this week</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 w-full"
                      onClick={() => setLocation(`/parent/assignments/${child.id}`)}
                    >
                      View All <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Alerts Section */}
              {child.alerts && child.alerts.length > 0 && (
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5 text-yellow-600" />
                      Attention Needed
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {child.alerts.map((alert, idx) => (
                      <div
                        key={idx}
                        className={`flex items-start gap-3 p-3 rounded-lg border-l-4 ${getAlertColor(alert.type)}`}
                      >
                        {getAlertIcon(alert.type)}
                        <p className="text-sm text-gray-700 flex-1">{alert.message}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Grades */}
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-600" />
                      Recent Grades
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {child.recentGrades && child.recentGrades.length > 0 ? (
                      child.recentGrades.map((grade, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{grade.course}</p>
                            <p className="text-xs text-gray-500">{grade.date}</p>
                          </div>
                          <Badge className={`text-lg font-bold ${getProgressBadgeColor(parseFloat(grade.grade?.replace('%', '') || '0'))}`}>
                            {grade.grade || 'N/A'}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 py-4">No recent grades</p>
                    )}
                    <Button variant="outline" className="w-full" onClick={() => setLocation('/parent/grades')}>
                      View All Grades <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>

                {/* Upcoming Assignments */}
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      Upcoming Assignments
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {child.upcomingAssignments && child.upcomingAssignments.length > 0 ? (
                      child.upcomingAssignments.map((assignment) => (
                        <div key={assignment.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <FileText className="h-5 w-5 text-gray-600 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{assignment.title}</p>
                            <p className="text-sm text-gray-600">{assignment.course}</p>
                            <p className="text-xs text-gray-500 mt-1">Due: {assignment.dueDate}</p>
                          </div>
                          <Badge variant={assignment.status === 'pending' ? 'destructive' : 'secondary'}>
                            {assignment.status}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 py-4">No upcoming assignments</p>
                    )}
                    <Button variant="outline" className="w-full" onClick={() => setLocation(`/parent/assignments/${child.id}`)}>
                      View All Assignments <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card className="border-2 bg-gradient-to-br from-purple-50 to-pink-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-purple-600" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Button
                      variant="outline"
                      className="h-24 flex-col gap-2 bg-white hover:bg-purple-50 hover:border-purple-300 transition-all hover:scale-105"
                      onClick={() => setLocation(`/parent/analytics/${child.id}`)}
                    >
                      <BarChart3 className="h-6 w-6 text-purple-600" />
                      <span className="text-sm font-medium">Analytics</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="h-24 flex-col gap-2 bg-white hover:bg-blue-50 hover:border-blue-300 transition-all hover:scale-105"
                      onClick={() => setLocation('/parent/calendar')}
                    >
                      <Calendar className="h-6 w-6 text-blue-600" />
                      <span className="text-sm font-medium">Calendar</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="h-24 flex-col gap-2 bg-white hover:bg-green-50 hover:border-green-300 transition-all hover:scale-105"
                      onClick={() => setLocation('/parent/progress')}
                    >
                      <TrendingUp className="h-6 w-6 text-green-600" />
                      <span className="text-sm font-medium">Progress</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="h-24 flex-col gap-2 bg-white hover:bg-pink-50 hover:border-pink-300 transition-all hover:scale-105"
                      onClick={() => setLocation('/parent/reports')}
                    >
                      <FileText className="h-6 w-6 text-pink-600" />
                      <span className="text-sm font-medium">Reports</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* Recent Activity Feed */}
        {data.recentActivity && data.recentActivity.length > 0 && (
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-gray-600" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.recentActivity.map((activity, idx) => (
                  <div key={idx} className="flex items-start gap-4 pb-4 border-b last:border-0">
                    <div className="p-2 bg-purple-100 rounded-full">
                      <Activity className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">
                        <span className="font-semibold">{activity.childName}</span> {activity.action}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
