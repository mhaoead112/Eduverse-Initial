import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, 
  Settings, 
  Bell, 
  Shield, 
  Palette,
  Camera,
  Edit3,
  Save,
  Eye,
  EyeOff,
  Smartphone,
  Mail,
  Phone,
  MapPin,
  Calendar,
  BookOpen,
  Award,
  Users,
  Clock,
  FileText,
  Download,
  Upload,
  Trash2,
  Key,
  Lock,
  Unlock,
  AlertTriangle
} from "lucide-react";

// Form schemas
const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50, "Too long"),
  lastName: z.string().min(1, "Last name is required").max(50, "Too long"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  bio: z.string().max(500, "Bio too long").optional(),
  department: z.string().min(1, "Department is required"),
  title: z.string().min(1, "Title is required"),
  officeLocation: z.string().optional(),
  officeHours: z.string().optional(),
  expertise: z.string().optional(),
});

const securitySchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const notificationSchema = z.object({
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  weeklyDigest: z.boolean(),
  newMessageEmail: z.boolean(),
  assignmentReminders: z.boolean(),
  gradeUpdates: z.boolean(),
  systemUpdates: z.boolean(),
});

const preferencesSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  language: z.string(),
  timezone: z.string(),
  dateFormat: z.string(),
  gradingScale: z.string(),
  autoSaveInterval: z.string(),
  defaultClassView: z.string(),
});

type ProfileFormData = z.infer<typeof profileSchema>;
type SecurityFormData = z.infer<typeof securitySchema>;
type NotificationFormData = z.infer<typeof notificationSchema>;
type PreferencesFormData = z.infer<typeof preferencesSchema>;

interface TeacherProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  department: string;
  title: string;
  officeLocation?: string;
  officeHours?: string;
  expertise?: string;
  joinedDate: string;
  totalClasses: number;
  totalStudents: number;
  yearsTeaching: number;
}

export default function TeacherProfile() {
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [verify2FACode, setVerify2FACode] = useState("");
  const { toast } = useToast();

  // Mock profile data
  const mockProfile: TeacherProfile = {
    id: "1",
    firstName: "Sarah",
    lastName: "Johnson",
    email: "sarah.johnson@eduverse.edu",
    phone: "+1 (555) 123-4567",
    bio: "Passionate educator with 8 years of experience in mathematics education. Specialized in making complex concepts accessible to students of all learning styles.",
    department: "Mathematics",
    title: "Senior Mathematics Teacher",
    officeLocation: "Room 205, Math Building",
    officeHours: "Monday-Friday, 2:00 PM - 4:00 PM",
    expertise: "Algebra, Calculus, Statistics, Educational Technology",
    joinedDate: "2016-08-15T00:00:00Z",
    totalClasses: 6,
    totalStudents: 152,
    yearsTeaching: 8
  };

  // Form setup
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: mockProfile.firstName,
      lastName: mockProfile.lastName,
      email: mockProfile.email,
      phone: mockProfile.phone || "",
      bio: mockProfile.bio || "",
      department: mockProfile.department,
      title: mockProfile.title,
      officeLocation: mockProfile.officeLocation || "",
      officeHours: mockProfile.officeHours || "",
      expertise: mockProfile.expertise || "",
    },
  });

  const securityForm = useForm<SecurityFormData>({
    resolver: zodResolver(securitySchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const notificationForm = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      weeklyDigest: true,
      newMessageEmail: true,
      assignmentReminders: true,
      gradeUpdates: false,
      systemUpdates: true,
    },
  });

  const preferencesForm = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      theme: "system",
      language: "English",
      timezone: "America/New_York",
      dateFormat: "MM/DD/YYYY",
      gradingScale: "Letter (A-F)",
      autoSaveInterval: "5 minutes",
      defaultClassView: "Grid",
    },
  });

  // Mutations
  const updateProfileMutation = useMutation({
    mutationFn: (data: ProfileFormData) => apiRequest('PUT', '/api/teacher/profile', data),
    onSuccess: () => {
      toast({ title: "Success", description: "Profile updated successfully!" });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update profile", variant: "destructive" });
    },
  });

  const updateSecurityMutation = useMutation({
    mutationFn: (data: SecurityFormData) => apiRequest('PUT', '/api/teacher/security', data),
    onSuccess: () => {
      toast({ title: "Success", description: "Security settings updated successfully!" });
      securityForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update security settings", variant: "destructive" });
    },
  });

  const updateNotificationsMutation = useMutation({
    mutationFn: (data: NotificationFormData) => apiRequest('PUT', '/api/teacher/notifications', data),
    onSuccess: () => {
      toast({ title: "Success", description: "Notification preferences updated!" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update notifications", variant: "destructive" });
    },
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: (data: PreferencesFormData) => apiRequest('PUT', '/api/teacher/preferences', data),
    onSuccess: () => {
      toast({ title: "Success", description: "Preferences updated successfully!" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update preferences", variant: "destructive" });
    },
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);
      return apiRequest('POST', '/api/teacher/avatar', formData);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Profile picture updated!" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to upload image", variant: "destructive" });
    },
  });

  const onProfileSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const onSecuritySubmit = (data: SecurityFormData) => {
    updateSecurityMutation.mutate(data);
  };

  const onNotificationSubmit = (data: NotificationFormData) => {
    updateNotificationsMutation.mutate(data);
  };

  const onPreferencesSubmit = (data: PreferencesFormData) => {
    updatePreferencesMutation.mutate(data);
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({ title: "Error", description: "File size must be less than 5MB", variant: "destructive" });
        return;
      }
      uploadAvatarMutation.mutate(file);
    }
  };

  const exportData = () => {
    // Mock data export
    const data = {
      profile: mockProfile,
      preferences: preferencesForm.getValues(),
      notifications: notificationForm.getValues(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'teacher-profile-data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handle2FASetup = () => {
    setShow2FAModal(true);
  };

  const handle2FAVerification = () => {
    if (verify2FACode.length !== 6) {
      toast({ title: "Error", description: "Please enter a 6-digit verification code", variant: "destructive" });
      return;
    }
    
    // Mock verification
    toast({ title: "Success", description: "Two-Factor Authentication has been enabled!" });
    setShow2FAModal(false);
    setVerify2FACode("");
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0a0f1a' }}>
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Profile & Settings
            </h1>
            <p className="text-slate-400">
              Manage your profile, preferences, and account settings
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" onClick={exportData} data-testid="button-export-data" className="border-slate-600 text-slate-300 hover:bg-slate-700">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-800/50 border border-slate-700/50">
            <TabsTrigger value="profile" data-testid="tab-profile" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-slate-900">Profile</TabsTrigger>
            <TabsTrigger value="security" data-testid="tab-security" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-slate-900">Security</TabsTrigger>
            <TabsTrigger value="notifications" data-testid="tab-notifications" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-slate-900">Notifications</TabsTrigger>
            <TabsTrigger value="preferences" data-testid="tab-preferences" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-slate-900">Preferences</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Overview */}
              <Card className="lg:col-span-1 bg-slate-800/50 border border-slate-700/50" data-testid="card-profile-overview">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-4">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={mockProfile.avatar} />
                        <AvatarFallback className="text-lg bg-slate-700 text-white">
                          {mockProfile.firstName[0]}{mockProfile.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <label 
                        htmlFor="avatar-upload" 
                        className="absolute bottom-0 right-0 bg-yellow-500 text-slate-900 rounded-full p-2 cursor-pointer hover:bg-yellow-400 transition-colors"
                        data-testid="button-upload-avatar"
                      >
                        <Camera className="h-3 w-3" />
                      </label>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                        data-testid="input-avatar-upload"
                      />
                    </div>
                    
                    <h2 className="text-xl font-semibold text-white mb-1">
                      {mockProfile.firstName} {mockProfile.lastName}
                    </h2>
                    <p className="text-slate-400 mb-2">{mockProfile.title}</p>
                    <Badge variant="secondary" className="bg-slate-700 text-slate-300">{mockProfile.department}</Badge>
                    
                    <div className="grid grid-cols-2 gap-4 mt-6 w-full">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-400">{mockProfile.totalClasses}</div>
                        <div className="text-sm text-slate-400">Classes</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">{mockProfile.totalStudents}</div>
                        <div className="text-sm text-slate-400">Students</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-400">{mockProfile.yearsTeaching}</div>
                        <div className="text-sm text-slate-400">Years</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-400">
                          {new Date(mockProfile.joinedDate).getFullYear()}
                        </div>
                        <div className="text-sm text-slate-400">Joined</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Profile Form */}
              <Card className="lg:col-span-2 bg-slate-800/50 border border-slate-700/50" data-testid="card-profile-form">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white">Personal Information</CardTitle>
                      <CardDescription className="text-slate-400">Update your profile details and contact information</CardDescription>
                    </div>
                    <Button 
                      variant={isEditing ? "outline" : "default"}
                      onClick={() => setIsEditing(!isEditing)}
                      data-testid="button-edit-profile"
                      className={isEditing ? "border-slate-600 text-slate-300 hover:bg-slate-700" : "bg-yellow-500 hover:bg-yellow-400 text-slate-900"}
                    >
                      {isEditing ? (
                        <>
                          <Eye className="h-4 w-4 mr-2" />
                          View Mode
                        </>
                      ) : (
                        <>
                          <Edit3 className="h-4 w-4 mr-2" />
                          Edit Profile
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={profileForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  disabled={!isEditing}
                                  data-testid="input-first-name"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={profileForm.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  disabled={!isEditing}
                                  data-testid="input-last-name"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={profileForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="email"
                                  disabled={!isEditing}
                                  data-testid="input-email"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={profileForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone (Optional)</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="tel"
                                  disabled={!isEditing}
                                  data-testid="input-phone"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={profileForm.control}
                          name="department"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Department</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!isEditing}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-department">
                                    <SelectValue placeholder="Select department" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Mathematics">Mathematics</SelectItem>
                                  <SelectItem value="Science">Science</SelectItem>
                                  <SelectItem value="English">English</SelectItem>
                                  <SelectItem value="History">History</SelectItem>
                                  <SelectItem value="Arts">Arts</SelectItem>
                                  <SelectItem value="Physical Education">Physical Education</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={profileForm.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Job Title</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  disabled={!isEditing}
                                  data-testid="input-title"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={profileForm.control}
                          name="officeLocation"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Office Location (Optional)</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  disabled={!isEditing}
                                  data-testid="input-office-location"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={profileForm.control}
                          name="officeHours"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Office Hours (Optional)</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  disabled={!isEditing}
                                  placeholder="e.g., Mon-Fri 2-4 PM"
                                  data-testid="input-office-hours"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={profileForm.control}
                        name="expertise"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Areas of Expertise (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                disabled={!isEditing}
                                placeholder="e.g., Algebra, Calculus, Statistics"
                                data-testid="input-expertise"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="bio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bio (Optional)</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                rows={4}
                                disabled={!isEditing}
                                placeholder="Tell us about yourself and your teaching philosophy..."
                                data-testid="textarea-bio"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {isEditing && (
                        <div className="flex justify-end gap-3">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setIsEditing(false)}
                            data-testid="button-cancel-profile"
                            className="border-slate-600 text-slate-300 hover:bg-slate-700"
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={updateProfileMutation.isPending}
                            data-testid="button-save-profile"
                            className="bg-yellow-500 hover:bg-yellow-400 text-slate-900"
                          >
                            {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                          </Button>
                        </div>
                      )}
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card data-testid="card-change-password" className="bg-slate-800/50 border border-slate-700/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Lock className="h-5 w-5" />
                    Change Password
                  </CardTitle>
                  <CardDescription className="text-slate-400">Update your account password for security</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...securityForm}>
                    <form onSubmit={securityForm.handleSubmit(onSecuritySubmit)} className="space-y-4">
                      <FormField
                        control={securityForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  {...field} 
                                  type={showCurrentPassword ? "text" : "password"}
                                  data-testid="input-current-password"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                  data-testid="button-toggle-current-password"
                                >
                                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={securityForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  {...field} 
                                  type={showNewPassword ? "text" : "password"}
                                  data-testid="input-new-password"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                  onClick={() => setShowNewPassword(!showNewPassword)}
                                  data-testid="button-toggle-new-password"
                                >
                                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={securityForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm New Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  {...field} 
                                  type={showConfirmPassword ? "text" : "password"}
                                  data-testid="input-confirm-password"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  data-testid="button-toggle-confirm-password"
                                >
                                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        disabled={updateSecurityMutation.isPending}
                        data-testid="button-update-password"
                        className="bg-yellow-500 hover:bg-yellow-400 text-slate-900"
                      >
                        {updateSecurityMutation.isPending ? "Updating..." : "Update Password"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              <Card data-testid="card-security-settings" className="bg-slate-800/50 border border-slate-700/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Shield className="h-5 w-5" />
                    Security Settings
                  </CardTitle>
                  <CardDescription className="text-slate-400">Additional security and privacy options</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium text-white">Two-Factor Authentication</Label>
                      <p className="text-sm text-slate-400">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handle2FASetup}
                      data-testid="button-setup-2fa"
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      <Key className="h-4 w-4 mr-2" />
                      Setup
                    </Button>
                  </div>
                  
                  <Separator className="bg-slate-700" />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium text-white">Active Sessions</Label>
                      <p className="text-sm text-slate-400">
                        View and manage your active login sessions
                      </p>
                    </div>
                    <Button variant="outline" size="sm" data-testid="button-manage-sessions" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                      <Smartphone className="h-4 w-4 mr-2" />
                      Manage
                    </Button>
                  </div>
                  
                  <Separator className="bg-slate-700" />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium text-white">Login History</Label>
                      <p className="text-sm text-slate-400">
                        Review recent login activity
                      </p>
                    </div>
                    <Button variant="outline" size="sm" data-testid="button-login-history" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                      <Clock className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </div>
                  
                  <Separator className="bg-slate-700" />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium text-red-400">Delete Account</Label>
                      <p className="text-sm text-slate-400">
                        Permanently delete your account and all data
                      </p>
                    </div>
                    <Button variant="destructive" size="sm" data-testid="button-delete-account">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card data-testid="card-notification-settings" className="bg-slate-800/50 border border-slate-700/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription className="text-slate-400">Choose how you want to receive notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...notificationForm}>
                  <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)} className="space-y-6">
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-lg font-medium mb-4 text-white">Delivery Methods</h4>
                        <div className="space-y-4">
                          <FormField
                            control={notificationForm.control}
                            name="emailNotifications"
                            render={({ field }) => (
                              <div className="flex items-center justify-between">
                                <div>
                                  <Label className="text-sm font-medium text-white">Email Notifications</Label>
                                  <p className="text-sm text-slate-400">
                                    Receive notifications via email
                                  </p>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    data-testid="switch-email-notifications"
                                  />
                                </FormControl>
                              </div>
                            )}
                          />
                          
                          <FormField
                            control={notificationForm.control}
                            name="pushNotifications"
                            render={({ field }) => (
                              <div className="flex items-center justify-between">
                                <div>
                                  <Label className="text-sm font-medium text-white">Push Notifications</Label>
                                  <p className="text-sm text-slate-400">
                                    Receive browser push notifications
                                  </p>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    data-testid="switch-push-notifications"
                                  />
                                </FormControl>
                              </div>
                            )}
                          />
                          
                          <FormField
                            control={notificationForm.control}
                            name="smsNotifications"
                            render={({ field }) => (
                              <div className="flex items-center justify-between">
                                <div>
                                  <Label className="text-sm font-medium text-white">SMS Notifications</Label>
                                  <p className="text-sm text-slate-400">
                                    Receive notifications via text message
                                  </p>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    data-testid="switch-sms-notifications"
                                  />
                                </FormControl>
                              </div>
                            )}
                          />
                        </div>
                      </div>
                      
                      <Separator className="bg-slate-700" />
                      
                      <div>
                        <h4 className="text-lg font-medium mb-4 text-white">Notification Types</h4>
                        <div className="space-y-4">
                          <FormField
                            control={notificationForm.control}
                            name="newMessageEmail"
                            render={({ field }) => (
                              <div className="flex items-center justify-between">
                                <div>
                                  <Label className="text-sm font-medium text-white">New Messages</Label>
                                  <p className="text-sm text-slate-400">
                                    When you receive new messages
                                  </p>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    data-testid="switch-new-message-notifications"
                                  />
                                </FormControl>
                              </div>
                            )}
                          />
                          
                          <FormField
                            control={notificationForm.control}
                            name="assignmentReminders"
                            render={({ field }) => (
                              <div className="flex items-center justify-between">
                                <div>
                                  <Label className="text-sm font-medium text-white">Assignment Reminders</Label>
                                  <p className="text-sm text-slate-400">
                                    Reminders for upcoming assignments and deadlines
                                  </p>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    data-testid="switch-assignment-reminders"
                                  />
                                </FormControl>
                              </div>
                            )}
                          />
                          
                          <FormField
                            control={notificationForm.control}
                            name="gradeUpdates"
                            render={({ field }) => (
                              <div className="flex items-center justify-between">
                                <div>
                                  <Label className="text-sm font-medium text-white">Grade Updates</Label>
                                  <p className="text-sm text-slate-400">
                                    When grades are submitted or updated
                                  </p>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    data-testid="switch-grade-updates"
                                  />
                                </FormControl>
                              </div>
                            )}
                          />
                          
                          <FormField
                            control={notificationForm.control}
                            name="systemUpdates"
                            render={({ field }) => (
                              <div className="flex items-center justify-between">
                                <div>
                                  <Label className="text-sm font-medium text-white">System Updates</Label>
                                  <p className="text-sm text-slate-400">
                                    Platform updates and maintenance notifications
                                  </p>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    data-testid="switch-system-updates"
                                  />
                                </FormControl>
                              </div>
                            )}
                          />
                          
                          <FormField
                            control={notificationForm.control}
                            name="weeklyDigest"
                            render={({ field }) => (
                              <div className="flex items-center justify-between">
                                <div>
                                  <Label className="text-sm font-medium text-white">Weekly Digest</Label>
                                  <p className="text-sm text-slate-400">
                                    Weekly summary of activities and updates
                                  </p>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    data-testid="switch-weekly-digest"
                                  />
                                </FormControl>
                              </div>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      type="submit" 
                      disabled={updateNotificationsMutation.isPending}
                      data-testid="button-save-notifications"
                      className="bg-yellow-500 hover:bg-yellow-400 text-slate-900"
                    >
                      {updateNotificationsMutation.isPending ? "Saving..." : "Save Preferences"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <Card data-testid="card-app-preferences" className="bg-slate-800/50 border border-slate-700/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Settings className="h-5 w-5" />
                  Application Preferences
                </CardTitle>
                <CardDescription className="text-slate-400">Customize your application experience</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...preferencesForm}>
                  <form onSubmit={preferencesForm.handleSubmit(onPreferencesSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={preferencesForm.control}
                        name="theme"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Theme</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-theme">
                                  <SelectValue placeholder="Select theme" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="light">Light</SelectItem>
                                <SelectItem value="dark">Dark</SelectItem>
                                <SelectItem value="system">System</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={preferencesForm.control}
                        name="language"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Language</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-language">
                                  <SelectValue placeholder="Select language" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="English">English</SelectItem>
                                <SelectItem value="Spanish">Español</SelectItem>
                                <SelectItem value="French">Français</SelectItem>
                                <SelectItem value="German">Deutsch</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={preferencesForm.control}
                        name="timezone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Timezone</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-timezone">
                                  <SelectValue placeholder="Select timezone" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="America/New_York">Eastern Time</SelectItem>
                                <SelectItem value="America/Chicago">Central Time</SelectItem>
                                <SelectItem value="America/Denver">Mountain Time</SelectItem>
                                <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                                <SelectItem value="UTC">UTC</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={preferencesForm.control}
                        name="dateFormat"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date Format</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-date-format">
                                  <SelectValue placeholder="Select date format" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={preferencesForm.control}
                        name="gradingScale"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Grading Scale</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-grading-scale">
                                  <SelectValue placeholder="Select grading scale" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Letter (A-F)">Letter (A-F)</SelectItem>
                                <SelectItem value="Percentage (0-100)">Percentage (0-100)</SelectItem>
                                <SelectItem value="Points (0-4)">Points (0-4)</SelectItem>
                                <SelectItem value="Pass/Fail">Pass/Fail</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={preferencesForm.control}
                        name="autoSaveInterval"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Auto-save Interval</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-autosave-interval">
                                  <SelectValue placeholder="Select interval" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="1 minute">1 minute</SelectItem>
                                <SelectItem value="5 minutes">5 minutes</SelectItem>
                                <SelectItem value="10 minutes">10 minutes</SelectItem>
                                <SelectItem value="Never">Never</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={preferencesForm.control}
                        name="defaultClassView"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Default Class View</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-default-class-view">
                                  <SelectValue placeholder="Select view" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Grid">Grid</SelectItem>
                                <SelectItem value="List">List</SelectItem>
                                <SelectItem value="Calendar">Calendar</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      disabled={updatePreferencesMutation.isPending}
                      data-testid="button-save-preferences"
                      className="bg-yellow-500 hover:bg-yellow-400 text-slate-900"
                    >
                      {updatePreferencesMutation.isPending ? "Saving..." : "Save Preferences"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Two-Factor Authentication Setup Modal */}
        <Dialog open={show2FAModal} onOpenChange={setShow2FAModal}>
          <DialogContent className="sm:max-w-md bg-slate-800 border border-slate-700" data-testid="modal-2fa">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-white">
                <Shield className="h-5 w-5 text-yellow-500" />
                Setup Two-Factor Authentication
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Scan the QR code below with your authenticator app, then enter the verification code.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* QR Code Section */}
              <div className="flex flex-col items-center space-y-4">
                <div className="bg-slate-700 p-4 rounded-lg border border-slate-600">
                  {/* Mock QR Code - In real app, this would be generated with the actual secret */}
                  <div 
                    className="w-48 h-48 bg-slate-600 rounded border-2 border-dashed border-slate-500 flex items-center justify-center"
                    data-testid="qr-code"
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-2">📱</div>
                      <p className="text-sm text-slate-300">QR Code</p>
                      <p className="text-xs text-slate-400">Scan with authenticator app</p>
                    </div>
                  </div>
                </div>
                
                <div className="text-center">
                  <p className="text-sm font-medium text-white mb-1">
                    Can't scan the code?
                  </p>
                  <p className="text-xs text-slate-300 font-mono bg-slate-700 px-2 py-1 rounded">
                    JBSWY3DPEHPK3PXP
                  </p>
                </div>
              </div>
              
              {/* Verification Section */}
              <div className="space-y-3">
                <Label htmlFor="verification-code" className="text-white">Verification Code</Label>
                <Input
                  id="verification-code"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={verify2FACode}
                  onChange={(e) => setVerify2FACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="text-center text-lg tracking-widest bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                  data-testid="input-2fa-code"
                />
                <p className="text-xs text-slate-400">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                  onClick={() => setShow2FAModal(false)}
                  data-testid="button-cancel-2fa"
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-slate-900"
                  onClick={handle2FAVerification}
                  disabled={verify2FACode.length !== 6}
                  data-testid="button-verify-2fa"
                >
                  Verify & Enable
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
