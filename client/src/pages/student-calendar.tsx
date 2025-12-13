import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiEndpoint } from "@/lib/config";
import StudentLayout from "@/components/StudentLayout";
import { ChevronLeft, ChevronRight, Clock, MapPin, BookOpen, FileText, Video, Users } from "lucide-react";

interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  type: "assignment" | "class" | "exam" | "meeting" | "other";
  date: string;
  time?: string;
  endTime?: string;
  location?: string;
  courseId?: number;
  courseName?: string;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function StudentCalendarPage() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week">("month");

  // Fetch calendar events using schedule API
  const { data: scheduleData, isLoading } = useQuery({
    queryKey: ["/api/schedule/me", currentDate.getMonth(), currentDate.getFullYear()],
    queryFn: async () => {
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      const response = await fetch(
        apiEndpoint(`/api/schedule/me?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`),
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (!response.ok) {
        // Return empty data if endpoint fails
        return { schedule: [] };
      }
      return response.json();
    },
    enabled: !!user,
  });
  
  // Transform schedule data to calendar events format
  const events: CalendarEvent[] = (scheduleData?.schedule || []).map((e: any) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    type: e.eventType === 'assignment-due' ? 'assignment' : (e.eventType || 'class'),
    date: e.startTime,
    time: e.startTime ? new Date(e.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : undefined,
    endTime: e.endTime ? new Date(e.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : undefined,
    location: e.location,
    courseId: e.courseId,
    courseName: e.courseName,
  }));

  // Fetch assignments as calendar events
  const { data: assignments = [] } = useQuery({
    queryKey: ["/api/assignments/student"],
    queryFn: async () => {
      const response = await fetch(apiEndpoint("/api/assignments/student"), {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) return [];
      const data = await response.json();
      return data.assignments || [];
    },
    enabled: !!user,
  });

  // Convert assignments to calendar events
  const assignmentEvents: CalendarEvent[] = assignments.map((a: any) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    type: "assignment" as const,
    date: a.dueDate,
    courseName: a.course?.title,
    courseId: a.courseId,
  }));

  // Combine all events
  const allEvents = [...events, ...assignmentEvents];

  // Calendar navigation
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  // Get calendar days
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days: (Date | null)[] = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const calendarDays = getDaysInMonth(currentDate);

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    return allEvents.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  // Get selected date events
  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  // Check if date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Check if date is selected
  const isSelected = (date: Date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };

  // Get event type styling
  const getEventTypeStyles = (type: string) => {
    switch (type) {
      case "assignment":
        return { bg: "bg-amber-500", icon: FileText, color: "text-amber-400" };
      case "class":
        return { bg: "bg-blue-500", icon: Video, color: "text-blue-400" };
      case "exam":
        return { bg: "bg-red-500", icon: BookOpen, color: "text-red-400" };
      case "meeting":
        return { bg: "bg-purple-500", icon: Users, color: "text-purple-400" };
      default:
        return { bg: "bg-slate-500", icon: Clock, color: "text-slate-400" };
    }
  };

  // Format time
  const formatTime = (time?: string) => {
    if (!time) return "";
    const date = new Date(`2000-01-01T${time}`);
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  };

  // Upcoming events (next 7 days)
  const upcomingEvents = allEvents
    .filter(event => {
      const eventDate = new Date(event.date);
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      return eventDate >= today && eventDate <= nextWeek;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  return (
    <StudentLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Calendar</h1>
            <p className="text-slate-400 mt-1">Track your classes, assignments, and events</p>
          </div>
          
          {/* View Toggle */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-slate-800/50 border border-slate-700/50 rounded-xl p-1">
              <button
                onClick={() => setViewMode("month")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === "month" ? "bg-amber-500 text-slate-900" : "text-slate-400 hover:text-white"
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setViewMode("week")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === "week" ? "bg-amber-500 text-slate-900" : "text-slate-400 hover:text-white"
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

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2 bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">
                {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={goToPreviousMonth}
                  className="p-2 rounded-lg bg-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={goToNextMonth}
                  className="p-2 rounded-lg bg-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS.map(day => (
                <div key={day} className="text-center text-xs font-medium text-slate-500 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} className="aspect-square" />;
                }

                const dayEvents = getEventsForDate(date);
                const hasEvents = dayEvents.length > 0;

                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => setSelectedDate(date)}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center p-1 transition-all ${
                      isSelected(date)
                        ? "bg-amber-500 text-slate-900"
                        : isToday(date)
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        : "hover:bg-slate-700/50 text-slate-300"
                    }`}
                  >
                    <span className={`text-sm font-medium ${isSelected(date) ? "" : ""}`}>
                      {date.getDate()}
                    </span>
                    {hasEvents && (
                      <div className="flex gap-0.5 mt-1">
                        {dayEvents.slice(0, 3).map((event, i) => (
                          <div
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSelected(date) ? "bg-slate-900" : getEventTypeStyles(event.type).bg
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Event Type Legend */}
            <div className="flex flex-wrap items-center gap-4 mt-6 pt-4 border-t border-slate-700/50">
              {[
                { type: "assignment", label: "Assignment" },
                { type: "class", label: "Class" },
                { type: "exam", label: "Exam" },
                { type: "meeting", label: "Meeting" },
              ].map(({ type, label }) => {
                const styles = getEventTypeStyles(type);
                return (
                  <div key={type} className="flex items-center gap-2 text-xs text-slate-400">
                    <div className={`w-2.5 h-2.5 rounded-full ${styles.bg}`} />
                    <span>{label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Selected Date Events */}
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5">
              <h3 className="text-lg font-semibold text-white mb-4">
                {selectedDate
                  ? selectedDate.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })
                  : "Select a Date"}
              </h3>

              {selectedDateEvents.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-3">
                    <Clock className="h-6 w-6 text-slate-500" />
                  </div>
                  <p className="text-slate-400 text-sm">No events scheduled</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDateEvents.map(event => {
                    const styles = getEventTypeStyles(event.type);
                    const Icon = styles.icon;
                    return (
                      <div
                        key={event.id}
                        className="p-3 bg-slate-700/30 border border-slate-700/50 rounded-xl"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-lg ${styles.bg}/20 flex items-center justify-center flex-shrink-0`}>
                            <Icon className={`h-4 w-4 ${styles.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-white text-sm">{event.title}</h4>
                            {event.courseName && (
                              <p className="text-xs text-slate-500 mt-0.5">{event.courseName}</p>
                            )}
                            {event.time && (
                              <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
                                <Clock className="h-3 w-3" />
                                <span>
                                  {formatTime(event.time)}
                                  {event.endTime && ` - ${formatTime(event.endTime)}`}
                                </span>
                              </div>
                            )}
                            {event.location && (
                              <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                                <MapPin className="h-3 w-3" />
                                <span>{event.location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Upcoming Events */}
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5">
              <h3 className="text-lg font-semibold text-white mb-4">Upcoming Events</h3>

              {upcomingEvents.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4">No upcoming events</p>
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.map(event => {
                    const styles = getEventTypeStyles(event.type);
                    const eventDate = new Date(event.date);
                    const isEventToday = isToday(eventDate);
                    
                    return (
                      <div
                        key={event.id}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-700/30 transition-colors cursor-pointer"
                        onClick={() => setSelectedDate(eventDate)}
                      >
                        <div className={`w-10 text-center flex-shrink-0`}>
                          <div className={`text-xs font-medium ${isEventToday ? "text-amber-400" : "text-slate-500"}`}>
                            {eventDate.toLocaleDateString("en-US", { weekday: "short" })}
                          </div>
                          <div className={`text-lg font-bold ${isEventToday ? "text-amber-400" : "text-white"}`}>
                            {eventDate.getDate()}
                          </div>
                        </div>
                        <div className={`w-1 h-10 rounded-full ${styles.bg}`} />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-white text-sm truncate">{event.title}</h4>
                          <p className="text-xs text-slate-500 truncate">
                            {event.courseName || event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
