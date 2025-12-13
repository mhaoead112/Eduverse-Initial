import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiEndpoint } from "@/lib/config";
import { DashboardLayout } from "@/components/DashboardLayout";
import { 
  CheckCircle2, 
  FileText, 
  GraduationCap, 
  AlertCircle, 
  TrendingUp,
  Clock,
  Star,
  Target,
  BarChart3,
  BookOpen
} from "lucide-react";

interface StudentAssignment {
  id: number;
  title: string;
  courseTitle?: string;
  dueDate?: string | null;
  status?: string;
}

interface StudentSubmission {
  id: number;
  assignmentTitle?: string;
  submittedAt?: string | null;
  status?: string;
}

interface StudentGrade {
  id: number;
  courseTitle?: string;
  assignmentTitle?: string;
  score?: number | null;
  maxScore?: number | null;
  letterGrade?: string | null;
}

interface MyProgressResponse {
  assignments?: StudentAssignment[];
  submissions?: StudentSubmission[];
  grades?: StudentGrade[];
}

export default function StudentProgressPage() {
  const { user } = useAuth();
  const [data, setData] = useState<MyProgressResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'assignments' | 'submissions' | 'grades'>('overview');

  useEffect(() => {
    const fetchProgress = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(apiEndpoint("/api/student/my-progress"), {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (!res.ok) throw new Error("Failed to load progress");
        const json = await res.json();
        setData(json || {});
      } catch (err: any) {
        setError(err?.message || "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProgress();
  }, []);

  const assignments = data?.assignments || [];
  const submissions = data?.submissions || [];
  const grades = data?.grades || [];

  // Calculate stats
  const pendingAssignments = assignments.filter(a => a.status === 'pending' || !a.status).length;
  const completedAssignments = submissions.length;
  const averageGrade = grades.length > 0 
    ? Math.round(grades.reduce((sum, g) => sum + ((g.score || 0) / (g.maxScore || 100) * 100), 0) / grades.length)
    : 0;

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'graded':
        return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'submitted':
        return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'pending':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'overdue':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      default:
        return 'text-slate-400 bg-slate-500/20 border-slate-500/30';
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'No date';
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'assignments', label: 'Assignments', icon: FileText, count: assignments.length },
    { id: 'submissions', label: 'Submissions', icon: CheckCircle2, count: submissions.length },
    { id: 'grades', label: 'Grades', icon: GraduationCap, count: grades.length },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/10 border border-yellow-500/20 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-yellow-400" />
            </div>
            My Progress
          </h1>
          <p className="text-slate-400 mt-1">Track your academic journey across all courses</p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? "bg-yellow-500 text-slate-900"
                    : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-white border border-slate-700/50"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-md ${
                    activeTab === tab.id
                      ? "bg-slate-900/30"
                      : "bg-slate-700/50"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-yellow-500 border-t-transparent"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <span className="text-red-400">{error}</span>
          </div>
        )}

        {/* Content */}
        {!isLoading && !error && (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/10 border border-yellow-500/20 rounded-2xl p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                        <Clock className="h-6 w-6 text-yellow-400" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-white">{pendingAssignments}</p>
                        <p className="text-sm text-slate-400">Pending</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-500/20 to-green-500/10 border border-green-500/20 rounded-2xl p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                        <CheckCircle2 className="h-6 w-6 text-green-400" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-white">{completedAssignments}</p>
                        <p className="text-sm text-slate-400">Submitted</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-blue-500/20 to-indigo-500/10 border border-blue-500/20 rounded-2xl p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                        <GraduationCap className="h-6 w-6 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-white">{grades.length}</p>
                        <p className="text-sm text-slate-400">Graded</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/20 rounded-2xl p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                        <Star className="h-6 w-6 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-white">{averageGrade}%</p>
                        <p className="text-sm text-slate-400">Avg Grade</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Recent Submissions */}
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-400" />
                      Recent Submissions
                    </h3>
                    {submissions.length === 0 ? (
                      <p className="text-slate-400 text-sm text-center py-8">No submissions yet</p>
                    ) : (
                      <div className="space-y-3">
                        {submissions.slice(0, 5).map((sub) => (
                          <div key={sub.id} className="flex items-center gap-3 p-3 bg-slate-900/30 rounded-xl">
                            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                              <FileText className="h-5 w-5 text-green-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium truncate">{sub.assignmentTitle}</p>
                              <p className="text-xs text-slate-500">{formatDate(sub.submittedAt)}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${getStatusColor(sub.status)}`}>
                              {sub.status || 'Submitted'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recent Grades */}
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-blue-400" />
                      Recent Grades
                    </h3>
                    {grades.length === 0 ? (
                      <p className="text-slate-400 text-sm text-center py-8">No grades yet</p>
                    ) : (
                      <div className="space-y-3">
                        {grades.slice(0, 5).map((grade) => {
                          const percentage = grade.maxScore ? Math.round((grade.score || 0) / grade.maxScore * 100) : 0;
                          return (
                            <div key={grade.id} className="flex items-center gap-3 p-3 bg-slate-900/30 rounded-xl">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                percentage >= 90 ? 'bg-green-500/20' :
                                percentage >= 80 ? 'bg-blue-500/20' :
                                percentage >= 70 ? 'bg-yellow-500/20' :
                                'bg-red-500/20'
                              }`}>
                                <span className={`font-bold ${
                                  percentage >= 90 ? 'text-green-400' :
                                  percentage >= 80 ? 'text-blue-400' :
                                  percentage >= 70 ? 'text-yellow-400' :
                                  'text-red-400'
                                }`}>
                                  {grade.letterGrade || `${percentage}%`}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white font-medium truncate">{grade.assignmentTitle}</p>
                                <p className="text-xs text-slate-500">{grade.courseTitle}</p>
                              </div>
                              <span className="text-sm text-slate-400">
                                {grade.score}/{grade.maxScore}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Assignments Tab */}
            {activeTab === 'assignments' && (
              <div className="space-y-3">
                {assignments.length === 0 ? (
                  <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-8 w-8 text-slate-500" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">No Assignments</h3>
                    <p className="text-slate-400 text-sm">You don't have any assignments yet</p>
                  </div>
                ) : (
                  assignments.map((assignment) => (
                    <div key={assignment.id} className="flex items-center gap-4 p-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl">
                      <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                        <FileText className="h-6 w-6 text-yellow-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white">{assignment.title}</h4>
                        <p className="text-sm text-slate-500">{assignment.courseTitle}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-400">Due: {formatDate(assignment.dueDate)}</p>
                        <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium border ${getStatusColor(assignment.status)}`}>
                          {assignment.status || 'Pending'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Submissions Tab */}
            {activeTab === 'submissions' && (
              <div className="space-y-3">
                {submissions.length === 0 ? (
                  <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="h-8 w-8 text-slate-500" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">No Submissions</h3>
                    <p className="text-slate-400 text-sm">You haven't submitted any assignments yet</p>
                  </div>
                ) : (
                  submissions.map((sub) => (
                    <div key={sub.id} className="flex items-center gap-4 p-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl">
                      <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                        <CheckCircle2 className="h-6 w-6 text-green-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white">{sub.assignmentTitle}</h4>
                        <p className="text-sm text-slate-500">Submitted on {formatDate(sub.submittedAt)}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${getStatusColor(sub.status)}`}>
                        {sub.status || 'Submitted'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Grades Tab */}
            {activeTab === 'grades' && (
              <div className="space-y-3">
                {grades.length === 0 ? (
                  <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
                      <GraduationCap className="h-8 w-8 text-slate-500" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">No Grades</h3>
                    <p className="text-slate-400 text-sm">Your graded assignments will appear here</p>
                  </div>
                ) : (
                  grades.map((grade) => {
                    const percentage = grade.maxScore ? Math.round((grade.score || 0) / grade.maxScore * 100) : 0;
                    return (
                      <div key={grade.id} className="flex items-center gap-4 p-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl">
                        <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center ${
                          percentage >= 90 ? 'bg-green-500/20' :
                          percentage >= 80 ? 'bg-blue-500/20' :
                          percentage >= 70 ? 'bg-yellow-500/20' :
                          'bg-red-500/20'
                        }`}>
                          <span className={`text-lg font-bold ${
                            percentage >= 90 ? 'text-green-400' :
                            percentage >= 80 ? 'text-blue-400' :
                            percentage >= 70 ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>
                            {grade.letterGrade || `${percentage}%`}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-white">{grade.assignmentTitle}</h4>
                          <p className="text-sm text-slate-500">{grade.courseTitle}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-white">{grade.score}/{grade.maxScore}</p>
                          <p className="text-xs text-slate-500">{percentage}%</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
