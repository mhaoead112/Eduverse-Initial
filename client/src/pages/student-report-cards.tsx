import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiEndpoint } from "@/lib/config";
import StudentLayout from "@/components/StudentLayout";
import { 
  FileText, 
  Download, 
  Eye, 
  Calendar,
  GraduationCap,
  AlertCircle,
  Filter,
  ChevronDown
} from "lucide-react";

interface ReportCard {
  id: number;
  studentId: number;
  period: string;
  academicYear: string;
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  uploadedBy: number;
  uploaderName?: string;
}

const PERIODS = [
  { value: 'Q1', label: '1st Quarter', color: 'from-blue-500/20 to-blue-600/10', border: 'border-blue-500/30', text: 'text-blue-400', bg: 'bg-blue-500' },
  { value: 'Q2', label: '2nd Quarter', color: 'from-emerald-500/20 to-emerald-600/10', border: 'border-emerald-500/30', text: 'text-emerald-400', bg: 'bg-emerald-500' },
  { value: 'Q3', label: '3rd Quarter', color: 'from-amber-500/20 to-amber-600/10', border: 'border-amber-500/30', text: 'text-amber-400', bg: 'bg-amber-500' },
  { value: 'Q4', label: '4th Quarter', color: 'from-orange-500/20 to-orange-600/10', border: 'border-orange-500/30', text: 'text-orange-400', bg: 'bg-orange-500' },
  { value: 'S1', label: '1st Semester', color: 'from-purple-500/20 to-purple-600/10', border: 'border-purple-500/30', text: 'text-purple-400', bg: 'bg-purple-500' },
  { value: 'S2', label: '2nd Semester', color: 'from-pink-500/20 to-pink-600/10', border: 'border-pink-500/30', text: 'text-pink-400', bg: 'bg-pink-500' },
  { value: 'FINAL', label: 'Final Report', color: 'from-red-500/20 to-red-600/10', border: 'border-red-500/30', text: 'text-red-400', bg: 'bg-red-500' },
];

const ACADEMIC_YEARS = [
  '2024-2025',
  '2023-2024',
  '2022-2023',
  '2021-2022',
];

export default function StudentReportCards() {
  const { user } = useAuth();
  const [reportCards, setReportCards] = useState<ReportCard[]>([]);
  const [selectedYear, setSelectedYear] = useState(ACADEMIC_YEARS[0]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showYearDropdown, setShowYearDropdown] = useState(false);

  useEffect(() => {
    fetchReportCards();
  }, [selectedYear, selectedPeriod]);

  const fetchReportCards = async () => {
    const token = localStorage.getItem("token");
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

  const handleView = async (reportCard: ReportCard) => {
    const token = localStorage.getItem("token");
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

  const handleDownload = async (reportCard: ReportCard) => {
    const token = localStorage.getItem("token");
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

  const getPeriodInfo = (period: string) => {
    return PERIODS.find(p => p.value === period) || PERIODS[0];
  };

  const filteredReports = reportCards.filter(report => {
    if (selectedPeriod === 'ALL') return true;
    return report.period === selectedPeriod;
  });

  const formatFileSize = (sizeStr: string): string => {
    const size = parseInt(sizeStr);
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <StudentLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/20 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-amber-400" />
              </div>
              Report Cards
            </h1>
            <p className="text-slate-400 mt-1">View and download your academic progress reports</p>
          </div>
          
          {/* Year Selector */}
          <div className="relative">
            <button
              onClick={() => setShowYearDropdown(!showYearDropdown)}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm text-white hover:bg-slate-700/50 transition-colors"
            >
              <Calendar className="h-4 w-4 text-slate-400" />
              <span>{selectedYear}</span>
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${showYearDropdown ? "rotate-180" : ""}`} />
            </button>
            
            {showYearDropdown && (
              <div className="absolute right-0 mt-2 w-40 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-10 overflow-hidden">
                {ACADEMIC_YEARS.map(year => (
                  <button
                    key={year}
                    onClick={() => {
                      setSelectedYear(year);
                      setShowYearDropdown(false);
                    }}
                    className={`w-full px-4 py-2.5 text-sm text-left transition-colors ${
                      selectedYear === year
                        ? "bg-amber-500/20 text-amber-400"
                        : "text-slate-300 hover:bg-slate-700/50"
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Period Filter */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
          <button
            onClick={() => setSelectedPeriod('ALL')}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              selectedPeriod === 'ALL'
                ? "bg-amber-500 text-slate-900"
                : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-white border border-slate-700/50"
            }`}
          >
            All Periods
          </button>
          {PERIODS.map(period => (
            <button
              key={period.value}
              onClick={() => setSelectedPeriod(period.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                selectedPeriod === period.value
                  ? "bg-amber-500 text-slate-900"
                  : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-white border border-slate-700/50"
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-amber-500 border-t-transparent"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <span className="text-red-400">{error}</span>
          </div>
        )}

        {/* Report Cards Grid */}
        {!loading && !error && (
          <>
            {filteredReports.length === 0 ? (
              <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-slate-500" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">No Report Cards Found</h3>
                <p className="text-slate-400 text-sm max-w-md mx-auto">
                  Report cards for the selected period will appear here once they are uploaded by your teachers.
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredReports.map((report) => {
                  const periodInfo = getPeriodInfo(report.period);
                  
                  return (
                    <div 
                      key={report.id} 
                      className={`bg-gradient-to-br ${periodInfo.color} border ${periodInfo.border} rounded-2xl overflow-hidden hover:scale-[1.02] transition-transform`}
                    >
                      {/* Card Header */}
                      <div className="p-5">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${periodInfo.text} bg-slate-900/30`}>
                              {periodInfo.label}
                            </span>
                            <h3 className="text-lg font-semibold text-white mt-3">
                              {report.academicYear}
                            </h3>
                          </div>
                          <div className={`w-12 h-12 rounded-xl ${periodInfo.bg}/20 flex items-center justify-center`}>
                            <FileText className={`h-6 w-6 ${periodInfo.text}`} />
                          </div>
                        </div>
                        
                        {/* Details */}
                        <div className="space-y-2 mt-4 text-sm">
                          <div className="flex items-center text-slate-400">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span>Uploaded: {new Date(report.uploadedAt).toLocaleDateString()}</span>
                          </div>
                          {report.uploaderName && (
                            <div className="text-slate-400">
                              <span className="text-slate-500">By:</span> {report.uploaderName}
                            </div>
                          )}
                          <div className="flex items-center justify-between text-slate-400">
                            <span className="truncate max-w-[150px]">{report.fileName}</span>
                            <span className="text-slate-500">{formatFileSize(report.fileSize)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex border-t border-slate-700/30">
                        <button 
                          onClick={() => handleView(report)}
                          className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-slate-300 hover:bg-slate-900/30 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </button>
                        <div className="w-px bg-slate-700/30" />
                        <button 
                          onClick={() => handleDownload(report)}
                          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium ${periodInfo.text} hover:bg-slate-900/30 transition-colors`}
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Info Card */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h4 className="font-medium text-blue-400 mb-1">About Report Cards</h4>
              <p className="text-sm text-slate-400">
                Your report cards are official documents showing your academic progress. 
                They are uploaded by your teachers at the end of each quarter or semester. 
                You can view them online or download them for your records.
              </p>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
