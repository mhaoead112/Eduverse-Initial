import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  ClipboardList, Clock, CheckCircle, AlertCircle, Calendar,
  Filter, Download, Upload, FileText, Play, Search,
  ArrowUpDown, ChevronDown
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

interface Assignment {
  id: string;
  title: string;
  course: string;
  courseColor: string;
  dueDate: string;
  dueTime: string;
  status: 'pending' | 'in-progress' | 'completed' | 'late';
  priority: 'high' | 'medium' | 'low';
  points: number;
  earnedPoints?: number;
  description: string;
  type: 'essay' | 'quiz' | 'project' | 'homework' | 'exam';
  submissions: number;
  maxSubmissions: number;
}

// Mock data - Replace with actual API call
const mockAssignments: Assignment[] = [
  {
    id: '1',
    title: 'Calculus Problem Set #5',
    course: 'Advanced Mathematics',
    courseColor: 'blue',
    dueDate: 'Today',
    dueTime: '11:59 PM',
    status: 'pending',
    priority: 'high',
    points: 100,
    description: 'Complete problems 1-20 from Chapter 5. Show all work and explain your reasoning.',
    type: 'homework',
    submissions: 0,
    maxSubmissions: 3
  },
  {
    id: '2',
    title: 'Lab Report: Electromagnetic Waves',
    course: 'Physics Laboratory',
    courseColor: 'green',
    dueDate: 'Tomorrow',
    dueTime: '5:00 PM',
    status: 'in-progress',
    priority: 'medium',
    points: 150,
    description: 'Write a comprehensive lab report including hypothesis, methodology, results, and conclusion.',
    type: 'project',
    submissions: 1,
    maxSubmissions: 2
  },
  {
    id: '3',
    title: 'Essay: Modern Poetry Analysis',
    course: 'English Literature',
    courseColor: 'purple',
    dueDate: 'Friday',
    dueTime: '2:00 PM',
    status: 'pending',
    priority: 'medium',
    points: 100,
    description: 'Analyze three modern poems and discuss their themes, literary devices, and cultural context.',
    type: 'essay',
    submissions: 0,
    maxSubmissions: 1
  },
  {
    id: '4',
    title: 'Programming Project: Web Application',
    course: 'Computer Science',
    courseColor: 'orange',
    dueDate: 'Next Monday',
    dueTime: '11:59 PM',
    status: 'completed',
    priority: 'low',
    points: 200,
    earnedPoints: 195,
    description: 'Build a full-stack web application using React and Node.js with user authentication.',
    type: 'project',
    submissions: 1,
    maxSubmissions: 1
  },
  {
    id: '5',
    title: 'Chemistry Quiz: Organic Compounds',
    course: 'Chemistry',
    courseColor: 'red',
    dueDate: 'Yesterday',
    dueTime: '10:00 AM',
    status: 'late',
    priority: 'high',
    points: 50,
    description: 'Online quiz covering organic chemistry fundamentals and nomenclature.',
    type: 'quiz',
    submissions: 0,
    maxSubmissions: 1
  },
  {
    id: '6',
    title: 'History Essay: Industrial Revolution',
    course: 'World History',
    courseColor: 'yellow',
    dueDate: 'Next Week',
    dueTime: '11:59 PM',
    status: 'pending',
    priority: 'low',
    points: 100,
    description: 'Discuss the social and economic impacts of the Industrial Revolution on modern society.',
    type: 'essay',
    submissions: 0,
    maxSubmissions: 2
  }
];

const statusConfig = {
  pending: { label: 'To Do', icon: AlertCircle, color: 'text-orange-600 bg-orange-50 border-orange-200' },
  'in-progress': { label: 'In Progress', icon: Clock, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  completed: { label: 'Completed', icon: CheckCircle, color: 'text-green-600 bg-green-50 border-green-200' },
  late: { label: 'Late', icon: AlertCircle, color: 'text-red-600 bg-red-50 border-red-200' }
};

const priorityConfig = {
  high: { color: 'bg-red-500', label: 'High Priority' },
  medium: { color: 'bg-yellow-500', label: 'Medium Priority' },
  low: { color: 'bg-green-500', label: 'Low Priority' }
};

const typeConfig = {
  essay: { label: 'Essay', icon: FileText },
  quiz: { label: 'Quiz', icon: ClipboardList },
  project: { label: 'Project', icon: Upload },
  homework: { label: 'Homework', icon: FileText },
  exam: { label: 'Exam', icon: AlertCircle }
};

function AssignmentCard({ assignment }: { assignment: Assignment }) {
  const statusInfo = statusConfig[assignment.status];
  const StatusIcon = statusInfo.icon;
  const typeInfo = typeConfig[assignment.type];
  const TypeIcon = typeInfo.icon;

  return (
    <Card className={`hover:shadow-lg transition-all duration-300 border-l-4 ${statusInfo.color}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                {assignment.course}
              </Badge>
              <Badge 
                variant="secondary" 
                className={`text-xs ${priorityConfig[assignment.priority].color} text-white`}
              >
                {priorityConfig[assignment.priority].label}
              </Badge>
            </div>
            <CardTitle className="text-lg mb-1">{assignment.title}</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {assignment.description}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className={`flex items-center gap-1 text-sm ${statusInfo.color.split(' ')[0]} px-2 py-1 rounded`}>
              <StatusIcon className="h-4 w-4" />
              <span className="font-medium">{statusInfo.label}</span>
            </div>
            <TypeIcon className="h-5 w-5 text-gray-400" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600 dark:text-gray-400">Due Date</p>
            <p className="font-medium flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {assignment.dueDate}
            </p>
            <p className="text-xs text-gray-500">{assignment.dueTime}</p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400">Points</p>
            <p className="font-medium">
              {assignment.status === 'completed' && assignment.earnedPoints
                ? `${assignment.earnedPoints}/${assignment.points}`
                : assignment.points
              }
            </p>
            {assignment.status === 'completed' && assignment.earnedPoints && (
              <Progress 
                value={(assignment.earnedPoints / assignment.points) * 100} 
                className="h-1 mt-1" 
              />
            )}
          </div>
        </div>

        <div className="text-sm">
          <p className="text-gray-600 dark:text-gray-400">Submissions</p>
          <p className="font-medium">{assignment.submissions} / {assignment.maxSubmissions}</p>
          <Progress 
            value={(assignment.submissions / assignment.maxSubmissions) * 100} 
            className="h-1 mt-1" 
          />
        </div>

        <div className="flex gap-2">
          {assignment.status === 'completed' ? (
            <>
              <Button variant="outline" size="sm" className="flex-1">
                <Download className="h-4 w-4 mr-1" />
                View Submission
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                <FileText className="h-4 w-4 mr-1" />
                Feedback
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" className="flex-1">
                <FileText className="h-4 w-4 mr-1" />
                View Details
              </Button>
              <Button size="sm" className="flex-1 bg-eduverse-blue hover:bg-eduverse-blue/90">
                <Play className="h-4 w-4 mr-1" />
                {assignment.status === 'in-progress' ? 'Continue' : 'Start'}
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function StudentAssignments() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCourse, setFilterCourse] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("dueDate");

  // Filter and sort assignments
  const filteredAssignments = mockAssignments
    .filter(assignment => {
      const matchesSearch = assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           assignment.course.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === "all" || assignment.status === filterStatus;
      const matchesCourse = filterCourse === "all" || assignment.course === filterCourse;
      return matchesSearch && matchesStatus && matchesCourse;
    })
    .sort((a, b) => {
      if (sortBy === "dueDate") {
        // Simple sort by due date string
        return a.dueDate.localeCompare(b.dueDate);
      } else if (sortBy === "priority") {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return 0;
    });

  const stats = {
    total: mockAssignments.length,
    pending: mockAssignments.filter(a => a.status === 'pending').length,
    inProgress: mockAssignments.filter(a => a.status === 'in-progress').length,
    completed: mockAssignments.filter(a => a.status === 'completed').length,
    late: mockAssignments.filter(a => a.status === 'late').length
  };

  const uniqueCourses = Array.from(new Set(mockAssignments.map(a => a.course)));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Assignments</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage and track all your assignments in one place
            </p>
          </div>
          <Button className="bg-eduverse-blue hover:bg-eduverse-blue/90">
            <Upload className="h-4 w-4 mr-2" />
            Submit Assignment
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-orange-500">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">To Do</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-blue-500">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-green-500">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-red-500">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Late</p>
                <p className="text-2xl font-bold text-red-600">{stats.late}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search assignments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">To Do</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterCourse} onValueChange={setFilterCourse}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Filter by course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {uniqueCourses.map(course => (
                    <SelectItem key={course} value={course}>{course}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dueDate">Due Date</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Assignments List */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">
              All ({filteredAssignments.length})
            </TabsTrigger>
            <TabsTrigger value="upcoming">
              Upcoming ({filteredAssignments.filter(a => a.status === 'pending').length})
            </TabsTrigger>
            <TabsTrigger value="in-progress">
              In Progress ({filteredAssignments.filter(a => a.status === 'in-progress').length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({filteredAssignments.filter(a => a.status === 'completed').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredAssignments.map(assignment => (
                <AssignmentCard key={assignment.id} assignment={assignment} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredAssignments.filter(a => a.status === 'pending').map(assignment => (
                <AssignmentCard key={assignment.id} assignment={assignment} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="in-progress" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredAssignments.filter(a => a.status === 'in-progress').map(assignment => (
                <AssignmentCard key={assignment.id} assignment={assignment} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredAssignments.filter(a => a.status === 'completed').map(assignment => (
                <AssignmentCard key={assignment.id} assignment={assignment} />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {filteredAssignments.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <ClipboardList className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No assignments found</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Try adjusting your filters or search query
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
