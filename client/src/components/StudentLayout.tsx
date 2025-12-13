import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  BookOpen, Search, Bell, Settings, LogOut, Menu, X
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { assetUrl } from '@/lib/config';

interface StudentLayoutProps {
  children: React.ReactNode;
  activeNav?: string;
  searchPlaceholder?: string;
}

export default function StudentLayout({ 
  children, 
  activeNav = 'dashboard',
  searchPlaceholder = "Search for classes, assignments, or teachers..."
}: StudentLayoutProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', icon: 'dashboard', label: 'Dashboard', href: '/student' },
    { id: 'courses', icon: 'book_2', label: 'Classes', href: '/student/courses' },
    { id: 'messages', icon: 'chat_bubble', label: 'Messages', href: '/student/messages', badge: 3 },
    { id: 'assignments', icon: 'assignment', label: 'Assignments', href: '/student/assignments' },
    { id: 'calendar', icon: 'calendar_month', label: 'Calendar', href: '/student/calendar' },
    { id: 'grades', icon: 'bar_chart', label: 'Report Cards', href: '/student/grades' },
  ];

  // Determine active nav based on current location
  const currentNav = navItems.find(item => location.startsWith(item.href))?.id || activeNav;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-900 text-white font-sans">
      {/* Sidebar */}
      <aside className={`
        fixed lg:relative inset-y-0 left-0 z-50 flex flex-col w-72 h-full 
        border-r border-slate-700/50 bg-slate-900 flex-shrink-0
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6">
          {/* Logo */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <BookOpen className="h-6 w-6 text-slate-900" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold leading-tight tracking-tight">Student LMS</h1>
              <p className="text-slate-400 text-xs font-normal">Spring Semester</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
              const isActive = currentNav === item.id;
              return (
                <Link key={item.href} href={item.href}>
                  <a 
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-full transition-all duration-200
                      ${isActive 
                        ? 'bg-white text-slate-900 shadow-md shadow-white/10 font-bold' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white font-medium'}
                    `}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className={`material-symbols-outlined ${isActive ? 'fill-1' : ''}`}>{item.icon}</span>
                    <span className="text-sm">{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto bg-amber-400 text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </a>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="mt-auto p-6 border-t border-slate-700/50">
          <Link href="/student/settings">
            <a className="flex items-center gap-3 px-4 py-2 rounded-full text-slate-400 hover:text-white transition-colors">
              <Settings className="h-5 w-5" />
              <span className="text-sm font-medium">Settings</span>
            </a>
          </Link>
          <button 
            onClick={() => logout()}
            className="flex items-center gap-3 px-4 py-2 rounded-full text-slate-400 hover:text-white transition-colors w-full"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-sm font-medium">Log out</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header */}
        <header className="flex items-center justify-between px-4 md:px-8 py-4 border-b border-slate-700/50 bg-slate-900 z-10">
          {/* Mobile menu button */}
          <button 
            className="lg:hidden p-2 rounded-lg hover:bg-slate-800 text-slate-400"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Search */}
          <div className="flex-1 max-w-xl mx-4">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-500 group-focus-within:text-slate-300" />
              </div>
              <Input 
                className="w-full pl-12 pr-4 py-2.5 bg-slate-800/80 border-none rounded-full text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-slate-600 focus:bg-slate-800 transition-all"
                placeholder={searchPlaceholder}
              />
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4 md:gap-6">
            <button className="relative p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-400 rounded-full border-2 border-slate-900"></span>
            </button>

            <div className="flex items-center gap-3 pl-4 md:pl-6 border-l border-slate-700/50">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-white">{user?.fullName || 'Student'}</p>
                <p className="text-xs text-slate-400">{user?.department || 'Computer Science'}</p>
              </div>
              <Avatar className="h-10 w-10 border-2 border-slate-700">
                <AvatarImage src={user?.profilePicture ? assetUrl(user.profilePicture) : undefined} />
                <AvatarFallback className="bg-gradient-to-br from-amber-400 to-amber-600 text-slate-900 font-bold">
                  {user?.fullName?.split(' ').map(n => n[0]).join('') || 'S'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto bg-slate-900 no-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
}
