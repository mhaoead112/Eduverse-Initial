import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
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

export default function StudentCoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch("http://localhost:3001/api/courses");
        if (!res.ok) throw new Error("Failed to load courses");
        const data = await res.json();
        // Filter to show only published courses for students
        const publishedCourses = Array.isArray(data) ? data.filter((c: Course) => c.isPublished) : [];
        setCourses(publishedCourses);
      } catch (err: any) {
        setError(err?.message || "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, []);

  return (
    <DashboardLayout role="student" userName={user?.fullName || user?.username || "Student"}>
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Available Courses</h1>
            <p className="mt-1 text-sm text-slate-600">
              Browse all published courses and jump into lessons.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-slate-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading courses...
          </div>
        ) : error ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-6 text-sm text-red-700">
              {error}
            </CardContent>
          </Card>
        ) : courses.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-sm text-slate-600">
              No courses are published yet. Please check back later.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Card key={course.id} className="flex flex-col justify-between border-slate-200 hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold text-slate-900">
                        {course.title}
                      </CardTitle>
                      {course.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-slate-600">
                          {course.description}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 pb-4 flex justify-end">
                  <Link href={`/student/courses/${course.id}/lessons`}>
                    <Button size="sm" variant="outline" className="flex items-center gap-1">
                      View lessons
                      <ArrowRight className="h-4 w-4" />
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
