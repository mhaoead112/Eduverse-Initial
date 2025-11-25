import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Users, 
  Search, 
  MessageSquare, 
  TrendingUp, 
  Award,
  Calendar,
  Clock,
  FileText,
  Send,
  Filter,
  Eye,
  Mail,
  Phone,
  GraduationCap,
  AlertCircle
} from "lucide-react";

interface Student {
  id: string;
  username: string;
  fullName: string;
  email: string;
  classId: string;
  className: string;
  enrolledAt: string;
  attendance: {
    present: number;
    absent: number;
    late: number;
    total: number;
  };
  grades: {
    average: number;
    assignments: number;
    quizzes: number;
    exams: number;
  };
  lastActivity: string;
  status: 'active' | 'inactive' | 'struggling';
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  targetType: 'class' | 'student';
  targetId: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  createdAt: string;
  readBy: string[];
}

export default function TeacherStudents() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isAnnouncementDialogOpen, setIsAnnouncementDialogOpen] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [announcementPriority, setAnnouncementPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');

  // Mock student data
  const mockStudents: Student[] = [
    {
      id: "1",
      username: "sarah.johnson",
      fullName: "Sarah Johnson",
      email: "sarah.johnson@student.edu",
      classId: "1",
      className: "Algebra I",
      enrolledAt: "2024-01-15T00:00:00Z",
      attendance: { present: 45, absent: 3, late: 2, total: 50 },
      grades: { average: 88, assignments: 85, quizzes: 90, exams: 92 },
      lastActivity: "2024-01-20T10:30:00Z",
      status: 'active'
    },
    {
      id: "2",
      username: "mike.chen",
      fullName: "Mike Chen",
      email: "mike.chen@student.edu",
      classId: "1",
      className: "Algebra I",
      enrolledAt: "2024-01-15T00:00:00Z",
      attendance: { present: 42, absent: 6, late: 2, total: 50 },
      grades: { average: 72, assignments: 70, quizzes: 75, exams: 71 },
      lastActivity: "2024-01-19T14:15:00Z",
      status: 'struggling'
    },
    {
      id: "3",
      username: "emma.davis",
      fullName: "Emma Davis",
      email: "emma.davis@student.edu",
      classId: "2",
      className: "Biology 101",
      enrolledAt: "2024-01-20T00:00:00Z",
      attendance: { present: 48, absent: 1, late: 1, total: 50 },
      grades: { average: 95, assignments: 96, quizzes: 94, exams: 95 },
      lastActivity: "2024-01-20T16:45:00Z",
      status: 'active'
    }
  ];

  const mockClasses = [
    { id: "1", name: "Algebra I" },
    { id: "2", name: "Biology 101" }
  ];

  // Filter students based on search and class selection
  const filteredStudents = mockStudents.filter(student => {
    const matchesSearch = student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClass === "all" || student.classId === selectedClass;
    return matchesSearch && matchesClass;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'struggling': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAttendancePercentage = (attendance: Student['attendance']) => {
    return Math.round((attendance.present / attendance.total) * 100);
  };

  const sendAnnouncement = () => {
    // Mock sending announcement
    console.log('Sending announcement:', {
      title: announcementTitle,
      content: announcementContent,
      priority: announcementPriority,
      targetType: selectedStudent ? 'student' : 'class',
      targetId: selectedStudent?.id || selectedClass
    });
    
    // Reset form and close dialog
    setAnnouncementTitle("");
    setAnnouncementContent("");
    setAnnouncementPriority('normal');
    setIsAnnouncementDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Student Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              View student profiles, monitor progress, and manage communications
            </p>
          </div>
          
          <Dialog open={isAnnouncementDialogOpen} onOpenChange={setIsAnnouncementDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-announcement">
                <Send className="h-4 w-4 mr-2" />
                Send Announcement
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Announcement</DialogTitle>
                <DialogDescription>
                  Send an announcement to {selectedStudent ? selectedStudent.fullName : "all students"}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Announcement title"
                    value={announcementTitle}
                    onChange={(e) => setAnnouncementTitle(e.target.value)}
                    data-testid="input-announcement-title"
                  />
                </div>
                
                <div>
                  <Label htmlFor="content">Message</Label>
                  <Textarea
                    id="content"
                    placeholder="Write your announcement here..."
                    value={announcementContent}
                    onChange={(e) => setAnnouncementContent(e.target.value)}
                    rows={4}
                    data-testid="textarea-announcement-content"
                  />
                </div>
                
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={announcementPriority} onValueChange={(value: any) => setAnnouncementPriority(value)}>
                    <SelectTrigger data-testid="select-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setIsAnnouncementDialogOpen(false)} data-testid="button-cancel-announcement">
                    Cancel
                  </Button>
                  <Button onClick={sendAnnouncement} data-testid="button-send-announcement">
                    Send Announcement
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search students by name, username, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-students"
              />
            </div>
          </div>
          
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-48" data-testid="select-class-filter">
              <SelectValue placeholder="Filter by class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {mockClasses.map((classItem) => (
                <SelectItem key={classItem.id} value={classItem.id}>
                  {classItem.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Students Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student) => (
            <Card key={student.id} className="hover:shadow-lg transition-shadow" data-testid={`student-card-${student.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.username}`} />
                      <AvatarFallback>
                        {student.fullName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{student.fullName}</CardTitle>
                      <CardDescription>@{student.username}</CardDescription>
                    </div>
                  </div>
                  <Badge className={getStatusColor(student.status)}>
                    {student.status}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                      <GraduationCap className="h-4 w-4" />
                      Class
                    </span>
                    <span className="font-medium">{student.className}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                      <Award className="h-4 w-4" />
                      Average Grade
                    </span>
                    <span className="font-medium">{student.grades.average}%</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                      <Calendar className="h-4 w-4" />
                      Attendance
                    </span>
                    <span className="font-medium">{getAttendancePercentage(student.attendance)}%</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                      <Clock className="h-4 w-4" />
                      Last Active
                    </span>
                    <span className="font-medium">
                      {new Date(student.lastActivity).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {student.status === 'struggling' && (
                    <div className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm text-yellow-700 dark:text-yellow-300">
                        Needs attention
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => setSelectedStudent(student)}
                    data-testid={`button-view-profile-${student.id}`}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View Profile
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedStudent(student);
                      setIsAnnouncementDialogOpen(true);
                    }}
                    data-testid={`button-message-${student.id}`}
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Empty State */}
        {filteredStudents.length === 0 && (
          <Card className="text-center py-12" data-testid="empty-state">
            <CardContent>
              <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No students found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm || selectedClass !== "all" 
                  ? "Try adjusting your search or filter criteria"
                  : "Students will appear here once they enroll in your classes"
                }
              </p>
            </CardContent>
          </Card>
        )}

        {/* Student Profile Modal */}
        {selectedStudent && (
          <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
            <DialogContent className="max-w-4xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedStudent.username}`} />
                    <AvatarFallback>
                      {selectedStudent.fullName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  {selectedStudent.fullName}
                  <Badge className={getStatusColor(selectedStudent.status)}>
                    {selectedStudent.status}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  Student profile and academic progress
                </DialogDescription>
              </DialogHeader>
              
              <ScrollArea className="max-h-[60vh]">
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="grades">Grades</TabsTrigger>
                    <TabsTrigger value="attendance">Attendance</TabsTrigger>
                    <TabsTrigger value="messages">Messages</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">Contact Information</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            {selectedStudent.email}
                          </div>
                          <div className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4 text-gray-400" />
                            {selectedStudent.className}
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-2">Academic Summary</h4>
                        <div className="space-y-2 text-sm">
                          <div>Overall Average: <span className="font-medium">{selectedStudent.grades.average}%</span></div>
                          <div>Attendance: <span className="font-medium">{getAttendancePercentage(selectedStudent.attendance)}%</span></div>
                          <div>Enrolled: <span className="font-medium">{new Date(selectedStudent.enrolledAt).toLocaleDateString()}</span></div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="grades" className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Assignments</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{selectedStudent.grades.assignments}%</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Quizzes</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{selectedStudent.grades.quizzes}%</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Exams</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{selectedStudent.grades.exams}%</div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="attendance" className="space-y-4">
                    <div className="grid grid-cols-4 gap-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm text-green-600">Present</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{selectedStudent.attendance.present}</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm text-red-600">Absent</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{selectedStudent.attendance.absent}</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm text-yellow-600">Late</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{selectedStudent.attendance.late}</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Total</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{selectedStudent.attendance.total}</div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="messages" className="space-y-4">
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h4 className="text-lg font-semibold mb-2">Message History</h4>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        View and send messages to {selectedStudent.fullName}
                      </p>
                      <Button onClick={() => setIsAnnouncementDialogOpen(true)}>
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}