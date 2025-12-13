import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiEndpoint } from "@/lib/config";
import StudentLayout from "@/components/StudentLayout";
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Calendar,
  BookOpen,
  ChevronRight,
  Filter,
  Search,
  Upload,
  Eye
} from "lucide-react";

interface Assignment {
  id: number;
  title: string;
  description?: string;
  dueDate: string;
  courseId: number;
  maxScore?: number;
  type?: string;
  status?: string;
  course?: {
    id: number;
    title: string;
    subject?: {
      name: string;
    };
  };
  submission?: {
    id: number;
    submittedAt: string;
    score?: number;
    feedback?: string;
    status: string;
  };
}

export default function StudentAssignmentsPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "submitted" | "graded" | "overdue">("all");
  const [sortBy, setSortBy] = useState<"dueDate" | "course" | "status">("dueDate");

  const { data, isLoading } = useQuery({
    queryKey: ["/api/assignments/student"],
    queryFn: async () => {
      const response = await fetch(apiEndpoint("/api/assignments/student"), {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch assignments");
      }
      return response.json();
    },
    enabled: !!user,
  });

  const assignments: Assignment[] = data?.assignments || [];

  // Calculate stats
  const stats = {
    total: assignments.length,
    pending: assignments.filter(a => !a.submission && new Date(a.dueDate) >= new Date()).length,
    submitted: assignments.filter(a => a.submission?.status === "submitted").length,
    graded: assignments.filter(a => a.submission?.status === "graded").length,
    overdue: assignments.filter(a => !a.submission && new Date(a.dueDate) < new Date()).length,
  };

  // Get assignment status
  const getAssignmentStatus = (assignment: Assignment) => {
    if (assignment.submission?.status === "graded") {
      return { label: "Graded", color: "text-emerald-400 bg-emerald-500/20 border-emerald-500/30" };
    }
    if (assignment.submission?.status === "submitted") {
      return { label: "Submitted", color: "text-blue-400 bg-blue-500/20 border-blue-500/30" };
    }
    const isOverdue = new Date(assignment.dueDate) < new Date();
    if (isOverdue) {
      return { label: "Overdue", color: "text-red-400 bg-red-500/20 border-red-500/30" };
    }
    return { label: "Pending", color: "text-amber-400 bg-amber-500/20 border-amber-500/30" };
  };

  // Get days until due
  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Format due date
  const formatDueDate = (dueDate: string) => {
    const date = new Date(dueDate);
    const daysUntil = getDaysUntilDue(dueDate);
    
    if (daysUntil < 0) {
      return { text: `${Math.abs(daysUntil)} days ago`, urgent: true };
    }
    if (daysUntil === 0) {
      return { text: "Due today", urgent: true };
    }
    if (daysUntil === 1) {
      return { text: "Due tomorrow", urgent: true };
    }
    if (daysUntil <= 3) {
      return { text: `Due in ${daysUntil} days`, urgent: true };
    }
    return { 
      text: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }), 
      urgent: false 
    };
  };

  // Filter assignments
  const filteredAssignments = assignments
    .filter(a => {
      const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           a.course?.title.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;
      
      switch (statusFilter) {
        case "pending":
          return !a.submission && new Date(a.dueDate) >= new Date();
        case "submitted":
          return a.submission?.status === "submitted";
        case "graded":
          return a.submission?.status === "graded";
        case "overdue":
          return !a.submission && new Date(a.dueDate) < new Date();
        default:
          return true;
      }
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "dueDate":
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case "course":
          return (a.course?.title || "").localeCompare(b.course?.title || "");
        case "status":
          return getAssignmentStatus(a).label.localeCompare(getAssignmentStatus(b).label);
        default:
          return 0;
      }
    });

  const filterOptions = [
    { value: "all", label: "All", count: stats.total },
    { value: "pending", label: "Pending", count: stats.pending },
    { value: "submitted", label: "Submitted", count: stats.submitted },
    { value: "graded", label: "Graded", count: stats.graded },
    { value: "overdue", label: "Overdue", count: stats.overdue },
  ];

  return (
    <StudentLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Assignments</h1>
            <p className="text-slate-400 mt-1">View and submit your assignments</p>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search assignments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 w-full lg:w-72"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: "Total", value: stats.total, icon: FileText, gradient: "from-slate-500/20 to-slate-600/10", border: "border-slate-500/20", iconBg: "bg-slate-500/20", iconColor: "text-slate-400" },
            { label: "Pending", value: stats.pending, icon: Clock, gradient: "from-amber-500/20 to-orange-500/10", border: "border-amber-500/20", iconBg: "bg-amber-500/20", iconColor: "text-amber-400" },
            { label: "Submitted", value: stats.submitted, icon: Upload, gradient: "from-blue-500/20 to-indigo-500/10", border: "border-blue-500/20", iconBg: "bg-blue-500/20", iconColor: "text-blue-400" },
            { label: "Graded", value: stats.graded, icon: CheckCircle2, gradient: "from-emerald-500/20 to-green-500/10", border: "border-emerald-500/20", iconBg: "bg-emerald-500/20", iconColor: "text-emerald-400" },
            { label: "Overdue", value: stats.overdue, icon: AlertCircle, gradient: "from-red-500/20 to-rose-500/10", border: "border-red-500/20", iconBg: "bg-red-500/20", iconColor: "text-red-400" },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`bg-gradient-to-br ${stat.gradient} border ${stat.border} rounded-2xl p-4`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${stat.iconBg} flex items-center justify-center`}>
                  <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-slate-400">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setStatusFilter(option.value as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                statusFilter === option.value
                  ? "bg-amber-500 text-slate-900"
                  : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-white border border-slate-700/50"
              }`}
            >
              <span>{option.label}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-md ${
                statusFilter === option.value
                  ? "bg-slate-900/30"
                  : "bg-slate-700/50"
              }`}>
                {option.count}
              </span>
            </button>
          ))}
        </div>

        {/* Assignments List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-amber-500 border-t-transparent"></div>
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No assignments found</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your search or filter criteria"
                : "You don't have any assignments yet. Check back later!"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAssignments.map((assignment) => {
              const status = getAssignmentStatus(assignment);
              const dueInfo = formatDueDate(assignment.dueDate);
              
              return (
                <Link key={assignment.id} href={`/student/assignment/${assignment.id}`}>
                  <div className="group flex items-center gap-4 bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 hover:bg-slate-800/60 hover:border-slate-600/50 transition-all cursor-pointer">
                    {/* Assignment Icon */}
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-6 w-6 text-amber-400" />
                    </div>
                    
                    {/* Assignment Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-white group-hover:text-amber-400 transition-colors">
                            {assignment.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                            <BookOpen className="h-3.5 w-3.5" />
                            <span>{assignment.course?.title || "Unknown Course"}</span>
                            {assignment.course?.subject && (
                              <>
                                <span>•</span>
                                <span>{assignment.course.subject.name}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-lg text-xs font-medium border ${status.color}`}>
                          {status.label}
                        </div>
                      </div>
                      
                      {/* Due Date and Score */}
                      <div className="flex items-center gap-4 mt-3">
                        <div className={`flex items-center gap-1.5 text-sm ${dueInfo.urgent ? "text-amber-400" : "text-slate-400"}`}>
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{dueInfo.text}</span>
                        </div>
                        
                        {assignment.maxScore && (
                          <div className="flex items-center gap-1.5 text-sm text-slate-400">
                            <span className="font-medium">
                              {assignment.submission?.score !== undefined
                                ? `${assignment.submission.score}/${assignment.maxScore}`
                                : `${assignment.maxScore} pts`}
                            </span>
                          </div>
                        )}
                        
                        {assignment.submission?.status === "graded" && assignment.submission.score !== undefined && assignment.maxScore && (
                          <div className="flex items-center gap-1.5">
                            <div className={`text-sm font-medium ${
                              (assignment.submission.score / assignment.maxScore) >= 0.9 ? "text-emerald-400" :
                              (assignment.submission.score / assignment.maxScore) >= 0.7 ? "text-blue-400" :
                              (assignment.submission.score / assignment.maxScore) >= 0.5 ? "text-amber-400" :
                              "text-red-400"
                            }`}>
                              {Math.round((assignment.submission.score / assignment.maxScore) * 100)}%
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Action Button */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {assignment.submission ? (
                        <div className="flex items-center gap-1 text-slate-400 text-sm">
                          <Eye className="h-4 w-4" />
                          <span>View</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-amber-400 text-sm font-medium">
                          <Upload className="h-4 w-4" />
                          <span>Submit</span>
                        </div>
                      )}
                      <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                    </div>
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
