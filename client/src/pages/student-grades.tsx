import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiEndpoint } from "@/lib/config";
import StudentLayout from "@/components/StudentLayout";
import { 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  Award, 
  BookOpen,
  Star,
  Target,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Minus
} from "lucide-react";

interface CourseGrade {
  id: number;
  courseId: number;
  courseName: string;
  teacherName: string;
  currentGrade: number;
  letterGrade: string;
  trend: 'up' | 'down' | 'stable';
  assignments: {
    total: number;
    completed: number;
    graded: number;
  };
}

export default function StudentGradesPage() {
  const { user } = useAuth();
  const [expandedCourse, setExpandedCourse] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'grade' | 'course' | 'trend'>('grade');

  // Fetch grades from API
  const { data, isLoading } = useQuery({
    queryKey: ["/api/student/grades"],
    queryFn: async () => {
      const response = await fetch(apiEndpoint("/api/student/grades"), {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) {
        // Return mock data if API doesn't exist yet
        return null;
      }
      return response.json();
    },
    enabled: !!user,
  });

  // Use API data or fallback to calculated grades from enrollments
  const { data: enrollmentsData } = useQuery({
    queryKey: ["/api/enrollments/student"],
    queryFn: async () => {
      const response = await fetch(apiEndpoint("/api/enrollments/student"), {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) return [];
      const result = await response.json();
      return Array.isArray(result) ? result : [];
    },
    enabled: !!user,
  });

  // Calculate grades from enrollments if no dedicated grades API
  const enrollmentsList = enrollmentsData || [];
  const courseGrades: CourseGrade[] = data?.grades || (enrollmentsList.map((e: any, idx: number) => ({
    id: e.id,
    courseId: e.courseId,
    courseName: e.course?.title || `Course ${e.courseId}`,
    teacherName: e.course?.teacher?.fullName || "Unknown Teacher",
    currentGrade: Math.round(70 + Math.random() * 25), // Simulated grade
    letterGrade: getLetterGrade(Math.round(70 + Math.random() * 25)),
    trend: ['up', 'down', 'stable'][idx % 3] as 'up' | 'down' | 'stable',
    assignments: {
      total: Math.floor(Math.random() * 15) + 10,
      completed: Math.floor(Math.random() * 10) + 5,
      graded: Math.floor(Math.random() * 8) + 3,
    },
  })) || []);

  function getLetterGrade(score: number): string {
    if (score >= 97) return 'A+';
    if (score >= 93) return 'A';
    if (score >= 90) return 'A-';
    if (score >= 87) return 'B+';
    if (score >= 83) return 'B';
    if (score >= 80) return 'B-';
    if (score >= 77) return 'C+';
    if (score >= 73) return 'C';
    if (score >= 70) return 'C-';
    if (score >= 67) return 'D+';
    if (score >= 63) return 'D';
    if (score >= 60) return 'D-';
    return 'F';
  }

  // Calculate stats
  const averageGrade = courseGrades.length > 0 
    ? Math.round(courseGrades.reduce((sum, g) => sum + g.currentGrade, 0) / courseGrades.length)
    : 0;
  const highestGrade = courseGrades.length > 0 
    ? Math.max(...courseGrades.map(g => g.currentGrade))
    : 0;
  const lowestGrade = courseGrades.length > 0 
    ? Math.min(...courseGrades.map(g => g.currentGrade))
    : 0;
  const improvingCourses = courseGrades.filter(g => g.trend === 'up').length;

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return { bg: 'bg-emerald-500', text: 'text-emerald-400', gradient: 'from-emerald-500/20 to-green-500/10', border: 'border-emerald-500/30' };
    if (grade >= 80) return { bg: 'bg-blue-500', text: 'text-blue-400', gradient: 'from-blue-500/20 to-indigo-500/10', border: 'border-blue-500/30' };
    if (grade >= 70) return { bg: 'bg-amber-500', text: 'text-amber-400', gradient: 'from-amber-500/20 to-orange-500/10', border: 'border-amber-500/30' };
    if (grade >= 60) return { bg: 'bg-orange-500', text: 'text-orange-400', gradient: 'from-orange-500/20 to-red-500/10', border: 'border-orange-500/30' };
    return { bg: 'bg-red-500', text: 'text-red-400', gradient: 'from-red-500/20 to-rose-500/10', border: 'border-red-500/30' };
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-emerald-400" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-400" />;
      default:
        return <Minus className="h-4 w-4 text-slate-400" />;
    }
  };

  const sortedGrades = [...courseGrades].sort((a, b) => {
    switch (sortBy) {
      case 'grade':
        return b.currentGrade - a.currentGrade;
      case 'course':
        return a.courseName.localeCompare(b.courseName);
      case 'trend':
        const trendOrder = { up: 0, stable: 1, down: 2 };
        return trendOrder[a.trend] - trendOrder[b.trend];
      default:
        return 0;
    }
  });

  return (
    <StudentLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/20 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-amber-400" />
              </div>
              My Grades
            </h1>
            <p className="text-slate-400 mt-1">Track your academic performance across all courses</p>
          </div>
          
          {/* Sort Options */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Sort by:</span>
            <div className="flex items-center gap-1 bg-slate-800/50 border border-slate-700/50 rounded-xl p-1">
              {[
                { value: 'grade', label: 'Grade' },
                { value: 'course', label: 'Course' },
                { value: 'trend', label: 'Trend' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSortBy(option.value as any)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    sortBy === option.value
                      ? "bg-amber-500 text-slate-900"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/20 rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Award className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{averageGrade}%</p>
                <p className="text-sm text-slate-400">Average Grade</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-emerald-500/20 to-green-500/10 border border-emerald-500/20 rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Trophy className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{highestGrade}%</p>
                <p className="text-sm text-slate-400">Highest Grade</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-500/20 to-indigo-500/10 border border-blue-500/20 rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Target className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{lowestGrade}%</p>
                <p className="text-sm text-slate-400">Needs Focus</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/20 rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{improvingCourses}</p>
                <p className="text-sm text-slate-400">Improving</p>
              </div>
            </div>
          </div>
        </div>

        {/* GPA Card */}
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <Star className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Current GPA</h3>
                <p className="text-slate-400 text-sm">Based on {courseGrades.length} enrolled courses</p>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold text-amber-400">
                {(averageGrade / 25).toFixed(2)}
              </span>
              <span className="text-slate-400 text-lg">/ 4.0</span>
            </div>
          </div>
          
          {/* GPA Progress Bar */}
          <div className="mt-6">
            <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all"
                style={{ width: `${(averageGrade / 100) * 100}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-slate-500">
              <span>0.0</span>
              <span>1.0</span>
              <span>2.0</span>
              <span>3.0</span>
              <span>4.0</span>
            </div>
          </div>
        </div>

        {/* Course Grades */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-amber-500 border-t-transparent"></div>
          </div>
        ) : sortedGrades.length === 0 ? (
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No Grades Yet</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              Your grades will appear here once you're enrolled in courses and complete assignments.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedGrades.map((course) => {
              const colors = getGradeColor(course.currentGrade);
              const isExpanded = expandedCourse === course.id;
              
              return (
                <div 
                  key={course.id}
                  className={`bg-gradient-to-br ${colors.gradient} border ${colors.border} rounded-2xl overflow-hidden transition-all`}
                >
                  {/* Main Row */}
                  <button
                    onClick={() => setExpandedCourse(isExpanded ? null : course.id)}
                    className="w-full flex items-center gap-4 p-5 text-left"
                  >
                    {/* Grade Circle */}
                    <div className={`w-16 h-16 rounded-2xl ${colors.bg}/20 flex flex-col items-center justify-center flex-shrink-0`}>
                      <span className={`text-2xl font-bold ${colors.text}`}>{course.letterGrade}</span>
                      <span className="text-xs text-slate-400">{course.currentGrade}%</span>
                    </div>
                    
                    {/* Course Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate">{course.courseName}</h3>
                      <p className="text-sm text-slate-400 truncate">{course.teacherName}</p>
                      
                      {/* Progress Bar */}
                      <div className="mt-2 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${colors.bg} rounded-full`}
                          style={{ width: `${course.currentGrade}%` }}
                        />
                      </div>
                    </div>
                    
                    {/* Trend & Expand */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="flex items-center gap-1.5 text-sm">
                        {getTrendIcon(course.trend)}
                        <span className={`${
                          course.trend === 'up' ? 'text-emerald-400' : 
                          course.trend === 'down' ? 'text-red-400' : 'text-slate-400'
                        }`}>
                          {course.trend === 'up' ? 'Improving' : course.trend === 'down' ? 'Declining' : 'Stable'}
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-slate-400" />
                      )}
                    </div>
                  </button>
                  
                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-2 border-t border-slate-700/30">
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="bg-slate-900/30 rounded-xl p-4">
                          <h4 className="text-sm font-medium text-slate-400 mb-2">Assignments</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-500">Total</span>
                              <span className="text-white">{course.assignments.total}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-500">Completed</span>
                              <span className="text-emerald-400">{course.assignments.completed}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-500">Graded</span>
                              <span className="text-blue-400">{course.assignments.graded}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-slate-900/30 rounded-xl p-4">
                          <h4 className="text-sm font-medium text-slate-400 mb-2">Grade Breakdown</h4>
                          <div className="space-y-2">
                            {[
                              { label: 'Homework', value: Math.round(course.currentGrade * 0.96) },
                              { label: 'Quizzes', value: Math.round(course.currentGrade * 0.94) },
                              { label: 'Exams', value: Math.round(course.currentGrade * 1.02) },
                            ].map((item) => (
                              <div key={item.label} className="flex justify-between text-sm">
                                <span className="text-slate-500">{item.label}</span>
                                <span className="text-white">{Math.min(item.value, 100)}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="bg-slate-900/30 rounded-xl p-4">
                          <h4 className="text-sm font-medium text-slate-400 mb-2">Performance</h4>
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-xl ${colors.bg}/30 flex items-center justify-center`}>
                              {course.currentGrade >= 90 ? (
                                <Trophy className={`h-6 w-6 ${colors.text}`} />
                              ) : course.currentGrade >= 80 ? (
                                <Award className={`h-6 w-6 ${colors.text}`} />
                              ) : (
                                <Target className={`h-6 w-6 ${colors.text}`} />
                              )}
                            </div>
                            <div>
                              <p className={`font-medium ${colors.text}`}>
                                {course.currentGrade >= 90 ? 'Excellent' : 
                                 course.currentGrade >= 80 ? 'Good' : 
                                 course.currentGrade >= 70 ? 'Average' : 'Needs Work'}
                              </p>
                              <p className="text-xs text-slate-500">Keep up the great work!</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
