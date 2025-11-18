import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  BookOpen, Clock, CheckCircle, AlertCircle, Calendar, 
  MessageCircle, Users, Trophy, Target, TrendingUp,
  FileText, Play, BookmarkPlus, Bell, Star, Award,
  GraduationCap, Zap, Heart, Brain, Coffee
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { 
  StatsCard, 
  ProgressWidget, 
  QuickActionCard, 
  AchievementBadge,
  ActivityFeed,
  ScheduleWidget,
  PerformanceOverview,
  QuickActionsPanel
} from "@/components/DashboardWidgets";
import { 
  GradeTrendChart, 
  CourseProgressChart, 
  PerformanceGauge 
} from "@/components/Charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";

// Mock data for demonstration - in real app this would come from API
const mockStudentData = {
  overview: {
    totalCourses: 6,
    completedAssignments: 23,
    pendingAssignments: 7,
    currentGPA: 3.78,
    attendanceRate: 94
  },
  courses: [
    {
      id: '1',
      name: 'Advanced Mathematics',
      instructor: 'Dr. Sarah Johnson',
      progress: 78,
      nextClass: 'Today 2:00 PM',
      assignments: 3,
      grade: 'A-',
      color: 'blue' as const
    },
    {
      id: '2', 
      name: 'Physics Laboratory',
      instructor: 'Prof. Michael Chen',
      progress: 65,
      nextClass: 'Tomorrow 10:00 AM',
      assignments: 2,
      grade: 'B+',
      color: 'green' as const
    },
    {
      id: '3',
      name: 'English Literature',
      instructor: 'Ms. Emily Davis',
      progress: 82,
      nextClass: 'Today 4:00 PM',
      assignments: 1,
      grade: 'A',
      color: 'purple' as const
    },
    {
      id: '4',
      name: 'Computer Science',
      instructor: 'Dr. Alex Kumar',
      progress: 90,
      nextClass: 'Wednesday 9:00 AM',
      assignments: 4,
      grade: 'A+',
      color: 'orange' as const
    }
  ],
  assignments: [
    {
      id: '1',
      title: 'Calculus Problem Set #5',
      subject: 'Advanced Mathematics',
      dueDate: 'Today, 11:59 PM',
      priority: 'high' as const,
      status: 'pending' as const,
      estimatedTime: '2 hours'
    },
    {
      id: '2',
      title: 'Lab Report: Electromagnetic Waves',
      subject: 'Physics Laboratory', 
      dueDate: 'Tomorrow, 5:00 PM',
      priority: 'medium' as const,
      status: 'in-progress' as const,
      estimatedTime: '3 hours'
    },
    {
      id: '3',
      title: 'Essay: Modern Poetry Analysis',
      subject: 'English Literature',
      dueDate: 'Friday, 2:00 PM',
      priority: 'medium' as const,
      status: 'pending' as const,
      estimatedTime: '4 hours'
    },
    {
      id: '4',
      title: 'Programming Project: Web App',
      subject: 'Computer Science',
      dueDate: 'Next Monday, 11:59 PM',
      priority: 'low' as const,
      status: 'completed' as const,
      estimatedTime: '6 hours'
    }
  ],
  schedule: [
    {
      id: '1',
      title: 'Advanced Mathematics',
      time: '2:00 PM - 3:30 PM',
      type: 'class' as const,
      location: 'Room 204',
      color: 'blue' as const
    },
    {
      id: '2',
      title: 'English Literature',
      time: '4:00 PM - 5:30 PM', 
      type: 'class' as const,
      location: 'Room 156',
      color: 'purple' as const
    },
    {
      id: '3',
      title: 'Study Group - Physics',
      time: '7:00 PM - 8:30 PM',
      type: 'meeting' as const,
      location: 'Library Room 3',
      color: 'green' as const
    }
  ],
  performance: [
    { subject: 'Computer Science', score: 95, trend: 'up' as const, color: 'green' as const },
    { subject: 'English Literature', score: 88, trend: 'up' as const, color: 'blue' as const },
    { subject: 'Advanced Mathematics', score: 82, trend: 'stable' as const, color: 'purple' as const },
    { subject: 'Physics Laboratory', score: 76, trend: 'down' as const, color: 'orange' as const }
  ],
  achievements: [
    {
      title: 'Perfect Attendance',
      description: '30 days in a row',
      icon: Calendar,
      earned: true,
      earnedDate: 'Oct 15, 2025',
      color: 'gold' as const
    },
    {
      title: 'Math Wizard',
      description: '10 A+ in Mathematics',
      icon: Brain,
      earned: true,
      earnedDate: 'Oct 10, 2025',
      color: 'blue' as const
    },
    {
      title: 'Team Player',
      description: 'Active in 5 study groups',
      icon: Users,
      earned: false,
      color: 'green' as const
    },
    {
      title: 'Early Bird',
      description: 'Submit 5 assignments early',
      icon: Coffee,
      earned: false,
      color: 'bronze' as const
    }
  ],
  activities: [
    {
      id: '1',
      type: 'grade' as const,
      title: 'New Grade Posted',
      description: 'Computer Science Quiz #3 - Grade: A+',
      timestamp: '2 hours ago',
      user: { name: 'Dr. Alex Kumar' }
    },
    {
      id: '2',
      type: 'assignment' as const,
      title: 'Assignment Due Soon',
      description: 'Calculus Problem Set #5 due tonight at 11:59 PM',
      timestamp: '4 hours ago'
    },
    {
      id: '3',
      type: 'message' as const,
      title: 'Message from Teacher',
      description: 'Dr. Johnson shared study materials for upcoming exam',
      timestamp: '1 day ago',
      user: { name: 'Dr. Sarah Johnson' }
    },
    {
      id: '4',
      type: 'achievement' as const,
      title: 'Achievement Unlocked!',
      description: 'You earned the "Perfect Attendance" badge',
      timestamp: '2 days ago'
    }
  ],
  gradeTrends: [
    { week: 'Week 1', grade: 78, average: 82 },
    { week: 'Week 2', grade: 82, average: 83 },
    { week: 'Week 3', grade: 85, average: 84 },
    { week: 'Week 4', grade: 88, average: 85 },
    { week: 'Week 5', grade: 86, average: 86 },
    { week: 'Week 6', grade: 91, average: 87 },
    { week: 'Week 7', grade: 89, average: 88 },
    { week: 'Week 8', grade: 93, average: 89 }
  ],
  courseProgress: [
    { course: 'Math', completed: 28, total: 36, percentage: 78 },
    { course: 'Physics', completed: 23, total: 35, percentage: 66 },
    { course: 'English', completed: 29, total: 35, percentage: 83 },
    { course: 'CS', completed: 32, total: 35, percentage: 91 }
  ]
};

function CourseCard({ course }: { course: typeof mockStudentData.courses[0] }) {
  return (
    <Card className="hover:shadow-lg transition-all duration-300 animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{course.name}</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {course.instructor}
            </p>
          </div>
          <Badge variant={course.grade.startsWith('A') ? 'default' : 'secondary'}>
            {course.grade}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ProgressWidget
          title="Course Progress"
          current={course.progress}
          total={100}
          color={course.color}
          showPercentage={true}
        />
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600 dark:text-gray-400">
              Next: {course.nextClass}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600 dark:text-gray-400">
              {course.assignments} assignments
            </span>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button size="sm" variant="outline" className="flex-1">
            <Play className="h-4 w-4 mr-1" />
            Continue
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            <BookmarkPlus className="h-4 w-4 mr-1" />
            Materials
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AssignmentCard({ assignment }: { assignment: typeof mockStudentData.assignments[0] }) {
  const priorityColors = {
    high: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400',
    medium: 'bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400',
    low: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'
  };

  const statusIcons = {
    pending: AlertCircle,
    'in-progress': Clock,
    completed: CheckCircle
  };

  const StatusIcon = statusIcons[assignment.status];

  return (
    <Card className={`hover:shadow-md transition-all duration-300 animate-slide-up ${priorityColors[assignment.priority]}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">{assignment.title}</h3>
            <p className="text-xs opacity-80">{assignment.subject}</p>
          </div>
          <div className="flex items-center space-x-2">
            <StatusIcon className="h-4 w-4" />
            <Badge 
              variant={assignment.priority === 'high' ? 'destructive' : 'secondary'}
              className="text-xs"
            >
              {assignment.priority}
            </Badge>
          </div>
        </div>
        
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="opacity-75">Due:</span>
            <span className="font-medium">{assignment.dueDate}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="opacity-75">Est. Time:</span>
            <span className="font-medium">{assignment.estimatedTime}</span>
          </div>
        </div>
        
        <div className="flex space-x-2 mt-3">
          {assignment.status === 'completed' ? (
            <Button size="sm" variant="outline" className="flex-1" disabled>
              <CheckCircle className="h-3 w-3 mr-1" />
              Completed
            </Button>
          ) : (
            <>
              <Button size="sm" variant="outline" className="flex-1">
                <FileText className="h-3 w-3 mr-1" />
                View
              </Button>
              <Button size="sm" className="flex-1">
                <Play className="h-3 w-3 mr-1" />
                {assignment.status === 'pending' ? 'Start' : 'Continue'}
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString());

  const quickActions = [
    {
      title: 'Submit Assignment',
      description: 'Upload your completed work',
      icon: FileText,
      color: 'blue' as const,
      onClick: () => console.log('Submit assignment'),
      badge: '3'
    },
    {
      title: 'Message Teacher',
      description: 'Ask questions or get help',
      icon: MessageCircle,
      color: 'green' as const,
      onClick: () => console.log('Message teacher')
    },
    {
      title: 'Join Study Group',
      description: 'Connect with classmates',
      icon: Users,
      color: 'purple' as const,
      onClick: () => console.log('Join study group'),
      badge: '2'
    },
    {
      title: 'View Schedule',
      description: 'Check upcoming classes',
      icon: Calendar,
      color: 'orange' as const,
      onClick: () => console.log('View schedule')
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {user?.fullName?.split(' ')[0]}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Here's what's happening with your studies today.
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatsCard
            title="Total Courses"
            value={mockStudentData.overview.totalCourses}
            icon={BookOpen}
            color="blue"
            trend={{ value: 12, isPositive: true }}
          />
          <StatsCard
            title="Assignments Done"
            value={mockStudentData.overview.completedAssignments}
            icon={CheckCircle}
            color="green"
            trend={{ value: 8, isPositive: true }}
          />
          <StatsCard
            title="Pending Tasks"
            value={mockStudentData.overview.pendingAssignments}
            icon={Clock}
            color="orange"
            subtitle="Due this week"
          />
          <StatsCard
            title="Current GPA"
            value={mockStudentData.overview.currentGPA.toFixed(2)}
            icon={TrendingUp}
            color="purple"
            trend={{ value: 3, isPositive: true }}
          />
          <StatsCard
            title="Attendance"
            value={`${mockStudentData.overview.attendanceRate}%`}
            icon={Calendar}
            color="green"
            trend={{ value: 2, isPositive: true }}
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="courses">My Courses</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="grades">Grades</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Quick Actions */}
                <QuickActionsPanel 
                  title="Quick Actions"
                  actions={quickActions}
                />

                {/* Recent Activity */}
                <ActivityFeed 
                  activities={mockStudentData.activities}
                  maxItems={4}
                />
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Today's Schedule */}
                <ScheduleWidget
                  title="Today's Schedule"
                  items={mockStudentData.schedule}
                  date={selectedDate}
                />

                {/* Performance Overview */}
                <PerformanceOverview
                  title="Performance"
                  data={mockStudentData.performance}
                  overallGPA={mockStudentData.overview.currentGPA}
                />

                {/* Achievements */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Trophy className="h-5 w-5" />
                      <span>Achievements</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      {mockStudentData.achievements.map((achievement, index) => (
                        <AchievementBadge
                          key={achievement.title}
                          {...achievement}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                My Courses
              </h2>
              <Button variant="outline">
                <BookmarkPlus className="h-4 w-4 mr-2" />
                Browse Courses
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {mockStudentData.courses.map(course => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </TabsContent>

          {/* Assignments Tab */}
          <TabsContent value="assignments" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Assignments
              </h2>
              <div className="flex space-x-2">
                <Badge variant="destructive">
                  {mockStudentData.assignments.filter(a => a.priority === 'high').length} High Priority
                </Badge>
                <Badge variant="secondary">
                  {mockStudentData.assignments.filter(a => a.status === 'pending').length} Pending
                </Badge>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {mockStudentData.assignments.map(assignment => (
                <AssignmentCard key={assignment.id} assignment={assignment} />
              ))}
            </div>
          </TabsContent>

          {/* Grades Tab */}
          <TabsContent value="grades" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Grades & Performance
              </h2>
              <Badge className="text-lg px-4 py-2">
                Overall GPA: {mockStudentData.overview.currentGPA.toFixed(2)}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <GradeTrendChart 
                  data={mockStudentData.gradeTrends}
                  title="Grade Trends Over Time"
                />
                
                <PerformanceOverview
                  title="Subject Performance"
                  data={mockStudentData.performance}
                  overallGPA={mockStudentData.overview.currentGPA}
                />
              </div>
              
              <div className="space-y-6">
                <PerformanceGauge 
                  data={{ score: Math.round(mockStudentData.overview.currentGPA * 25), label: 'Overall GPA' }}
                  title="Academic Performance"
                  color="#10b981"
                />
                
                <Card>
                  <CardHeader>
                    <CardTitle>Current Grades</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {mockStudentData.courses.map((course) => (
                      <div key={course.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{course.name}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{course.instructor}</p>
                        </div>
                        <Badge variant={course.grade.startsWith('A') ? 'default' : 'secondary'}>
                          {course.grade}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
            
            <CourseProgressChart 
              data={mockStudentData.courseProgress}
              title="Course Completion Progress"
            />
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                My Schedule
              </h2>
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Full Calendar
              </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ScheduleWidget
                title="Today's Classes"
                items={mockStudentData.schedule}
                date={selectedDate}
              />
              
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Deadlines</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {mockStudentData.assignments
                    .filter(a => a.status !== 'completed')
                    .slice(0, 4)
                    .map((assignment) => (
                      <div key={assignment.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{assignment.title}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{assignment.subject}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{assignment.dueDate}</p>
                          <Badge 
                            variant={assignment.priority === 'high' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {assignment.priority}
                          </Badge>
                        </div>
                      </div>
                    ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}