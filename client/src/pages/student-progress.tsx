import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, FileText, GraduationCap, AlertCircle } from "lucide-react";

interface StudentAssignment {
  id: string;
  title: string;
  courseTitle?: string;
  dueDate?: string | null;
  status?: string;
}

interface StudentSubmission {
  id: string;
  assignmentTitle?: string;
  submittedAt?: string | null;
  status?: string;
}

interface StudentGrade {
  id: string;
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
  const { user, getAuthHeaders } = useAuth();
  const [data, setData] = useState<MyProgressResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProgress = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch("http://localhost:3001/api/student/my-progress", {
          headers: getAuthHeaders(),
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

  return (
    <DashboardLayout role="student" userName={user?.fullName || user?.username || "Student"}>
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Progress</h1>
          <p className="mt-1 text-sm text-slate-600">
            View your assignments, submissions, and grades in one place.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-slate-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading your progress...
          </div>
        ) : error ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-6 text-sm text-red-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {/* Assignments */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <FileText className="h-4 w-4 text-blue-600" />
                  Upcoming Assignments
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {assignments.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {assignments.length === 0 ? (
                  <p className="text-slate-500 text-xs">No assignments found.</p>
                ) : (
                  assignments.map((a) => (
                    <div key={a.id} className="rounded-md border border-slate-100 p-3">
                      <div className="font-medium text-slate-900">{a.title}</div>
                      {a.courseTitle && (
                        <div className="text-xs text-slate-500 mt-0.5">{a.courseTitle}</div>
                      )}
                      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                        {a.dueDate && <span>Due {new Date(a.dueDate).toLocaleString()}</span>}
                        {a.status && (
                          <Badge variant="outline" className="text-[10px] uppercase">
                            {a.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Submissions */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Recent Submissions
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {submissions.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {submissions.length === 0 ? (
                  <p className="text-slate-500 text-xs">No submissions yet.</p>
                ) : (
                  submissions.map((s) => (
                    <div key={s.id} className="rounded-md border border-slate-100 p-3">
                      <div className="font-medium text-slate-900">
                        {s.assignmentTitle || "Assignment"}
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                        {s.submittedAt && <span>Submitted {new Date(s.submittedAt).toLocaleString()}</span>}
                        {s.status && (
                          <Badge variant="outline" className="text-[10px] uppercase">
                            {s.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Grades */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <GraduationCap className="h-4 w-4 text-indigo-600" />
                  Grades
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {grades.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {grades.length === 0 ? (
                  <p className="text-slate-500 text-xs">No grades posted yet.</p>
                ) : (
                  grades.map((g) => (
                    <div key={g.id} className="rounded-md border border-slate-100 p-3">
                      <div className="font-medium text-slate-900 flex justify-between items-center">
                        <span>{g.assignmentTitle || g.courseTitle || "Assessment"}</span>
                        {g.letterGrade && (
                          <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 rounded-full px-2 py-0.5">
                            {g.letterGrade}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-slate-500 flex justify-between">
                        {g.courseTitle && <span>{g.courseTitle}</span>}
                        {g.score != null && g.maxScore != null && (
                          <span>
                            {g.score}/{g.maxScore}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
