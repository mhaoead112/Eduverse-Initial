import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { 
  ArrowLeft, Calendar, Clock, FileText, Users, 
  Edit, Trash2, Eye, Download, Loader2, CheckCircle2
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiEndpoint } from "@/lib/config";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Assignment {
  id: string;
  title: string;
  description: string;
  courseId: string;
  courseName: string;
  dueDate: string;
  maxScore: number;
  isPublished: boolean;
  createdAt: string;
}

export default function TeacherAssignmentDetail() {
  const [, params] = useRoute("/teacher/assignments/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { token, isLoading: authLoading, getAuthHeaders } = useAuth();
  
  const assignmentId = params?.id;
  
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Edit form state
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editMaxScore, setEditMaxScore] = useState("");

  // Export grades to CSV
  const handleExportGrades = async () => {
    try {
      const response = await fetch(apiEndpoint(`/api/assignments/${assignmentId}/submissions`), {
        headers: getAuthHeaders(),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch submissions");
      }

      const submissions = await response.json();
      
      // Create CSV content
      const headers = ['Student Name', 'Student Email', 'Score', 'Max Score', 'Percentage', 'Status', 'Submitted At'];
      const rows = submissions.map((sub: any) => [
        sub.studentName || 'Unknown',
        sub.studentEmail || '',
        sub.score ?? 'Not Graded',
        assignment?.maxScore ?? 100,
        sub.score ? `${((sub.score / (assignment?.maxScore ?? 100)) * 100).toFixed(1)}%` : '-',
        sub.status,
        sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : 'Not submitted'
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row: (string | number)[]) => row.map((cell: string | number) => `"${cell}"`).join(','))
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${assignment?.title || 'assignment'}_grades_${Date.now()}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Grades exported successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export grades",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (!authLoading && token && assignmentId) {
      fetchAssignment();
    }
  }, [authLoading, token, assignmentId]);

  const fetchAssignment = async () => {
    try {
      setLoading(true);
      const response = await fetch(apiEndpoint(`/api/assignments/${assignmentId}`), {
        headers: getAuthHeaders(),
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setAssignment(data);
        setEditTitle(data.title || "");
        setEditDescription(data.description || "");
        setEditDueDate(data.dueDate ? data.dueDate.split('T')[0] : "");
        setEditMaxScore(data.maxScore ? data.maxScore.toString() : "");
      } else {
        throw new Error("Failed to fetch assignment");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load assignment details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAssignment = async () => {
    try {
      const response = await fetch(apiEndpoint(`/api/assignments/${assignmentId}`), {
        method: "PUT",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          dueDate: editDueDate,
          maxScore: parseInt(editMaxScore),
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Assignment updated successfully",
        });
        setIsEditDialogOpen(false);
        fetchAssignment();
      } else {
        throw new Error("Failed to update assignment");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update assignment",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAssignment = async () => {
    try {
      const response = await fetch(apiEndpoint(`/api/assignments/${assignmentId}`), {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Assignment deleted successfully",
        });
        setLocation("/teacher/assignments");
      } else {
        throw new Error("Failed to delete assignment");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete assignment",
        variant: "destructive",
      });
    }
  };

  const handleTogglePublish = async () => {
    try {
      const response = await fetch(apiEndpoint(`/api/assignments/${assignmentId}/publish`), {
        method: "PATCH",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({ isPublished: !assignment?.isPublished }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: assignment?.isPublished ? "Assignment unpublished" : "Assignment published",
        });
        fetchAssignment();
      } else {
        throw new Error("Failed to toggle publish status");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update assignment status",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
        </div>
      </DashboardLayout>
    );
  }

  if (!assignment) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-slate-400">Assignment not found</p>
          <Button onClick={() => setLocation("/teacher/assignments")} className="mt-4 bg-yellow-500 hover:bg-yellow-400 text-slate-900">
            Back to Assignments
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const isPastDue = new Date(assignment.dueDate) < new Date();

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-10">
        {/* Header */}
        <div className="bg-slate-800/50 rounded-2xl p-6 shadow-lg border border-slate-700/50">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setLocation("/teacher/assignments")}
                className="hover:bg-slate-700/50 text-slate-400"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-white">{assignment.title}</h1>
                  <Badge variant={assignment.isPublished ? "default" : "secondary"}>
                    {assignment.isPublished ? "Published" : "Draft"}
                  </Badge>
                  {isPastDue && (
                    <Badge variant="destructive">Past Due</Badge>
                  )}
                </div>
                <p className="text-slate-400 max-w-2xl">{assignment.description}</p>
                <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Due: {new Date(assignment.dueDate).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    Max Score: {assignment.maxScore} points
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(true)}
                className="bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-600"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button 
                variant={assignment.isPublished ? "outline" : "default"}
                onClick={handleTogglePublish}
                className={assignment.isPublished ? "bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-600" : "bg-yellow-500 hover:bg-yellow-400 text-slate-900"}
              >
                {assignment.isPublished ? (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Unpublish
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Publish
                  </>
                )}
              </Button>
              <Button 
                variant="destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="bg-slate-800/50 border border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400 font-medium">Total Submissions</p>
                  <p className="text-3xl font-bold text-white">0</p>
                </div>
                <Users className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400 font-medium">Graded</p>
                  <p className="text-3xl font-bold text-white">0</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400 font-medium">Pending</p>
                  <p className="text-3xl font-bold text-white">0</p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400 font-medium">Avg Score</p>
                  <p className="text-3xl font-bold text-white">--</p>
                </div>
                <FileText className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <Card className="bg-slate-800/50 border border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full justify-start bg-yellow-500 hover:bg-yellow-400 text-slate-900"
              onClick={() => setLocation(`/teacher/assignments/${assignmentId}/submissions`)}
            >
              <Users className="h-4 w-4 mr-2" />
              View Submissions
            </Button>
            <Button 
              variant="outline"
              className="w-full justify-start bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-600"
              onClick={handleExportGrades}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Grades
            </Button>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl bg-slate-800 border border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Assignment</DialogTitle>
              <DialogDescription className="text-slate-400">Update assignment details</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-slate-300">Title</Label>
                <Input
                  id="title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-slate-300">Description</Label>
                <Textarea
                  id="description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={4}
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dueDate" className="text-slate-300">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxScore" className="text-slate-300">Max Score</Label>
                  <Input
                    id="maxScore"
                    type="number"
                    value={editMaxScore}
                    onChange={(e) => setEditMaxScore(e.target.value)}
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-600">
                Cancel
              </Button>
              <Button onClick={handleUpdateAssignment} className="bg-yellow-500 hover:bg-yellow-400 text-slate-900">Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="bg-slate-800 border border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Delete Assignment</DialogTitle>
              <DialogDescription className="text-slate-400">
                Are you sure you want to delete this assignment? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-600">
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteAssignment}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
