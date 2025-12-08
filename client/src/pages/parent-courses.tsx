import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { 
  BookOpen, GraduationCap, User, TrendingUp, 
  CheckCircle2, Clock, Award, ChevronRight
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Child {
  id: string;
  fullName: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  teacher: {
    id: string;
    name: string;
    email: string;
  };
  enrolledAt: Date;
  progress: {
    percentage: number;
    completedAssignments: number;
    totalAssignments: number;
    totalLessons: number;
  };
  currentScore: number; // Percentage score instead of letter grade
  isPublished: boolean;
}

export default function ParentCourses() {
  const { token } = useAuth();
  const [, setLocation] = useLocation();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChildren();
  }, [token]);

  useEffect(() => {
    if (selectedChild) {
      fetchCourses();
    }
  }, [selectedChild, token]);

  const fetchChildren = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/parent/children', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setChildren(data.children || []);
        if (data.children?.length > 0 && !selectedChild) {
          setSelectedChild(data.children[0].id);
        }
      } else if (response.status === 401) {
        setLocation('/login');
      }
    } catch (error) {
      console.error('Error fetching children:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    if (!token || !selectedChild) return;

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/parent/children/${selectedChild}/courses`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || []);
      } else if (response.status === 401) {
        setLocation('/login');
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-700';
    if (score >= 80) return 'bg-blue-100 text-blue-700';
    if (score >= 70) return 'bg-yellow-100 text-yellow-700';
    if (score >= 60) return 'bg-orange-100 text-orange-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Modern Header with Gradient */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-pink-500 to-purple-700 p-6 text-white shadow-xl">
          <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-3">
                  <BookOpen className="h-7 w-7" />
                  Enrolled Courses
                </h1>
                <p className="text-purple-100 mt-1">Track your child's course progress and performance</p>
              </div>
              {children.length > 0 && (
                <Select value={selectedChild} onValueChange={setSelectedChild}>
                  <SelectTrigger className="w-64 bg-white/20 border-white/30 text-white hover:bg-white/30">
                    <SelectValue placeholder="Select child" />
                  </SelectTrigger>
                  <SelectContent>
                    {children.map((child) => (
                      <SelectItem key={child.id} value={child.id}>
                        {child.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </div>

        {/* Loading State with Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="hover:shadow-lg transition-shadow">
                <CardHeader className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Skeleton className="h-6 w-48 mb-2" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-8 w-12" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Skeleton className="h-10 flex-1" />
                    <Skeleton className="h-10 w-10" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && courses.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Courses Enrolled
              </h3>
              <p className="text-gray-500">
                This child is not enrolled in any courses yet.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Courses Grid */}
        {!loading && courses.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {courses.map((course) => (
              <Card key={course.id} className="relative overflow-hidden border-2 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-400/10 to-transparent rounded-bl-full"></div>
                <CardHeader className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2 group-hover:text-purple-600 transition-colors">{course.title}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="h-4 w-4" />
                        <span>{course.teacher.name}</span>
                      </div>
                    </div>
                    <Badge className={`${getScoreColor(course.currentScore || 0)} text-lg font-bold px-3 py-1 shadow-sm`}>
                      {course.currentScore ? `${Math.round(course.currentScore)}%` : 'N/A'}
                    </Badge>
                  </div>

                  {course.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {course.description}
                    </p>
                  )}
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Overall Progress</span>
                      <span className="font-semibold text-purple-600">
                        {course.progress.percentage}%
                      </span>
                    </div>
                    <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                        style={{ width: `${course.progress.percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <div className="text-center p-2 rounded-lg bg-gray-50">
                      <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mb-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Tasks</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        {course.progress.completedAssignments}/{course.progress.totalAssignments}
                      </p>
                    </div>

                    <div className="text-center p-2 rounded-lg bg-gray-50">
                      <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mb-1">
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>Lessons</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        {course.progress.totalLessons}
                      </p>
                    </div>

                    <div className="text-center p-2 rounded-lg bg-gray-50">
                      <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mb-1">
                        <Award className="h-3.5 w-3.5" />
                        <span>Score</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        {course.currentScore ? `${Math.round(course.currentScore)}%` : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      className="flex-1 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 transition-all"
                      onClick={() => setLocation(`/parent/courses/${course.id}/lessons?child=${selectedChild}`)}
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      View Lessons
                    </Button>
                    <Button
                      variant="outline"
                      className="hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 transition-all"
                      onClick={() => setLocation(`/parent/assignments/${selectedChild}?course=${course.id}`)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Summary Card */}
        {!loading && courses.length > 0 && (
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50">
            <CardContent className="py-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <GraduationCap className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
                  <p className="text-sm text-gray-600">Total Courses</p>
                </div>
                <div className="text-center">
                  <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(courses.reduce((sum, c) => sum + c.progress.percentage, 0) / courses.length)}%
                  </p>
                  <p className="text-sm text-gray-600">Avg Progress</p>
                </div>
                <div className="text-center">
                  <CheckCircle2 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">
                    {courses.reduce((sum, c) => sum + c.progress.completedAssignments, 0)}
                  </p>
                  <p className="text-sm text-gray-600">Completed Tasks</p>
                </div>
                <div className="text-center">
                  <Award className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">
                    {courses.filter(c => (c.currentScore || 0) >= 90).length}
                  </p>
                  <p className="text-sm text-gray-600">90%+ Scores</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
