import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiEndpoint, assetUrl } from "@/lib/config";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Users, 
  Search, 
  Loader2,
  BookOpen,
  Mail,
  TrendingUp,
  Award,
  Filter,
  Download,
  UserPlus
} from "lucide-react";

interface Student {
  id: string;
  username: string;
  fullName?: string;
  email: string;
  profilePicture?: string;
  grade?: string;
  enrollmentCount: number;
  enrolledCourses: {
    enrollmentId: string;
    courseId: string;
    courseTitle: string;
    enrolledAt: string;
  }[];
}

export default function TeacherStudents() {
  const { toast } = useToast();
  const { getAuthHeaders, isAuthenticated, token } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterBy, setFilterBy] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");

  useEffect(() => {
    if (token && isAuthenticated) {
      fetchStudents();
    }
  }, [token, isAuthenticated]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch(apiEndpoint('/api/enrollments/students/all'), {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        setStudents(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Failed to fetch students:", error);
      toast({
        title: "Error",
        description: "Failed to load students",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      student.username?.toLowerCase().includes(searchLower) ||
      student.fullName?.toLowerCase().includes(searchLower) ||
      student.email?.toLowerCase().includes(searchLower)
    );

    if (filterBy === "active") {
      return matchesSearch && student.enrollmentCount > 0;
    } else if (filterBy === "inactive") {
      return matchesSearch && student.enrollmentCount === 0;
    }
    return matchesSearch;
  }).sort((a, b) => {
    if (sortBy === "name") {
      return (a.fullName || a.username).localeCompare(b.fullName || b.username);
    } else if (sortBy === "courses") {
      return b.enrollmentCount - a.enrollmentCount;
    }
    return 0;
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-10">
        {/* Enhanced Header with Stats */}
        <div className="bg-slate-800/50 rounded-2xl p-6 shadow-lg border border-slate-700/50">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">My Students</h1>
              <p className="text-slate-400">Manage and track your students' progress</p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="gap-2 border-slate-600/50 text-slate-300 hover:bg-slate-700 hover:text-white"
                onClick={() => {
                  // Export students to CSV
                  const headers = ['Name', 'Username', 'Email', 'Courses Enrolled', 'Enrolled Courses'];
                  const csvContent = [
                    headers.join(','),
                    ...students.map(student => [
                      `"${(student.fullName || student.username).replace(/"/g, '""')}"`,
                      `"${student.username}"`,
                      `"${student.email}"`,
                      student.enrollmentCount,
                      `"${student.enrolledCourses.map(c => c.courseTitle).join('; ')}"`
                    ].join(','))
                  ].join('\n');
                  
                  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                  const link = document.createElement('a');
                  link.href = URL.createObjectURL(blob);
                  link.download = `students_export_${new Date().toISOString().split('T')[0]}.csv`;
                  link.click();
                  
                  toast({
                    title: "Export Complete",
                    description: `Exported ${students.length} students to CSV`,
                  });
                }}
                disabled={students.length === 0}
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Users className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Total Students</p>
                  <p className="text-2xl font-bold text-white">{students.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Active</p>
                  <p className="text-2xl font-bold text-white">
                    {students.filter(s => s.enrollmentCount > 0).length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <BookOpen className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Avg Classes</p>
                  <p className="text-2xl font-bold text-white">
                    {students.length > 0 ? 
                      (students.reduce((sum, s) => sum + s.enrollmentCount, 0) / students.length).toFixed(1) 
                      : '0'}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <Award className="h-5 w-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Top Performer</p>
                  <p className="text-sm font-bold text-white truncate">
                    {students.length > 0 ? 
                      students.reduce((prev, curr) => 
                        curr.enrollmentCount > prev.enrollmentCount ? curr : prev
                      ).fullName || 'N/A'
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="bg-slate-800/50 border border-slate-700/50 shadow-[0_2px_8px_rgba(0,0,0,0.08)] rounded-2xl">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <Input
                  placeholder="Search by name, username, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11 border-slate-600 bg-slate-700/50 text-white placeholder:text-slate-400"
                />
              </div>
              <div className="flex gap-3">
                <Select value={filterBy} onValueChange={setFilterBy}>
                  <SelectTrigger className="w-40 h-11 border-slate-600 bg-slate-700/50 text-white">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all">All Students</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40 h-11 border-slate-600 bg-slate-700/50 text-white">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="name">Name (A-Z)</SelectItem>
                    <SelectItem value="courses">Most Classes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Students Grid */}
        {filteredStudents.length === 0 ? (
          <Card className="bg-slate-800/50 border border-slate-700/50 shadow-[0_2px_8px_rgba(0,0,0,0.08)] rounded-2xl">
            <CardContent className="py-12 text-center">
              <Users className="h-16 w-16 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">
                {searchTerm ? "No students found matching your search" : "No students yet"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredStudents.map((student) => (
              <Card 
                key={student.id} 
                className="group bg-slate-800/50 border border-slate-700/50 shadow-[0_2px_8px_rgba(0,0,0,0.08)] rounded-2xl hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)] transition-all duration-300 overflow-hidden"
              >
                <div className="h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <Avatar className="h-20 w-20 ring-4 ring-slate-700 group-hover:ring-slate-600 transition-all">
                      <AvatarImage 
                        src={student.profilePicture ? assetUrl(student.profilePicture) : ''} 
                        alt={student.fullName || student.username} 
                      />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xl font-bold">
                        {(student.fullName || student.username).substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-xl text-white mb-1 truncate group-hover:text-blue-400 transition-colors">
                        {student.fullName || student.username}
                      </h3>
                      <p className="text-sm text-slate-400 mb-2">@{student.username}</p>
                      <div className="flex items-center gap-2">
                        {student.grade && (
                          <Badge variant="secondary" className="text-xs bg-slate-700 text-slate-300">
                            {student.grade}
                          </Badge>
                        )}
                        {student.enrollmentCount > 2 && (
                          <Badge className="text-xs bg-green-500/20 text-green-400 hover:bg-green-500/30">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-slate-300 bg-slate-700/50 rounded-lg p-2">
                      <Mail className="h-4 w-4 flex-shrink-0 text-blue-400" />
                      <span className="truncate">{student.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-300 bg-slate-700/50 rounded-lg p-2">
                      <BookOpen className="h-4 w-4 flex-shrink-0 text-purple-400" />
                      <span className="font-medium">{student.enrollmentCount} {student.enrollmentCount === 1 ? 'Class' : 'Classes'} Enrolled</span>
                    </div>
                  </div>

                  {student.enrolledCourses.length > 0 && (
                    <div className="border-t border-slate-700 pt-4 mb-4">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Enrolled Classes</p>
                      <div className="space-y-2">
                        {student.enrolledCourses.slice(0, 3).map((course) => (
                          <div key={course.enrollmentId} className="flex items-center gap-2 text-sm text-slate-300 bg-green-500/10 rounded-lg p-2">
                            <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                            <span className="truncate font-medium">{course.courseTitle}</span>
                          </div>
                        ))}
                        {student.enrolledCourses.length > 3 && (
                          <p className="text-xs text-slate-500 text-center pt-1">
                            +{student.enrolledCourses.length - 3} more courses
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button 
                      variant="default" 
                      className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-slate-900"
                      size="sm"
                      onClick={() => setLocation(`/teacher/students/${student.id}`)}
                    >
                      View Profile
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="px-3 border-slate-600/50 text-slate-300 hover:bg-slate-700 hover:text-white"
                      onClick={() => window.location.href = `mailto:${student.email}`}
                      title={`Send email to ${student.email}`}
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}