import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiEndpoint } from "@/lib/config";
import StudentLayout from "@/components/StudentLayout";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Video,
  Bell,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  FileText,
  GraduationCap,
  Laptop
} from "lucide-react";

interface ScheduleEvent {
  id: number;
  title: string;
  description?: string;
  courseName?: string;
  eventType: 'class' | 'exam' | 'assignment-due' | 'meeting' | 'event' | 'holiday';
  startTime: string;
  endTime: string;
  location?: string;
  isOnline?: boolean;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const eventTypeConfig: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  class: { label: 'Class', color: 'text-blue-400', bgColor: 'bg-blue-500', icon: BookOpen },
  exam: { label: 'Exam', color: 'text-red-400', bgColor: 'bg-red-500', icon: Bell },
  'assignment-due': { label: 'Due', color: 'text-amber-400', bgColor: 'bg-amber-500', icon: FileText },
  meeting: { label: 'Meeting', color: 'text-emerald-400', bgColor: 'bg-emerald-500', icon: Users },
  event: { label: 'Event', color: 'text-purple-400', bgColor: 'bg-purple-500', icon: Calendar },
  holiday: { label: 'Holiday', color: 'text-pink-400', bgColor: 'bg-pink-500', icon: GraduationCap },
};

export default function StudentSchedulePage() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week'>('week');

  // Fetch schedule events
  const { data: events = [], isLoading } = useQuery<ScheduleEvent[]>({
    queryKey: ["/api/schedule", currentDate.toISOString()],
    queryFn: async () => {
      const startOfWeek = getStartOfWeek(currentDate);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      
      const response = await fetch(
        apiEndpoint(`/api/schedule?start=${startOfWeek.toISOString()}&end=${endOfWeek.toISOString()}`),
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (!response.ok) {
        // Return mock schedule if API doesn't exist
        return generateMockSchedule(startOfWeek);
      }
      return response.json();
    },
    enabled: !!user,
  });

  function getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function generateMockSchedule(startOfWeek: Date): ScheduleEvent[] {
    const events: ScheduleEvent[] = [];
    const courses = [
      { name: 'Mathematics', type: 'class' as const },
      { name: 'Physics', type: 'class' as const },
      { name: 'English Literature', type: 'class' as const },
      { name: 'Computer Science', type: 'class' as const },
    ];
    
    for (let i = 0; i < 5; i++) { // Mon-Fri
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + i + 1);
      
      courses.forEach((course, idx) => {
        if ((i + idx) % 2 === 0) {
          const startHour = 8 + (idx * 2);
          const startTime = new Date(date);
          startTime.setHours(startHour, 0, 0, 0);
          
          const endTime = new Date(startTime);
          endTime.setHours(startHour + 1, 30, 0, 0);
          
          events.push({
            id: events.length + 1,
            title: course.name,
            courseName: course.name,
            eventType: course.type,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            location: idx % 2 === 0 ? 'Room 101' : undefined,
            isOnline: idx % 2 !== 0,
          });
        }
      });
    }
    
    return events;
  }

  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const getWeekDays = () => {
    const startOfWeek = getStartOfWeek(currentDate);
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + i);
      return date;
    });
  };

  const weekDays = getWeekDays();

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const selectedDateEvents = getEventsForDate(selectedDate).sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  // Time slots for week view
  const timeSlots = Array.from({ length: 12 }, (_, i) => i + 7); // 7 AM to 6 PM

  return (
    <StudentLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/20 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-amber-400" />
              </div>
              My Schedule
            </h1>
            <p className="text-slate-400 mt-1">Your weekly class and event schedule</p>
          </div>
          
          {/* Controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-slate-800/50 border border-slate-700/50 rounded-xl p-1">
              <button
                onClick={() => setViewMode('day')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'day' ? "bg-amber-500 text-slate-900" : "text-slate-400 hover:text-white"
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'week' ? "bg-amber-500 text-slate-900" : "text-slate-400 hover:text-white"
                }`}
              >
                Week
              </button>
            </div>
            <button
              onClick={goToToday}
              className="px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm font-medium text-white hover:bg-slate-700/50 transition-colors"
            >
              Today
            </button>
          </div>
        </div>

        {/* Week Navigation */}
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={goToPreviousWeek}
              className="p-2 rounded-lg bg-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-semibold text-white">
              {weekDays[0].toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - {weekDays[6].toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </h2>
            <button
              onClick={goToNextWeek}
              className="p-2 rounded-lg bg-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Week Day Headers */}
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((date, idx) => {
              const dayEvents = getEventsForDate(date);
              const hasEvents = dayEvents.length > 0;
              
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(date)}
                  className={`p-3 rounded-xl text-center transition-all ${
                    isSelected(date)
                      ? "bg-amber-500 text-slate-900"
                      : isToday(date)
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "hover:bg-slate-700/50 text-slate-300"
                  }`}
                >
                  <div className="text-xs font-medium mb-1 opacity-70">{SHORT_DAYS[idx]}</div>
                  <div className={`text-lg font-bold ${isSelected(date) ? "" : ""}`}>{date.getDate()}</div>
                  {hasEvents && (
                    <div className="flex justify-center gap-0.5 mt-1">
                      {dayEvents.slice(0, 3).map((event, i) => (
                        <div
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full ${
                            isSelected(date) ? "bg-slate-900" : eventTypeConfig[event.eventType]?.bgColor || "bg-slate-500"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Schedule Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Selected Day Events */}
          <div className="lg:col-span-2 bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5">
            <h3 className="text-lg font-semibold text-white mb-4">
              {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </h3>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-amber-500 border-t-transparent"></div>
              </div>
            ) : selectedDateEvents.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-slate-500" />
                </div>
                <h4 className="text-white font-medium mb-2">No Events Scheduled</h4>
                <p className="text-slate-400 text-sm">You have no classes or events on this day</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDateEvents.map((event) => {
                  const config = eventTypeConfig[event.eventType] || eventTypeConfig.event;
                  const Icon = config.icon;
                  
                  return (
                    <div
                      key={event.id}
                      className={`flex items-start gap-4 p-4 bg-slate-900/30 border border-slate-700/30 rounded-xl hover:bg-slate-900/50 transition-colors`}
                    >
                      {/* Time */}
                      <div className="w-20 text-center flex-shrink-0">
                        <div className="text-sm font-medium text-white">{formatTime(event.startTime)}</div>
                        <div className="text-xs text-slate-500">{formatTime(event.endTime)}</div>
                      </div>
                      
                      {/* Colored Line */}
                      <div className={`w-1 h-16 rounded-full ${config.bgColor} flex-shrink-0`} />
                      
                      {/* Event Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${config.bgColor}/20 ${config.color}`}>
                            {config.label}
                          </span>
                          {event.courseName && event.courseName !== event.title && (
                            <span className="text-xs text-slate-500">{event.courseName}</span>
                          )}
                        </div>
                        <h4 className="font-medium text-white truncate">{event.title}</h4>
                        
                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                          {event.isOnline ? (
                            <div className="flex items-center gap-1.5">
                              <Video className="h-3.5 w-3.5 text-emerald-400" />
                              <span>Online</span>
                            </div>
                          ) : event.location ? (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5" />
                              <span>{event.location}</span>
                            </div>
                          ) : null}
                        </div>
                      </div>
                      
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-xl ${config.bgColor}/20 flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`h-5 w-5 ${config.color}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upcoming Events Sidebar */}
          <div className="space-y-5">
            {/* Quick Stats */}
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5">
              <h3 className="text-lg font-semibold text-white mb-4">This Week</h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(eventTypeConfig).slice(0, 4).map(([type, config]) => {
                  const count = events.filter(e => e.eventType === type).length;
                  const Icon = config.icon;
                  
                  return (
                    <div key={type} className="bg-slate-900/30 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-8 h-8 rounded-lg ${config.bgColor}/20 flex items-center justify-center`}>
                          <Icon className={`h-4 w-4 ${config.color}`} />
                        </div>
                      </div>
                      <div className="text-xl font-bold text-white">{count}</div>
                      <div className="text-xs text-slate-400">{config.label}es</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-slate-400 mb-3">Event Types</h3>
              <div className="space-y-2">
                {Object.entries(eventTypeConfig).map(([type, config]) => {
                  const Icon = config.icon;
                  return (
                    <div key={type} className="flex items-center gap-2 text-sm">
                      <div className={`w-2.5 h-2.5 rounded-full ${config.bgColor}`} />
                      <Icon className={`h-4 w-4 ${config.color}`} />
                      <span className="text-slate-300">{config.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
