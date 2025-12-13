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
    <DashboardLayout>
      <div className="space-y-5 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">My Classes</h1>
            <p className="mt-1 sm:mt-2 text-sm text-slate-400">
              Manage your active courses and track your progress
            </p>
          </div>
          
          {/* Search Bar */}
          {enrollments.length > 0 && (
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search for classes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 h-11 rounded-xl bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48 sm:h-64 text-slate-400">
            <Loader2 className="mr-2 h-6 w-6 sm:h-8 sm:w-8 animate-spin text-yellow-500" />
            <span className="text-sm sm:text-base">Loading courses...</span>
          </div>
        ) : error ? (
          <Card className="bg-red-900/20 border-red-800/50 rounded-2xl">
            <CardContent className="py-6 sm:py-8 text-sm text-red-400 text-center px-4">
              {error}
            </CardContent>
          </Card>
        ) : enrollments.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-2xl">
            <CardContent className="py-12 text-center px-4">
              <BookOpen className="h-12 w-12 mx-auto text-slate-600 mb-4" />
              <p className="text-base text-slate-400">You are not enrolled in any courses yet. Please contact your teacher to enroll.</p>
            </CardContent>
          </Card>
        ) : filteredEnrollments.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-2xl">
            <CardContent className="py-12 text-center px-4">
              <Search className="h-12 w-12 mx-auto text-slate-600 mb-4" />
              <p className="text-base text-slate-400">No classes match your search "{searchQuery}"</p>
              <Button 
                variant="outline" 
                onClick={() => setSearchQuery("")}
                className="mt-4 border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Clear Search
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredEnrollments.map((enrollment, index) => {
              const courseStyle = getCourseStyle(enrollment.course.title);
              const courseCode = enrollment.course.title.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,3) + ' ' + Math.floor(100 + Math.random() * 200);
              
              return (
                <Link key={enrollment.id} href={`/student/courses/${enrollment.courseId}/lessons`}>
                  <Card 
                    className="flex flex-col h-full bg-slate-800/50 border-slate-700/50 hover:border-slate-600 transition-all rounded-2xl overflow-hidden cursor-pointer group"
                  >
                    {/* Course Image */}
                    <div className="h-44 relative overflow-hidden bg-gradient-to-br from-slate-700 to-slate-800">
                      {enrollment.course.imageUrl && enrollment.course.imageUrl.length > 0 ? (
                        <img 
                          src={enrollment.course.imageUrl.startsWith('http') ? enrollment.course.imageUrl : `/uploads/${enrollment.course.imageUrl}`}
                          alt={enrollment.course.title}
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-5xl">{courseStyle.icon}</span>
                        </div>
                      )}
                      {/* Course Code Badge */}
                      <div className="absolute top-3 right-3">
                        <span className="bg-slate-900/80 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-600/50">
                          {courseCode}
                        </span>
                      </div>
                      {/* Avatar placeholder */}
                      <div className="absolute bottom-3 left-3">
                        <div className="w-9 h-9 rounded-full bg-slate-600 border-2 border-slate-800 flex items-center justify-center">
                          <GraduationCap className="h-4 w-4 text-slate-300" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="text-base font-bold text-white mb-1 line-clamp-1 group-hover:text-blue-400 transition-colors">
                        {enrollment.course.title}
                      </h3>
                      <p className="text-xs text-slate-400 mb-3">
                        Dr. Smith • Mon, Wed 9:00 AM
                      </p>
                      
                      {/* Progress */}
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                          <span>Progress</span>
                          <span>85%</span>
                        </div>
                        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full w-[85%] bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-full" />
                        </div>
                      </div>
                      
                      {/* Grade and Action */}
                      <div className="flex items-center justify-between mt-auto">
                        <div className="text-xs">
                          <span className="text-slate-500">GRADE</span>
                          <span className="ml-2 text-white font-bold">B+</span>
                          <span className="text-slate-400"> / 88%</span>
                        </div>
                        <Button size="sm" className="bg-slate-700 hover:bg-slate-600 text-white text-xs h-8 px-4 rounded-lg">
                          View Class
                        </Button>
                      </div>
                    </div>
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
