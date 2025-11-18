import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { 
  Home, Menu, X, User, Settings, LogOut, Bell, Search,
  BookOpen, GraduationCap, Calendar, ClipboardList, BarChart3,
  Users, MessageCircle, PlusCircle, FileText, TrendingUp,
  Shield, Database, Wrench, CreditCard, Eye, UserCog,
  Baby, Heart, Phone, Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { Logo } from "./logo";

interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  submenu?: NavigationItem[];
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

// Role-based navigation configurations
const navigationConfig: Record<string, NavigationItem[]> = {
  student: [
    {
      id: 'overview',
      label: 'Dashboard',
      href: '/student',
      icon: Home
    },
    {
      id: 'courses',
      label: 'My Courses',
      href: '/student/courses',
      icon: BookOpen,
      badge: 3
    },
    {
      id: 'assignments',
      label: 'Assignments',
      href: '/student/assignments',
      icon: ClipboardList,
      badge: 5
    },
    {
      id: 'grades',
      label: 'Grades',
      href: '/student/grades',
      icon: BarChart3
    },
    {
      id: 'schedule',
      label: 'Schedule',
      href: '/student/schedule',
      icon: Calendar
    },
    {
      id: 'groups',
      label: 'Study Groups',
      href: '/student/groups',
      icon: Users,
      badge: 2
    },
    {
      id: 'messages',
      label: 'Messages',
      href: '/student/messages',
      icon: MessageCircle,
      badge: 4
    }
  ],
  teacher: [
    {
      id: 'overview',
      label: 'Dashboard',
      href: '/dashboard/teacher',
      icon: Home
    },
    {
      id: 'classes',
      label: 'My Classes',
      href: '/teacher/classes',
      icon: GraduationCap,
      badge: 4
    },
    {
      id: 'courses',
      label: 'My Courses',
      href: '/teacher/courses',
      icon: BookOpen,
      submenu: [
        { id: 'create-course', label: 'Create Course', href: '/teacher/courses/create', icon: PlusCircle },
        { id: 'lessons', label: 'Lessons & Materials', href: '/teacher/lessons', icon: FileText }
      ]
    },
    {
      id: 'students',
      label: 'Students',
      href: '/teacher/students',
      icon: Users
    },
    {
      id: 'content',
      label: 'Course Content',
      href: '/teacher/content',
      icon: BookOpen,
      submenu: [
        { id: 'create', label: 'Create Content', href: '/teacher/content/create', icon: PlusCircle },
        { id: 'library', label: 'Content Library', href: '/teacher/content/library', icon: FileText }
      ]
    },
    {
      id: 'assessments',
      label: 'Assessments',
      href: '/teacher/assessments',
      icon: ClipboardList,
      badge: 12
    },
    {
      id: 'analytics',
      label: 'Analytics',
      href: '/teacher/analytics',
      icon: TrendingUp
    },
    {
      id: 'communication',
      label: 'Communication',
      href: '/teacher/communication',
      icon: MessageCircle,
      badge: 8
    }
  ],
  admin: [
    {
      id: 'overview',
      label: 'Dashboard',
      href: '/dashboard/admin',
      icon: Home
    },
    {
      id: 'users',
      label: 'User Management',
      href: '/dashboard/admin/users',
      icon: UserCog,
      submenu: [
        { id: 'students', label: 'Students', href: '/dashboard/admin/users/students', icon: GraduationCap },
        { id: 'teachers', label: 'Teachers', href: '/dashboard/admin/users/teachers', icon: Users },
        { id: 'parents', label: 'Parents', href: '/dashboard/admin/users/parents', icon: Heart }
      ]
    },
    {
      id: 'reports',
      label: 'System Reports',
      href: '/dashboard/admin/reports',
      icon: BarChart3
    },
    {
      id: 'content',
      label: 'Content Management',
      href: '/dashboard/admin/content',
      icon: Database,
      submenu: [
        { id: 'courses', label: 'Courses', href: '/admin/courses', icon: BookOpen },
        { id: 'create-course', label: 'Create Course', href: '/admin/courses/create', icon: PlusCircle },
        { id: 'lessons', label: 'Lessons & Materials', href: '/admin/lessons', icon: FileText }
      ]
    },
    {
      id: 'settings',
      label: 'Settings',
      href: '/dashboard/admin/settings',
      icon: Wrench
    },
    {
      id: 'moderation',
      label: 'Moderation',
      href: '/dashboard/admin/moderation',
      icon: Shield,
      badge: 3
    },
    {
      id: 'financial',
      label: 'Financial',
      href: '/dashboard/admin/financial',
      icon: CreditCard
    }
  ],
  parent: [
    {
      id: 'overview',
      label: 'Dashboard',
      href: '/dashboard/parent',
      icon: Home
    },
    {
      id: 'children',
      label: 'My Children',
      href: '/dashboard/parent/children',
      icon: Baby
    },
    {
      id: 'grades',
      label: 'Grades & Progress',
      href: '/dashboard/parent/grades',
      icon: BarChart3
    },
    {
      id: 'schedule',
      label: 'Schedule',
      href: '/dashboard/parent/schedule',
      icon: Calendar
    },
    {
      id: 'communication',
      label: 'Teacher Communication',
      href: '/dashboard/parent/communication',
      icon: Mail,
      badge: 2
    }
  ]
};

// Role-based color schemes
const roleColors: Record<string, { primary: string; secondary: string; accent: string }> = {
  student: {
    primary: 'text-blue-600 dark:text-blue-400',
    secondary: 'bg-blue-50 dark:bg-blue-900/20',
    accent: 'border-blue-200 dark:border-blue-800'
  },
  teacher: {
    primary: 'text-green-600 dark:text-green-400',
    secondary: 'bg-green-50 dark:bg-green-900/20',
    accent: 'border-green-200 dark:border-green-800'
  },
  admin: {
    primary: 'text-purple-600 dark:text-purple-400',
    secondary: 'bg-purple-50 dark:bg-purple-900/20',
    accent: 'border-purple-200 dark:border-purple-800'
  },
  parent: {
    primary: 'text-pink-600 dark:text-pink-400',
    secondary: 'bg-pink-50 dark:bg-pink-900/20',
    accent: 'border-pink-200 dark:border-pink-800'
  }
};

function SidebarNavItem({ item, isActive, colors, isSubmenuItem = false }: {
  item: NavigationItem;
  isActive: boolean;
  colors: typeof roleColors[string];
  isSubmenuItem?: boolean;
}) {
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);
  const hasSubmenu = item.submenu && item.submenu.length > 0;
  
  const baseClasses = `
    flex items-center justify-between w-full px-3 py-2.5 text-left 
    rounded-lg transition-all duration-200 group
    ${isSubmenuItem ? 'pl-10 text-sm' : ''}
    ${isActive 
      ? `${colors.secondary} ${colors.primary} shadow-sm` 
      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
    }
  `;

  if (hasSubmenu) {
    return (
      <div className="space-y-1">
        <button
          onClick={() => setIsSubmenuOpen(!isSubmenuOpen)}
          className={baseClasses}
          data-testid={`nav-${item.id}`}
        >
          <div className="flex items-center space-x-3">
            <item.icon className={`h-5 w-5 ${isActive ? colors.primary : ''}`} />
            <span className="font-medium">{item.label}</span>
            {item.badge && (
              <Badge className="h-5 text-xs" variant={isActive ? "default" : "secondary"}>
                {item.badge}
              </Badge>
            )}
          </div>
          <div className={`transform transition-transform ${isSubmenuOpen ? 'rotate-90' : ''}`}>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>
        
        {isSubmenuOpen && (
          <div className="space-y-1 animate-slide-up">
            {item.submenu!.map((subItem) => (
              <Link key={subItem.id} href={subItem.href}>
                <SidebarNavItem 
                  item={subItem} 
                  isActive={window.location.pathname === subItem.href}
                  colors={colors}
                  isSubmenuItem={true}
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link href={item.href}>
      <div className={baseClasses} data-testid={`nav-${item.id}`}>
        <div className="flex items-center space-x-3">
          <item.icon className={`h-5 w-5 ${isActive ? colors.primary : ''}`} />
          <span className="font-medium">{item.label}</span>
        </div>
        {item.badge && (
          <Badge className="h-5 text-xs" variant={isActive ? "default" : "secondary"}>
            {item.badge}
          </Badge>
        )}
      </div>
    </Link>
  );
}

function UserMenu({ user, onLogout }: { user: any; onLogout: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="relative h-10 w-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          data-testid="user-menu-trigger"
        >
          <Avatar className="h-9 w-9">
            <AvatarImage src="" alt={user?.fullName} />
            <AvatarFallback className="bg-eduverse-blue text-white">
              {user?.fullName?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1 leading-none">
            <p className="font-medium">{user?.fullName}</p>
            <p className="w-[200px] truncate text-sm text-gray-600 dark:text-gray-400">
              {user?.email}
            </p>
            <Badge className="w-fit text-xs capitalize" variant="secondary">
              {user?.role}
            </Badge>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile" className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings" className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="cursor-pointer text-red-600 dark:text-red-400" 
          onClick={onLogout}
          data-testid="logout-button"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [location] = useLocation();
  const { user, logout } = useAuth();
  
  const userRole = user?.role || 'student';
  const navigation = navigationConfig[userRole] || navigationConfig.student;
  const colors = roleColors[userRole] || roleColors.student;
  
  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const welcomeMessages: Record<string, string> = {
    student: `Welcome back, ${user?.fullName?.split(' ')[0]}! Ready to learn something new today?`,
    teacher: `Good ${new Date().getHours() < 12 ? 'morning' : 'afternoon'}, ${user?.fullName?.split(' ')[0]}! Your students are waiting.`,
    admin: `Hello, ${user?.fullName?.split(' ')[0]}! Keep EduVerse running smoothly.`,
    parent: `Hi, ${user?.fullName?.split(' ')[0]}! Check on your child's progress.`
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 
        transform transition-transform duration-300 ease-in-out lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Sidebar header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <Logo className="h-8 w-8" />
              <span className="text-xl font-bold text-eduverse-blue">EduVerse</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* User info */}
          <div className={`p-4 ${colors.secondary} ${colors.accent} border-b`}>
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src="" alt={user?.fullName} />
                <AvatarFallback className="bg-eduverse-blue text-white">
                  {user?.fullName?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user?.fullName}
                </p>
                <Badge className="text-xs capitalize" variant="secondary">
                  {user?.role}
                </Badge>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 animate-fade-in">
              {welcomeMessages[userRole]}
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => (
              <SidebarNavItem
                key={item.id}
                item={item}
                isActive={location === item.href}
                colors={colors}
              />
            ))}
          </nav>

          {/* Sidebar footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <span>EduVerse v2.0</span>
              </div>
              <UserMenu user={user} onLogout={handleLogout} />
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16">
          <div className="flex items-center justify-between h-full px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
                data-testid="mobile-menu-button"
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              {/* Search */}
              <div className="hidden sm:flex items-center max-w-md w-full">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="search"
                    placeholder="Search..."
                    className="pl-10 pr-4"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    data-testid="search-input"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative" data-testid="notifications-button">
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center">
                  3
                </Badge>
              </Button>

              {/* User menu for desktop */}
              <div className="hidden sm:block">
                <UserMenu user={user} onLogout={handleLogout} />
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}