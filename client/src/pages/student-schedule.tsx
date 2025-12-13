import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { apiEndpoint } from "@/lib/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar, Clock, MapPin, Users, Video, Bell,
  ChevronLeft, ChevronRight, Download, AlertCircle,
  BookOpen, FileText, GraduationCap, MoreHorizontal
} from "lucide-react";

interface ScheduleEvent {
  id: string;
  title: string;
  description?: string;
  courseName?: string;
  eventType: string;
  startTime: string;
  endTime: string;
  location?: string;
  isOnline?: boolean;
  color?: string;
  maxScore?: string;
}

interface GroupedSchedule {
  [date: string]: ScheduleEvent[];
}

interface DateRange {
  start: Date;
  end: Date;
}

const eventTypeConfig: Record<string, { label: string; color: string; bgColor: string; icon: any; dotColor: string }> = {
  class: { label: 'Class', color: 'text-blue-400', bgColor: 'bg-blue-500', icon: Users, dotColor: 'bg-blue-500' },
  exam: { label: 'Exam', color: 'text-red-400', bgColor: 'bg-red-500', icon: Bell, dotColor: 'bg-red-500' },
  'assignment-due': { label: 'Due', color: 'text-orange-400', bgColor: 'bg-orange-500', icon: FileText, dotColor: 'bg-orange-500' },
  meeting: { label: 'Meeting', color: 'text-green-400', bgColor: 'bg-green-500', icon: Users, dotColor: 'bg-green-500' },
  event: { label: 'Event', color: 'text-purple-400', bgColor: 'bg-purple-500', icon: Calendar, dotColor: 'bg-purple-500' },
  holiday: { label: 'Holiday', color: 'text-emerald-400', bgColor: 'bg-emerald-500', icon: GraduationCap, dotColor: 'bg-emerald-500' },
  announcement: { label: 'Announcement', color: 'text-yellow-400', bgColor: 'bg-yellow-500', icon: Bell, dotColor: 'bg-yellow-500' }
};

function EventCard({ event }: { event: ScheduleEvent }) {
  const config = eventTypeConfig[event.eventType] || eventTypeConfig.event;
  const Icon = config.icon;
  const startTime = new Date(event.startTime);
  const endTime = new Date(event.endTime);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const isOnline = event.isOnline || event.location?.toLowerCase().includes('online');

  return (
    <Card className="bg-slate-800/60 border-slate-700/50 rounded-xl hover:bg-slate-800/80 transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge className={`${config.bgColor} text-white text-xs`}>
                {config.label}
              </Badge>
              {event.courseName && (
                <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                  {event.courseName}
                </Badge>
              )}
            </div>
            <h3 className="font-semibold text-white">{event.title}</h3>
          </div>
          <Icon className={`h-5 w-5 ${config.color}`} />
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-slate-400">
            <Clock className="h-4 w-4" />
            <span>{formatTime(startTime)} - {formatTime(endTime)}</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2 text-slate-400">
              {isOnline ? <Video className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
              <span>{event.location}</span>
            </div>
          )}
        </div>

        {event.description && (
          <p className="mt-3 text-sm text-slate-500 border-t border-slate-700 pt-2">
            {event.description}
          </p>
        )}

        {isOnline && (
          <Button size="sm" className="w-full mt-3 bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-semibold">
            <Video className="h-4 w-4 mr-2" />
            Join Online
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function DayView({ date, events, isToday }: { date: string; events: ScheduleEvent[]; isToday: boolean }) {
  const dayDate = new Date(date);
  const dayOfWeek = dayDate.toLocaleDateString('en-US', { weekday: 'long' });
  const formattedDate = dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-white">{dayOfWeek}</h3>
          <p className="text-sm text-slate-400">{formattedDate}</p>
        </div>
        {isToday && (
          <Badge className="bg-yellow-500 text-slate-900 font-semibold">Today</Badge>
        )}
      </div>
      
      {events.length > 0 ? (
        <div className="space-y-4">
          {events
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
            .map(event => (
              <EventCard key={event.id} event={event} />
            ))}
        </div>
      ) : (
        <Card className="bg-slate-800/60 border-slate-700/50 rounded-xl">
          <CardContent className="p-8 text-center">
            <Calendar className="h-12 w-12 mx-auto text-slate-600 mb-2" />
            <p className="text-slate-400">No events scheduled</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function StudentSchedule() {
  const { user, token, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [schedule, setSchedule] = useState<ScheduleEvent[]>([]);
  const [groupedSchedule, setGroupedSchedule] = useState<GroupedSchedule>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [dateRange, setDateRange] = useState<DateRange | null>(null);

  // Calculate date range based on week offset
  const getDateRange = useCallback(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(now.getDate() - day + (weekOffset * 7));
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return { start: startOfWeek, end: endOfWeek };
  }, [weekOffset]);

  const fetchSchedule = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { start, end } = getDateRange();
      const response = await fetch(
        apiEndpoint(`/api/schedule/me?startDate=${start.toISOString()}&endDate=${end.toISOString()}`),
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch schedule');
      }

      const data = await response.json();
      setSchedule(data.schedule || []);
      setGroupedSchedule(data.grouped || {});
      setDateRange(data.dateRange ? {
        start: new Date(data.dateRange.start),
        end: new Date(data.dateRange.end)
      } : getDateRange());

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load schedule';
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [token, getDateRange, toast]);

  useEffect(() => {
    // Wait for auth to complete loading before fetching
    if (!authLoading) {
      fetchSchedule();
    }
  }, [fetchSchedule, authLoading]);

  // Calculate stats
  const stats = {
    totalClasses: schedule.filter(e => e.eventType === 'class').length,
    upcomingExams: schedule.filter(e => e.eventType === 'exam').length,
    assignmentsDue: schedule.filter(e => e.eventType === 'assignment-due').length,
    onlineClasses: schedule.filter(e => e.isOnline || e.location?.toLowerCase().includes('online')).length
  };

  // Get today's date string
  const todayStr = new Date().toISOString().split('T')[0];

  // Get week days for display
  const getWeekDays = () => {
    const { start } = getDateRange();
    const days: string[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day.toISOString().split('T')[0]);
    }
    return days;
  };

  const weekDays = getWeekDays();

  // Export schedule as ICS
  const handleExport = () => {
    if (schedule.length === 0) {
      toast({
        title: "No events to export",
        description: "There are no events in your current schedule to export.",
        variant: "destructive"
      });
      return;
    }

    // Generate ICS content
    const icsEvents = schedule.map(event => {
      const start = new Date(event.startTime).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const end = new Date(event.endTime).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      return `BEGIN:VEVENT
DTSTART:${start}
DTEND:${end}
SUMMARY:${event.title}
DESCRIPTION:${event.description || ''}
LOCATION:${event.location || ''}
END:VEVENT`;
    }).join('\n');

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//EduVerse//Schedule//EN
${icsEvents}
END:VCALENDAR`;

    // Download file
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'eduverse-schedule.ics';
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Schedule exported",
      description: "Your schedule has been downloaded as an ICS file."
    });
  };

  const weekLabel = weekOffset === 0 
    ? 'This Week' 
    : weekOffset > 0 
      ? `${weekOffset} Week${weekOffset > 1 ? 's' : ''} Ahead`
      : `${Math.abs(weekOffset)} Week${Math.abs(weekOffset) > 1 ? 's' : ''} Ago`;

  // Get current month and year for calendar view
  const currentMonth = new Date();
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [calendarMonth, setCalendarMonth] = useState(currentMonth);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    return { daysInMonth, startingDay };
  };

  const { daysInMonth, startingDay } = getDaysInMonth(calendarMonth);

  const getEventsForDate = (day: number) => {
    const dateStr = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return groupedSchedule[dateStr] || [];
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">My Calendar</h1>
            <p className="text-slate-400 mt-1 text-sm">
              Keep track of all your classes, assignments, and events.
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-700"
              onClick={handleExport} 
              disabled={loading || schedule.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* View Toggle Tabs */}
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            className="rounded-full h-8 px-4 text-sm bg-white text-slate-900"
          >
            Month
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="rounded-full h-8 px-4 text-sm bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-700"
          >
            Week
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="rounded-full h-8 px-4 text-sm bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-700"
          >
            Day
          </Button>
        </div>

        {/* Event Type Legend */}
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-slate-400">Classes</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-slate-400">Assignments</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-slate-400">Exams</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Grid */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-800/60 border-slate-700/50 rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-slate-700 pb-4">
                <div className="flex items-center justify-between">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="text-slate-400 hover:text-white hover:bg-slate-700"
                    onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <CardTitle className="text-xl font-bold text-white">
                    {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="text-slate-400 hover:text-white hover:bg-slate-700"
                    onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {/* Days of Week Header */}
                <div className="grid grid-cols-7 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-sm font-medium text-slate-500 py-2">
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Empty cells for days before the 1st */}
                  {Array.from({ length: startingDay }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square p-1"></div>
                  ))}
                  
                  {/* Days of the month */}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const isToday = dateStr === todayStr;
                    const isSelected = dateStr === selectedDate;
                    const dayEvents = getEventsForDate(day);
                    
                    return (
                      <div 
                        key={day}
                        className={`aspect-square p-1 cursor-pointer rounded-lg transition-all ${
                          isSelected ? 'bg-yellow-500/20 ring-2 ring-yellow-500' :
                          isToday ? 'bg-slate-700/50' :
                          'hover:bg-slate-700/30'
                        }`}
                        onClick={() => setSelectedDate(dateStr)}
                      >
                        <div className="h-full flex flex-col items-center pt-1">
                          <span className={`text-sm font-medium ${
                            isToday ? 'text-yellow-500' : 
                            isSelected ? 'text-yellow-400' :
                            'text-slate-300'
                          }`}>
                            {day}
                          </span>
                          {/* Event dots */}
                          {dayEvents.length > 0 && (
                            <div className="flex gap-0.5 mt-1 flex-wrap justify-center max-w-full">
                              {dayEvents.slice(0, 3).map((event, idx) => (
                                <div 
                                  key={idx}
                                  className={`w-1.5 h-1.5 rounded-full ${eventTypeConfig[event.eventType]?.dotColor || 'bg-slate-500'}`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Selected Date Details Sidebar */}
          <div className="space-y-6">
            {/* Selected Date Card */}
            <Card className="bg-slate-800/60 border-slate-700/50 rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold text-white flex items-center justify-between">
                  {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {groupedSchedule[selectedDate]?.length > 0 ? (
                  groupedSchedule[selectedDate]
                    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                    .map(event => {
                      const config = eventTypeConfig[event.eventType] || eventTypeConfig.event;
                      const startTime = new Date(event.startTime);
                      return (
                        <div key={event.id} className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-xl">
                          <div className={`w-1 h-full min-h-[40px] rounded-full ${config.bgColor}`}></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white">{event.title}</p>
                            <p className="text-xs text-slate-400">
                              {startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                              {event.location && ` • ${event.location}`}
                            </p>
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <div className="text-center py-6">
                    <Calendar className="h-10 w-10 mx-auto text-slate-600 mb-2" />
                    <p className="text-sm text-slate-500">No events scheduled</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Up Next Section */}
            <Card className="bg-slate-800/60 border-slate-700/50 rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold text-white">Up Next</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {schedule
                  .filter(e => new Date(e.startTime) >= new Date())
                  .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                  .slice(0, 3)
                  .map(event => {
                    const config = eventTypeConfig[event.eventType] || eventTypeConfig.event;
                    const startTime = new Date(event.startTime);
                    const Icon = config.icon;
                    return (
                      <div key={event.id} className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-xl">
                        <div className={`p-2 rounded-lg ${config.bgColor}/20`}>
                          <Icon className={`h-4 w-4 ${config.color}`} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">{event.title}</p>
                          <p className="text-xs text-slate-400">
                            {startTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                {schedule.filter(e => new Date(e.startTime) >= new Date()).length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-sm text-slate-500">No upcoming events</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Card className="border-red-500/50 bg-red-500/10 rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <p className="text-red-300">{error}</p>
                <Button variant="outline" size="sm" onClick={fetchSchedule} className="border-red-500/50 text-red-300 hover:bg-red-500/20">
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
