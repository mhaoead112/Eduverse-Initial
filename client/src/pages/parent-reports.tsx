import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { FileText, Download, Calendar, User, ExternalLink } from "lucide-react";
import { apiEndpoint, assetUrl } from '@/lib/config';

interface Child {
  id: string;
  fullName: string;
}

interface ReportCard {
  id: string;
  period: string;
  academicYear: string;
  fileName: string;
  filePath: string;
  fileSize: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export default function ParentReports() {
  const { token } = useAuth();
  const [, setLocation] = useLocation();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>("");
  const [reports, setReports] = useState<ReportCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChildren();
  }, [token]);

  useEffect(() => {
    if (selectedChild) {
      fetchReportCards();
    }
  }, [selectedChild, token]);

  const fetchChildren = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(apiEndpoint('/api/parent/children'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setChildren(data.children || []);
        if (data.children?.length > 0 && !selectedChild) {
          setSelectedChild(data.children[0].id);
        }
      } else if (response.status === 401) {
        setLocation('/login');
      }
    } catch (error) {
      console.error('Error fetching children:', error);
    }
  };

  const fetchReportCards = async () => {
    if (!token || !selectedChild) return;

    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:3001/api/parent/children/${selectedChild}/reports`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        }
      );

      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
      } else if (response.status === 401) {
        setLocation('/login');
      }
    } catch (error) {
      console.error('Error fetching report cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPeriodColor = (period: string) => {
    const colors: { [key: string]: string } = {
      'Q1': 'bg-blue-100 text-blue-700',
      'Q2': 'bg-green-100 text-green-700',
      'Q3': 'bg-yellow-100 text-yellow-700',
      'Q4': 'bg-purple-100 text-purple-700',
      'S1': 'bg-indigo-100 text-indigo-700',
      'S2': 'bg-pink-100 text-pink-700',
      'FINAL': 'bg-red-100 text-red-700'
    };
    return colors[period] || 'bg-gray-100 text-gray-700';
  };

  const formatFileSize = (size: string) => {
    const bytes = parseInt(size);
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleDownload = (report: ReportCard) => {
    // In a real implementation, this would download the file
    window.open(assetUrl(report.filePath), '_blank');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-6 w-6 text-purple-600" />
                  Report Cards
                </CardTitle>
                <CardDescription>View and download academic report cards</CardDescription>
              </div>
              {children.length > 0 && (
                <Select value={selectedChild} onValueChange={setSelectedChild}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select child" />
                  </SelectTrigger>
                  <SelectContent>
                    {children.map((child) => (
                      <SelectItem key={child.id} value={child.id}>
                        {child.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8 text-gray-500">Loading report cards...</div>
        )}

        {/* Empty State */}
        {!loading && reports.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Report Cards Available
              </h3>
              <p className="text-gray-500">
                Report cards will appear here once they are uploaded by the school.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Report Cards Grid */}
        {!loading && reports.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {reports.map((report) => (
              <Card key={report.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-white rounded-lg shadow-sm">
                        <FileText className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {report.period} Report Card
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          Academic Year {report.academicYear}
                        </p>
                      </div>
                    </div>
                    <Badge className={getPeriodColor(report.period)}>
                      {report.period}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="pt-6 space-y-4">
                  {/* File Info */}
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <FileText className="h-4 w-4" />
                      <span className="font-medium">{report.fileName}</span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600">
                      <User className="h-4 w-4" />
                      <span>Uploaded by {report.uploadedBy || 'Administrator'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(report.uploadedAt)}</span>
                    </div>

                    <div className="pt-2 border-t">
                      <span className="text-gray-500">
                        Size: {formatFileSize(report.fileSize)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleDownload(report)}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
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
            ))}
          </div>
        )}

        {/* Info Card */}
        {!loading && reports.length > 0 && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900 mb-1">About Report Cards</p>
                  <p className="text-sm text-blue-700">
                    Report cards are official academic documents that summarize your child's performance.
                    They are typically issued at the end of each quarter or semester. Download and save
                    these documents for your records.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
