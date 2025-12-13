import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { 
  FileText, 
  Plus, 
  Edit, 
  GraduationCap,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Eye,
  Calendar,
  BarChart3,
  Award
} from "lucide-react";

// Form schemas
const quizFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().max(500, "Description too long").optional(),
  classId: z.string().min(1, "Class is required"),
  duration: z.number().min(1, "Duration must be at least 1 minute").max(300, "Duration too long"),
  maxScore: z.number().min(1, "Max score required").max(1000, "Score too high"),
  availableFrom: z.string().optional(),
  availableUntil: z.string().optional(),
  allowRetake: z.boolean().default(false),
  randomizeQuestions: z.boolean().default(false),
  showCorrectAnswers: z.boolean().default(true),
});

const assignmentFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().max(1000, "Description too long").optional(),
  instructions: z.string().max(2000, "Instructions too long").optional(),
  classId: z.string().min(1, "Class is required"),
  dueDate: z.string().optional(),
  maxScore: z.number().min(1, "Max score required").max(1000, "Score too high"),
  assignmentType: z.enum(["homework", "project", "essay", "presentation"]),
  allowLateSubmission: z.boolean().default(true),
});

type QuizFormData = z.infer<typeof quizFormSchema>;
type AssignmentFormData = z.infer<typeof assignmentFormSchema>;

interface Assessment {
  id: string;
  type: 'quiz' | 'assignment';
  title: string;
  description?: string;
  classId: string;
  className: string;
  dueDate?: string;
  maxScore: number;
  submissions: number;
  totalStudents: number;
  averageScore?: number;
  status: 'draft' | 'published' | 'closed';
  createdAt: string;
}

interface Submission {
  id: string;
  studentId: string;
  studentName: string;
  assessmentId: string;
  assessmentTitle: string;
  submittedAt: string;
  grade?: number;
  maxScore: number;
  feedback?: string;
  status: 'submitted' | 'graded' | 'late';
}

export default function TeacherAssessments() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isQuizDialogOpen, setIsQuizDialogOpen] = useState(false);
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const { toast } = useToast();

  // Mock data
  const mockClasses = [
    { id: "1", name: "Algebra I" },
    { id: "2", name: "Biology 101" }
  ];

  const mockAssessments: Assessment[] = [
    {
      id: "1",
      type: "quiz",
      title: "Linear Equations Quiz",
      description: "Quiz on solving linear equations",
      classId: "1",
      className: "Algebra I",
      dueDate: "2024-01-25T23:59:00Z",
      maxScore: 100,
      submissions: 25,
      totalStudents: 28,
      averageScore: 84,
      status: "published",
      createdAt: "2024-01-20T00:00:00Z"
    },
    {
      id: "2",
      type: "assignment",
      title: "Cell Structure Essay",
      description: "Write an essay about cell structure and function",
      classId: "2",
      className: "Biology 101",
      dueDate: "2024-01-30T23:59:00Z",
      maxScore: 50,
      submissions: 18,
      totalStudents: 23,
      averageScore: 42,
      status: "published",
      createdAt: "2024-01-22T00:00:00Z"
    },
    {
      id: "3",
      type: "quiz",
      title: "Photosynthesis Quiz",
      description: "Test on photosynthesis process",
      classId: "2",
      className: "Biology 101",
      maxScore: 75,
      submissions: 0,
      totalStudents: 23,
      status: "draft",
      createdAt: "2024-01-23T00:00:00Z"
    }
  ];

  const mockSubmissions: Submission[] = [
    {
      id: "1",
      studentId: "1",
      studentName: "Sarah Johnson",
      assessmentId: "1",
      assessmentTitle: "Linear Equations Quiz",
      submittedAt: "2024-01-24T15:30:00Z",
      grade: 92,
      maxScore: 100,
      feedback: "Excellent work! Great understanding of the concepts.",
      status: "graded"
    },
    {
      id: "2",
      studentId: "2",
      studentName: "Mike Chen",
      assessmentId: "1",
      assessmentTitle: "Linear Equations Quiz",
      submittedAt: "2024-01-24T18:45:00Z",
      maxScore: 100,
      status: "submitted"
    },
    {
      id: "3",
      studentId: "3",
      studentName: "Emma Davis",
      assessmentId: "2",
      assessmentTitle: "Cell Structure Essay",
      submittedAt: "2024-01-29T14:20:00Z",
      grade: 48,
      maxScore: 50,
      feedback: "Good analysis. Consider adding more details about organelle functions.",
      status: "graded"
    }
  ];

  // Form setup
  const quizForm = useForm<QuizFormData>({
    resolver: zodResolver(quizFormSchema),
    defaultValues: {
      title: "",
      description: "",
      classId: "",
      duration: 60,
      maxScore: 100,
      allowRetake: false,
      randomizeQuestions: false,
      showCorrectAnswers: true,
    },
  });

  const assignmentForm = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: {
      title: "",
      description: "",
      instructions: "",
      classId: "",
      maxScore: 100,
      assignmentType: "homework",
      allowLateSubmission: true,
    },
  });

  // Create quiz mutation
  const createQuizMutation = useMutation({
    mutationFn: (data: QuizFormData) => apiRequest('POST', '/api/quizzes', data),
    onSuccess: () => {
      toast({ title: "Success", description: "Quiz created successfully!" });
      setIsQuizDialogOpen(false);
      quizForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create quiz", variant: "destructive" });
    },
  });

  // Create assignment mutation
  const createAssignmentMutation = useMutation({
    mutationFn: (data: AssignmentFormData) => apiRequest('POST', '/api/assignments', data),
    onSuccess: () => {
      toast({ title: "Success", description: "Assignment created successfully!" });
      setIsAssignmentDialogOpen(false);
      assignmentForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create assignment", variant: "destructive" });
    },
  });

  const onQuizSubmit = (data: QuizFormData) => {
    createQuizMutation.mutate(data);
  };

  const onAssignmentSubmit = (data: AssignmentFormData) => {
    createAssignmentMutation.mutate(data);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-500/20 text-green-400 border border-green-500/30';
      case 'draft': return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      case 'closed': return 'bg-slate-500/20 text-slate-400 border border-slate-500/30';
      case 'graded': return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'submitted': return 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
      case 'late': return 'bg-red-500/20 text-red-400 border border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border border-slate-500/30';
    }
  };

  const pendingGradingCount = mockSubmissions.filter(s => s.status === 'submitted').length;

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Assessment Tools
            </h1>
            <p className="text-slate-400">
              Create quizzes, manage assignments, and grade student work
            </p>
          </div>
          
          <div className="flex gap-3">
            <Dialog open={isQuizDialogOpen} onOpenChange={setIsQuizDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white" data-testid="button-create-quiz">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Quiz
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Quiz</DialogTitle>
                  <DialogDescription>
                    Set up a new quiz for your students
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...quizForm}>
                  <form onSubmit={quizForm.handleSubmit(onQuizSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={quizForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quiz Title</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Chapter 5 Quiz" {...field} data-testid="input-quiz-title" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={quizForm.control}
                        name="classId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Class</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-quiz-class">
                                  <SelectValue placeholder="Select class" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {mockClasses.map((classItem) => (
                                  <SelectItem key={classItem.id} value={classItem.id}>
                                    {classItem.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={quizForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Brief description of the quiz" {...field} data-testid="textarea-quiz-description" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={quizForm.control}
                        name="duration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Duration (minutes)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                                data-testid="input-quiz-duration"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={quizForm.control}
                        name="maxScore"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Max Score</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                                data-testid="input-quiz-max-score"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="space-y-2">
                        <Label>Available Until</Label>
                        <Input type="datetime-local" data-testid="input-quiz-available-until" />
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-3">
                      <Button type="button" variant="outline" onClick={() => setIsQuizDialogOpen(false)} data-testid="button-cancel-quiz">
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createQuizMutation.isPending} data-testid="button-submit-quiz">
                        {createQuizMutation.isPending ? "Creating..." : "Create Quiz"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            
            <Dialog open={isAssignmentDialogOpen} onOpenChange={setIsAssignmentDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-yellow-500 hover:bg-yellow-400 text-slate-900" data-testid="button-create-assignment">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Assignment
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Assignment</DialogTitle>
                  <DialogDescription>
                    Set up a new assignment for your students
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...assignmentForm}>
                  <form onSubmit={assignmentForm.handleSubmit(onAssignmentSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={assignmentForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Assignment Title</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Research Project" {...field} data-testid="input-assignment-title" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={assignmentForm.control}
                        name="classId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Class</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-assignment-class">
                                  <SelectValue placeholder="Select class" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {mockClasses.map((classItem) => (
                                  <SelectItem key={classItem.id} value={classItem.id}>
                                    {classItem.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={assignmentForm.control}
                        name="assignmentType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-assignment-type">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="homework">Homework</SelectItem>
                                <SelectItem value="project">Project</SelectItem>
                                <SelectItem value="essay">Essay</SelectItem>
                                <SelectItem value="presentation">Presentation</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={assignmentForm.control}
                        name="maxScore"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Max Score</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                                data-testid="input-assignment-max-score"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={assignmentForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Assignment description" {...field} data-testid="textarea-assignment-description" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={assignmentForm.control}
                      name="instructions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Instructions</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Detailed instructions for students" {...field} rows={4} data-testid="textarea-assignment-instructions" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div>
                      <Label>Due Date</Label>
                      <Input type="datetime-local" data-testid="input-assignment-due-date" />
                    </div>
                    
                    <div className="flex justify-end gap-3">
                      <Button type="button" variant="outline" onClick={() => setIsAssignmentDialogOpen(false)} data-testid="button-cancel-assignment">
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createAssignmentMutation.isPending} data-testid="button-submit-assignment">
                        {createAssignmentMutation.isPending ? "Creating..." : "Create Assignment"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800/50 border border-slate-700/50" data-testid="card-total-assessments">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Total Assessments</CardTitle>
              <FileText className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{mockAssessments.length}</div>
              <p className="text-xs text-slate-500">Active assessments</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border border-slate-700/50" data-testid="card-pending-grading">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Pending Grading</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-400">{pendingGradingCount}</div>
              <p className="text-xs text-slate-500">Submissions to review</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border border-slate-700/50" data-testid="card-average-score">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Average Score</CardTitle>
              <BarChart3 className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">83%</div>
              <p className="text-xs text-slate-500">Across all assessments</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border border-slate-700/50" data-testid="card-completion-rate">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Completion Rate</CardTitle>
              <Award className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">92%</div>
              <p className="text-xs text-slate-500">Students completing work</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-800/50 border border-slate-700/50">
            <TabsTrigger value="overview" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-slate-900 text-slate-400" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="grading" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-slate-900 text-slate-400" data-testid="tab-grading">
              Grading Queue
              {pendingGradingCount > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs bg-red-500">
                  {pendingGradingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="gradebook" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-slate-900 text-slate-400" data-testid="tab-gradebook">Gradebook</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
              {/* Assessments List */}
              <Card className="bg-slate-800/50 border border-slate-700/50" data-testid="card-assessments-list">
                <CardHeader>
                  <CardTitle className="text-white">Recent Assessments</CardTitle>
                  <CardDescription className="text-slate-400">Manage your quizzes and assignments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockAssessments.map((assessment) => (
                      <div 
                        key={assessment.id}
                        className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600/30"
                        data-testid={`assessment-item-${assessment.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            {assessment.type === 'quiz' ? (
                              <GraduationCap className="h-5 w-5 text-blue-400" />
                            ) : (
                              <FileText className="h-5 w-5 text-green-400" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-white">
                              {assessment.title}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-slate-400">
                              <span>{assessment.className}</span>
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {assessment.submissions}/{assessment.totalStudents} submitted
                              </span>
                              {assessment.averageScore && (
                                <span>Avg: {assessment.averageScore}%</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={getStatusColor(assessment.status)}>
                            {assessment.status}
                          </Badge>
                          <Button variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white" data-testid={`button-view-assessment-${assessment.id}`}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="grading" className="space-y-6">
            <Card className="bg-slate-800/50 border border-slate-700/50" data-testid="card-grading-queue">
              <CardHeader>
                <CardTitle className="text-white">Grading Queue</CardTitle>
                <CardDescription className="text-slate-400">Review and grade student submissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockSubmissions.filter(s => s.status === 'submitted').map((submission) => (
                    <div 
                      key={submission.id}
                      className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600/30"
                      data-testid={`submission-item-${submission.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <h3 className="font-semibold text-white">
                            {submission.studentName}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-slate-400">
                            <span>{submission.assessmentTitle}</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Submitted {new Date(submission.submittedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(submission.status)}>
                          {submission.status}
                        </Badge>
                        <Button size="sm" className="bg-yellow-500 hover:bg-yellow-400 text-slate-900" data-testid={`button-grade-${submission.id}`}>
                          <Edit className="h-4 w-4 mr-1" />
                          Grade
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {mockSubmissions.filter(s => s.status === 'submitted').length === 0 && (
                    <div className="text-center py-8" data-testid="empty-grading-queue">
                      <CheckCircle className="h-12 w-12 mx-auto text-green-400 mb-4" />
                      <h3 className="text-lg font-semibold text-white mb-2">
                        All caught up!
                      </h3>
                      <p className="text-slate-400">
                        No submissions pending review at this time.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gradebook" className="space-y-6">
            <Card className="bg-slate-800/50 border border-slate-700/50" data-testid="card-gradebook">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-white">Gradebook</CardTitle>
                    <CardDescription className="text-slate-400">Overview of all student grades</CardDescription>
                  </div>
                  <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white" data-testid="button-export-grades">
                    <Download className="h-4 w-4 mr-2" />
                    Export Grades
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockSubmissions.filter(s => s.status === 'graded').map((submission) => (
                    <div 
                      key={submission.id}
                      className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600/30"
                      data-testid={`grade-item-${submission.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <h3 className="font-semibold text-white">
                            {submission.studentName}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-slate-400">
                            <span>{submission.assessmentTitle}</span>
                            <span>Graded {new Date(submission.submittedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-lg font-bold text-white">
                            {submission.grade}/{submission.maxScore}
                          </div>
                          <div className="text-sm text-slate-500">
                            {Math.round((submission.grade! / submission.maxScore) * 100)}%
                          </div>
                        </div>
                        <Badge className={getStatusColor('graded')}>
                          Graded
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
