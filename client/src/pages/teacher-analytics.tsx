import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { apiEndpoint, assetUrl } from "@/lib/config";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  TrendingUp, TrendingDown, Users, BookOpen, 
  Award, AlertCircle, CheckCircle2, Clock,
  BarChart3, Loader2, FileText, Target, Download, Activity
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart
} from 'recharts';

interface Course {
  id: string;
  title: string;
}

interface StudentAnalytics {
  id: string;
  username: string;
  fullName: string;
  email: string;
  profilePicture?: string;
  averageScore: number;
  totalAssignments: number;
  completedAssignments: number;
  pendingAssignments: number;
  attendanceRate: number;
  lastActivity: string;
  trend: 'up' | 'down' | 'stable';
  coursesEnrolled: number;
}

interface CourseAnalytics {
  courseId: string;
  courseTitle: string;
  totalStudents: number;
  averageScore: number;
  completionRate: number;
  totalAssignments: number;
  submittedAssignments: number;
}

interface OverviewStats {
  totalStudents: number;
  averageClassScore: number;
  totalAssignments: number;
  averageCompletionRate: number;
  studentsAtRisk: number;
  topPerformers: number;
}

export default function TeacherAnalytics() {
  const { toast } = useToast();
  const { token, isLoading: authLoading, getAuthHeaders } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<StudentAnalytics[]>([]);
  const [courseAnalytics, setCourseAnalytics] = useState<CourseAnalytics[]>([]);
  const [overviewStats, setOverviewStats] = useState<OverviewStats>({
    totalStudents: 0,
    averageClassScore: 0,
    totalAssignments: 0,
    averageCompletionRate: 0,
    studentsAtRisk: 0,
    topPerformers: 0,
  });

  // Export analytics to CSV
  const handleExportAnalytics = () => {
    try {
      if (!students || students.length === 0) {
        toast({
          title: "No Data",
          description: "No student data available to export",
          variant: "destructive",
        });
        return;
      }

      const headers = ['Student Name', 'Email', 'Average Score', 'Assignments Completed', 'Completion Rate', 'Status'];
      const rows = students.map(student => [
        student.fullName || student.username || 'N/A',
        student.email || 'N/A',
        student.averageScore ? `${student.averageScore.toFixed(1)}%` : '0%',
        student.completedAssignments || 0,
        student.totalAssignments > 0 ? `${((student.completedAssignments / student.totalAssignments) * 100).toFixed(1)}%` : '0%',
        (student.averageScore || 0) >= 70 ? 'Good Standing' : (student.averageScore || 0) >= 60 ? 'At Risk' : 'Needs Attention'
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics_report_${selectedCourse}_${Date.now()}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Analytics report exported successfully",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to export analytics",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (!authLoading && token) {
      fetchAnalyticsData();
    }
  }, [authLoading, token, selectedCourse]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      const courseParam = selectedCourse !== "all" ? `?courseId=${selectedCourse}` : "";

      // Fetch courses
      const coursesRes = await fetch(apiEndpoint("/api/courses/user"), { 
        headers,
        credentials: "include"
      });
      if (coursesRes.ok) {
        const coursesData = await coursesRes.json();
        setCourses(coursesData);
      }

      // Fetch analytics overview
      const overviewRes = await fetch(apiEndpoint(`/api/analytics/overview${courseParam}`), { 
        headers,
        credentials: "include"
      });
      if (overviewRes.ok) {
        const overviewData = await overviewRes.json();
        setOverviewStats(overviewData);
      }

      // Fetch student analytics
      const studentsRes = await fetch(apiEndpoint(`/api/analytics/students${courseParam}`), { 
        headers,
        credentials: "include"
      });
      if (studentsRes.ok) {
        const studentsData = await studentsRes.json();
        setStudents(studentsData);
      }

      // Fetch course analytics
      if (selectedCourse === "all") {
        const courseAnalyticsRes = await fetch(apiEndpoint("/api/analytics/courses"), { 
          headers,
          credentials: "include"
        });
        if (courseAnalyticsRes.ok) {
          const courseAnalyticsData = await courseAnalyticsRes.json();
          setCourseAnalytics(courseAnalyticsData);
        }
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data from students
  const getGradeDistribution = () => {
    const ranges = [
      { range: '90-100', min: 90, max: 100, students: 0, color: '#22c55e' },
      { range: '80-89', min: 80, max: 89, students: 0, color: '#3b82f6' },
      { range: '70-79', min: 70, max: 79, students: 0, color: '#f59e0b' },
      { range: '60-69', min: 60, max: 69, students: 0, color: '#ef4444' },
      { range: 'Below 60', min: 0, max: 59, students: 0, color: '#dc2626' }
    ];

    students.forEach(student => {
      const grade = student.averageScore;
      const rangeIndex = ranges.findIndex(r => grade >= r.min && grade <= r.max);
      if (rangeIndex !== -1) {
        ranges[rangeIndex].students++;
      }
    });

    return ranges;
  };

  const getPerformanceTrend = () => {
    return [
      { trend: 'Improving', students: students.filter(s => s.trend === 'up').length, color: '#22c55e' },
      { trend: 'Stable', students: students.filter(s => s.trend === 'stable').length, color: '#3b82f6' },
      { trend: 'Declining', students: students.filter(s => s.trend === 'down').length, color: '#ef4444' }
    ];
  };

  const getCompletionData = () => {
    return students.slice(0, 10).map(student => ({
      name: student.fullName || student.username,
      completed: student.completedAssignments,
      pending: student.pendingAssignments,
      total: student.totalAssignments
    }));
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-yellow-500" />
          <p className="text-slate-400 font-medium">Loading analytics data...</p>
        </div>
      </DashboardLayout>
    );
  }

  const gradeDistribution = getGradeDistribution();
  const performanceTrend = getPerformanceTrend();
  const completionData = getCompletionData();

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-10 px-1">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-yellow-400 to-yellow-500 bg-clip-text text-transparent">
              Analytics Dashboard
            </h1>
            <p className="text-slate-400">Monitor student performance and gain insights</p>
          </div>
          <div className="flex gap-3">
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger className="w-[250px] border-slate-700 bg-slate-800/50 text-white shadow-sm">
                <SelectValue placeholder="Select course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">📚 All Classes</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" className="shadow-sm border-slate-700 bg-slate-800/50 text-white hover:bg-slate-700" onClick={handleExportAnalytics}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-slate-800/50 border border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-400 mb-1">Total Students</p>
                  <p className="text-4xl font-bold text-white">{overviewStats.totalStudents}</p>
                  <p className="text-xs text-slate-500 mt-1">Enrolled across courses</p>
                </div>
                <div className="h-16 w-16 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Users className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-400 mb-1">Average Score</p>
                  <p className="text-4xl font-bold text-white">{overviewStats.averageClassScore}%</p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="h-3 w-3 text-green-400" />
                    <p className="text-xs text-green-400">Above target</p>
                  </div>
                </div>
                <div className="h-16 w-16 bg-green-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Target className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-400 mb-1">Completion Rate</p>
                  <p className="text-4xl font-bold text-white">{overviewStats.averageCompletionRate}%</p>
                  <Progress value={overviewStats.averageCompletionRate} className="h-2 mt-2" />
                </div>
                <div className="h-16 w-16 bg-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <CheckCircle2 className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-400 mb-1">Top Performers</p>
                  <p className="text-4xl font-bold text-white">{overviewStats.topPerformers}</p>
                  <p className="text-xs text-slate-500 mt-1">Score ≥ 85%</p>
                </div>
                <div className="h-16 w-16 bg-yellow-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Award className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-400 mb-1">Students at Risk</p>
                  <p className="text-4xl font-bold text-white">{overviewStats.studentsAtRisk}</p>
                  <p className="text-xs text-slate-500 mt-1">Score &lt; 60%</p>
                </div>
                <div className="h-16 w-16 bg-red-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <AlertCircle className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-indigo-400 mb-1">Total Assignments</p>
                  <p className="text-4xl font-bold text-white">{overviewStats.totalAssignments}</p>
                  <p className="text-xs text-slate-500 mt-1">Across all classes</p>
                </div>
                <div className="h-16 w-16 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <FileText className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Grade Distribution Chart */}
          <Card className="bg-slate-800/50 border border-slate-700/50 shadow-lg rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <BarChart3 className="h-5 w-5 text-yellow-400" />
                Grade Distribution
              </CardTitle>
              <CardDescription className="text-slate-400">Current grade ranges across all students</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={gradeDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="range" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', backgroundColor: '#1e293b', color: '#fff' }}
                  />
                  <Bar dataKey="students" radius={[8, 8, 0, 0]}>
                    {gradeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Performance Trend Pie Chart */}
          <Card className="bg-slate-800/50 border border-slate-700/50 shadow-lg rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Activity className="h-5 w-5 text-yellow-400" />
                Performance Trends
              </CardTitle>
              <CardDescription className="text-slate-400">Student progress distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={performanceTrend}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ trend, students }) => `${trend}: ${students}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="students"
                  >
                    {performanceTrend.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', backgroundColor: '#1e293b', color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Assignment Completion Chart */}
          {completionData.length > 0 && (
            <Card className="bg-slate-800/50 border border-slate-700/50 shadow-lg rounded-2xl lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <CheckCircle2 className="h-5 w-5 text-yellow-400" />
                  Assignment Completion by Student
                </CardTitle>
                <CardDescription className="text-slate-400">Top 10 students assignment progress</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={completionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', backgroundColor: '#1e293b', color: '#fff' }}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="completed" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="pending" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Course Analytics (only when "All Courses" selected) */}
        {selectedCourse === "all" && courseAnalytics.length > 0 && (
          <Card className="bg-slate-800/50 border border-slate-700/50 shadow-lg rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <BarChart3 className="h-5 w-5 text-yellow-400" />
                Course Performance Overview
              </CardTitle>
              <CardDescription className="text-slate-400">Detailed metrics for each course</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {courseAnalytics.map((course) => (
                  <div key={course.courseId} className="border border-slate-700/50 rounded-xl p-5 hover:shadow-md transition-all bg-slate-900/50">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-bold text-lg text-white">{course.courseTitle}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <Badge variant="outline" className="bg-blue-900/50 border-blue-700 text-blue-400">
                            <Users className="h-3 w-3 mr-1" />
                            {course.totalStudents} students
                          </Badge>
                          <Badge variant="outline" className="bg-purple-900/50 border-purple-700 text-purple-400">
                            <FileText className="h-3 w-3 mr-1" />
                            {course.totalAssignments} assignments
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-green-400">{course.averageScore}%</div>
                        <p className="text-xs text-slate-500">Average Score</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-8 w-8 bg-green-900/50 rounded-lg flex items-center justify-center">
                            <Target className="h-4 w-4 text-green-400" />
                          </div>
                          <p className="text-xs text-slate-400 font-medium">Avg Score</p>
                        </div>
                        <p className="text-2xl font-bold text-white">{course.averageScore}%</p>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-8 w-8 bg-purple-900/50 rounded-lg flex items-center justify-center">
                            <CheckCircle2 className="h-4 w-4 text-purple-400" />
                          </div>
                          <p className="text-xs text-slate-400 font-medium">Completion</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-2xl font-bold text-white">{course.completionRate}%</p>
                          <Progress value={course.completionRate} className="h-2 flex-1" />
                        </div>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-8 w-8 bg-indigo-900/50 rounded-lg flex items-center justify-center">
                            <FileText className="h-4 w-4 text-indigo-400" />
                          </div>
                          <p className="text-xs text-slate-400 font-medium">Submissions</p>
                        </div>
                        <p className="text-2xl font-bold text-white">
                          {course.submittedAssignments}<span className="text-base text-slate-500">/{course.totalAssignments}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Student Performance */}
        <Card className="bg-slate-800/50 border border-slate-700/50 shadow-lg rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Users className="h-5 w-5 text-yellow-400" />
              Student Performance Details
            </CardTitle>
            <CardDescription className="text-slate-400">Individual student analytics and progress tracking</CardDescription>
          </CardHeader>
          <CardContent>
            {students.length === 0 ? (
              <div className="text-center py-12">
                <div className="h-20 w-20 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-10 w-10 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No Student Data</h3>
                <p className="text-slate-400">No students found for the selected course</p>
              </div>
            ) : (
              <div className="space-y-4">
                {students.map((student) => (
                  <div key={student.id} className="border border-slate-700/50 rounded-xl p-5 hover:shadow-lg transition-all duration-300 bg-slate-900/50">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16 ring-4 ring-slate-700 shadow-md">
                        <AvatarImage 
                          src={student.profilePicture ? assetUrl(student.profilePicture) : ''} 
                          alt={student.fullName} 
                        />
                        <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-500 text-white font-bold text-lg">
                          {student.fullName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-bold text-lg text-white">{student.fullName}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-sm text-slate-400">@{student.username}</p>
                              <span className="text-slate-600">•</span>
                              <p className="text-sm text-slate-400">{student.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {student.trend === 'up' && (
                              <Badge className="bg-green-100 text-green-700 hover:bg-green-100 shadow-sm">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                Improving
                              </Badge>
                            )}
                            {student.trend === 'down' && (
                              <Badge className="bg-red-100 text-red-700 hover:bg-red-100 shadow-sm">
                                <TrendingDown className="h-3 w-3 mr-1" />
                                Declining
                              </Badge>
                            )}
                            {student.trend === 'stable' && (
                              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 shadow-sm">
                                Stable
                              </Badge>
                            )}
                            <Badge 
                              className={`font-bold shadow-sm ${
                                student.averageScore >= 85 
                                  ? "bg-green-500 hover:bg-green-500 text-white" 
                                  : student.averageScore >= 70 
                                  ? "bg-blue-500 hover:bg-blue-500 text-white" 
                                  : student.averageScore >= 60 
                                  ? "bg-orange-500 hover:bg-orange-500 text-white"
                                  : "bg-red-500 hover:bg-red-500 text-white"
                              }`}
                            >
                              {student.averageScore}% avg
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-blue-900/30 rounded-lg p-3 border border-blue-800/50">
                            <p className="text-xs text-blue-400 font-semibold mb-2">Assignments</p>
                            <div className="flex items-center gap-2 mb-1">
                              <Progress value={(student.completedAssignments / student.totalAssignments) * 100} className="h-2 flex-1" />
                            </div>
                            <p className="text-sm font-bold text-white">
                              {student.completedAssignments}/{student.totalAssignments}
                              <span className="text-xs text-slate-500 ml-1">
                                ({Math.round((student.completedAssignments / student.totalAssignments) * 100)}%)
                              </span>
                            </p>
                          </div>
                          <div className="bg-orange-900/30 rounded-lg p-3 border border-orange-800/50">
                            <p className="text-xs text-orange-400 font-semibold mb-2">Pending Tasks</p>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-orange-400" />
                              <p className="text-2xl font-bold text-white">{student.pendingAssignments}</p>
                            </div>
                          </div>
                          <div className="bg-purple-900/30 rounded-lg p-3 border border-purple-800/50">
                            <p className="text-xs text-purple-400 font-semibold mb-2">Attendance</p>
                            <div className="flex items-center gap-2 mb-1">
                              <Progress value={student.attendanceRate} className="h-2 flex-1" />
                            </div>
                            <p className="text-2xl font-bold text-white">{student.attendanceRate}%</p>
                          </div>
                          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                            <p className="text-xs text-slate-400 font-semibold mb-2">Last Activity</p>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-slate-500" />
                              <p className="text-sm font-semibold text-slate-300">{student.lastActivity}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
