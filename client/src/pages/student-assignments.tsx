import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { 
  ClipboardList, Clock, CheckCircle, AlertCircle, Calendar,
  Filter, Download, Upload, FileText, Play, Search,
  ArrowUpDown, ChevronDown, Loader2, X, Send, Eye,
  PaperclipIcon, Trash2, CheckCircle2, XCircle, AlertTriangle,
  ChevronRight, Timer, MoreVertical
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { apiEndpoint, assetUrl } from '@/lib/config';

// Countdown Timer Component
function CountdownTimer({ dueDate }: { dueDate: string }) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(dueDate).getTime() - new Date().getTime();
      if (difference > 0) {
        setTimeLeft({
          hours: Math.floor(difference / (1000 * 60 * 60)),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [dueDate]);

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className="font-mono text-3xl sm:text-4xl font-bold text-white tracking-wider">
      {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
    </div>
  );
}

interface APIAssignment {
  id: number;
  courseId: number;
  lessonId: number | null;
  title: string;
  description: string;
  type: string;
  dueDate: string;
  maxScore: number;
  isPublished: boolean;
  createdAt: string;
  courseTitle: string;
  courseDescription: string | null;
  submission: {
    id: number;
    content: string | null;
    filePath: string | null;
    fileName: string | null;
    submittedAt: string;
    status: string;
    score: number | null;
    feedback: string | null;
  } | null;
  status: 'pending' | 'submitted' | 'graded' | 'overdue';
  grade: number | null;
  feedback: string | null;
  submittedAt: string | null;
}

interface Assignment {
  id: string;
  title: string;
  course: string;
  courseColor: string;
  dueDate: string;
  dueTime: string;
  status: 'pending' | 'in-progress' | 'completed' | 'late';
  priority: 'high' | 'medium' | 'low';
  points: number;
  earnedPoints?: number;
  description: string;
  type: 'essay' | 'quiz' | 'project' | 'homework' | 'exam' | 'presentation';
  submissions: number;
  maxSubmissions: number;
  submissionId?: string;
  submissionContent?: string;
  submissionFile?: string;
  feedback?: string;
}

interface SubmissionFormData {
  assignmentId: string;
  content: string;
  file: File | null;
}

// Fetch assignments from API
const fetchAssignments = async (token: string): Promise<APIAssignment[]> => {
  const response = await fetch(apiEndpoint('/api/assignments/student'), {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    credentials: "include",
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch assignments');
  }
  
  return response.json();
};

// Helper functions
const calculatePriority = (dueDate: string): 'high' | 'medium' | 'low' => {
  const due = new Date(dueDate);
  const now = new Date();
  const hoursUntilDue = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  if (hoursUntilDue < 24) return 'high';
  if (hoursUntilDue < 72) return 'medium';
  return 'low';
};

const formatDueDate = (dueDate: string): string => {
  const due = new Date(dueDate);
  const now = new Date();
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
  if (diffDays < 7) return `In ${diffDays} days`;
  
  return due.toLocaleDateString();
};

const mockAssignments: Assignment[] = [
  {
    id: '1',
    title: 'Calculus Problem Set #5',
    course: 'Advanced Mathematics',
    courseColor: 'blue',
    dueDate: 'Today',
    dueTime: '11:59 PM',
    status: 'pending',
    priority: 'high',
    points: 100,
    description: 'Complete problems 1-20 from Chapter 5. Show all work and explain your reasoning.',
    type: 'homework',
    submissions: 0,
    maxSubmissions: 3
  },
  {
    id: '2',
    title: 'Lab Report: Electromagnetic Waves',
    course: 'Physics Laboratory',
    courseColor: 'green',
    dueDate: 'Tomorrow',
    dueTime: '5:00 PM',
    status: 'in-progress',
    priority: 'medium',
    points: 150,
    description: 'Write a comprehensive lab report including hypothesis, methodology, results, and conclusion.',
    type: 'project',
    submissions: 1,
    maxSubmissions: 2
  },
  {
    id: '3',
    title: 'Essay: Modern Poetry Analysis',
    course: 'English Literature',
    courseColor: 'purple',
    dueDate: 'Friday',
    dueTime: '2:00 PM',
    status: 'pending',
    priority: 'medium',
    points: 100,
    description: 'Analyze three modern poems and discuss their themes, literary devices, and cultural context.',
    type: 'essay',
    submissions: 0,
    maxSubmissions: 1
  },
  {
    id: '4',
    title: 'Programming Project: Web Application',
    course: 'Computer Science',
    courseColor: 'orange',
    dueDate: 'Next Monday',
    dueTime: '11:59 PM',
    status: 'completed',
    priority: 'low',
    points: 200,
    earnedPoints: 195,
    description: 'Build a full-stack web application using React and Node.js with user authentication.',
    type: 'project',
    submissions: 1,
    maxSubmissions: 1
  },
  {
    id: '5',
    title: 'Chemistry Quiz: Organic Compounds',
    course: 'Chemistry',
    courseColor: 'red',
    dueDate: 'Yesterday',
    dueTime: '10:00 AM',
    status: 'late',
    priority: 'high',
    points: 50,
    description: 'Online quiz covering organic chemistry fundamentals and nomenclature.',
    type: 'quiz',
    submissions: 0,
    maxSubmissions: 1
  },
  {
    id: '6',
    title: 'History Essay: Industrial Revolution',
    course: 'World History',
    courseColor: 'yellow',
    dueDate: 'Next Week',
    dueTime: '11:59 PM',
    status: 'pending',
    priority: 'low',
    points: 100,
    description: 'Discuss the social and economic impacts of the Industrial Revolution on modern society.',
    type: 'essay',
    submissions: 0,
    maxSubmissions: 2
  }
];

const statusConfig = {
  pending: { label: 'Not Started', icon: AlertCircle, color: 'text-orange-400 bg-orange-500/20 border-orange-500/30' },
  'in-progress': { label: 'In Progress', icon: Clock, color: 'text-blue-400 bg-blue-500/20 border-blue-500/30' },
  completed: { label: 'Submitted', icon: CheckCircle, color: 'text-green-400 bg-green-500/20 border-green-500/30' },
  late: { label: 'Overdue', icon: AlertCircle, color: 'text-red-400 bg-red-500/20 border-red-500/30' }
};

const priorityConfig = {
  high: { color: 'bg-red-500', label: 'High Priority' },
  medium: { color: 'bg-yellow-500', label: 'Medium Priority' },
  low: { color: 'bg-green-500', label: 'Low Priority' }
};

const typeConfig = {
  essay: { label: 'Essay', icon: FileText },
  quiz: { label: 'Quiz', icon: ClipboardList },
  project: { label: 'Project', icon: Upload },
  homework: { label: 'Homework', icon: FileText },
  exam: { label: 'Exam', icon: AlertCircle },
  presentation: { label: 'Presentation', icon: Upload }
};

// Assignment Card for "Coming Up This Week" section
function AssignmentMiniCard({ assignment, onSubmit }: { 
  assignment: Assignment;
  onSubmit: (assignment: Assignment) => void;
}) {
  const statusInfo = statusConfig[assignment.status];
  const isCompleted = assignment.status === 'completed';
  
  // Color based on course
  const courseColors: Record<string, string> = {
    'HISTORY': 'bg-purple-500/20 text-purple-400',
    'PHYSICS': 'bg-blue-500/20 text-blue-400',
    'CS': 'bg-emerald-500/20 text-emerald-400',
  };
  const courseKey = assignment.course.split(' ')[0].toUpperCase().slice(0, 7);
  const courseColor = courseColors[courseKey] || 'bg-slate-500/20 text-slate-400';

  return (
    <Card className="bg-slate-800/60 border-slate-700/50 rounded-xl overflow-hidden hover:border-slate-600 transition-all">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <span className={`text-[10px] font-bold uppercase tracking-wider ${courseColor} px-2 py-0.5 rounded`}>
            {courseKey}
          </span>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-500 hover:text-white">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
        
        <h4 className="font-semibold text-white text-sm mb-2 line-clamp-1">{assignment.title}</h4>
        <p className="text-xs text-slate-400 line-clamp-2 mb-3">{assignment.description}</p>
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-xs">
            <Calendar className="h-3 w-3 text-slate-500" />
            <span className="text-slate-400">{assignment.dueDate}, {assignment.dueTime}</span>
          </div>
          <Badge 
            variant="outline" 
            className={`text-[10px] border ${statusInfo.color}`}
          >
            {statusInfo.label}
          </Badge>
        </div>
        
        {/* Progress bar for in-progress items */}
        {assignment.status === 'in-progress' && (
          <div className="mb-3">
            <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full w-1/2 bg-blue-500 rounded-full" />
            </div>
          </div>
        )}
        
        <Button 
          size="sm" 
          className={`w-full h-9 rounded-lg text-sm font-medium ${
            isCompleted 
              ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
              : assignment.status === 'in-progress'
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-slate-700 text-white hover:bg-slate-600'
          }`}
          onClick={() => onSubmit(assignment)}
        >
          {isCompleted ? 'View Submission' : assignment.status === 'in-progress' ? 'Continue' : 'Start Assignment'}
        </Button>
      </CardContent>
    </Card>
  );
}

function AssignmentCard({ assignment, onSubmit, onViewDetails, onViewSubmission }: { 
  assignment: Assignment;
  onSubmit: (assignment: Assignment) => void;
  onViewDetails: (assignment: Assignment) => void;
  onViewSubmission: (assignment: Assignment) => void;
}) {
  const statusInfo = statusConfig[assignment.status];
  const StatusIcon = statusInfo.icon;
  const typeInfo = typeConfig[assignment.type] || typeConfig.homework;
  const TypeIcon = typeInfo.icon;

  return (
    <Card className="bg-slate-800/60 border-slate-700/50 hover:border-slate-600 transition-all rounded-xl overflow-hidden">
      <CardHeader className="pb-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant="outline" className="text-[10px] font-medium border-slate-600 text-slate-300">
                {assignment.course}
              </Badge>
              <Badge variant="outline" className="text-[10px] border-slate-600 text-slate-400">
                <TypeIcon className="h-2.5 w-2.5 mr-1" />
                {typeInfo.label}
              </Badge>
            </div>
            <CardTitle className="text-base text-white mb-1">
              {assignment.title}
            </CardTitle>
            <p className="text-xs text-slate-400 line-clamp-2">
              {assignment.description}
            </p>
          </div>
          <Badge 
            variant="outline" 
            className={`text-[10px] whitespace-nowrap border ${statusInfo.color}`}
          >
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusInfo.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-0">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-700/50 p-2.5 rounded-lg">
            <p className="text-[10px] text-slate-500 mb-0.5">Due Date</p>
            <p className="font-semibold text-xs text-white flex items-center gap-1">
              <Calendar className="h-3 w-3 text-blue-400" />
              {assignment.dueDate}
            </p>
            <p className="text-[10px] text-slate-500">{assignment.dueTime}</p>
          </div>
          <div className="bg-slate-700/50 p-2.5 rounded-lg">
            <p className="text-[10px] text-slate-500 mb-0.5">Points</p>
            <p className="font-bold text-sm text-white">
              {assignment.status === 'completed' && assignment.earnedPoints !== undefined
                ? <span className="text-green-400">{assignment.earnedPoints}/{assignment.points}</span>
                : assignment.points
              }
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white text-xs h-8"
            onClick={() => onViewDetails(assignment)}
          >
            <Eye className="h-3 w-3 mr-1" />
            Details
          </Button>
          <Button 
            size="sm" 
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs h-8"
            onClick={() => onSubmit(assignment)}
          >
            <Upload className="h-3 w-3 mr-1" />
            {assignment.status === 'completed' ? 'Resubmit' : 'Submit'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function StudentAssignments() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCourse, setFilterCourse] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("dueDate");
  
  // Submission dialog state
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissionContent, setSubmissionContent] = useState("");
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  
  // Details dialog state
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [detailsAssignment, setDetailsAssignment] = useState<Assignment | null>(null);
  
  // View submission dialog state
  const [isViewSubmissionOpen, setIsViewSubmissionOpen] = useState(false);
  const [viewSubmissionAssignment, setViewSubmissionAssignment] = useState<Assignment | null>(null);
  const [submissionData, setSubmissionData] = useState<any>(null);
  const [loadingSubmission, setLoadingSubmission] = useState(false);

  // Fetch assignments from API
  const { data: apiAssignments = [], isLoading, error } = useQuery<APIAssignment[]>({
    queryKey: ['studentAssignments'],
    queryFn: () => fetchAssignments(token || ''),
    enabled: !!token,
    refetchInterval: 30000,
  });

  // Submit assignment mutation
  const submitMutation = useMutation({
    mutationFn: async ({ assignmentId, content, file }: { assignmentId: string; content: string; file: File | null }) => {
      const formData = new FormData();
      formData.append('content', content);
      if (file) {
        formData.append('file', file);
      }

      const response = await fetch(apiEndpoint(`/api/assignments/${assignmentId}/submit`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: "include",
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit assignment');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentAssignments'] });
      toast({
        title: "Success!",
        description: "Assignment submitted successfully",
      });
      setIsSubmitDialogOpen(false);
      setSubmissionContent("");
      setSubmissionFile(null);
      setSelectedAssignment(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleSubmitAssignment = () => {
    if (!selectedAssignment) return;
    
    if (!submissionContent.trim() && !submissionFile) {
      toast({
        title: "Missing content",
        description: "Please provide submission content or upload a file",
        variant: "destructive"
      });
      return;
    }

    submitMutation.mutate({
      assignmentId: selectedAssignment.id,
      content: submissionContent,
      file: submissionFile
    });
  };

  const handleOpenSubmitDialog = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setSubmissionContent(assignment.submissionContent || "");
    setIsSubmitDialogOpen(true);
  };

  const handleViewDetails = (assignment: Assignment) => {
    setDetailsAssignment(assignment);
    setIsDetailsDialogOpen(true);
  };

  const handleViewSubmission = async (assignment: Assignment) => {
    setViewSubmissionAssignment(assignment);
    setIsViewSubmissionOpen(true);
    setLoadingSubmission(true);
    
    try {
      const response = await fetch(apiEndpoint(`/api/assignments/${assignment.id}/my-submission`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        setSubmissionData(data);
      } else {
        toast({
          title: "Error",
          description: "Failed to load submission",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load submission",
        variant: "destructive",
      });
    } finally {
      setLoadingSubmission(false);
    }
  };

  const handleDownloadSubmission = async (submissionId: number) => {
    try {
      const response = await fetch(apiEndpoint(`/api/assignments/submissions/${submissionId}/download`), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (response.ok) {
        const blob = await response.blob();
        const filename = response.headers.get('content-disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'download';
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSubmissionFile(e.target.files[0]);
    }
  };

  // Transform API data to match UI expectations
  const mockAssignments: Assignment[] = apiAssignments.map(assignment => {
    const priority = calculatePriority(assignment.dueDate);
    const formattedDueDate = formatDueDate(assignment.dueDate);
    const dueTime = new Date(assignment.dueDate).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit' 
    });

    let displayStatus: 'pending' | 'in-progress' | 'completed' | 'late' = 'pending';
    if (assignment.status === 'graded') {
      displayStatus = 'completed';
    } else if (assignment.status === 'submitted') {
      displayStatus = 'in-progress';
    } else if (assignment.status === 'overdue') {
      displayStatus = 'late';
    }

    return {
      id: assignment.id.toString(),
      title: assignment.title,
      course: assignment.courseTitle,
      courseColor: 'blue',
      dueDate: formattedDueDate,
      dueTime: dueTime,
      status: displayStatus,
      priority: priority,
      points: assignment.maxScore,
      earnedPoints: assignment.grade || undefined,
      description: assignment.description,
      type: (assignment.type || 'homework') as 'essay' | 'quiz' | 'project' | 'homework' | 'exam' | 'presentation',
      submissions: assignment.submission ? 1 : 0,
      maxSubmissions: 3,
    };
  });

  // Filter and sort assignments
  const filteredAssignments = mockAssignments
    .filter(assignment => {
      const matchesSearch = assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           assignment.course.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === "all" || assignment.status === filterStatus;
      const matchesCourse = filterCourse === "all" || assignment.course === filterCourse;
      return matchesSearch && matchesStatus && matchesCourse;
    })
    .sort((a, b) => {
      if (sortBy === "dueDate") {
        // Simple sort by due date string
        return a.dueDate.localeCompare(b.dueDate);
      } else if (sortBy === "priority") {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return 0;
    });

  const stats = {
    total: mockAssignments.length,
    pending: mockAssignments.filter(a => a.status === 'pending').length,
    inProgress: mockAssignments.filter(a => a.status === 'in-progress').length,
    completed: mockAssignments.filter(a => a.status === 'completed').length,
    late: mockAssignments.filter(a => a.status === 'late').length
  };

  const uniqueCourses = Array.from(new Set(mockAssignments.map(a => a.course)));

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-12 w-12 mx-auto animate-spin text-yellow-500" />
              <p className="text-slate-400 mt-4">Loading assignments...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-white font-semibold">Failed to load assignments</p>
              <p className="text-slate-400 mt-2">
                {error instanceof Error ? error.message : 'An error occurred'}
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Get the most urgent assignment for the featured "Due Soon" card
  const urgentAssignment = filteredAssignments.find(a => a.status === 'pending' || a.status === 'in-progress');
  const upcomingAssignments = filteredAssignments.slice(0, 3);

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              My Assignments
            </h1>
            <p className="text-slate-400 mt-1 text-sm">
              Track your progress and stay on top of deadlines.
            </p>
          </div>
          <Button className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-semibold rounded-xl px-4 h-10 w-fit">
            <Upload className="h-4 w-4 mr-2" />
            Submit External Work
          </Button>
        </div>

        {/* Tab Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            size="sm"
            className={`rounded-full h-8 px-4 text-sm ${
              filterStatus === 'all' 
                ? 'bg-white text-slate-900' 
                : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
            onClick={() => setFilterStatus('all')}
          >
            All
          </Button>
          <Button 
            variant={filterStatus === 'pending' ? 'default' : 'outline'}
            size="sm"
            className={`rounded-full h-8 px-4 text-sm ${
              filterStatus === 'pending' 
                ? 'bg-white text-slate-900' 
                : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
            onClick={() => setFilterStatus('pending')}
          >
            To Do <Badge variant="secondary" className="ml-1.5 bg-slate-700 text-slate-300 text-xs">{stats.pending}</Badge>
          </Button>
          <Button 
            variant={filterStatus === 'in-progress' ? 'default' : 'outline'}
            size="sm"
            className={`rounded-full h-8 px-4 text-sm ${
              filterStatus === 'in-progress' 
                ? 'bg-white text-slate-900' 
                : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
            onClick={() => setFilterStatus('in-progress')}
          >
            In Progress <Badge variant="secondary" className="ml-1.5 bg-slate-700 text-slate-300 text-xs">{stats.inProgress}</Badge>
          </Button>
          <Button 
            variant={filterStatus === 'completed' ? 'default' : 'outline'}
            size="sm"
            className={`rounded-full h-8 px-4 text-sm ${
              filterStatus === 'completed' 
                ? 'bg-white text-slate-900' 
                : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
            onClick={() => setFilterStatus('completed')}
          >
            Graded
          </Button>
          <Button 
            variant={filterStatus === 'late' ? 'default' : 'outline'}
            size="sm"
            className={`rounded-full h-8 px-4 text-sm ${
              filterStatus === 'late' 
                ? 'bg-white text-slate-900' 
                : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
            onClick={() => setFilterStatus('late')}
          >
            Overdue <Badge variant="secondary" className="ml-1.5 bg-red-500/20 text-red-400 text-xs">{stats.late}</Badge>
          </Button>
          
          <div className="ml-auto">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[200px] h-9 bg-slate-800/60 border-slate-700 text-slate-300 rounded-lg">
                <SelectValue placeholder="Sort by Due Date (Closest)" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="dueDate">Sort by Due Date (Closest)</SelectItem>
                <SelectItem value="priority">Sort by Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Due Soon - Featured Assignment */}
        {urgentAssignment && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <h2 className="text-lg font-bold text-white">Due Soon</h2>
            </div>
            
            <Card className="bg-slate-800/60 border-slate-700/50 rounded-2xl overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                  <div className="flex-1 space-y-3">
                    <Badge className="bg-red-500 text-white text-xs font-bold uppercase tracking-wide">
                      Due Today, 11:59 PM
                    </Badge>
                    <h3 className="text-xl sm:text-2xl font-bold text-white">
                      {urgentAssignment.title}
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      {urgentAssignment.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs">
                          Σ
                        </div>
                        <div>
                          <p className="text-white font-medium">{urgentAssignment.course}</p>
                          <p className="text-slate-500 text-xs">Prof. Johnson</p>
                        </div>
                      </div>
                      <div className="text-slate-500">
                        <span className="text-slate-400">Estimated Time</span>
                        <span className="text-white ml-2">~45 mins</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center gap-3 lg:border-l lg:border-slate-700 lg:pl-6">
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Time Remaining</p>
                    <CountdownTimer dueDate={new Date(Date.now() + 4 * 60 * 60 * 1000 + 12 * 60 * 1000 + 35 * 1000).toISOString()} />
                    <Button 
                      className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-semibold rounded-xl px-6 h-10 mt-2"
                      onClick={() => handleOpenSubmitDialog(urgentAssignment)}
                    >
                      Resume
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Coming Up This Week */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Coming Up This Week</h2>
            <Button variant="link" className="text-blue-400 hover:text-blue-300 text-sm p-0 h-auto">
              View Calendar
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingAssignments.map(assignment => (
              <AssignmentMiniCard 
                key={assignment.id} 
                assignment={assignment}
                onSubmit={handleOpenSubmitDialog}
              />
            ))}
          </div>
        </div>

        {/* All Assignments Grid */}
        {filteredAssignments.length > 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white">All Assignments</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredAssignments.slice(3).map(assignment => (
                <AssignmentCard 
                  key={assignment.id} 
                  assignment={assignment}
                  onSubmit={handleOpenSubmitDialog}
                  onViewDetails={handleViewDetails}
                  onViewSubmission={handleViewSubmission}
                />
              ))}
            </div>
          </div>
        )}

        {filteredAssignments.length === 0 && (
          <Card className="bg-slate-800/60 border-slate-700/50 rounded-2xl">
            <CardContent className="p-16 text-center">
              <ClipboardList className="h-16 w-16 mx-auto text-slate-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-white">No assignments found</h3>
              <p className="text-slate-400">
                Try adjusting your filters or check back later
              </p>
            </CardContent>
          </Card>
        )}

        {/* Submit Assignment Dialog */}
        <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
          <DialogContent className="sm:max-w-[600px] bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-2xl text-white">Submit Assignment</DialogTitle>
              <DialogDescription className="text-base text-slate-400">
                Submit your work for "{selectedAssignment?.title}"
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Assignment Info */}
              <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-lg text-white">
                      {selectedAssignment?.title}
                    </p>
                    <p className="text-sm text-slate-400">
                      {selectedAssignment?.course}
                    </p>
                  </div>
                  <Badge className="bg-yellow-500 text-slate-900">
                    {selectedAssignment?.points} pts
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Due: {selectedAssignment?.dueDate} at {selectedAssignment?.dueTime}
                  </span>
                </div>
              </div>

              {/* Text Content */}
              <div className="space-y-2">
                <Label htmlFor="content" className="text-base font-medium text-white">
                  Submission Content
                </Label>
                <Textarea
                  id="content"
                  placeholder="Write your submission here... (optional if uploading a file)"
                  value={submissionContent}
                  onChange={(e) => setSubmissionContent(e.target.value)}
                  rows={8}
                  className="resize-none border-slate-700 bg-slate-800/60 text-white placeholder:text-slate-500 focus:border-yellow-500 transition-colors rounded-xl"
                />
                <p className="text-xs text-slate-500">
                  You can type your submission directly or upload a file below
                </p>
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="file" className="text-base font-medium text-white">
                  Attach File (Optional)
                </Label>
                <div className="border-2 border-dashed border-slate-700 rounded-xl p-6 text-center hover:border-yellow-500 transition-colors bg-slate-800/30">
                  <input
                    id="file"
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {submissionFile ? (
                    <div className="flex items-center justify-between bg-emerald-500/20 p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <PaperclipIcon className="h-5 w-5 text-emerald-400" />
                        <span className="text-sm font-medium text-emerald-300">
                          {submissionFile.name}
                        </span>
                        <span className="text-xs text-emerald-400">
                          ({(submissionFile.size / 1024).toFixed(2)} KB)
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSubmissionFile(null)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label htmlFor="file" className="cursor-pointer">
                      <Upload className="h-12 w-12 mx-auto text-slate-500 mb-3" />
                      <p className="text-sm font-medium text-slate-300 mb-1">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-slate-500">
                        PDF, DOC, DOCX, TXT, or ZIP (max 10MB)
                      </p>
                    </label>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsSubmitDialogOpen(false);
                  setSubmissionContent("");
                  setSubmissionFile(null);
                }}
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitAssignment}
                disabled={submitMutation.isPending || (!submissionContent.trim() && !submissionFile)}
                className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-semibold"
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Assignment
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Assignment Details Dialog */}
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-2xl text-white">{detailsAssignment?.title}</DialogTitle>
              <DialogDescription className="text-slate-400">
                {detailsAssignment?.course}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Status and Priority */}
              <div className="flex gap-3 flex-wrap">
                <Badge 
                  variant="outline" 
                  className={`px-4 py-2 text-sm font-medium border-0 ${
                    statusConfig[detailsAssignment?.status || 'pending'].color
                  }`}
                >
                  {statusConfig[detailsAssignment?.status || 'pending'].label}
                </Badge>
                <Badge 
                  variant="secondary"
                  className={`px-4 py-2 text-sm font-medium ${
                    priorityConfig[detailsAssignment?.priority || 'low'].color
                  } text-white`}
                >
                  {priorityConfig[detailsAssignment?.priority || 'low'].label}
                </Badge>
                <Badge variant="outline" className="px-4 py-2 text-sm border-slate-700 text-slate-300">
                  {typeConfig[detailsAssignment?.type || 'homework'].label}
                </Badge>
              </div>

              {/* Description */}
              <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700">
                <h3 className="font-semibold mb-2 text-lg text-white">Description</h3>
                <p className="text-slate-300 leading-relaxed">
                  {detailsAssignment?.description}
                </p>
              </div>

              {/* Due Date and Points */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700">
                  <p className="text-sm text-slate-400 mb-1">Due Date</p>
                  <p className="font-semibold text-lg text-white flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-yellow-500" />
                    {detailsAssignment?.dueDate}
                  </p>
                  <p className="text-sm text-slate-400 mt-1">
                    {detailsAssignment?.dueTime}
                  </p>
                </div>
                <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700">
                  <p className="text-sm text-slate-400 mb-1">Points</p>
                  <p className="font-semibold text-2xl text-emerald-400">
                    {detailsAssignment?.earnedPoints !== undefined 
                      ? `${detailsAssignment.earnedPoints}/${detailsAssignment.points}`
                      : detailsAssignment?.points
                    }
                  </p>
                  {detailsAssignment?.earnedPoints !== undefined && (
                    <Progress 
                      value={(detailsAssignment.earnedPoints / detailsAssignment.points) * 100}
                      className="h-2 mt-2 bg-slate-700"
                    />
                  )}
                </div>
              </div>

              {/* Feedback (if completed) */}
              {detailsAssignment?.status === 'completed' && detailsAssignment?.feedback && (
                <div className="bg-yellow-500/20 p-4 rounded-xl border border-yellow-500/30">
                  <h3 className="font-semibold mb-2 text-lg text-yellow-400 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Teacher Feedback
                  </h3>
                  <p className="text-yellow-200 leading-relaxed">
                    {detailsAssignment.feedback}
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDetailsDialogOpen(false)}
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Close
              </Button>
              {detailsAssignment?.status !== 'completed' && (
                <Button
                  onClick={() => {
                    setIsDetailsDialogOpen(false);
                    if (detailsAssignment) {
                      handleOpenSubmitDialog(detailsAssignment);
                    }
                  }}
                  className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-semibold"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Submit Assignment
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View My Submission Dialog */}
        <Dialog open={isViewSubmissionOpen} onOpenChange={setIsViewSubmissionOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-white">My Submission</DialogTitle>
              <DialogDescription className="text-slate-400">
                View your submission for {viewSubmissionAssignment?.title}
              </DialogDescription>
            </DialogHeader>

            {loadingSubmission ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
              </div>
            ) : submissionData ? (
              <div className="space-y-6">
                {/* Assignment Info */}
                <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700">
                  <h3 className="font-semibold text-lg mb-2 text-white">
                    {submissionData.assignment?.title}
                  </h3>
                  <p className="text-slate-400 text-sm">
                    {submissionData.assignment?.description}
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                    <span>Max Score: {submissionData.assignment?.maxScore}</span>
                    <span>•</span>
                    <span>Due: {new Date(submissionData.assignment?.dueDate).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Submission Status */}
                <div className="flex items-center justify-between p-4 bg-slate-800/60 rounded-xl border border-slate-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-400" />
                    <span className="font-medium text-white">Submitted</span>
                  </div>
                  <span className="text-sm text-slate-400">
                    {new Date(submissionData.submission.submittedAt).toLocaleString()}
                  </span>
                </div>

                {/* Submission Content */}
                {submissionData.submission.content && (
                  <div className="space-y-2">
                    <Label className="text-base font-semibold text-white">Submission Text</Label>
                    <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
                        {submissionData.submission.content}
                      </p>
                    </div>
                  </div>
                )}

                {/* Submitted File */}
                {submissionData.submission.fileName && (
                  <div className="space-y-2">
                    <Label className="text-base font-semibold text-white">Attached File</Label>
                    <div className="flex items-center justify-between p-4 bg-slate-800/60 rounded-xl border border-slate-700">
                      <div className="flex items-center gap-3">
                        <PaperclipIcon className="h-5 w-5 text-slate-500" />
                        <div>
                          <p className="font-medium text-sm text-white">{submissionData.submission.fileName}</p>
                          <p className="text-xs text-slate-500">
                            {(submissionData.submission.fileSize / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-slate-700 text-slate-300 hover:bg-slate-800"
                        onClick={() => handleDownloadSubmission(submissionData.submission.id)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                )}

                {/* Grade and Feedback */}
                {submissionData.grade ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-base font-semibold text-emerald-400">
                          Grade
                        </Label>
                        <span className="text-2xl font-bold text-emerald-400">
                          {submissionData.grade.score}/{submissionData.grade.maxScore}
                        </span>
                      </div>
                      <Progress 
                        value={(submissionData.grade.score / submissionData.grade.maxScore) * 100}
                        className="h-2 bg-slate-700"
                      />
                    </div>

                    {submissionData.grade.feedback && (
                      <div className="p-4 bg-yellow-500/20 rounded-xl border border-yellow-500/30">
                        <Label className="text-base font-semibold text-yellow-400 flex items-center gap-2 mb-2">
                          <FileText className="h-5 w-5" />
                          Teacher Feedback
                        </Label>
                        <p className="text-yellow-200 text-sm leading-relaxed whitespace-pre-wrap">
                          {submissionData.grade.feedback}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700">
                    <p className="text-sm text-slate-400 text-center">
                      This submission has not been graded yet.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                No submission data available
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsViewSubmissionOpen(false);
                  setSubmissionData(null);
                }}
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setIsViewSubmissionOpen(false);
                  setSubmissionData(null);
                  if (viewSubmissionAssignment) {
                    handleOpenSubmitDialog(viewSubmissionAssignment);
                  }
                }}
                className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-semibold"
              >
                <Upload className="h-4 w-4 mr-2" />
                Resubmit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
