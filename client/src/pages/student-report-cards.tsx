import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/hooks/useAuth';
import { apiEndpoint } from '@/lib/config';
import { 
  FileText, 
  Download, 
  Eye, 
  Calendar,
  GraduationCap,
  AlertCircle,
  Loader2
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ReportCard, ReportPeriod } from "@shared/schema";
import { apiEndpoint, assetUrl } from '@/lib/config';

interface ReportCardWithDetails extends ReportCard {
  uploaderName: string;
}

const PERIODS = [
  { value: 'Q1', label: '1st Quarter', color: 'bg-blue-100 text-blue-700' },
  { value: 'Q2', label: '2nd Quarter', color: 'bg-green-100 text-green-700' },
  { value: 'Q3', label: '3rd Quarter', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'Q4', label: '4th Quarter', color: 'bg-orange-100 text-orange-700' },
  { value: 'S1', label: '1st Semester', color: 'bg-purple-100 text-purple-700' },
  { value: 'S2', label: '2nd Semester', color: 'bg-pink-100 text-pink-700' },
  { value: 'FINAL', label: 'Final Report', color: 'bg-red-100 text-red-700' },
] as const;

const ACADEMIC_YEARS = [
  '2024-2025',
  '2023-2024',
  '2022-2023',
  '2021-2022',
];

export default function StudentReportCards() {
  const { token, user } = useAuth();
  const [reportCards, setReportCards] = useState<ReportCardWithDetails[]>([]);
  const [selectedYear, setSelectedYear] = useState(ACADEMIC_YEARS[0]);
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod | 'ALL'>('ALL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReportCards();
  }, [selectedYear, selectedPeriod]);

  const fetchReportCards = async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      let url = apiEndpoint(`/api/report-cards/student?academicYear=${selectedYear}`);
      if (selectedPeriod !== 'ALL') {
        url += `&period=${selectedPeriod}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch report cards');
      }

      const data = await response.json();
      setReportCards(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (reportCard: ReportCardWithDetails) => {
    if (!token) return;
    
    try {
      const response = await fetch(
        apiEndpoint(`/api/report-cards/${reportCard.id}/view`),
        {
          headers: { 'Authorization': `Bearer ${token}` }
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

  const handleDownload = async (reportCard: ReportCardWithDetails) => {
    if (!token) return;
    
    try {
      const response = await fetch(
        apiEndpoint(`/api/report-cards/${reportCard.id}/download`),
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (!response.ok) throw new Error('Failed to download report');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = reportCard.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download report card');
    }
  };

  const getPeriodInfo = (period: ReportPeriod) => {
    return PERIODS.find(p => p.value === period) || PERIODS[0];
  };

  const filteredReports = reportCards.filter(report => {
    if (selectedPeriod === 'ALL') return true;
    return report.period === selectedPeriod;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <GraduationCap className="h-8 w-8 text-blue-600" />
              Report Cards
            </h1>
            <p className="text-gray-600 mt-1">
              View and download your academic progress reports
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filter Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Academic Year
                </label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select academic year" />
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
                <label className="text-sm font-medium text-gray-700">
                  Period
                </label>
                <Select value={selectedPeriod} onValueChange={(val) => setSelectedPeriod(val as ReportPeriod | 'ALL')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Periods</SelectItem>
                    {PERIODS.map(period => (
                      <SelectItem key={period.value} value={period.value}>
                        {period.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Loading report cards...</span>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-red-700">{error}</span>
            </CardContent>
          </Card>
        )}

        {/* Report Cards List */}
        {!loading && !error && (
          <>
            {filteredReports.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-16 w-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    No Report Cards Found
                  </h3>
                  <p className="text-gray-500 text-center max-w-md">
                    Report cards for the selected period will appear here once they are uploaded by your teachers.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredReports.map((report) => {
                  const periodInfo = getPeriodInfo(report.period);
                  
                  return (
                    <Card 
                      key={report.id} 
                      className="hover:shadow-lg transition-shadow border-l-4"
                      style={{ borderLeftColor: periodInfo.color.split(' ')[0].replace('bg-', '#') }}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <Badge className={periodInfo.color}>
                              {periodInfo.label}
                            </Badge>
                            <CardTitle className="text-lg mt-2">
                              {report.academicYear}
                            </CardTitle>
                          </div>
                          <FileText className="h-8 w-8 text-blue-600" />
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center text-gray-600">
                            <Calendar className="h-4 w-4 mr-2" />
                            Uploaded: {new Date(report.uploadedAt).toLocaleDateString()}
                          </div>
                          <div className="text-gray-600">
                            <span className="font-medium">Uploaded by:</span> {report.uploaderName}
                          </div>
                          <div className="text-gray-600">
                            <span className="font-medium">File:</span> {report.fileName}
                          </div>
                          <div className="text-gray-600">
                            <span className="font-medium">Size:</span> {formatFileSize(report.fileSize)}
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2 border-t">
                          <Button 
                            className="flex-1" 
                            variant="outline"
                            onClick={() => handleView(report)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          <Button 
                            className="flex-1"
                            onClick={() => handleDownload(report)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Info Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="flex items-start gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">About Report Cards</p>
              <p>
                Your report cards are official documents showing your academic progress. 
                They are uploaded by your teachers at the end of each quarter or semester. 
                You can view them online or download them for your records.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function formatFileSize(sizeStr: string): string {
  const size = parseInt(sizeStr);
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}
