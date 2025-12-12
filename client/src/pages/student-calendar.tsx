import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiEndpoint, assetUrl } from '@/lib/config';
 import { ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  Video,
  FileText,
  Bell,
  Plus,
  Filter,
  Download,
  Share2
} from "lucide-react";

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  type: 'assignment' | 'exam' | 'class' | 'event' | 'deadline';
  location?: string;
  meetingLink?: string;
  courseId?: string;
  courseName?: string;
  color: string;
  participants?: number;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function StudentCalendar() {
  const { toast } = useToast();
  const { token, getAuthHeaders } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchEvents();
    }
  }, [currentDate, token]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const authHeaders = getAuthHeaders();

      // Fetch assignments
      const assignmentsRes = await fetch(apiEndpoint('/api/assignments/student'), {
        headers: authHeaders,
      });

      const tempEvents: CalendarEvent[] = [];

      if (assignmentsRes.ok) {
        const assignments = await assignmentsRes.json();
        assignments.forEach((assignment: any) => {
          if (assignment.dueDate) {
            const dueDate = new Date(assignment.dueDate);
            tempEvents.push({
              id: assignment.id,
              title: assignment.title,
              description: assignment.description,
              startTime: dueDate,
              endTime: dueDate,
              type: assignment.title.toLowerCase().includes('exam') || assignment.title.toLowerCase().includes('test') ? 'exam' : 'assignment',
              courseName: assignment.courseTitle,
              courseId: assignment.courseId,
              color: getEventColor('assignment'),
            });
          }
        });
      }

      // Fetch calendar events
      const eventsRes = await fetch(apiEndpoint('/api/events'), {
        headers: authHeaders,
      });

      if (eventsRes.ok) {
        const calendarEvents = await eventsRes.json();
        calendarEvents.forEach((event: any) => {
          tempEvents.push({
            id: event.id,
            title: event.title,
            description: event.description,
            startTime: new Date(event.startTime),
            endTime: new Date(event.endTime),
            type: event.eventType,
            location: event.location,
            meetingLink: event.meetingLink,
            courseName: event.courseName,
            courseId: event.courseId,
            color: getEventColor(event.eventType),
            participants: event.participants,
          });
        });
      }

      setEvents(tempEvents);
    } catch (error) {
      console.error('Failed to fetch events:', error);
      toast({
        title: 'Error',
        description: 'Failed to load calendar events',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'assignment':
        return 'bg-blue-500';
      case 'exam':
        return 'bg-red-500';
      case 'class':
        return 'bg-green-500';
      case 'event':
        return 'bg-purple-500';
      case 'deadline':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, firstDay, lastDay };
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.getDate() === date.getDate() &&
             eventDate.getMonth() === date.getMonth() &&
             eventDate.getFullYear() === date.getFullYear();
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const renderMonthView = () => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(
        <div key={`empty-${i}`} className="min-h-[120px] bg-gray-50 border border-gray-200"></div>
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayEvents = getEventsForDate(date);
      const isToday = date.toDateString() === new Date().toDateString();
      const isSelected = date.toDateString() === selectedDate.toDateString();

      days.push(
        <div
          key={day}
          onClick={() => setSelectedDate(date)}
          className={`min-h-[120px] border border-gray-200 p-2 cursor-pointer transition-all hover:bg-blue-50 ${
            isToday ? 'bg-blue-50 border-blue-400' : 'bg-white'
          } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
        >
          <div className={`text-sm font-semibold mb-2 ${
            isToday ? 'text-blue-600' : 'text-gray-700'
          }`}>
            {day}
            {isToday && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full">
                Today
              </span>
            )}
          </div>
          <div className="space-y-1">
            {dayEvents.slice(0, 3).map((event, idx) => (
              <div
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedEvent(event);
                  setShowEventDialog(true);
                }}
                className={`text-xs p-1.5 rounded ${event.color} text-white truncate hover:opacity-80 transition-opacity`}
              >
                <div className="flex items-center gap-1">
                  {event.type === 'assignment' && <FileText className="w-3 h-3" />}
                  {event.type === 'exam' && <Clock className="w-3 h-3" />}
                  {event.type === 'event' && <CalendarIcon className="w-3 h-3" />}
                  <span className="truncate font-medium">{event.title}</span>
                </div>
              </div>
            ))}
            {dayEvents.length > 3 && (
              <div className="text-xs text-gray-600 font-medium pl-1">
                +{dayEvents.length - 3} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  // Get the week dates for the current week
  const getWeekDates = (date: Date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      weekDates.push(day);
    }
    return weekDates;
  };

  // Navigate week
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  // Navigate day
  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setSelectedDate(newDate);
    setCurrentDate(newDate);
  };

  // Render week view
  const renderWeekView = () => {
    const weekDates = getWeekDates(currentDate);
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="overflow-x-auto">
        {/* Week header */}
        <div className="grid grid-cols-8 gap-0 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="p-2 text-xs text-gray-500 font-medium border-r border-gray-200"></div>
          {weekDates.map((date, idx) => {
            const isToday = date.toDateString() === new Date().toDateString();
            return (
              <div 
                key={idx} 
                className={`p-3 text-center border-r border-gray-200 ${isToday ? 'bg-blue-50' : ''}`}
              >
                <div className="text-xs text-gray-500 font-medium">{DAYS[date.getDay()].slice(0, 3)}</div>
                <div className={`text-lg font-bold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                  {date.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Time slots */}
        <div className="max-h-[600px] overflow-y-auto">
          {hours.map(hour => (
            <div key={hour} className="grid grid-cols-8 gap-0 border-b border-gray-100">
              <div className="p-2 text-xs text-gray-400 font-medium border-r border-gray-200 text-right pr-3">
                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
              </div>
              {weekDates.map((date, dayIdx) => {
                const dayEvents = getEventsForDate(date).filter(event => {
                  const eventHour = new Date(event.startTime).getHours();
                  return eventHour === hour;
                });
                return (
                  <div 
                    key={dayIdx} 
                    className="min-h-[60px] border-r border-gray-200 p-1 hover:bg-gray-50 cursor-pointer relative"
                    onClick={() => setSelectedDate(date)}
                  >
                    {dayEvents.map((event, eventIdx) => (
                      <div
                        key={eventIdx}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvent(event);
                          setShowEventDialog(true);
                        }}
                        className={`text-xs p-1 rounded ${event.color} text-white truncate mb-1 hover:opacity-80 cursor-pointer`}
                      >
                        {event.title}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render day view
  const renderDayView = () => {
    const dayEvents = getEventsForDate(selectedDate);
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const isToday = selectedDate.toDateString() === new Date().toDateString();

    return (
      <div>
        {/* Day header */}
        <div className={`p-4 text-center border-b border-gray-200 ${isToday ? 'bg-blue-50' : ''}`}>
          <div className="text-sm text-gray-500 font-medium">{DAYS[selectedDate.getDay()]}</div>
          <div className={`text-3xl font-bold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
            {selectedDate.getDate()}
          </div>
          <div className="text-sm text-gray-500">
            {MONTHS[selectedDate.getMonth()]} {selectedDate.getFullYear()}
          </div>
        </div>

        {/* All day events */}
        {dayEvents.filter(e => {
          const start = new Date(e.startTime);
          const end = new Date(e.endTime);
          return end.getTime() - start.getTime() >= 24 * 60 * 60 * 1000;
        }).length > 0 && (
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <div className="text-xs text-gray-500 font-medium mb-2">All Day</div>
            <div className="space-y-1">
              {dayEvents.filter(e => {
                const start = new Date(e.startTime);
                const end = new Date(e.endTime);
                return end.getTime() - start.getTime() >= 24 * 60 * 60 * 1000;
              }).map((event, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedEvent(event);
                    setShowEventDialog(true);
                  }}
                  className={`text-sm p-2 rounded ${event.color} text-white cursor-pointer hover:opacity-80`}
                >
                  {event.title}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hourly schedule */}
        <div className="max-h-[500px] overflow-y-auto">
          {hours.map(hour => {
            const hourEvents = dayEvents.filter(event => {
              const eventHour = new Date(event.startTime).getHours();
              return eventHour === hour;
            });
            const currentHour = new Date().getHours();
            const isCurrentHour = isToday && hour === currentHour;

            return (
              <div 
                key={hour} 
                className={`flex border-b border-gray-100 ${isCurrentHour ? 'bg-blue-50' : ''}`}
              >
                <div className="w-20 p-3 text-xs text-gray-400 font-medium text-right border-r border-gray-200">
                  {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                </div>
                <div className="flex-1 min-h-[60px] p-2 relative">
                  {hourEvents.map((event, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setSelectedEvent(event);
                        setShowEventDialog(true);
                      }}
                      className={`p-3 rounded-lg ${event.color} text-white mb-2 cursor-pointer hover:opacity-90 transition-opacity shadow-sm`}
                    >
                      <div className="font-medium">{event.title}</div>
                      <div className="text-xs opacity-90 flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(new Date(event.startTime))} - {formatTime(new Date(event.endTime))}
                      </div>
                      {event.location && (
                        <div className="text-xs opacity-90 flex items-center gap-2 mt-1">
                          <MapPin className="w-3 h-3" />
                          {event.location}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-10 relative">
        {/* Elegant Background */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-blue-50"></div>
          <div className="absolute top-0 left-0 w-full h-full opacity-20">
            <div className="absolute top-20 right-10 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl animate-float"></div>
            <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{ animationDelay: '3s' }}></div>
          </div>
          <div className="absolute inset-0 bg-white/50 backdrop-blur-3xl"></div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 font-luxury">Calendar</h1>
            <p className="text-gray-600 mt-1 font-elegant">Manage your schedule and upcoming events</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              Filter
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4" />
              Add Event
            </Button>
          </div>
        </div>

        {/* Calendar Navigation */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-900 font-luxury">
                  {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (view === 'month') navigateMonth('prev');
                      else if (view === 'week') navigateWeek('prev');
                      else navigateDay('prev');
                    }}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCurrentDate(new Date());
                      setSelectedDate(new Date());
                    }}
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (view === 'month') navigateMonth('next');
                      else if (view === 'week') navigateWeek('next');
                      else navigateDay('next');
                    }}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={view === 'month' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setView('month')}
                >
                  Month
                </Button>
                <Button
                  variant={view === 'week' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setView('week')}
                >
                  Week
                </Button>
                <Button
                  variant={view === 'day' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setView('day')}
                >
                  Day
                </Button>
              </div>
            </div>

            {/* Calendar Grid */}
            {view === 'month' && (
              <div>
                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-0 mb-2">
                  {DAYS.map(day => (
                    <div key={day} className="text-center font-semibold text-gray-700 py-2 text-sm">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-0 border-t border-l border-gray-200">
                  {renderMonthView()}
                </div>
              </div>
            )}

            {view === 'week' && renderWeekView()}
            
            {view === 'day' && renderDayView()}
          </CardContent>
        </Card>

        {/* Upcoming Events Sidebar */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 font-luxury">
                Upcoming Events
              </h3>
              <Badge variant="secondary" className="text-sm">
                {events.filter(e => new Date(e.startTime) >= new Date()).length} events
              </Badge>
            </div>

            <div className="space-y-3">
              {events
                .filter(e => new Date(e.startTime) >= new Date())
                .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                .slice(0, 5)
                .map((event) => (
                  <div
                    key={event.id}
                    onClick={() => {
                      setSelectedEvent(event);
                      setShowEventDialog(true);
                    }}
                    className="flex items-start gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className={`w-1 h-full ${event.color} rounded-full`}></div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-semibold text-gray-900">{event.title}</h4>
                          {event.courseName && (
                            <p className="text-sm text-gray-600">{event.courseName}</p>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {event.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatTime(new Date(event.startTime))}
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {event.location}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Event Details Dialog */}
        <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold font-luxury">
                {selectedEvent?.title}
              </DialogTitle>
              <DialogDescription>
                {formatDate(new Date(selectedEvent?.startTime || new Date()))}
              </DialogDescription>
            </DialogHeader>

            {selectedEvent && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge className={selectedEvent.color}>
                    {selectedEvent.type}
                  </Badge>
                  {selectedEvent.courseName && (
                    <Badge variant="outline">{selectedEvent.courseName}</Badge>
                  )}
                </div>

                {selectedEvent.description && (
                  <p className="text-gray-700">{selectedEvent.description}</p>
                )}

                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="w-5 h-5 text-gray-500" />
                    <div>
                      <div className="font-medium">
                        {formatTime(new Date(selectedEvent.startTime))} - {formatTime(new Date(selectedEvent.endTime))}
                      </div>
                      <div className="text-gray-600">
                        {formatDate(new Date(selectedEvent.startTime))}
                      </div>
                    </div>
                  </div>

                  {selectedEvent.location && (
                    <div className="flex items-center gap-3 text-sm">
                      <MapPin className="w-5 h-5 text-gray-500" />
                      <span>{selectedEvent.location}</span>
                    </div>
                  )}

                  {selectedEvent.meetingLink && (
                    <div className="flex items-center gap-3 text-sm">
                      <Video className="w-5 h-5 text-gray-500" />
                      <a href={selectedEvent.meetingLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        Join Meeting
                      </a>
                    </div>
                  )}

                  {selectedEvent.participants && (
                    <div className="flex items-center gap-3 text-sm">
                      <Users className="w-5 h-5 text-gray-500" />
                      <span>{selectedEvent.participants} participants</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4">
                  <Button className="flex-1 gap-2">
                    <Bell className="w-4 h-4" />
                    Add Reminder
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <Share2 className="w-4 h-4" />
                    Share
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
