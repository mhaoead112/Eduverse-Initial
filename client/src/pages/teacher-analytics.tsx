import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts";
import { 
  BarChart3, 
  TrendingUp,
  TrendingDown, 
  Users, 
  BookOpen,
  Award,
  Clock,
  Download,
  Calendar,
  Target,
  AlertTriangle,
  CheckCircle,
  FileBarChart,
  Filter,
  RefreshCw
} from "lucide-react";

interface ClassPerformance {
  id: string;
  name: string;
  totalStudents: number;
  averageGrade: number;
  attendanceRate: number;
  assignmentsCompleted: number;
  totalAssignments: number;
  trend: 'up' | 'down' | 'stable';
}

interface StudentProgress {
  id: string;
  name: string;
  className: string;
  currentGrade: number;
  previousGrade: number;
  attendanceRate: number;
  assignmentsCompleted: number;
  totalAssignments: number;
  lastActivity: string;
  status: 'excellent' | 'good' | 'struggling' | 'at-risk';
}

interface AssignmentAnalytics {
  id: string;
  title: string;
  className: string;
  averageScore: number;
  completionRate: number;
  submittedCount: number;
  totalStudents: number;
  difficulty: 'easy' | 'medium' | 'hard';
  dueDate: string;
}

export default function TeacherAnalytics() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("month");

  // Mock data
  const mockClasses = [
    { id: "all", name: "All Classes" },
    { id: "1", name: "Algebra I" },
    { id: "2", name: "Biology 101" },
    { id: "3", name: "Chemistry" }
  ];

  const classPerformanceData: ClassPerformance[] = [
    {
      id: "1",
      name: "Algebra I",
      totalStudents: 28,
      averageGrade: 84.2,
      attendanceRate: 92.5,
      assignmentsCompleted: 156,
      totalAssignments: 180,
      trend: 'up'
    },
    {
      id: "2", 
      name: "Biology 101",
      totalStudents: 23,
      averageGrade: 87.8,
      attendanceRate: 88.4,
      assignmentsCompleted: 198,
      totalAssignments: 230,
      trend: 'up'
    },
    {
      id: "3",
      name: "Chemistry",
      totalStudents: 19,
      averageGrade: 79.3,
      attendanceRate: 85.2,
      assignmentsCompleted: 142,
      totalAssignments: 190,
      trend: 'down'
    }
  ];

  const studentProgressData: StudentProgress[] = [
    {
      id: "1",
      name: "Sarah Johnson",
      className: "Algebra I",
      currentGrade: 92,
      previousGrade: 89,
      attendanceRate: 96,
      assignmentsCompleted: 18,
      totalAssignments: 20,
      lastActivity: "2024-01-23T14:30:00Z",
      status: 'excellent'
    },
    {
      id: "2",
      name: "Mike Chen", 
      className: "Biology 101",
      currentGrade: 78,
      previousGrade: 82,
      attendanceRate: 88,
      assignmentsCompleted: 15,
      totalAssignments: 18,
      lastActivity: "2024-01-22T16:45:00Z",
      status: 'struggling'
    },
    {
      id: "3",
      name: "Emma Davis",
      className: "Chemistry", 
      currentGrade: 85,
      previousGrade: 83,
      attendanceRate: 94,
      assignmentsCompleted: 16,
      totalAssignments: 17,
      lastActivity: "2024-01-23T10:15:00Z",
      status: 'good'
    },
    {
      id: "4",
      name: "Alex Rodriguez",
      className: "Algebra I",
      currentGrade: 65,
      previousGrade: 71,
      attendanceRate: 76,
      assignmentsCompleted: 12,
      totalAssignments: 20,
      lastActivity: "2024-01-20T09:30:00Z",
      status: 'at-risk'
    }
  ];

  const assignmentAnalytics: AssignmentAnalytics[] = [
    {
      id: "1",
      title: "Linear Equations Quiz",
      className: "Algebra I",
      averageScore: 84.2,
      completionRate: 96.4,
      submittedCount: 27,
      totalStudents: 28,
      difficulty: 'medium',
      dueDate: "2024-01-25T23:59:00Z"
    },
    {
      id: "2",
      title: "Cell Structure Essay",
      className: "Biology 101", 
      averageScore: 88.7,
      completionRate: 91.3,
      submittedCount: 21,
      totalStudents: 23,
      difficulty: 'hard',
      dueDate: "2024-01-30T23:59:00Z"
    },
    {
      id: "3",
      title: "Chemical Reactions Lab",
      className: "Chemistry",
      averageScore: 76.5,
      completionRate: 84.2,
      submittedCount: 16,
      totalStudents: 19,
      difficulty: 'hard',
      dueDate: "2024-01-28T23:59:00Z"
    }
  ];

  // Chart data
  const gradeDistributionData = [
    { range: '90-100', students: 12, percentage: 28.6 },
    { range: '80-89', students: 18, percentage: 42.9 },
    { range: '70-79', students: 8, percentage: 19.0 },
    { range: '60-69', students: 3, percentage: 7.1 },
    { range: 'Below 60', students: 1, percentage: 2.4 }
  ];

  const attendanceTrendData = [
    { week: 'Week 1', attendance: 92 },
    { week: 'Week 2', attendance: 89 },
    { week: 'Week 3', attendance: 94 },
    { week: 'Week 4', attendance: 91 },
    { week: 'Week 5', attendance: 88 },
    { week: 'Week 6', attendance: 93 }
  ];

  const assignmentPerformanceData = [
    { assignment: 'Quiz 1', average: 85, completion: 96 },
    { assignment: 'Essay 1', average: 78, completion: 89 },
    { assignment: 'Lab 1', average: 92, completion: 94 },
    { assignment: 'Quiz 2', average: 81, completion: 91 },
    { assignment: 'Project 1', average: 87, completion: 85 }
  ];

  const engagementData = [
    { name: 'Highly Engaged', value: 45, color: '#22c55e' },
    { name: 'Moderately Engaged', value: 35, color: '#3b82f6' },
    { name: 'Low Engagement', value: 15, color: '#f59e0b' },
    { name: 'At Risk', value: 5, color: '#ef4444' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'good': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'struggling': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'at-risk': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const generateReport = () => {
    // Mock report generation
    console.log('Generating comprehensive report...');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Analytics & Reports
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Track class performance and student progress
            </p>
          </div>
          
          <div className="flex gap-3">
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-48" data-testid="select-class-filter">
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {mockClasses.map((classItem) => (
                  <SelectItem key={classItem.id} value={classItem.id}>
                    {classItem.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
              <SelectTrigger className="w-40" data-testid="select-timeframe">
                <SelectValue placeholder="Timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={generateReport} data-testid="button-generate-report">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card data-testid="card-total-students">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">70</div>
              <p className="text-xs text-muted-foreground">Across all classes</p>
            </CardContent>
          </Card>

          <Card data-testid="card-average-grade">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">83.8%</div>
              <p className="text-xs text-muted-foreground flex items-center">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                +2.4% from last month
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-attendance-rate">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">88.7%</div>
              <p className="text-xs text-muted-foreground flex items-center">
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                -1.2% from last month
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-assignment-completion">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assignment Completion</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">86.2%</div>
              <p className="text-xs text-muted-foreground flex items-center">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                +0.8% from last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="class-performance" data-testid="tab-class-performance">Class Performance</TabsTrigger>
            <TabsTrigger value="student-progress" data-testid="tab-student-progress">Student Progress</TabsTrigger>
            <TabsTrigger value="assignments" data-testid="tab-assignments">Assignment Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Grade Distribution */}
              <Card data-testid="card-grade-distribution">
                <CardHeader>
                  <CardTitle>Grade Distribution</CardTitle>
                  <CardDescription>Current grade ranges across all students</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={gradeDistributionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="students" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Attendance Trend */}
              <Card data-testid="card-attendance-trend">
                <CardHeader>
                  <CardTitle>Attendance Trend</CardTitle>
                  <CardDescription>Weekly attendance over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={attendanceTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="attendance" stroke="#10b981" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Student Engagement */}
              <Card data-testid="card-student-engagement">
                <CardHeader>
                  <CardTitle>Student Engagement</CardTitle>
                  <CardDescription>Distribution of engagement levels</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={engagementData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {engagementData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Assignment Performance */}
              <Card data-testid="card-assignment-performance">
                <CardHeader>
                  <CardTitle>Assignment Performance</CardTitle>
                  <CardDescription>Average scores and completion rates</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={assignmentPerformanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="assignment" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="average" stackId="1" stroke="#8884d8" fill="#8884d8" />
                      <Area type="monotone" dataKey="completion" stackId="2" stroke="#82ca9d" fill="#82ca9d" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="class-performance" className="space-y-6">
            <Card data-testid="card-class-performance-list">
              <CardHeader>
                <CardTitle>Class Performance Summary</CardTitle>
                <CardDescription>Overview of all your classes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {classPerformanceData.map((classData) => (
                    <div 
                      key={classData.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      data-testid={`class-performance-${classData.id}`}
                    >
                      <div className="flex items-center gap-4">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {classData.name}
                          </h3>
                          <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {classData.totalStudents} students
                            </span>
                            <span>Avg Grade: {classData.averageGrade}%</span>
                            <span>Attendance: {classData.attendanceRate}%</span>
                            <span>
                              Assignments: {classData.assignmentsCompleted}/{classData.totalAssignments}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {classData.trend === 'up' ? (
                          <TrendingUp className="h-5 w-5 text-green-500" />
                        ) : classData.trend === 'down' ? (
                          <TrendingDown className="h-5 w-5 text-red-500" />
                        ) : (
                          <div className="h-5 w-5 bg-gray-400 rounded-full" />
                        )}
                        <Button variant="outline" size="sm" data-testid={`button-view-class-${classData.id}`}>
                          <BarChart3 className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="student-progress" className="space-y-6">
            <Card data-testid="card-student-progress-list">
              <CardHeader>
                <CardTitle>Student Progress Tracking</CardTitle>
                <CardDescription>Monitor individual student performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {studentProgressData.map((student) => (
                    <div 
                      key={student.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      data-testid={`student-progress-${student.id}`}
                    >
                      <div className="flex items-center gap-4">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {student.name}
                          </h3>
                          <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                            <span>{student.className}</span>
                            <span>Current: {student.currentGrade}%</span>
                            <span>Previous: {student.previousGrade}%</span>
                            <span>Attendance: {student.attendanceRate}%</span>
                            <span>
                              Completed: {student.assignmentsCompleted}/{student.totalAssignments}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(student.status)}>
                          {student.status}
                        </Badge>
                        {student.currentGrade > student.previousGrade ? (
                          <TrendingUp className="h-5 w-5 text-green-500" />
                        ) : student.currentGrade < student.previousGrade ? (
                          <TrendingDown className="h-5 w-5 text-red-500" />
                        ) : (
                          <div className="h-5 w-5 bg-gray-400 rounded-full" />
                        )}
                        <Button variant="outline" size="sm" data-testid={`button-view-student-${student.id}`}>
                          View Profile
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assignments" className="space-y-6">
            <Card data-testid="card-assignment-analytics-list">
              <CardHeader>
                <CardTitle>Assignment Analytics</CardTitle>
                <CardDescription>Performance metrics for your assignments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assignmentAnalytics.map((assignment) => (
                    <div 
                      key={assignment.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      data-testid={`assignment-analytics-${assignment.id}`}
                    >
                      <div className="flex items-center gap-4">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {assignment.title}
                          </h3>
                          <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                            <span>{assignment.className}</span>
                            <span>Avg Score: {assignment.averageScore}%</span>
                            <span>Completion: {assignment.completionRate}%</span>
                            <span>
                              Submitted: {assignment.submittedCount}/{assignment.totalStudents}
                            </span>
                            <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getDifficultyColor(assignment.difficulty)}>
                          {assignment.difficulty}
                        </Badge>
                        {assignment.completionRate >= 90 ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : assignment.completionRate < 70 ? (
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                        ) : (
                          <Clock className="h-5 w-5 text-yellow-500" />
                        )}
                        <Button variant="outline" size="sm" data-testid={`button-view-assignment-${assignment.id}`}>
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}