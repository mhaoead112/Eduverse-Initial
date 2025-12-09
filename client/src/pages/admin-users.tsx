import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { DashboardLayout } from "@/components/DashboardLayout";
import { apiEndpoint } from "@/lib/config";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, Plus, Search, Filter, Edit, Trash2, 
  MoreVertical, Mail, Shield, GraduationCap, 
  UserCog, Download, Upload, CheckCircle, XCircle,
  RefreshCw, TrendingUp, Activity, UserPlus, ArrowUpRight
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: 'student' | 'teacher' | 'admin' | 'parent';
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  lastLogin?: string;
  profilePicture?: string;
}

export default function AdminUsers() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTab, setSelectedTab] = useState("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    fullName: "",
    role: "student",
    password: ""
  });

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const fetchUsers = async () => {
    try {
      const response = await fetch(apiEndpoint('/api/admin/users'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        // Map backend user data to frontend format
        const mappedUsers = (data.users || []).map((u: any) => ({
          ...u,
          // Map isActive to status if status is not present
          status: u.status || (u.isActive ? 'active' : 'inactive'),
          // Ensure fullName exists
          fullName: u.fullName || u.username || 'Unknown User',
        }));
        setUsers(mappedUsers);
      } else {
        // Demo data
        setUsers([
          { id: 1, username: "jsmith", email: "john.smith@school.edu", fullName: "John Smith", role: "student", status: "active", createdAt: "2024-09-01", lastLogin: "2024-12-02" },
          { id: 2, username: "ejohnson", email: "emma.johnson@school.edu", fullName: "Emma Johnson", role: "student", status: "active", createdAt: "2024-09-01", lastLogin: "2024-12-03" },
          { id: 3, username: "mwilliams", email: "michael.williams@school.edu", fullName: "Michael Williams", role: "student", status: "inactive", createdAt: "2024-09-01" },
          { id: 4, username: "sanderson", email: "sarah.anderson@school.edu", fullName: "Sarah Anderson", role: "teacher", status: "active", createdAt: "2024-08-15", lastLogin: "2024-12-03" },
          { id: 5, username: "droberts", email: "david.roberts@school.edu", fullName: "David Roberts", role: "teacher", status: "active", createdAt: "2024-08-15", lastLogin: "2024-12-02" },
          { id: 6, username: "admin1", email: "admin@eduverse.com", fullName: "System Admin", role: "admin", status: "active", createdAt: "2024-01-01", lastLogin: "2024-12-03" },
          { id: 7, username: "pjohnson", email: "parent.johnson@email.com", fullName: "Patricia Johnson", role: "parent", status: "active", createdAt: "2024-09-05", lastLogin: "2024-12-01" },
          { id: 8, username: "rthomas", email: "robert.thomas@school.edu", fullName: "Robert Thomas", role: "student", status: "pending", createdAt: "2024-12-01" },
        ]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.username || !newUser.email || !newUser.fullName || !newUser.password) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(apiEndpoint('/api/admin/users'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(newUser)
      });

      if (response.ok) {
        toast({ title: "Success", description: "User created successfully" });
        setCreateDialogOpen(false);
        setNewUser({ username: "", email: "", fullName: "", role: "student", password: "" });
        fetchUsers();
      } else {
        throw new Error('Failed to create user');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create user. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleExportUsers = () => {
    // Filter users based on current filters
    const dataToExport = filteredUsers.length > 0 ? filteredUsers : users;
    
    if (dataToExport.length === 0) {
      toast({
        title: "No Data",
        description: "There are no users to export.",
        variant: "destructive"
      });
      return;
    }

    // Create CSV content
    const headers = ["ID", "Username", "Full Name", "Email", "Role", "Status", "Created At", "Last Login"];
    const csvContent = [
      headers.join(","),
      ...dataToExport.map(user => [
        user.id,
        `"${user.username || ''}"`,
        `"${user.fullName || ''}"`,
        `"${user.email || ''}"`,
        user.role || '',
        user.status || '',
        user.createdAt || '',
        user.lastLogin || ''
      ].join(","))
    ].join("\n");

    // Create and trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `eduverse_users_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful",
      description: `Exported ${dataToExport.length} users to CSV file.`,
    });
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const response = await fetch(apiEndpoint(`/api/admin/users/${userId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        toast({ title: "Success", description: "User deleted successfully" });
        setUsers(users.filter(u => u.id !== userId));
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive"
      });
    }
  };

  const handleToggleStatus = async (userId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
      const response = await fetch(apiEndpoint(`/api/admin/users/${userId}/status`), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });

      // Update locally
      setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus as any } : u));
      toast({ title: "Success", description: `User ${newStatus === 'active' ? 'activated' : 'deactivated'}` });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive"
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="h-4 w-4 text-purple-600" />;
      case 'teacher': return <UserCog className="h-4 w-4 text-green-600" />;
      case 'student': return <GraduationCap className="h-4 w-4 text-blue-600" />;
      case 'parent': return <Users className="h-4 w-4 text-pink-600" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-gradient-to-r from-purple-500 to-violet-500 text-white';
      case 'teacher': return 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white';
      case 'student': return 'bg-gradient-to-r from-emerald-500 to-green-500 text-white';
      case 'parent': return 'bg-gradient-to-r from-pink-500 to-rose-500 text-white';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredUsers = users.filter(u => {
    const fullName = u.fullName || '';
    const email = u.email || '';
    const username = u.username || '';
    const status = u.status || 'inactive';
    
    const matchesSearch = fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || status === statusFilter;
    const matchesTab = selectedTab === 'all' || u.role === selectedTab;
    
    return matchesSearch && matchesRole && matchesStatus && matchesTab;
  });

  const userCounts = {
    all: users.length,
    student: users.filter(u => u.role === 'student').length,
    teacher: users.filter(u => u.role === 'teacher').length,
    admin: users.filter(u => u.role === 'admin').length,
    parent: users.filter(u => u.role === 'parent').length
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-200 rounded-full animate-spin border-t-indigo-600" />
            <Users className="h-6 w-6 text-indigo-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-gray-500 font-medium">Loading users...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 p-8 text-white shadow-xl">
          <div className="absolute inset-0 bg-grid-white/10" />
          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Users className="h-6 w-6" />
                  </div>
                  <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">
                    User Management
                  </Badge>
                </div>
                <h1 className="text-3xl font-bold mb-2">Manage Platform Users</h1>
                <p className="text-white/80 max-w-xl">
                  View, create, edit, and manage all users across the EduVerse platform.
                </p>
              </div>
              
              <div className="hidden lg:flex items-center gap-3">
                <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
                <Button 
                  variant="outline" 
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  onClick={handleExportUsers}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-white text-indigo-600 hover:bg-white/90">
                      <Plus className="h-4 w-4 mr-2" />
                      Add User
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
                          <UserPlus className="h-5 w-5 text-white" />
                        </div>
                        Create New User
                      </DialogTitle>
                      <DialogDescription>
                        Add a new user to the EduVerse platform.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="username">Username</Label>
                          <Input
                            id="username"
                            value={newUser.username}
                            onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                            placeholder="username"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="role">Role</Label>
                          <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v })}>
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="student">Student</SelectItem>
                              <SelectItem value="teacher">Teacher</SelectItem>
                              <SelectItem value="parent">Parent</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          value={newUser.fullName}
                          onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                          placeholder="John Doe"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newUser.email}
                          onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                          placeholder="john@example.com"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          value={newUser.password}
                          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                          placeholder="••••••••"
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateUser} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                        Create User
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-white/80" />
                  <div>
                    <p className="text-2xl font-bold">{userCounts.all}</p>
                    <p className="text-white/60 text-sm">Total Users</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-3">
                  <GraduationCap className="h-8 w-8 text-emerald-300" />
                  <div>
                    <p className="text-2xl font-bold">{userCounts.student}</p>
                    <p className="text-white/60 text-sm">Students</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-3">
                  <UserCog className="h-8 w-8 text-blue-300" />
                  <div>
                    <p className="text-2xl font-bold">{userCounts.teacher}</p>
                    <p className="text-white/60 text-sm">Teachers</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-pink-300" />
                  <div>
                    <p className="text-2xl font-bold">{userCounts.parent}</p>
                    <p className="text-white/60 text-sm">Parents</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-3">
                  <Shield className="h-8 w-8 text-amber-300" />
                  <div>
                    <p className="text-2xl font-bold">{userCounts.admin}</p>
                    <p className="text-white/60 text-sm">Admins</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 bg-white shadow-sm border p-1 rounded-xl h-auto">
            <TabsTrigger value="all" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-lg py-2.5 gap-2">
              <Users className="h-4 w-4" />
              All ({userCounts.all})
            </TabsTrigger>
            <TabsTrigger value="student" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white rounded-lg py-2.5 gap-2">
              <GraduationCap className="h-4 w-4" />
              Students ({userCounts.student})
            </TabsTrigger>
            <TabsTrigger value="teacher" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white rounded-lg py-2.5 gap-2">
              <UserCog className="h-4 w-4" />
              Teachers ({userCounts.teacher})
            </TabsTrigger>
            <TabsTrigger value="parent" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-rose-500 data-[state=active]:text-white rounded-lg py-2.5 gap-2">
              <Users className="h-4 w-4" />
              Parents ({userCounts.parent})
            </TabsTrigger>
            <TabsTrigger value="admin" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white rounded-lg py-2.5 gap-2">
              <Shield className="h-4 w-4" />
              Admins ({userCounts.admin})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filters */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="🔍 Search users by name, email, or username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white border-gray-200"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 bg-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={fetchUsers} className="shrink-0">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">User Directory</CardTitle>
                  <CardDescription>Showing {filteredUsers.length} users</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead className="font-semibold">User</TableHead>
                  <TableHead className="font-semibold">Role</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Created</TableHead>
                  <TableHead className="font-semibold">Last Login</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 ring-2 ring-offset-2 ring-gray-200">
                          <AvatarImage src={user.profilePicture} />
                          <AvatarFallback className={`font-semibold ${getRoleBadgeColor(user.role)}`}>
                            {(user.fullName || 'U').split(' ').map(n => n[0] || '').join('').toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900">{user.fullName || 'Unknown'}</p>
                          <p className="text-sm text-gray-500">{user.email || 'No email'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getRoleBadgeColor(user.role)} flex items-center gap-1 w-fit font-medium shadow-sm`}>
                        {getRoleIcon(user.role)}
                        <span className="capitalize">{user.role || 'user'}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${(user.status || 'inactive') === 'active' ? 'bg-green-500 animate-pulse' : (user.status || 'inactive') === 'pending' ? 'bg-yellow-500' : 'bg-gray-400'}`} />
                        <span className={`text-sm font-medium ${(user.status || 'inactive') === 'active' ? 'text-green-700' : (user.status || 'inactive') === 'pending' ? 'text-yellow-700' : 'text-gray-500'}`}>
                          {((user.status || 'inactive').charAt(0).toUpperCase() + (user.status || 'inactive').slice(1))}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      }) : <span className="text-gray-400">Never</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem className="gap-2">
                            <Edit className="h-4 w-4" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2">
                            <Mail className="h-4 w-4" />
                            Send Email
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(user.id, user.status)} className="gap-2">
                            {user.status === 'active' ? (
                              <>
                                <XCircle className="h-4 w-4 text-orange-500" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600 gap-2"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredUsers.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <Users className="h-12 w-12 mb-3 opacity-50" />
                <p className="font-medium">No users found</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
