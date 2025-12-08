import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight,
  Clock, MapPin, Users, Edit, Trash2, Search,
  Filter, Bell, CheckCircle, AlertCircle, Loader2,
  Video, BookOpen, GraduationCap, PartyPopper, Flag
} from "lucide-react";
import { apiEndpoint, assetUrl } from '@/lib/config';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  eventType: 'assignment' | 'exam' | 'class' | 'event' | 'deadline' | 'meeting';
  startTime: string;
  endTime: string;
  location?: string;
  meetingLink?: string;
  isPublic: boolean;
  maxParticipants?: string;
  createdBy: string;
  courseId?: string;
}

export default function AdminCalendar() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    eventType: "event" as const,
    date: "",
    startTime: "09:00",
    endTime: "10:00",
    location: "",
    meetingLink: "",
    isPublic: true,
    maxParticipants: ""
  });

  useEffect(() => {
    fetchEvents();
  }, [token, currentDate]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const response = await fetch(
        `http://localhost:3001/api/events?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        }
      );

      if (response.ok) {
        const data = await response.json();
        setEvents(Array.isArray(data) ? data : (data.events || []));
      } else {
        console.error('Failed to fetch events');
        setEvents([]);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!newEvent.title || !newEvent.date) {
      toast({
        title: "Validation Error",
        description: "Please fill in the title and date",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const startDateTime = new Date(`${newEvent.date}T${newEvent.startTime}:00`);
      const endDateTime = new Date(`${newEvent.date}T${newEvent.endTime}:00`);

      const response = await fetch(apiEndpoint('/api/events'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          title: newEvent.title,
          description: newEvent.description || null,
          eventType: newEvent.eventType,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          location: newEvent.location || null,
          meetingLink: newEvent.meetingLink || null,
          isPublic: newEvent.isPublic,
          maxParticipants: newEvent.maxParticipants || null
        })
      });

      if (response.ok) {
        toast({
          title: "Event Created",
          description: "The event has been added to the calendar"
        });
        fetchEvents();
        setCreateDialogOpen(false);
        resetNewEvent();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create event');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create event",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateEvent = async () => {
    if (!selectedEvent) return;
    
    setSaving(true);
    try {
      const response = await fetch(apiEndpoint(`/api/events/${selectedEvent.id}`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(selectedEvent)
      });

      if (response.ok) {
        toast({
          title: "Event Updated",
          description: "The event has been updated successfully"
        });
        fetchEvents();
        setEditDialogOpen(false);
        setSelectedEvent(null);
      } else {
        throw new Error('Failed to update event');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update event",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      const response = await fetch(apiEndpoint(`/api/events/${eventId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        toast({
          title: "Event Deleted",
          description: "The event has been removed from the calendar"
        });
        fetchEvents();
        setViewDialogOpen(false);
      } else {
        throw new Error('Failed to delete event');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive"
      });
    }
  };

  const resetNewEvent = () => {
    setNewEvent({
      title: "",
      description: "",
      eventType: "event",
      date: "",
      startTime: "09:00",
      endTime: "10:00",
      location: "",
      meetingLink: "",
      isPublic: true,
      maxParticipants: ""
    });
  };

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getEventTypeConfig = (type: string) => {
    const configs: Record<string, { color: string; bgColor: string; icon: React.ElementType; label: string }> = {
      meeting: { color: 'text-blue-700', bgColor: 'bg-blue-100 border-blue-200', icon: Users, label: 'Meeting' },
      class: { color: 'text-indigo-700', bgColor: 'bg-indigo-100 border-indigo-200', icon: BookOpen, label: 'Class' },
      exam: { color: 'text-red-700', bgColor: 'bg-red-100 border-red-200', icon: GraduationCap, label: 'Exam' },
      event: { color: 'text-purple-700', bgColor: 'bg-purple-100 border-purple-200', icon: PartyPopper, label: 'Event' },
      deadline: { color: 'text-orange-700', bgColor: 'bg-orange-100 border-orange-200', icon: Flag, label: 'Deadline' },
      assignment: { color: 'text-green-700', bgColor: 'bg-green-100 border-green-200', icon: CheckCircle, label: 'Assignment' }
    };
    return configs[type] || configs.event;
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(e => {
      const eventDate = new Date(e.startTime).toISOString().split('T')[0];
      return eventDate === dateStr;
    });
  };

  const filteredEvents = events.filter(event => {
    const matchesType = filterType === "all" || event.eventType === filterType;
    const matchesSearch = searchQuery === "" || 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const upcomingEvents = filteredEvents
    .filter(e => new Date(e.startTime) >= new Date())
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 6);

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const generateCalendarDays = () => {
    const days: { date: Date | null; events: CalendarEvent[]; isToday: boolean }[] = [];
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push({ date: null, events: [], isToday: false });
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), d);
      const dateEvents = getEventsForDate(date).filter(e => 
        filterType === "all" || e.eventType === filterType
      );
      days.push({
        date,
        events: dateEvents,
        isToday: date.getTime() === today.getTime()
      });
    }

    return days;
  };

  const calendarDays = generateCalendarDays();
  const totalEvents = events.length;
  const thisMonthEvents = events.filter(e => {
    const eventDate = new Date(e.startTime);
    return eventDate.getMonth() === currentDate.getMonth() && 
           eventDate.getFullYear() === currentDate.getFullYear();
  }).length;

  const formatEventTime = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return `${start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })} - ${end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
  };

  const formatEventDate = (startTime: string) => {
    return new Date(startTime).toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-gray-500">Loading calendar...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-2xl p-6 md:p-8 text-white shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <CalendarIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">School Calendar</h1>
                <p className="text-purple-200 mt-1 text-sm md:text-base">Manage events, schedules, and important dates</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-lg px-4 py-2 text-center min-w-[80px]">
                <div className="text-xl font-bold text-white">{thisMonthEvents}</div>
                <div className="text-xs text-purple-200">This Month</div>
              </div>
              <div className="bg-white/20 rounded-lg px-4 py-2 text-center min-w-[80px]">
                <div className="text-xl font-bold text-white">{totalEvents}</div>
                <div className="text-xs text-purple-200">Total</div>
              </div>
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-white text-purple-700 hover:bg-gray-100 font-semibold shadow-lg h-11">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Event
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5 text-purple-600" />
                      Create New Event
                    </DialogTitle>
                    <DialogDescription>Add a new event to the school calendar</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                    <div className="space-y-2">
                      <Label htmlFor="title">Event Title *</Label>
                      <Input
                        id="title"
                        value={newEvent.title}
                        onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                        placeholder="Enter event title"
                        className="h-11"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="eventType">Event Type *</Label>
                        <Select 
                          value={newEvent.eventType} 
                          onValueChange={(v: any) => setNewEvent({ ...newEvent, eventType: v })}
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="event">🎉 Event</SelectItem>
                            <SelectItem value="meeting">👥 Meeting</SelectItem>
                            <SelectItem value="class">📚 Class</SelectItem>
                            <SelectItem value="exam">📝 Exam</SelectItem>
                            <SelectItem value="deadline">🚩 Deadline</SelectItem>
                            <SelectItem value="assignment">✅ Assignment</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="date">Date *</Label>
                        <Input
                          id="date"
                          type="date"
                          value={newEvent.date}
                          onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                          className="h-11"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="startTime">Start Time</Label>
                        <Input
                          id="startTime"
                          type="time"
                          value={newEvent.startTime}
                          onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endTime">End Time</Label>
                        <Input
                          id="endTime"
                          type="time"
                          value={newEvent.endTime}
                          onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                          className="h-11"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={newEvent.location}
                        onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                        placeholder="e.g., Room 101, Main Hall"
                        className="h-11"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="meetingLink">Meeting Link (Optional)</Label>
                      <Input
                        id="meetingLink"
                        value={newEvent.meetingLink}
                        onChange={(e) => setNewEvent({ ...newEvent, meetingLink: e.target.value })}
                        placeholder="https://meet.google.com/..."
                        className="h-11"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newEvent.description}
                        onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                        placeholder="Enter event description..."
                        rows={3}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <Label className="font-medium">Public Event</Label>
                        <p className="text-xs text-gray-500">Visible to all users</p>
                      </div>
                      <Switch
                        checked={newEvent.isPublic}
                        onCheckedChange={(checked) => setNewEvent({ ...newEvent, isPublic: checked })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreateEvent} 
                      disabled={saving}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Event'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 w-full"
                />
              </div>
              <div className="flex gap-3">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[160px] h-11">
                    <SelectValue placeholder="All Events" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    <SelectItem value="meeting">Meetings</SelectItem>
                    <SelectItem value="class">Classes</SelectItem>
                    <SelectItem value="exam">Exams</SelectItem>
                    <SelectItem value="event">Events</SelectItem>
                    <SelectItem value="deadline">Deadlines</SelectItem>
                    <SelectItem value="assignment">Assignments</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={goToToday} className="h-11 px-6">
                  Today
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Grid */}
          <Card className="lg:col-span-2 border border-gray-200 shadow-sm">
            <CardHeader className="border-b bg-white py-4">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={() => navigateMonth(-1)} className="hover:bg-purple-100 h-10 w-10">
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <CardTitle className="text-xl font-bold text-gray-900">{monthName}</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => navigateMonth(1)} className="hover:bg-purple-100 h-10 w-10">
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-xs md:text-sm font-semibold text-gray-500 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1 md:gap-2">
                {calendarDays.map((day, idx) => (
                  <div
                    key={idx}
                    className={`min-h-[80px] md:min-h-[100px] p-1 md:p-2 rounded-lg transition-all ${
                      day.date 
                        ? 'bg-white hover:bg-purple-50 cursor-pointer border border-gray-100 hover:border-purple-300' 
                        : 'bg-gray-50/30'
                    } ${day.isToday ? 'ring-2 ring-purple-500 bg-purple-50 border-purple-300' : ''}`}
                    onClick={() => {
                      if (day.date) {
                        if (day.events.length === 0) {
                          setNewEvent({ ...newEvent, date: day.date.toISOString().split('T')[0] });
                          setCreateDialogOpen(true);
                        }
                      }
                    }}
                  >
                    {day.date && (
                      <>
                        <div className={`text-sm font-semibold mb-1 ${
                          day.isToday 
                            ? 'text-white bg-purple-600 w-7 h-7 rounded-full flex items-center justify-center' 
                            : 'text-gray-700'
                        }`}>
                          {day.date.getDate()}
                        </div>
                        <div className="space-y-1">
                          {day.events.slice(0, 2).map((event) => {
                            const config = getEventTypeConfig(event.eventType);
                            return (
                              <div
                                key={event.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedEvent(event);
                                  setViewDialogOpen(true);
                                }}
                                className={`text-xs px-2 py-1 rounded-md truncate border ${config.bgColor} ${config.color} cursor-pointer hover:opacity-80`}
                                title={event.title}
                              >
                                {event.title}
                              </div>
                            );
                          })}
                          {day.events.length > 2 && (
                            <div className="text-xs text-purple-600 font-medium pl-1">
                              +{day.events.length - 2} more
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t">
                {['meeting', 'class', 'exam', 'event', 'deadline', 'assignment'].map(type => {
                  const config = getEventTypeConfig(type);
                  return (
                    <div key={type} className="flex items-center gap-2">
                      <div className={`h-3 w-3 rounded ${config.bgColor.split(' ')[0]}`} />
                      <span className="text-sm text-gray-600 capitalize">{config.label}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Events Sidebar */}
          <div className="space-y-6">
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b py-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Bell className="h-5 w-5 text-purple-600" />
                  Upcoming Events
                </CardTitle>
                <CardDescription>Next scheduled events</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                {upcomingEvents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">No upcoming events</p>
                    <p className="text-sm">Create your first event to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingEvents.map((event) => {
                      const config = getEventTypeConfig(event.eventType);
                      const Icon = config.icon;
                      return (
                        <div
                          key={event.id}
                          onClick={() => {
                            setSelectedEvent(event);
                            setViewDialogOpen(true);
                          }}
                          className={`p-3 rounded-xl border cursor-pointer transition-all hover:shadow-md ${config.bgColor}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg bg-white/80 ${config.color}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className={`font-semibold truncate ${config.color}`}>{event.title}</h4>
                              <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-1">
                                <CalendarIcon className="h-3 w-3" />
                                {formatEventDate(event.startTime)}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                <Clock className="h-3 w-3" />
                                {formatEventTime(event.startTime, event.endTime)}
                              </div>
                              {event.location && (
                                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                  <MapPin className="h-3 w-3" />
                                  {event.location}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="py-4">
                <CardTitle className="text-lg">Event Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {['meeting', 'class', 'exam', 'event', 'deadline', 'assignment'].map(type => {
                  const count = events.filter(e => e.eventType === type).length;
                  const config = getEventTypeConfig(type);
                  const Icon = config.icon;
                  return (
                    <div key={type} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-md ${config.bgColor}`}>
                          <Icon className={`h-4 w-4 ${config.color}`} />
                        </div>
                        <span className="text-sm font-medium capitalize">{config.label}s</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">{count}</Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* View Event Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-md">
          {selectedEvent && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <Badge className={`${getEventTypeConfig(selectedEvent.eventType).bgColor} ${getEventTypeConfig(selectedEvent.eventType).color} mb-2`}>
                      {getEventTypeConfig(selectedEvent.eventType).label}
                    </Badge>
                    <DialogTitle className="text-xl">{selectedEvent.title}</DialogTitle>
                  </div>
                </div>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-3 text-gray-600">
                  <CalendarIcon className="h-5 w-5" />
                  <span>{formatEventDate(selectedEvent.startTime)}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <Clock className="h-5 w-5" />
                  <span>{formatEventTime(selectedEvent.startTime, selectedEvent.endTime)}</span>
                </div>
                {selectedEvent.location && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <MapPin className="h-5 w-5" />
                    <span>{selectedEvent.location}</span>
                  </div>
                )}
                {selectedEvent.meetingLink && (
                  <div className="flex items-center gap-3">
                    <Video className="h-5 w-5 text-blue-600" />
                    <a 
                      href={selectedEvent.meetingLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Join Meeting
                    </a>
                  </div>
                )}
                {selectedEvent.description && (
                  <div className="pt-4 border-t">
                    <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                    <p className="text-gray-600 text-sm">{selectedEvent.description}</p>
                  </div>
                )}
                <div className="flex items-center gap-2 pt-2">
                  {selectedEvent.isPublic ? (
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Public
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-orange-600 border-orange-200">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Private
                    </Badge>
                  )}
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  className="text-red-600 hover:bg-red-50"
                  onClick={() => handleDeleteEvent(selectedEvent.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
                <Button
                  onClick={() => {
                    setViewDialogOpen(false);
                    setEditDialogOpen(true);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Event
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle>Edit Event</DialogTitle>
                <DialogDescription>Update event details</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">
                  <Label>Event Title</Label>
                  <Input
                    value={selectedEvent.title}
                    onChange={(e) => setSelectedEvent({ ...selectedEvent, title: e.target.value })}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Event Type</Label>
                  <Select 
                    value={selectedEvent.eventType} 
                    onValueChange={(v: any) => setSelectedEvent({ ...selectedEvent, eventType: v })}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="event">🎉 Event</SelectItem>
                      <SelectItem value="meeting">👥 Meeting</SelectItem>
                      <SelectItem value="class">📚 Class</SelectItem>
                      <SelectItem value="exam">📝 Exam</SelectItem>
                      <SelectItem value="deadline">🚩 Deadline</SelectItem>
                      <SelectItem value="assignment">✅ Assignment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    value={selectedEvent.location || ''}
                    onChange={(e) => setSelectedEvent({ ...selectedEvent, location: e.target.value })}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Meeting Link</Label>
                  <Input
                    value={selectedEvent.meetingLink || ''}
                    onChange={(e) => setSelectedEvent({ ...selectedEvent, meetingLink: e.target.value })}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={selectedEvent.description || ''}
                    onChange={(e) => setSelectedEvent({ ...selectedEvent, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="font-medium">Public Event</Label>
                    <p className="text-xs text-gray-500">Visible to all users</p>
                  </div>
                  <Switch
                    checked={selectedEvent.isPublic}
                    onCheckedChange={(checked) => setSelectedEvent({ ...selectedEvent, isPublic: checked })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdateEvent} 
                  disabled={saving}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
