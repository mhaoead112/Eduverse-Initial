import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiEndpoint } from "@/lib/config";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, BookOpen, ArrowRight } from "lucide-react";
import { Link } from "wouter";

interface Course {
  id: string;
  title: string;
  description?: string | null;
  teacherId: string;
  isPublished: boolean;
}

interface Enrollment {
  id: string;
  courseId: string;
  enrolledAt: string;
  course: Course;
}

export default function StudentCoursesPage() {
  const { user, token } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      if (!token) return;
      
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(apiEndpoint("/api/enrollments/student"), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (!res.ok) throw new Error("Failed to load enrolled courses");
        const data = await res.json();
        setEnrollments(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err?.message || "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEnrolledCourses();
  }, [token]);

  return (
    <DashboardLayout role="student" userName={user?.fullName || user?.username || "Student"}>
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Courses</h1>
          <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600">
            View and access your enrolled courses.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48 sm:h-64 text-gray-500">
            <Loader2 className="mr-2 h-6 w-6 sm:h-8 sm:w-8 animate-spin" />
            <span className="text-sm sm:text-base">Loading courses...</span>
          </div>
        ) : error ? (
          <Card className="border-red-100 bg-red-50">
            <CardContent className="py-6 sm:py-8 text-xs sm:text-sm text-red-700 text-center px-4">
              {error}
            </CardContent>
          </Card>
        ) : enrollments.length === 0 ? (
          <Card className="shadow-[0_2px_8px_rgba(0,0,0,0.08)] rounded-xl sm:rounded-2xl">
            <CardContent className="py-8 sm:py-12 text-center px-4">
              <BookOpen className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-gray-300 mb-3 sm:mb-4" />
              <p className="text-sm sm:text-base text-gray-600">You are not enrolled in any courses yet. Please contact your teacher to enroll.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {enrollments.map((enrollment) => (
              <Card key={enrollment.id} className="flex flex-col justify-between shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-all rounded-xl sm:rounded-2xl">
                <CardHeader className="pb-3 sm:pb-4 p-4 sm:p-6">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="rounded-lg bg-gray-100 p-2 sm:p-3">
                      <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">
                        {enrollment.course.title}
                      </CardTitle>
                      {enrollment.course.description && (
                        <p className="mt-1 line-clamp-2 text-xs sm:text-sm text-gray-600">
                          {enrollment.course.description}
                        </p>
                      )}
                      <p className="mt-2 sm:mt-3 text-xs text-gray-500">
                        Enrolled: {new Date(enrollment.enrolledAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 pb-4 sm:pb-5 px-4 sm:px-6 flex justify-end">
                  <Link href={`/student/courses/${enrollment.courseId}/lessons`}>
                    <Button size="sm" className="bg-gray-900 text-white hover:bg-gray-800 text-xs sm:text-sm h-8 sm:h-9">
                      View lessons
                      <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
