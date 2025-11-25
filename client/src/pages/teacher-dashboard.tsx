import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PermissionGuard, ProtectedElement, RoleGuard } from "@/components/PermissionGuard";
import { useCurrentUser, useHasPermission } from "@/hooks/usePermissions";
import { 
  Calendar, 
  Users, 
  FileText, 
  MessageSquare, 
  Bell, 
  BookOpen,
  Clock,
  TrendingUp,
  Plus,
  Shield,
  Settings,
  Crown,
  BarChart3,
  UserPlus,
  GraduationCap
} from "lucide-react";
import { Link } from "wouter";

interface DashboardStats {
  totalClasses: number;
  totalStudents: number;
  pendingSubmissions: number;
  unreadMessages: number;
}

interface RecentActivity {
  id: string;
  type: 'submission' | 'message' | 'enrollment';
  content: string;
  time: string;
  studentName?: string;
  className?: string;
}

interface UpcomingClass {
  id: string;
  name: string;
  time: string;
  students: number;
  room?: string;
}

export default function TeacherDashboard() {
  const { data: user } = useCurrentUser();
  const canManageTeachers = useHasPermission('admin', 'manage_teachers');
  const canViewDepartmentAnalytics = useHasPermission('admin', 'view_department_analytics');
  const canCreateContent = useHasPermission('content', 'create');

  // Mock data for now - this will be replaced with real API calls
  const mockStats: DashboardStats = {
    totalClasses: 5,
    totalStudents: 147,
    pendingSubmissions: 23,
    unreadMessages: 8
  };

  const mockRecentActivity: RecentActivity[] = [
    {
      id: "1",
      type: "submission",
      content: "Math Homework Assignment #3",
      time: "10 minutes ago",
      studentName: "Sarah Johnson",
      className: "Algebra I"
    },
    {
      id: "2", 
      type: "message",
      content: "New message in General Discussion",
      time: "25 minutes ago",
      className: "Biology 101"
    },
    {
      id: "3",
      type: "enrollment",
      content: "New student enrolled",
      time: "1 hour ago",
      studentName: "Mike Chen",
      className: "Chemistry"
    }
  ];

  const mockUpcomingClasses: UpcomingClass[] = [
    {
      id: "1",
      name: "Algebra I",
      time: "9:00 AM",
      students: 28,
      room: "Room 101"
    },
    {
      id: "2", 
      name: "Biology 101",
      time: "11:30 AM",
      students: 35,
      room: "Lab 203"
    },
    {
      id: "3",
      name: "Chemistry",
      time: "2:00 PM", 
      students: 22,
      room: "Lab 105"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Teacher Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Welcome back! Here's what's happening with your classes today.
              </p>
            </div>
            
            {user && (
              <div className="flex items-center gap-4">
                {/* User Profile */}
                <div className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">
                      {user.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {user.department}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Role-based Quick Access */}
                <div className="flex items-center gap-2">
                  <ProtectedElement resource="profile" action="read">
                    <Link href="/teacher/profile">
                      <Button variant="outline" size="sm" data-testid="button-profile">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </Link>
                  </ProtectedElement>
                  
                  <RoleGuard allowedRoles={['department_head', 'senior_teacher']}>
                    <Button variant="outline" size="sm" data-testid="button-admin-tools">
                      <Crown className="h-4 w-4" />
                    </Button>
                  </RoleGuard>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card data-testid="card-total-classes">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-classes">
                {mockStats.totalClasses}
              </div>
              <p className="text-xs text-muted-foreground">Active courses</p>
            </CardContent>
          </Card>

          <Card data-testid="card-total-students">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-students">
                {mockStats.totalStudents}
              </div>
              <p className="text-xs text-muted-foreground">Across all classes</p>
            </CardContent>
          </Card>

          <Card data-testid="card-pending-submissions">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600" data-testid="text-pending-submissions">
                {mockStats.pendingSubmissions}
              </div>
              <p className="text-xs text-muted-foreground">Submissions to grade</p>
            </CardContent>
          </Card>

          <Card data-testid="card-unread-messages">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600" data-testid="text-unread-messages">
                {mockStats.unreadMessages}
              </div>
              <p className="text-xs text-muted-foreground">Unread messages</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Schedule */}
          <Card className="lg:col-span-2" data-testid="card-todays-schedule">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Today's Schedule
              </CardTitle>
              <CardDescription>Your upcoming classes for today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockUpcomingClasses.map((classItem) => (
                  <div 
                    key={classItem.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    data-testid={`class-schedule-${classItem.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-sm">{classItem.time}</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {classItem.name}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {classItem.students} students
                          </span>
                          {classItem.room && (
                            <span>{classItem.room}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" data-testid={`button-join-class-${classItem.id}`}>
                      Join Class
                    </Button>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t">
                <Link href="/teacher/classes">
                  <Button variant="ghost" className="w-full" data-testid="button-view-all-classes">
                    <Plus className="h-4 w-4 mr-2" />
                    View All Classes
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card data-testid="card-recent-activity">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest updates from your classes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockRecentActivity.map((activity) => (
                  <div 
                    key={activity.id}
                    className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    data-testid={`activity-${activity.id}`}
                  >
                    <div className="flex-shrink-0">
                      {activity.type === 'submission' && (
                        <FileText className="h-4 w-4 text-green-600" />
                      )}
                      {activity.type === 'message' && (
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                      )}
                      {activity.type === 'enrollment' && (
                        <Users className="h-4 w-4 text-purple-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {activity.content}
                      </p>
                      {activity.studentName && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          by {activity.studentName}
                        </p>
                      )}
                      {activity.className && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          {activity.className}
                        </Badge>
                      )}
                      <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t">
                <Button variant="ghost" className="w-full text-sm" data-testid="button-view-all-activity">
                  View All Activity
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <Card data-testid="card-quick-actions">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Frequently used teacher tools</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Basic Teacher Actions */}
                <ProtectedElement resource="classes" action="create">
                  <Link href="/teacher/classes">
                    <Button variant="outline" className="w-full h-20 flex flex-col gap-2" data-testid="button-manage-classes">
                      <BookOpen className="h-6 w-6" />
                      <span className="text-sm">Manage Classes</span>
                    </Button>
                  </Link>
                </ProtectedElement>
                
                <ProtectedElement resource="assessments" action="create">
                  <Link href="/teacher/assessments">
                    <Button variant="outline" className="w-full h-20 flex flex-col gap-2" data-testid="button-create-assignment">
                      <FileText className="h-6 w-6" />
                      <span className="text-sm">Assessments</span>
                    </Button>
                  </Link>
                </ProtectedElement>
                
                <ProtectedElement resource="content" action="read">
                  <Link href="/teacher/content">
                    <Button variant="outline" className="w-full h-20 flex flex-col gap-2" data-testid="button-content-library">
                      <BookOpen className="h-6 w-6" />
                      <span className="text-sm">Content Library</span>
                    </Button>
                  </Link>
                </ProtectedElement>
                
                <ProtectedElement resource="analytics" action="view_class_performance">
                  <Link href="/teacher/analytics">
                    <Button variant="outline" className="w-full h-20 flex flex-col gap-2" data-testid="button-analytics">
                      <BarChart3 className="h-6 w-6" />
                      <span className="text-sm">Analytics</span>
                    </Button>
                  </Link>
                </ProtectedElement>
                
                <ProtectedElement resource="students" action="read">
                  <Link href="/teacher/students">
                    <Button variant="outline" className="w-full h-20 flex flex-col gap-2" data-testid="button-manage-students">
                      <Users className="h-6 w-6" />
                      <span className="text-sm">Students</span>
                    </Button>
                  </Link>
                </ProtectedElement>
                
                <ProtectedElement resource="communication" action="send_messages">
                  <Link href="/teacher/communication">
                    <Button variant="outline" className="w-full h-20 flex flex-col gap-2" data-testid="button-communication">
                      <MessageSquare className="h-6 w-6" />
                      <span className="text-sm">Communication</span>
                    </Button>
                  </Link>
                </ProtectedElement>
                
                {/* Administrative Actions for Senior Teachers */}
                <RoleGuard allowedRoles={['department_head', 'senior_teacher']}>
                  <Button variant="outline" className="w-full h-20 flex flex-col gap-2" data-testid="button-department-analytics">
                    <Crown className="h-6 w-6 text-yellow-600" />
                    <span className="text-sm">Department Analytics</span>
                  </Button>
                </RoleGuard>
                
                <RoleGuard allowedRoles={['department_head']}>
                  <Button variant="outline" className="w-full h-20 flex flex-col gap-2" data-testid="button-manage-teachers">
                    <UserPlus className="h-6 w-6 text-blue-600" />
                    <span className="text-sm">Manage Teachers</span>
                  </Button>
                </RoleGuard>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Administrative Panel for Senior Teachers and Department Heads */}
        <RoleGuard allowedRoles={['department_head', 'senior_teacher']}>
          <div className="mt-8">
            <Card data-testid="card-admin-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Administrative Tools
                </CardTitle>
                <CardDescription>Advanced tools for {user?.role === 'department_head' ? 'department heads' : 'senior teachers'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <ProtectedElement resource="admin" action="view_department_analytics">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-3 mb-2">
                        <BarChart3 className="h-5 w-5 text-blue-600" />
                        <h4 className="font-semibold text-blue-900 dark:text-blue-100">Department Analytics</h4>
                      </div>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                        View department-wide performance metrics and reports
                      </p>
                      <Button size="sm" variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                        View Reports
                      </Button>
                    </div>
                  </ProtectedElement>
                  
                  <RoleGuard allowedRoles={['department_head']}>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-3 mb-2">
                        <UserPlus className="h-5 w-5 text-green-600" />
                        <h4 className="font-semibold text-green-900 dark:text-green-100">Teacher Management</h4>
                      </div>
                      <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                        Manage teacher roles, permissions, and assignments
                      </p>
                      <Button size="sm" variant="outline" className="border-green-300 text-green-700 hover:bg-green-100">
                        Manage Roles
                      </Button>
                    </div>
                  </RoleGuard>
                  
                  <ProtectedElement resource="admin" action="approve_content">
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center gap-3 mb-2">
                        <BookOpen className="h-5 w-5 text-purple-600" />
                        <h4 className="font-semibold text-purple-900 dark:text-purple-100">Content Approval</h4>
                      </div>
                      <p className="text-sm text-purple-700 dark:text-purple-300 mb-3">
                        Review and approve shared content from teachers
                      </p>
                      <Button size="sm" variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-100">
                        Review Content
                      </Button>
                    </div>
                  </ProtectedElement>
                </div>
              </CardContent>
            </Card>
          </div>
        </RoleGuard>
      </div>
    </div>
  );
}