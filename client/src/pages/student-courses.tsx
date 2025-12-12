import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiEndpoint } from "@/lib/config";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, BookOpen, ArrowRight, Search, X, GraduationCap } from "lucide-react";
import { Link } from "wouter";

interface Course {
  id: string;
  title: string;
  description?: string | null;
  teacherId: string;
  isPublished: boolean;
  imageUrl?: string | null;
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
  const [searchQuery, setSearchQuery] = useState("");

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

  // Filter enrollments based on search query
  const filteredEnrollments = useMemo(() => {
    if (!searchQuery.trim()) return enrollments;
    const query = searchQuery.toLowerCase();
    return enrollments.filter(enrollment => 
      enrollment.course.title.toLowerCase().includes(query) ||
      enrollment.course.description?.toLowerCase().includes(query)
    );
  }, [enrollments, searchQuery]);

  // Get course icon based on title
  const getCourseStyle = (title: string) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('math') || lowerTitle.includes('algebra') || lowerTitle.includes('geometry')) {
      return { bg: 'bg-gradient-to-br from-amber-200 to-amber-300', icon: '📐' };
    }
    if (lowerTitle.includes('science') || lowerTitle.includes('physics') || lowerTitle.includes('chemistry') || lowerTitle.includes('biology')) {
      return { bg: 'bg-gradient-to-br from-green-200 to-green-300', icon: '🔬' };
    }
    if (lowerTitle.includes('english') || lowerTitle.includes('writing') || lowerTitle.includes('literature')) {
      return { bg: 'bg-gradient-to-br from-blue-200 to-blue-300', icon: '📚' };
    }
    if (lowerTitle.includes('history') || lowerTitle.includes('social')) {
      return { bg: 'bg-gradient-to-br from-orange-200 to-orange-300', icon: '🏛️' };
    }
    if (lowerTitle.includes('art') || lowerTitle.includes('music') || lowerTitle.includes('drama')) {
      return { bg: 'bg-gradient-to-br from-purple-200 to-purple-300', icon: '🎨' };
    }
    if (lowerTitle.includes('computer') || lowerTitle.includes('programming') || lowerTitle.includes('coding')) {
      return { bg: 'bg-gradient-to-br from-cyan-200 to-cyan-300', icon: '💻' };
    }
    return { bg: 'bg-gradient-to-br from-indigo-200 to-indigo-300', icon: '📖' };
  };

  return (
    <DashboardLayout role="student" userName={user?.fullName || user?.username || "Student"}>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Classes</h1>
            <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600">
              View and access your enrolled classes.
            </p>
          </div>
          
          {/* Search Bar */}
          {enrollments.length > 0 && (
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search classes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9 h-10 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
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
        ) : filteredEnrollments.length === 0 ? (
          <Card className="shadow-[0_2px_8px_rgba(0,0,0,0.08)] rounded-xl sm:rounded-2xl">
            <CardContent className="py-8 sm:py-12 text-center px-4">
              <Search className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-gray-300 mb-3 sm:mb-4" />
              <p className="text-sm sm:text-base text-gray-600">No classes match your search "{searchQuery}"</p>
              <Button 
                variant="outline" 
                onClick={() => setSearchQuery("")}
                className="mt-4"
              >
                Clear Search
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredEnrollments.map((enrollment, index) => {
              const courseStyle = getCourseStyle(enrollment.course.title);
              return (
                <Link key={enrollment.id} href={`/student/courses/${enrollment.courseId}/lessons`}>
                  <Card 
                    className="flex flex-col h-full shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-all rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer group opacity-0 animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.1}s`, animationFillMode: 'forwards' }}
                  >
                    {/* Course Image */}
                    <div className={`h-40 sm:h-48 relative overflow-hidden ${!enrollment.course.imageUrl ? courseStyle.bg : ''}`}>
                      {enrollment.course.imageUrl ? (
                        <img 
                          src={enrollment.course.imageUrl.startsWith('http') ? enrollment.course.imageUrl : `/uploads/${enrollment.course.imageUrl}`}
                          alt={enrollment.course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white/40 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                            <span className="text-4xl sm:text-5xl">{courseStyle.icon}</span>
                          </div>
                        </div>
                      )}
                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                    </div>
                    
                    <CardHeader className="pb-2 sm:pb-3 p-4 sm:p-5">
                      <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {enrollment.course.title}
                      </CardTitle>
                      {enrollment.course.description && (
                        <p className="mt-1 line-clamp-2 text-xs sm:text-sm text-gray-600">
                          {enrollment.course.description}
                        </p>
                      )}
                    </CardHeader>
                    
                    <CardContent className="pt-0 pb-4 sm:pb-5 px-4 sm:px-5 mt-auto flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        Enrolled: {new Date(enrollment.enrolledAt).toLocaleDateString()}
                      </p>
                      <div className="flex items-center text-blue-600 text-xs sm:text-sm font-medium group-hover:translate-x-1 transition-transform">
                        View lessons
                        <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
