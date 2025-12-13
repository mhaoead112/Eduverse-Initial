import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiEndpoint } from "@/lib/config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Download, 
  Eye,
  Users,
  FileText,
  Award,
  Loader2,
  Calendar,
  User
} from "lucide-react";

interface Submission {
  id: string;
  content: string | null;
  fileName: string | null;
  fileType: string | null;
  fileSize: string | null;
  submittedAt: string;
  status: string;
  score: string | null;
  feedback: string | null;
  gradedAt: string | null;
}

interface StudentSubmission {
  studentId: string;
  studentName: string;
  studentEmail: string;
  enrolledAt: string;
  hasSubmitted: boolean;
  submission: Submission | null;
}

interface AssignmentSubmissionsData {
  assignment: {
    id: string;
    title: string;
    maxScore: string;
    dueDate: string;
  };
  totalStudents: number;
  submittedCount: number;
  students: StudentSubmission[];
}

export default function TeacherAssignmentSubmissions() {
  const [, params] = useRoute("/teacher/assignments/:assignmentId/submissions");
  const [, setLocation] = useLocation();
  const { token, getAuthHeaders } = useAuth();
  const { toast } = useToast();
  const assignmentId = params?.assignmentId;

  const [selectedSubmission, setSelectedSubmission] = useState<StudentSubmission | null>(null);
  const [isGradeDialogOpen, setIsGradeDialogOpen] = useState(false);
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch submissions
  const { data, isLoading, error } = useQuery<AssignmentSubmissionsData>({
    queryKey: ['assignmentSubmissions', assignmentId],
    queryFn: async () => {
      const response = await fetch(apiEndpoint(`/api/assignments/${assignmentId}/submissions`), {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch submissions');
      }

      return response.json();
    },
    enabled: !!token && !!assignmentId,
  });

  // Grade submission mutation
  const gradeMutation = useMutation({
    mutationFn: async ({ submissionId, score, feedback }: { submissionId: string; score: string; feedback: string }) => {
      const response = await fetch(apiEndpoint(`/api/assignments/submissions/${submissionId}/grade`), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ grade: score, feedback })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to grade submission');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignmentSubmissions'] });
      toast({
        title: "Success",
        description: "Submission graded successfully"
      });
      setIsGradeDialogOpen(false);
      setScore("");
      setFeedback("");
      setSelectedSubmission(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleGradeSubmission = () => {
    if (!selectedSubmission?.submission) return;

    if (!score || parseFloat(score) < 0 || parseFloat(score) > parseFloat(data?.assignment.maxScore || "100")) {
      toast({
        title: "Invalid score",
        description: `Score must be between 0 and ${data?.assignment.maxScore}`,
        variant: "destructive"
      });
      return;
    }

    gradeMutation.mutate({
      submissionId: selectedSubmission.submission.id,
      score,
      feedback
    });
  };

  const handleDownload = async (submissionId: string) => {
    try {
      const response = await fetch(apiEndpoint(`/api/assignments/submissions/${submissionId}/download`), {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = selectedSubmission?.submission?.fileName || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive"
      });
    }
  };

  const filteredStudents = data?.students.filter(student =>
    student.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.studentEmail.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-yellow-500" />
          <p className="text-slate-400">Loading submissions...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-white font-semibold">Failed to load submissions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/teacher/assignments")}
            className="mb-4 text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Assignments
          </Button>
          
          <h1 className="text-3xl font-bold text-white mb-2">
            {data.assignment.title}
          </h1>
          <p className="text-slate-400">
            Review and grade student submissions
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-slate-800/50 border border-slate-700/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Total Students</p>
                  <p className="text-2xl font-bold text-white">{data.totalStudents}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border border-slate-700/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Submitted</p>
                  <p className="text-2xl font-bold text-green-500">{data.submittedCount}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border border-slate-700/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Pending</p>
                  <p className="text-2xl font-bold text-orange-500">{data.totalStudents - data.submittedCount}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border border-slate-700/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Max Score</p>
                  <p className="text-2xl font-bold text-white">{data.assignment.maxScore}</p>
                </div>
                <Award className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="mb-6 bg-slate-800/50 border border-slate-700/50">
          <CardContent className="p-4">
            <Input
              placeholder="Search students by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
            />
          </CardContent>
        </Card>

        {/* Students List */}
        <div className="grid grid-cols-1 gap-4">
          {filteredStudents.map((student) => (
            <Card key={student.studentId} className="bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="bg-slate-700 p-3 rounded-full">
                      <User className="h-6 w-6 text-slate-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-white">{student.studentName}</h3>
                      <p className="text-sm text-slate-400">{student.studentEmail}</p>
                      {student.hasSubmitted && student.submission && (
                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Submitted: {new Date(student.submission.submittedAt).toLocaleString()}
                          </span>
                          {student.submission.score && (
                            <span className="flex items-center gap-1 text-green-500 font-medium">
                              <Award className="h-4 w-4" />
                              Score: {student.submission.score}/{data.assignment.maxScore}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {student.hasSubmitted ? (
                      <>
                        <Badge className="bg-green-500/20 text-green-400 border border-green-500/30">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Submitted
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedSubmission(student)}
                          className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Submission
                        </Button>
                      </>
                    ) : (
                      <Badge variant="secondary" className="bg-orange-500/20 text-orange-400 border border-orange-500/30">
                        <Clock className="h-3 w-3 mr-1" />
                        Not Submitted
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* View Submission Dialog */}
        <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-800 border border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Submission Details</DialogTitle>
              <DialogDescription className="text-slate-400">
                {selectedSubmission?.studentName} • {selectedSubmission?.studentEmail}
              </DialogDescription>
            </DialogHeader>

            {selectedSubmission?.submission && (
              <div className="space-y-4">
                {/* Submission Info */}
                <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                  <h4 className="font-semibold mb-2 text-white">Submission Information</h4>
                  <div className="text-sm space-y-1 text-slate-300">
                    <p>Submitted: {new Date(selectedSubmission.submission.submittedAt).toLocaleString()}</p>
                    {selectedSubmission.submission.fileName && (
                      <p>File: {selectedSubmission.submission.fileName} ({(parseInt(selectedSubmission.submission.fileSize || "0") / 1024).toFixed(2)} KB)</p>
                    )}
                  </div>
                </div>

                {/* Content */}
                {selectedSubmission.submission.content && (
                  <div>
                    <h4 className="font-semibold mb-2 text-white">Submission Content</h4>
                    <div className="bg-slate-700/50 p-4 rounded-lg whitespace-pre-wrap text-slate-300 border border-slate-600">
                      {selectedSubmission.submission.content}
                    </div>
                  </div>
                )}

                {/* File Download */}
                {selectedSubmission.submission.fileName && (
                  <Button
                    variant="outline"
                    onClick={() => handleDownload(selectedSubmission.submission!.id)}
                    className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download {selectedSubmission.submission.fileName}
                  </Button>
                )}

                {/* Current Grade */}
                {selectedSubmission.submission.score && (
                  <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/30">
                    <h4 className="font-semibold mb-2 text-green-400">Current Grade</h4>
                    <p className="text-2xl font-bold text-green-500">{selectedSubmission.submission.score}/{data.assignment.maxScore}</p>
                    {selectedSubmission.submission.feedback && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-green-400">Feedback:</p>
                        <p className="text-sm text-green-300">{selectedSubmission.submission.feedback}</p>
                      </div>
                    )}
                  </div>
                )}

                <Button
                  onClick={() => {
                    setScore(selectedSubmission.submission?.score || "");
                    setFeedback(selectedSubmission.submission?.feedback || "");
                    setIsGradeDialogOpen(true);
                  }}
                  className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-900"
                >
                  <Award className="h-4 w-4 mr-2" />
                  {selectedSubmission.submission.score ? 'Update Grade' : 'Grade Submission'}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Grade Dialog */}
        <Dialog open={isGradeDialogOpen} onOpenChange={setIsGradeDialogOpen}>
          <DialogContent className="bg-slate-800 border border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Grade Submission</DialogTitle>
              <DialogDescription className="text-slate-400">
                Grade {selectedSubmission?.studentName}'s submission
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="score" className="text-slate-300">Score (out of {data.assignment.maxScore})</Label>
                <Input
                  id="score"
                  type="number"
                  min="0"
                  max={data.assignment.maxScore}
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  placeholder="Enter score"
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>

              <div>
                <Label htmlFor="feedback" className="text-slate-300">Feedback (Optional)</Label>
                <Textarea
                  id="feedback"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Provide feedback for the student..."
                  rows={4}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsGradeDialogOpen(false)} className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">
                Cancel
              </Button>
              <Button
                onClick={handleGradeSubmission}
                disabled={gradeMutation.isPending || !score}
                className="bg-yellow-500 hover:bg-yellow-400 text-slate-900"
              >
                {gradeMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Submit Grade
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
