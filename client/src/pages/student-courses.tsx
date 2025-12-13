import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiEndpoint, assetUrl } from "@/lib/config";
import StudentLayout from "@/components/StudentLayout";
import { Play, Clock, BookOpen, Search, Filter, ChevronRight, Star, Users, Trophy, Target } from "lucide-react";

interface Enrollment {
  id: number;
  courseId: number;
  studentId: number;
  enrolledAt: string;
  progress: number;
  status: string;
  course: {
    id: number;
    title: string;
    description: string;
    subjectId: number;
    gradeLevel: string;
    imageUrl: string | null;
    teacherId: number;
    status: string;
    subject?: {
      id: number;
      name: string;
    };
    teacher?: {
      id: number;
      fullName: string;
    };
  };
}

interface EnrollmentsResponse {
  enrollments: Enrollment[];
}

export default function StudentCoursesPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { data, isLoading, error } = useQuery<Enrollment[]>({
    queryKey: ["/api/enrollments/student"],
    queryFn: async () => {
      const response = await fetch(apiEndpoint("/api/enrollments/student"), {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch enrollments");
      }
      const result = await response.json();
      // API returns array directly, map to expected format
      return Array.isArray(result) ? result.map((e: any) => ({
        id: e.id,
        courseId: e.courseId,
        studentId: e.studentId || 0,
        enrolledAt: e.enrolledAt,
        progress: e.progress || 0,
        status: e.status || 'active',
        course: {
          id: e.course?.id || e.courseId,
          title: e.course?.title || 'Unknown Course',
          description: e.course?.description || '',
          subjectId: e.course?.subjectId || 0,
          gradeLevel: e.course?.gradeLevel || '',
          imageUrl: e.course?.imageUrl || null,
          teacherId: e.course?.teacherId || 0,
          status: e.course?.status || 'active',
          subject: e.course?.subject,
          teacher: e.course?.teacher,
        }
      })) : [];
    },
    enabled: !!user,
  });

  const enrollments = data || [];
  
  // Get unique categories from subjects
  const categories = ["All", ...new Set(enrollments.map(e => e.course.subject?.name || "General").filter(Boolean))];
  
  // Filter enrollments based on search and category
  const filteredEnrollments = enrollments.filter(enrollment => {
    const matchesSearch = enrollment.course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         enrollment.course.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || 
                           enrollment.course.subject?.name === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate stats
  const totalCourses = enrollments.length;
  const completedCourses = enrollments.filter(e => e.progress >= 100).length;
  const inProgressCourses = enrollments.filter(e => e.progress > 0 && e.progress < 100).length;
  const averageProgress = enrollments.length > 0 
    ? Math.round(enrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / enrollments.length)
    : 0;

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "bg-emerald-500";
    if (progress >= 50) return "bg-amber-500";
    if (progress >= 25) return "bg-orange-500";
    return "bg-red-500";
  };

  const getStatusBadge = (progress: number) => {
    if (progress >= 100) return { text: "Completed", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" };
    if (progress >= 75) return { text: "Almost Done", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" };
    if (progress > 0) return { text: "In Progress", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" };
    return { text: "Not Started", color: "bg-slate-500/20 text-slate-400 border-slate-500/30" };
  };

  return (
    <StudentLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">My Classes</h1>
            <p className="text-slate-400 mt-1">Manage and track your enrolled courses</p>
          </div>
          
          {/* Search and Filter */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 w-64"
              />
            </div>
            <div className="flex items-center gap-1 bg-slate-800/50 border border-slate-700/50 rounded-xl p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-colors ${viewMode === "grid" ? "bg-amber-500 text-slate-900" : "text-slate-400 hover:text-white"}`}
              >
                <span className="material-symbols-outlined text-lg">grid_view</span>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-colors ${viewMode === "list" ? "bg-amber-500 text-slate-900" : "text-slate-400 hover:text-white"}`}
              >
                <span className="material-symbols-outlined text-lg">view_list</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/20 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{totalCourses}</p>
                <p className="text-xs text-slate-400">Total Courses</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-emerald-500/20 to-green-500/10 border border-emerald-500/20 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Trophy className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{completedCourses}</p>
                <p className="text-xs text-slate-400">Completed</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-500/20 to-indigo-500/10 border border-blue-500/20 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Target className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{inProgressCourses}</p>
                <p className="text-xs text-slate-400">In Progress</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/20 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Star className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{averageProgress}%</p>
                <p className="text-xs text-slate-400">Avg Progress</p>
              </div>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === category
                  ? "bg-amber-500 text-slate-900"
                  : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-white border border-slate-700/50"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Courses Grid/List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-amber-500 border-t-transparent"></div>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center">
            <p className="text-red-400">Failed to load courses. Please try again.</p>
          </div>
        ) : filteredEnrollments.length === 0 ? (
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No courses found</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              {searchQuery || selectedCategory !== "All" 
                ? "Try adjusting your search or filter criteria"
                : "You haven't enrolled in any courses yet. Explore the catalog to get started!"}
            </p>
            {!searchQuery && selectedCategory === "All" && (
              <Link href="/student/explore">
                <button className="mt-6 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium rounded-xl transition-colors">
                  Explore Courses
                </button>
              </Link>
            )}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredEnrollments.map((enrollment) => {
              const status = getStatusBadge(enrollment.progress || 0);
              return (
                <Link key={enrollment.id} href={`/student/course/${enrollment.courseId}`}>
                  <div className="group bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden hover:bg-slate-800/60 hover:border-slate-600/50 transition-all cursor-pointer">
                    {/* Course Image */}
                    <div className="relative h-40 overflow-hidden">
                      <img
                        src={enrollment.course.imageUrl ? assetUrl(enrollment.course.imageUrl) : `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=400&fit=crop`}
                        alt={enrollment.course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                      
                      {/* Status Badge */}
                      <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-lg text-xs font-medium border ${status.color}`}>
                        {status.text}
                      </div>
                      
                      {/* Subject Badge */}
                      <div className="absolute bottom-3 left-3 px-2.5 py-1 bg-slate-900/60 backdrop-blur-sm rounded-lg text-xs text-slate-300">
                        {enrollment.course.subject?.name || "General"}
                      </div>
                    </div>
                    
                    {/* Course Info */}
                    <div className="p-4">
                      <h3 className="font-semibold text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                        {enrollment.course.title}
                      </h3>
                      <p className="text-sm text-slate-400 mt-1 line-clamp-2">
                        {enrollment.course.description || "No description available"}
                      </p>
                      
                      {/* Teacher & Grade */}
                      <div className="flex items-center gap-3 mt-3 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5" />
                          <span>{enrollment.course.teacher?.fullName || "Unknown Teacher"}</span>
                        </div>
                        <span>•</span>
                        <span>{enrollment.course.gradeLevel}</span>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-slate-400">Progress</span>
                          <span className="text-white font-medium">{enrollment.progress || 0}%</span>
                        </div>
                        <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${getProgressColor(enrollment.progress || 0)} rounded-full transition-all`}
                            style={{ width: `${enrollment.progress || 0}%` }}
                          />
                        </div>
                      </div>
                      
                      {/* Continue Button */}
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700/50">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Clock className="h-3.5 w-3.5" />
                          <span>Last accessed 2d ago</span>
                        </div>
                        <div className="flex items-center gap-1 text-amber-400 text-sm font-medium group-hover:gap-2 transition-all">
                          <Play className="h-4 w-4" />
                          <span>Continue</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="space-y-3">
            {filteredEnrollments.map((enrollment) => {
              const status = getStatusBadge(enrollment.progress || 0);
              return (
                <Link key={enrollment.id} href={`/student/course/${enrollment.courseId}`}>
                  <div className="group flex items-center gap-4 bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4 hover:bg-slate-800/60 hover:border-slate-600/50 transition-all cursor-pointer">
                    {/* Course Thumbnail */}
                    <div className="w-24 h-16 rounded-xl overflow-hidden flex-shrink-0">
                      <img
                        src={enrollment.course.imageUrl ? assetUrl(enrollment.course.imageUrl) : `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200&h=130&fit=crop`}
                        alt={enrollment.course.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* Course Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-white group-hover:text-amber-400 transition-colors">
                            {enrollment.course.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                            <span>{enrollment.course.subject?.name || "General"}</span>
                            <span>•</span>
                            <span>{enrollment.course.teacher?.fullName}</span>
                          </div>
                        </div>
                        <div className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${status.color}`}>
                          {status.text}
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="flex items-center gap-3 mt-3">
                        <div className="flex-1 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${getProgressColor(enrollment.progress || 0)} rounded-full`}
                            style={{ width: `${enrollment.progress || 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-white font-medium">{enrollment.progress || 0}%</span>
                      </div>
                    </div>
                    
                    {/* Continue Arrow */}
                    <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
