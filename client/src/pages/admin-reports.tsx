import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  Flag, AlertTriangle, CheckCircle, Clock, Eye, 
  Loader2, User, XCircle, Shield, RefreshCw, Search
} from "lucide-react";

interface Report {
  id: string;
  reportedUserId: string;
  reportedUser: {
    id: string;
    fullName: string;
    email: string;
  };
  reporterId: string;
  reporter: {
    id: string;
    fullName: string;
    email: string;
  };
  reason: string;
  description?: string;
  status: "pending" | "reviewed" | "resolved";
  createdAt: string;
  updatedAt?: string;
}

export default function AdminReports() {
  const { toast } = useToast();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [filter, setFilter] = useState({ status: "all" });

  // Fetch reports
  const { data: reportsData, isLoading } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: async () => {
      const response = await fetch('http://localhost:3001/api/admin/reports', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }
      
      const data = await response.json();
      return data.reports || [];
    },
    enabled: !!token
  });

  // Update report status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ reportId, status }: { reportId: string; status: string }) => {
      const response = await fetch(`http://localhost:3001/api/admin/reports/${reportId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ status })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update report');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      toast({
        title: "Success",
        description: "Report status updated successfully"
      });
      setIsViewModalOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-gradient-to-r from-amber-500 to-orange-500 text-white";
      case "reviewed": return "bg-gradient-to-r from-blue-500 to-indigo-500 text-white";
      case "resolved": return "bg-gradient-to-r from-green-500 to-emerald-500 text-white";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="h-4 w-4" />;
      case "reviewed": return <Eye className="h-4 w-4" />;
      case "resolved": return <CheckCircle className="h-4 w-4" />;
      default: return <Flag className="h-4 w-4" />;
    }
  };

  const handleUpdateStatus = (status: string) => {
    if (!selectedReport) return;
    updateStatusMutation.mutate({ reportId: selectedReport.id, status });
  };

  const handleViewReport = (report: Report) => {
    setSelectedReport(report);
    setIsViewModalOpen(true);
  };

  // Ensure reports is always an array
  const reports: Report[] = Array.isArray(reportsData) ? reportsData : [];
  
  const filteredReports = reports.filter((report: Report) => {
    if (filter.status !== "all" && report.status !== filter.status) return false;
    return true;
  });

  const stats = {
    total: reports.length,
    pending: reports.filter((r: Report) => r.status === "pending").length,
    reviewed: reports.filter((r: Report) => r.status === "reviewed").length,
    resolved: reports.filter((r: Report) => r.status === "resolved").length,
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-red-200 rounded-full animate-spin border-t-red-600" />
            <Flag className="h-6 w-6 text-red-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-gray-500 font-medium">Loading reports...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 p-8 text-white shadow-xl">
          <div className="absolute inset-0 bg-grid-white/10" />
          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Shield className="h-6 w-6" />
                  </div>
                  <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">
                    Moderation Center
                  </Badge>
                </div>
                <h1 className="text-3xl font-bold mb-2">User Reports</h1>
                <p className="text-white/80 max-w-xl">
                  Review and manage reports submitted by users. Take appropriate action to maintain platform safety.
                </p>
              </div>
              
              <div className="hidden lg:block">
                <Button variant="outline" size="icon" onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-reports'] })} className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-3">
                  <Flag className="h-8 w-8 text-white/80" />
                  <div>
                    <p className="text-2xl font-bold">{stats.total}</p>
                    <p className="text-white/60 text-sm">Total Reports</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-3">
                  <Clock className="h-8 w-8 text-amber-300" />
                  <div>
                    <p className="text-2xl font-bold">{stats.pending}</p>
                    <p className="text-white/60 text-sm">Pending</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-3">
                  <Eye className="h-8 w-8 text-blue-300" />
                  <div>
                    <p className="text-2xl font-bold">{stats.reviewed}</p>
                    <p className="text-white/60 text-sm">Under Review</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-8 w-8 text-green-300" />
                  <div>
                    <p className="text-2xl font-bold">{stats.resolved}</p>
                    <p className="text-white/60 text-sm">Resolved</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <Select value={filter.status} onValueChange={(v) => setFilter({ ...filter, status: v })}>
                <SelectTrigger className="w-[200px] bg-white">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="reviewed">Under Review</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Reports Table */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-red-500 to-rose-500 rounded-lg">
                <Flag className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">All Reports</CardTitle>
                <CardDescription>Showing {filteredReports.length} reports</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredReports.length === 0 ? (
              <div className="text-center py-16">
                <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports</h3>
                <p className="text-gray-500">There are no reports matching your filters</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50/50 border-b">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Reported User</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Reporter</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Reason</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredReports.map((report: Report) => (
                      <tr key={report.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-mono text-gray-600">
                          #{report.id.substring(0, 8)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-red-500 to-rose-500 flex items-center justify-center text-white text-xs font-bold">
                              {report.reportedUser.fullName.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {report.reportedUser.fullName}
                              </div>
                              <div className="text-gray-500 text-xs">
                                {report.reportedUser.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                              {report.reporter.fullName.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {report.reporter.fullName}
                              </div>
                              <div className="text-gray-500 text-xs">
                                {report.reporter.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                          {report.reason}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <Badge className={`${getStatusColor(report.status)} gap-1 font-medium`}>
                            {getStatusIcon(report.status)}
                            <span className="capitalize">{report.status}</span>
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(report.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewReport(report)}
                            className="gap-1"
                          >
                            <Eye className="h-3 w-3" />
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* View Report Dialog */}
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-r from-red-500 to-rose-500 rounded-lg">
                  <Flag className="h-5 w-5 text-white" />
                </div>
                Report Details
              </DialogTitle>
              <DialogDescription>
                Review the report and take appropriate action
              </DialogDescription>
            </DialogHeader>
            
            {selectedReport && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-gray-50 border">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Report ID</label>
                    <p className="text-sm font-mono text-gray-900 mt-1">#{selectedReport.id.substring(0, 8)}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-50 border">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Date</label>
                    <p className="text-sm text-gray-900 mt-1">
                      {new Date(selectedReport.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-r from-red-50 to-rose-50 border border-red-100">
                  <label className="text-xs font-medium text-red-600 uppercase tracking-wide">Reported User</label>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-red-500 to-rose-500 flex items-center justify-center text-white font-bold">
                      {selectedReport.reportedUser.fullName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{selectedReport.reportedUser.fullName}</p>
                      <p className="text-sm text-gray-600">{selectedReport.reportedUser.email}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                  <label className="text-xs font-medium text-blue-600 uppercase tracking-wide">Reporter</label>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold">
                      {selectedReport.reporter.fullName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{selectedReport.reporter.fullName}</p>
                      <p className="text-sm text-gray-600">{selectedReport.reporter.email}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 border">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Reason</label>
                  <p className="mt-2 text-gray-900 font-medium">{selectedReport.reason}</p>
                </div>

                {selectedReport.description && (
                  <div className="p-4 rounded-xl bg-gray-50 border">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Description</label>
                    <p className="mt-2 text-sm text-gray-700">{selectedReport.description}</p>
                  </div>
                )}

                <div className="p-4 rounded-xl bg-gray-50 border">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Current Status</label>
                  <div className="mt-2">
                    <Badge className={`${getStatusColor(selectedReport.status)} gap-1`}>
                      {getStatusIcon(selectedReport.status)}
                      <span className="capitalize">{selectedReport.status}</span>
                    </Badge>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={() => handleUpdateStatus('reviewed')}
                    disabled={updateStatusMutation.isPending || selectedReport.status === 'reviewed'}
                    variant="outline"
                    className="gap-2"
                  >
                    {updateStatusMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                    Mark as Reviewed
                  </Button>
                  <Button
                    onClick={() => handleUpdateStatus('resolved')}
                    disabled={updateStatusMutation.isPending || selectedReport.status === 'resolved'}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 gap-2"
                  >
                    {updateStatusMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    Mark as Resolved
                  </Button>
                  <Button
                    onClick={() => handleUpdateStatus('pending')}
                    disabled={updateStatusMutation.isPending || selectedReport.status === 'pending'}
                    variant="outline"
                    className="gap-2"
                  >
                    {updateStatusMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Clock className="h-4 w-4" />
                    )}
                    Mark as Pending
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
