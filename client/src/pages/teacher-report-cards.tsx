import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiEndpoint } from "@/lib/config";
import { 
  Upload, 
  FileText, 
  Trash2, 
  Eye, 
  Download,
  GraduationCap,
  AlertCircle,
  Loader2,
  Search,
  X
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { ReportCard, ReportPeriod, User } from "@shared/schema";

interface ReportCardWithStudent extends ReportCard {
  studentName: string;
  studentEmail: string;
}

const PERIODS = [
  { value: 'Q1', label: '1st Quarter' },
  { value: 'Q2', label: '2nd Quarter' },
  { value: 'Q3', label: '3rd Quarter' },
  { value: 'Q4', label: '4th Quarter' },
  { value: 'S1', label: '1st Semester' },
  { value: 'S2', label: '2nd Semester' },
  { value: 'FINAL', label: 'Final Report' },
] as const;

const ACADEMIC_YEARS = [
  '2024-2025',
  '2023-2024',
  '2022-2023',
];

export default function TeacherReportCards() {
  const { token, user, getAuthHeaders } = useAuth();
  const { toast } = useToast();
  const [students, setStudents] = useState<User[]>([]);
  const [reportCards, setReportCards] = useState<ReportCardWithStudent[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('Q1');
  const [selectedYear, setSelectedYear] = useState(ACADEMIC_YEARS[0]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  useEffect(() => {
    if (token) {
      fetchStudents();
      fetchReportCards();
    }
  }, [token]);

  const fetchStudents = async () => {
    if (!token) return;
    
    try {
      const response = await fetch(apiEndpoint('/api/users/students'), {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch students');
      }

      const data = await response.json();
      setStudents(data);
    } catch (err) {
      console.error('Failed to fetch students:', err);
      toast({
        title: "Error",
        description: "Failed to load students list",
        variant: "destructive"
      });
    }
  };

  const fetchReportCards = async () => {
    if (!token) return;
    
    setLoading(true);
    
    try {
      const response = await fetch(apiEndpoint('/api/report-cards/all'), {
        headers: getAuthHeaders()
      });

      if (!response.ok) throw new Error('Failed to fetch report cards');

      const data = await response.json();
      setReportCards(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type
      if (!file.type.includes('pdf')) {
        toast({
          title: "Invalid file type",
          description: "Please select a PDF file",
          variant: "destructive"
        });
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "File size must be less than 10MB",
          variant: "destructive"
        });
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedStudent || !token) {
      toast({
        title: "Missing information",
        description: "Please select a student and a file",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('studentId', selectedStudent);
      formData.append('period', selectedPeriod);
      formData.append('academicYear', selectedYear);

      // Use XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percentComplete);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          toast({
            title: "Success",
            description: "Report card uploaded successfully!"
          });
          setUploadDialogOpen(false);
          setSelectedFile(null);
          setSelectedStudent('');
          setUploadProgress(0);
          fetchReportCards();
        } else {
          const errorData = JSON.parse(xhr.responseText);
          throw new Error(errorData.message || 'Failed to upload report card');
        }
        setUploading(false);
      });

      xhr.addEventListener('error', () => {
        setError('Network error during upload');
        toast({
          title: "Upload failed",
          description: "Network error occurred",
          variant: "destructive"
        });
        setUploading(false);
        setUploadProgress(0);
      });

      xhr.open('POST', apiEndpoint('/api/report-cards/upload'));
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : 'Upload failed',
        variant: "destructive"
      });
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report card?')) return;
    if (!token) return;

    try {
      const response = await fetch(apiEndpoint(`/api/report-cards/${reportId}`), {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) throw new Error('Failed to delete report card');

      alert('Report card deleted successfully');
      fetchReportCards();
    } catch (err) {
      alert('Failed to delete report card');
    }
  };

  const handleView = async (reportCard: ReportCardWithStudent) => {
    if (!token) return;
    
    try {
      const response = await fetch(
        apiEndpoint(`/api/report-cards/${reportCard.id}/view`),
        {
          headers: getAuthHeaders()
        }
      );

      if (!response.ok) throw new Error('Failed to fetch report');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to view report card');
    }
  };

  const filteredReports = reportCards.filter(report => {
    if (!searchTerm) return true;
    return report.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           report.studentEmail.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getPeriodLabel = (period: ReportPeriod) => {
    return PERIODS.find(p => p.value === period)?.label || period;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 bg-[#0a0f1a] min-h-screen p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <GraduationCap className="h-8 w-8 text-yellow-500" />
              Manage Report Cards
            </h1>
            <p className="text-slate-400 mt-1">
              Upload and manage student report cards
            </p>
          </div>
          
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-yellow-500 hover:bg-yellow-400 text-slate-900">
                <Upload className="h-4 w-4" />
                Upload Report Card
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-slate-800/50 border border-slate-700/50">
              <DialogHeader>
                <DialogTitle className="text-white">Upload Report Card</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Select a student and upload their report card for a specific period
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Student</label>
                  <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a student" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.length === 0 ? (
                        <SelectItem value="no-students" disabled>
                          No students found
                        </SelectItem>
                      ) : (
                        students.map(student => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.fullName || student.username || 'Unknown'} ({student.email})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Academic Year</label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACADEMIC_YEARS.map(year => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Period</label>
                  <Select value={selectedPeriod} onValueChange={(val) => setSelectedPeriod(val as ReportPeriod)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PERIODS.map(period => (
                        <SelectItem key={period.value} value={period.value}>
                          {period.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Report Card File (PDF)</label>
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="bg-slate-700/50 border-slate-600 text-slate-300"
                  />
                  {selectedFile && (
                    <p className="text-sm text-slate-400 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                    </p>
                  )}
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-900/30 border border-red-700/50 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <span className="text-sm text-red-300">{error}</span>
                  </div>
                )}

                {/* Upload Progress */}
                {uploading && uploadProgress > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Uploading...</span>
                      <span className="font-semibold text-yellow-500">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  onClick={() => {
                    setUploadDialogOpen(false);
                    setSelectedFile(null);
                    setError(null);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpload}
                  disabled={!selectedFile || !selectedStudent || uploading}
                  className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading... {uploadProgress}%
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <Card className="bg-slate-800/50 border border-slate-700/50">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by student name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="h-4 w-4 text-slate-400 hover:text-slate-300" />
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Report Cards List */}
        {loading ? (
          <Card className="bg-slate-800/50 border border-slate-700/50">
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
              <span className="ml-3 text-slate-400">Loading report cards...</span>
            </CardContent>
          </Card>
        ) : filteredReports.length === 0 ? (
          <Card className="bg-slate-800/50 border border-slate-700/50">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-16 w-16 text-slate-600 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                No Report Cards Found
              </h3>
              <p className="text-slate-400 text-center max-w-md">
                {searchTerm 
                  ? 'No report cards match your search criteria' 
                  : 'Upload report cards to get started'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <Card className="bg-slate-800/50 border border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white">
                  All Report Cards ({filteredReports.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filteredReports.map((report) => (
                    <div
                      key={report.id}
                      className="flex items-center justify-between p-4 border border-slate-700/50 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <FileText className="h-5 w-5 text-yellow-500" />
                          <div>
                            <h4 className="font-semibold text-white">{report.studentName}</h4>
                            <p className="text-sm text-slate-400">
                              {report.studentEmail}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 text-sm">
                          <Badge variant="outline" className="border-slate-600 text-slate-300">
                            {getPeriodLabel(report.period)}
                          </Badge>
                          <Badge variant="secondary" className="bg-slate-600 text-slate-300">
                            {report.academicYear}
                          </Badge>
                          <span className="text-slate-500">
                            Uploaded: {new Date(report.uploadedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-slate-600 text-slate-300 hover:bg-slate-700"
                          onClick={() => handleView(report)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-400 border-red-700/50 hover:bg-red-900/30"
                          onClick={() => handleDelete(report.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Info */}
        <Card className="bg-yellow-900/20 border border-yellow-700/50">
          <CardContent className="flex items-start gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
            <div className="text-sm text-yellow-200">
              <p className="font-semibold mb-1">Report Card Guidelines</p>
              <ul className="list-disc list-inside space-y-1 text-yellow-300/80">
                <li>Only PDF files are accepted (max 10MB)</li>
                <li>Students will be able to view and download their reports</li>
                <li>You can upload multiple reports for different periods</li>
                <li>Deleted reports cannot be recovered</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
