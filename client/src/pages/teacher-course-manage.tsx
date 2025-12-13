import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { 
  BookOpen, Users, FileText, Settings, Trash2, Edit, Plus,
  ArrowLeft, Calendar, Clock, TrendingUp, CheckCircle2, Loader2,
  UserPlus, X, Search, Megaphone, Pin
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiEndpoint } from "@/lib/config";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Course {
  id: string;
  title: string;
  description: string;
  status: string;
  teacherId: string;
  createdAt: string;
}

interface Lesson {
  id: string;
  title: string;
  content: string;
  videoUrl?: string;
  createdAt: string;
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
}

interface Enrollment {
  enrollmentId: string;
  enrolledAt: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentRole: string;
  progress?: number;
  completedAssignments?: number;
  totalAssignments?: number;
  averageScore?: number;
}

interface Student {
  id: string;
  fullName: string;
  email: string;
  username: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
}

export default function TeacherCourseManage() {
  const [, params] = useRoute("/teacher/courses/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, token, isAuthenticated, getAuthHeaders } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Announcement dialog states
  const [isAnnouncementDialogOpen, setIsAnnouncementDialogOpen] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [announcementPinned, setAnnouncementPinned] = useState(false);
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  
  // Enrollment states
  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [enrolling, setEnrolling] = useState(false);
  const [studentSearchTerm, setStudentSearchTerm] = useState("");
  const [loadingStudents, setLoadingStudents] = useState(false);

  const courseId = params?.id;

  // Handle redirect for 'create' courseId - must be in useEffect, not during render
  useEffect(() => {
    if (courseId === 'create') {
      setLocation('/teacher/courses/create');
    }
  }, [courseId, setLocation]);

  useEffect(() => {
    if (courseId && courseId !== 'create' && token && isAuthenticated) {
      fetchCourseData();
    } else if (!token || !isAuthenticated) {
      setLoading(false);
    }
  }, [courseId, token, isAuthenticated]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();

      // Fetch course details
      const courseRes = await fetch(apiEndpoint(`/api/courses/${courseId}`), { headers });
      if (courseRes.ok) {
        const courseData = await courseRes.json();
        setCourse(courseData);
        setEditTitle(courseData.title);
        setEditDescription(courseData.description);
      }

      // Fetch lessons
      const lessonsRes = await fetch(apiEndpoint(`/api/lessons/course/${courseId}`), { headers });
      if (lessonsRes.ok) {
        const lessonsData = await lessonsRes.json();
        setLessons(Array.isArray(lessonsData.lessons) ? lessonsData.lessons : []);
      }

      // Fetch assignments
      const assignmentsRes = await fetch(apiEndpoint(`/api/assignments/courses/${courseId}/assignments`), { headers });
      if (assignmentsRes.ok) {
        const assignmentsData = await assignmentsRes.json();
        setAssignments(Array.isArray(assignmentsData) ? assignmentsData : []);
      }

      // Fetch enrolled students
      const studentsRes = await fetch(apiEndpoint(`/api/enrollments/course/${courseId}`), { headers });
      if (studentsRes.ok) {
        const studentsData = await studentsRes.json();
        setEnrollments(Array.isArray(studentsData) ? studentsData : []);
      }

      // Fetch announcements
      const announcementsRes = await fetch(apiEndpoint(`/api/announcements/course/${courseId}`), { headers });
      if (announcementsRes.ok) {
        const announcementsData = await announcementsRes.json();
        setAnnouncements(announcementsData.announcements || []);
      }
    } catch (error) {
      console.error("Failed to fetch course data:", error);
      toast({
        title: "Error",
        description: "Failed to load course data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCourse = async () => {
    try {
      const response = await fetch(apiEndpoint(`/api/courses/${courseId}`), {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ title: editTitle, description: editDescription }),
      });

      if (response.ok) {
        toast({ title: "Success", description: "Class updated successfully" });
        setIsEditDialogOpen(false);
        fetchCourseData();
      } else {
        throw new Error("Failed to update course");
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update course", variant: "destructive" });
    }
  };

  // Fetch available students (not already enrolled)
  const fetchAvailableStudents = async () => {
    if (!token || !courseId) return;
    
    setLoadingStudents(true);
    try {
      // Use the enrollment API that already filters out enrolled students
      const response = await fetch(apiEndpoint(`/api/enrollments/students/available/${courseId}`), {
        headers: getAuthHeaders()
      });

      if (!response.ok) throw new Error('Failed to fetch students');

      const availableStudentsList = await response.json();
      
      // Map to expected format (API returns id, username, email)
      const available = availableStudentsList.map((s: any) => ({
        id: s.id,
        fullName: s.username, // Use username as display name
        email: s.email,
        username: s.username
      }));
      
      setAvailableStudents(available);
    } catch (err) {
      console.error('Failed to fetch students:', err);
      toast({
        title: "Error",
        description: "Failed to load students list",
        variant: "destructive"
      });
    } finally {
      setLoadingStudents(false);
    }
  };

  // Enroll selected student
  const handleEnrollStudent = async () => {
    if (!selectedStudentId || !courseId) {
      toast({
        title: "Error",
        description: "Please select a student",
        variant: "destructive"
      });
      return;
    }

    setEnrolling(true);
    try {
      // Use the enrollment API endpoint
      const response = await fetch(apiEndpoint('/api/enrollments/enroll'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ studentId: selectedStudentId, courseId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to enroll student');
      }

      const data = await response.json();
      
      toast({
        title: "Success",
        description: `${data.student?.fullName || 'Student'} has been enrolled in this course`
      });
      
      setIsEnrollDialogOpen(false);
      setSelectedStudentId("");
      setStudentSearchTerm("");
      fetchCourseData(); // Refresh enrollment list
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to enroll student",
        variant: "destructive"
      });
    } finally {
      setEnrolling(false);
    }
  };

  // Unenroll student
  const handleUnenrollStudent = async (enrollmentId: string, studentName: string) => {
    if (!confirm(`Are you sure you want to remove ${studentName} from this course?`)) return;

    try {
      // Use the enrollment API endpoint with enrollmentId
      const response = await fetch(apiEndpoint(`/api/enrollments/${enrollmentId}`), {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to unenroll student');
      }

      toast({
        title: "Success",
        description: `${studentName} has been removed from this course`
      });
      
      fetchCourseData(); // Refresh enrollment list
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to unenroll student",
        variant: "destructive"
      });
    }
  };

  // Create announcement
  const handleCreateAnnouncement = async () => {
    if (!announcementTitle.trim() || !announcementContent.trim()) {
      toast({
        title: "Error",
        description: "Please fill in both title and content",
        variant: "destructive"
      });
      return;
    }

    setSavingAnnouncement(true);
    try {
      const response = await fetch(apiEndpoint('/api/announcements'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          courseId,
          title: announcementTitle.trim(),
          content: announcementContent.trim(),
          isPinned: announcementPinned
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create announcement');
      }

      toast({
        title: "Success",
        description: "Announcement created successfully"
      });

      setIsAnnouncementDialogOpen(false);
      setAnnouncementTitle("");
      setAnnouncementContent("");
      setAnnouncementPinned(false);
      fetchCourseData();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create announcement",
        variant: "destructive"
      });
    } finally {
      setSavingAnnouncement(false);
    }
  };

  // Delete announcement
  const handleDeleteAnnouncement = async (announcementId: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
      const response = await fetch(apiEndpoint(`/api/announcements/${announcementId}`), {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to delete announcement');
      }

      toast({
        title: "Success",
        description: "Announcement deleted successfully"
      });

      fetchCourseData();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete announcement",
        variant: "destructive"
      });
    }
  };

  // Open enroll dialog and fetch students
  const openEnrollDialog = () => {
    setIsEnrollDialogOpen(true);
    fetchAvailableStudents();
  };

  // Filter students by search term
  const filteredStudents = availableStudents.filter(student =>
    student.fullName?.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
    student.username?.toLowerCase().includes(studentSearchTerm.toLowerCase())
  );

  if (loading && courseId !== 'create') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
        </div>
      </DashboardLayout>
    );
  }

  if (!course && courseId !== 'create') {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-slate-400">Class not found</p>
          <Button onClick={() => setLocation("/teacher/courses")} className="mt-4 bg-yellow-500 hover:bg-yellow-400 text-slate-900">
            Back to Courses
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // If courseId is 'create', show loading while useEffect handles redirect
  if (courseId === 'create') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
        </div>
      </DashboardLayout>
    );
  }

  // At this point, course must exist (due to checks above)
  if (!course) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-10">
        {/* Enhanced Header */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setLocation("/teacher/courses")}
                className="hover:bg-slate-700/50 text-slate-400 hover:text-white"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{course.title}</h1>
                <p className="text-slate-400 max-w-2xl">{course.description}</p>
                <div className="flex items-center gap-3 mt-3">
                  <Badge variant="outline" className="bg-slate-700/50 border-slate-600 text-slate-300">
                    <Calendar className="h-3 w-3 mr-1" />
                    Created {new Date(course.createdAt).toLocaleDateString()}
                  </Badge>
                  <Badge className="bg-green-500/20 text-green-400 hover:bg-green-500/30">
                    {course.status}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(true)} className="bg-slate-700/50 border-slate-600 text-white hover:bg-slate-700">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button onClick={() => setLocation(`/teacher/courses/${courseId}/lessons/create`)} className="bg-yellow-500 hover:bg-yellow-400 text-slate-900">
                <Plus className="h-4 w-4 mr-2" />
                Add Lesson
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card className="bg-slate-800/50 border border-slate-700/50 shadow-lg rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-400 mb-1">Students Enrolled</p>
                  <h3 className="text-4xl font-bold text-white">{enrollments.length}</h3>
                  <p className="text-xs text-slate-400 mt-1">Active learners</p>
                </div>
                <div className="w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg">
                  <Users className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border border-slate-700/50 shadow-lg rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-400 mb-1">Total Lessons</p>
                  <h3 className="text-4xl font-bold text-white">{lessons.length}</h3>
                  <p className="text-xs text-slate-400 mt-1">Content modules</p>
                </div>
                <div className="w-14 h-14 rounded-xl bg-green-600 flex items-center justify-center shadow-lg">
                  <BookOpen className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border border-slate-700/50 shadow-lg rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-400 mb-1">Assignments</p>
                  <h3 className="text-4xl font-bold text-white">{assignments.length}</h3>
                  <p className="text-xs text-slate-400 mt-1">Active tasks</p>
                </div>
                <div className="w-14 h-14 rounded-xl bg-orange-600 flex items-center justify-center shadow-lg">
                  <FileText className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Content Tabs */}
        <Tabs defaultValue="lessons" className="space-y-4">
          <TabsList className="bg-slate-800/50 border border-slate-700/50 p-1 shadow-sm">
            <TabsTrigger value="lessons" className="text-slate-400 data-[state=active]:bg-yellow-500 data-[state=active]:text-slate-900">
              <BookOpen className="h-4 w-4 mr-2" />
              Lessons ({lessons.length})
            </TabsTrigger>
            <TabsTrigger value="assignments" className="text-slate-400 data-[state=active]:bg-yellow-500 data-[state=active]:text-slate-900">
              <FileText className="h-4 w-4 mr-2" />
              Assignments ({assignments.length})
            </TabsTrigger>
            <TabsTrigger value="students" className="text-slate-400 data-[state=active]:bg-yellow-500 data-[state=active]:text-slate-900">
              <Users className="h-4 w-4 mr-2" />
              Students ({enrollments.length})
            </TabsTrigger>
            <TabsTrigger value="announcements" className="text-slate-400 data-[state=active]:bg-yellow-500 data-[state=active]:text-slate-900">
              <Megaphone className="h-4 w-4 mr-2" />
              Announcements ({announcements.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lessons" className="space-y-4">
            {lessons.length === 0 ? (
              <Card className="bg-slate-800/50 border border-slate-700/50">
                <CardContent className="py-12 text-center">
                  <BookOpen className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                  <p className="text-slate-400">No lessons yet. Create your first lesson!</p>
                  <Button 
                    className="mt-4 bg-yellow-500 hover:bg-yellow-400 text-slate-900" 
                    onClick={() => setLocation(`/teacher/courses/${courseId}/lessons/create`)}
                  >
                    Create Lesson
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {lessons.map((lesson) => (
                  <Card key={lesson.id} className="bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2 text-white">{lesson.title}</h3>
                          <p className="text-sm text-slate-400 line-clamp-2">{lesson.content}</p>
                          <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(lesson.createdAt).toLocaleDateString()}
                            </span>
                            {lesson.videoUrl && (
                              <Badge variant="secondary" className="bg-slate-700 text-slate-300">Has Video</Badge>
                            )}
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setLocation(`/teacher/courses/${courseId}/lessons/${lesson.id}`)}
                          className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                        >
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="assignments" className="space-y-4">
            {assignments.length === 0 ? (
              <Card className="bg-slate-800/50 border border-slate-700/50">
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                  <p className="text-slate-400">No assignments yet.</p>
                  <Button 
                    className="mt-4 bg-yellow-500 hover:bg-yellow-400 text-slate-900"
                    onClick={() => setLocation('/teacher/assignments')}
                  >
                    Create Assignment
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {assignments.map((assignment) => (
                  <Card key={assignment.id} className="bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2 text-white">{assignment.title}</h3>
                          <p className="text-sm text-slate-400 mb-3">{assignment.description}</p>
                          <div className="flex items-center gap-4 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              Due: {new Date(assignment.dueDate).toLocaleDateString()}
                            </span>
                            <span>Max Score: {assignment.maxScore}</span>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setLocation(`/teacher/assignments/${assignment.id}`)}
                          className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                        >
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="students" className="space-y-4">
            {/* Enroll Student Button */}
            <div className="flex justify-end">
              <Button onClick={openEnrollDialog} className="bg-yellow-500 hover:bg-yellow-400 text-slate-900">
                <UserPlus className="h-4 w-4 mr-2" />
                Enroll Student
              </Button>
            </div>

            {enrollments.length === 0 ? (
              <Card className="bg-slate-800/50 border border-slate-700/50">
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                  <p className="text-slate-400 mb-4">No students enrolled yet.</p>
                  <Button onClick={openEnrollDialog} className="bg-yellow-500 hover:bg-yellow-400 text-slate-900">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Enroll Your First Student
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {enrollments.map((enrollment) => (
                  <Card key={enrollment.enrollmentId} className="bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                            {enrollment.studentName?.charAt(0) || 'S'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white">{enrollment.studentName || 'Student'}</h3>
                            <p className="text-sm text-slate-400">{enrollment.studentEmail}</p>
                            <p className="text-xs text-slate-500 mt-1">
                              Enrolled {new Date(enrollment.enrolledAt).toLocaleDateString()}
                            </p>
                            
                            {/* Progress Section */}
                            <div className="mt-3 space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-400">Course Progress</span>
                                <span className="font-medium text-white">{enrollment.progress ?? 0}%</span>
                              </div>
                              <Progress value={enrollment.progress ?? 0} className="h-2" />
                              <div className="flex items-center gap-4 text-xs text-slate-500">
                                <span className="flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                                  {enrollment.completedAssignments ?? 0}/{enrollment.totalAssignments ?? 0} assignments
                                </span>
                                {enrollment.averageScore !== undefined && enrollment.averageScore > 0 && (
                                  <span className="flex items-center gap-1">
                                    <TrendingUp className="h-3 w-3 text-blue-500" />
                                    {enrollment.averageScore}% avg score
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setLocation(`/teacher/students/${enrollment.studentId}`)}
                            className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                          >
                            View Details
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/30 border-slate-600"
                            onClick={() => handleUnenrollStudent(enrollment.enrollmentId, enrollment.studentName)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Announcements Tab */}
          <TabsContent value="announcements" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setIsAnnouncementDialogOpen(true)} className="bg-yellow-500 hover:bg-yellow-400 text-slate-900">
                <Plus className="h-4 w-4 mr-2" />
                New Announcement
              </Button>
            </div>

            {announcements.length === 0 ? (
              <Card className="bg-slate-800/50 border border-slate-700/50">
                <CardContent className="py-12 text-center">
                  <Megaphone className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                  <p className="text-slate-400 mb-4">No announcements yet.</p>
                  <Button onClick={() => setIsAnnouncementDialogOpen(true)} className="bg-yellow-500 hover:bg-yellow-400 text-slate-900">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Announcement
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {announcements.map((announcement) => (
                  <Card key={announcement.id} className="bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg text-white">{announcement.title}</h3>
                            {announcement.isPinned && (
                              <Badge variant="secondary" className="bg-amber-500/20 text-amber-400">
                                <Pin className="h-3 w-3 mr-1" />
                                Pinned
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-400 mb-3 whitespace-pre-wrap">{announcement.content}</p>
                          <p className="text-xs text-slate-500">
                            Posted {new Date(announcement.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/30 border-slate-600"
                          onClick={() => handleDeleteAnnouncement(announcement.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Edit Course Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Course</DialogTitle>
              <DialogDescription className="text-slate-400">Update course information</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-white">Course Title</Label>
                <Input
                  id="title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                />
              </div>
              <div>
                <Label htmlFor="description" className="text-white">Description</Label>
                <Textarea
                  id="description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={4}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">
                Cancel
              </Button>
              <Button onClick={handleUpdateCourse} className="bg-yellow-500 hover:bg-yellow-400 text-slate-900">Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Enroll Student Dialog */}
        <Dialog open={isEnrollDialogOpen} onOpenChange={setIsEnrollDialogOpen}>
          <DialogContent className="max-w-md bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Enroll Student</DialogTitle>
              <DialogDescription className="text-slate-400">
                Select a student to enroll in this course
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search students..."
                  value={studentSearchTerm}
                  onChange={(e) => setStudentSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                />
              </div>

              {/* Student Selection */}
              {loadingStudents ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-yellow-500" />
                  <span className="ml-2 text-slate-400">Loading students...</span>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="py-8 text-center text-slate-500">
                  {studentSearchTerm ? "No students match your search" : "No available students to enroll"}
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto border border-slate-700 rounded-lg divide-y divide-slate-700">
                  {filteredStudents.map((student) => (
                    <div
                      key={student.id}
                      className={`p-3 cursor-pointer hover:bg-slate-700/50 transition-colors flex items-center gap-3 ${
                        selectedStudentId === student.id ? 'bg-yellow-500/20 border-l-4 border-yellow-500' : ''
                      }`}
                      onClick={() => setSelectedStudentId(student.id)}
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                        {student.fullName?.charAt(0) || 'S'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">{student.fullName}</p>
                        <p className="text-sm text-slate-400 truncate">{student.email}</p>
                      </div>
                      {selectedStudentId === student.id && (
                        <CheckCircle2 className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsEnrollDialogOpen(false);
                  setSelectedStudentId("");
                  setStudentSearchTerm("");
                }}
                className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleEnrollStudent}
                disabled={!selectedStudentId || enrolling}
                className="bg-yellow-500 hover:bg-yellow-400 text-slate-900"
              >
                {enrolling ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enrolling...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Enroll Student
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Announcement Dialog */}
        <Dialog open={isAnnouncementDialogOpen} onOpenChange={setIsAnnouncementDialogOpen}>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Create Announcement</DialogTitle>
              <DialogDescription className="text-slate-400">
                Share important updates with your students
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="announcementTitle" className="text-white">Title</Label>
                <Input
                  id="announcementTitle"
                  placeholder="Announcement title..."
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                />
              </div>
              <div>
                <Label htmlFor="announcementContent" className="text-white">Content</Label>
                <Textarea
                  id="announcementContent"
                  placeholder="Write your announcement here..."
                  value={announcementContent}
                  onChange={(e) => setAnnouncementContent(e.target.value)}
                  rows={5}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="announcementPinned"
                  checked={announcementPinned}
                  onChange={(e) => setAnnouncementPinned(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-700"
                />
                <Label htmlFor="announcementPinned" className="text-sm font-normal text-slate-300">
                  Pin this announcement (will appear at the top)
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAnnouncementDialogOpen(false)} className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">
                Cancel
              </Button>
              <Button 
                onClick={handleCreateAnnouncement} 
                disabled={savingAnnouncement || !announcementTitle.trim() || !announcementContent.trim()}
                className="bg-yellow-500 hover:bg-yellow-400 text-slate-900"
              >
                {savingAnnouncement ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Megaphone className="h-4 w-4 mr-2" />
                    Create Announcement
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
