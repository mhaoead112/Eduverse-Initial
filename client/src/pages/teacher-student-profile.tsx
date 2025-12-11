import React, { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiEndpoint, assetUrl } from "@/lib/config";
import {
  Loader2,
  ArrowLeft,
  User,
  Mail,
  Phone,
  GraduationCap,
  BookOpen,
  Trophy,
  Target,
  TrendingUp,
  Calendar,
  Clock,
  Award,
  Star,
  CheckCircle2,
  XCircle,
  BarChart3,
  FileText
} from "lucide-react";

interface StudentProfile {
  id: string;
  fullName: string;
  username: string;
  email: string;
  phone?: string;
  profilePicture?: string;
  bio?: string;
  grade?: string;
  createdAt: string;
}

interface EnrolledCourse {
  courseId: string;
  courseTitle: string;
  progress: number;
  grade?: string;
}

interface AssignmentStats {
  total: number;
  completed: number;
  pending: number;
  averageScore: number;
}

interface GradeInfo {
  courseTitle: string;
  assignmentTitle: string;
  score: number;
  maxScore: number;
  percentage: number;
  gradedAt: string;
}

export default function StudentProfilePage() {
  const [match, params] = useRoute("/teacher/students/:studentId");
  const studentId = params?.studentId;
  const [, setLocation] = useLocation();
  const { user, token } = useAuth();
  const { toast } = useToast();

  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [grades, setGrades] = useState<GradeInfo[]>([]);
  const [stats, setStats] = useState<AssignmentStats>({
    total: 0,
    completed: 0,
    pending: 0,
    averageScore: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const getAuthHeaders = (): Record<string, string> => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    if (!studentId) return;
    fetchStudentData();
  }, [studentId, token]);

  const fetchStudentData = async () => {
    setIsLoading(true);
    try {
      const headers = getAuthHeaders();

      // Fetch student profile
      const studentRes = await fetch(apiEndpoint(`/api/users/${studentId}`), { headers });
      if (studentRes.ok) {
        const studentData = await studentRes.json();
        setStudent(studentData.user || studentData);
      }

      // Fetch student enrollments
      const enrollmentsRes = await fetch(apiEndpoint(`/api/enrollments/student/${studentId}`), { headers });
      if (enrollmentsRes.ok) {
        const enrollmentsData = await enrollmentsRes.json();
        const enrollments = enrollmentsData.enrollments || enrollmentsData || [];
        setCourses(enrollments.map((e: any) => ({
          courseId: e.courseId,
          courseTitle: e.course?.title || 'Unknown Course',
          progress: Math.floor(Math.random() * 80) + 20, // Mock progress
          grade: e.grade
        })));
      }

      // Fetch student grades
      const gradesRes = await fetch(apiEndpoint(`/api/grades/student/${studentId}`), { headers });
      if (gradesRes.ok) {
        const gradesData = await gradesRes.json();
        const gradesList = gradesData.grades || gradesData || [];
        setGrades(gradesList.map((g: any) => ({
          courseTitle: g.courseName || 'Course',
          assignmentTitle: g.assignmentTitle || 'Assignment',
          score: parseFloat(g.score) || 0,
          maxScore: parseFloat(g.maxScore) || 100,
          percentage: ((parseFloat(g.score) || 0) / (parseFloat(g.maxScore) || 100)) * 100,
          gradedAt: g.gradedAt || g.createdAt
        })));

        // Calculate stats
        const totalScore = gradesList.reduce((sum: number, g: any) => sum + (parseFloat(g.score) || 0), 0);
        const totalMax = gradesList.reduce((sum: number, g: any) => sum + (parseFloat(g.maxScore) || 100), 0);
        setStats({
          total: gradesList.length,
          completed: gradesList.length,
          pending: 0,
          averageScore: totalMax > 0 ? (totalScore / totalMax) * 100 : 0
        });
      }
    } catch (error) {
      console.error("Error fetching student data:", error);
      toast({
        title: "Error",
        description: "Failed to load student profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600 bg-green-100';
    if (percentage >= 80) return 'text-blue-600 bg-blue-100';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-100';
    if (percentage >= 60) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getGradeLetter = (percentage: number) => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-500 mx-auto mb-4" />
            <p className="text-gray-500">Loading student profile...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!student) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="max-w-md">
            <CardContent className="pt-6 text-center">
              <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Student Not Found</h2>
              <p className="text-gray-500 mb-4">This student profile doesn't exist or you don't have access.</p>
              <Button onClick={() => setLocation('/teacher/students')}>
                Back to Students
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const initials = student.fullName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="gap-2 text-gray-600 hover:text-gray-900 -ml-2"
          onClick={() => setLocation('/teacher/students')}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Students
        </Button>

        {/* Profile Header */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-32 relative">
            <div className="absolute -bottom-12 left-6">
              <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                <AvatarImage src={student.profilePicture ? assetUrl(student.profilePicture) : undefined} />
                <AvatarFallback className="text-2xl bg-gradient-to-br from-indigo-400 to-purple-500 text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
          <CardContent className="pt-16 pb-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{student.fullName}</h1>
                <p className="text-gray-500">@{student.username}</p>
                {student.grade && (
                  <Badge className="mt-2 bg-indigo-100 text-indigo-700">
                    <GraduationCap className="h-3 w-3 mr-1" />
                    {student.grade}
                  </Badge>
                )}
              </div>
              
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  {student.email}
                </div>
                {student.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    {student.phone}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  Joined {new Date(student.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            {student.bio && (
              <p className="mt-4 text-gray-600 border-t pt-4">{student.bio}</p>
            )}
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
              <p className="text-sm text-gray-500">Classes Enrolled</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              <p className="text-sm text-gray-500">Completed</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-pink-50">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Trophy className="h-6 w-6 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.averageScore.toFixed(1)}%</p>
              <p className="text-sm text-gray-500">Average Score</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-amber-50 to-orange-50">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Award className="h-6 w-6 text-amber-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{getGradeLetter(stats.averageScore)}</p>
              <p className="text-sm text-gray-500">Overall Grade</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Tabs */}
        <Tabs defaultValue="courses" className="space-y-6">
          <TabsList className="bg-white border shadow-sm p-1 rounded-xl">
            <TabsTrigger value="courses" className="rounded-lg data-[state=active]:bg-indigo-500 data-[state=active]:text-white">
              Enrolled Classes
            </TabsTrigger>
            <TabsTrigger value="grades" className="rounded-lg data-[state=active]:bg-indigo-500 data-[state=active]:text-white">
              Grades
            </TabsTrigger>
            <TabsTrigger value="progress" className="rounded-lg data-[state=active]:bg-indigo-500 data-[state=active]:text-white">
              Progress
            </TabsTrigger>
          </TabsList>

          {/* Enrolled Courses Tab */}
          <TabsContent value="courses">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>Enrolled Classes</CardTitle>
              </CardHeader>
              <CardContent>
                {courses.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Not enrolled in any classes yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {courses.map((course) => (
                      <div
                        key={course.courseId}
                        className="flex items-center gap-4 p-4 rounded-xl border hover:border-indigo-200 hover:bg-indigo-50/50 transition-colors"
                      >
                        <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                          <BookOpen className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900">{course.courseTitle}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Progress value={course.progress} className="h-2 flex-1 max-w-[200px]" />
                            <span className="text-sm text-gray-500">{course.progress}%</span>
                          </div>
                        </div>
                        {course.grade && (
                          <Badge className={getGradeColor(parseFloat(course.grade))}>
                            {course.grade}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Grades Tab */}
          <TabsContent value="grades">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>Assignment Grades</CardTitle>
              </CardHeader>
              <CardContent>
                {grades.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No graded assignments yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {grades.map((grade, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-4 p-4 rounded-xl border"
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getGradeColor(grade.percentage)}`}>
                          <span className="font-bold">{getGradeLetter(grade.percentage)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900">{grade.assignmentTitle}</h4>
                          <p className="text-sm text-gray-500">{grade.courseTitle}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            {grade.score} / {grade.maxScore}
                          </p>
                          <p className="text-sm text-gray-500">{grade.percentage.toFixed(1)}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>Learning Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Overall Progress */}
                  <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">Overall Progress</h3>
                      <span className="text-2xl font-bold text-indigo-600">
                        {courses.length > 0 
                          ? Math.round(courses.reduce((sum, c) => sum + c.progress, 0) / courses.length)
                          : 0
                        }%
                      </span>
                    </div>
                    <Progress 
                      value={courses.length > 0 
                        ? courses.reduce((sum, c) => sum + c.progress, 0) / courses.length
                        : 0
                      } 
                      className="h-3" 
                    />
                  </div>

                  {/* Per-Course Progress */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Progress by Class</h3>
                    {courses.map((course) => (
                      <div key={course.courseId} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700">{course.courseTitle}</span>
                          <span className="font-medium text-gray-900">{course.progress}%</span>
                        </div>
                        <Progress value={course.progress} className="h-2" />
                      </div>
                    ))}
                  </div>

                  {/* Performance Summary */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="text-center p-4 bg-green-50 rounded-xl">
                      <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Performance</p>
                      <p className="font-semibold text-gray-900">
                        {stats.averageScore >= 80 ? 'Excellent' : 
                         stats.averageScore >= 60 ? 'Good' : 'Needs Improvement'}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-xl">
                      <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Completion Rate</p>
                      <p className="font-semibold text-gray-900">
                        {stats.total > 0 
                          ? Math.round((stats.completed / stats.total) * 100)
                          : 0
                        }%
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
