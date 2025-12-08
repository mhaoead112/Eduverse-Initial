import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight,
  Clock, MapPin, Users, BookOpen, Trash2
} from "lucide-react";
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
  id: number;
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  type: 'class' | 'meeting' | 'office_hours' | 'deadline' | 'event';
  location?: string;
  courseName?: string;
}

export default function TeacherCalendar() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    date: "",
    startTime: "09:00",
    endTime: "10:00",
    type: "class",
    location: "",
    courseName: ""
  });

  useEffect(() => {
    if (token) {
      fetchEvents();
    } else {
      setLoading(false);
    }
  }, [token, currentDate]);

  const fetchEvents = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    
    try {
      // Calculate date range for current month
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const response = await fetch(
        `http://localhost:3001/api/schedule/me?startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`,
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
        // Transform API response to match component's expected format
        // The API returns 'schedule' array with startTime/endTime as full datetime
        const transformedEvents = (data.schedule || []).map((e: any) => {
          const startDateTime = new Date(e.startTime);
          const endDateTime = new Date(e.endTime);
          return {
            id: e.id,
            title: e.title,
            description: e.description,
            date: startDateTime.toISOString().split('T')[0],
            startTime: startDateTime.toTimeString().slice(0, 5),
            endTime: endDateTime.toTimeString().slice(0, 5),
            type: e.eventType || 'event',
            location: e.location,
            courseName: e.courseName
          };
        });
        setEvents(transformedEvents);
      } else {
        // API not available - use empty state
        setEvents([]);
        toast({
          title: "Info",
          description: "Calendar is empty. Add events to get started!",
        });
      }
    } catch (error) {
      // Network error - use empty state
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!newEvent.title || !newEvent.date) {
      toast({
        title: "Error",
        description: "Please fill in title and date",
        variant: "destructive"
      });
      return;
    }

    try {
      // Combine date and time to create full ISO datetime strings
      const startDateTime = new Date(`${newEvent.date}T${newEvent.startTime}:00`);
      const endDateTime = new Date(`${newEvent.date}T${newEvent.endTime}:00`);
      
      const response = await fetch('http://localhost:3001/api/schedule/event', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          title: newEvent.title,
          description: newEvent.description,
          eventType: newEvent.type,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          location: newEvent.location,
          courseName: newEvent.courseName
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Convert API response to component's expected format
        const savedEvent: CalendarEvent = {
          id: data.event.id,
          title: data.event.title,
          description: data.event.description,
          date: newEvent.date,
          startTime: newEvent.startTime,
          endTime: newEvent.endTime,
          type: newEvent.type as any,
          location: data.event.location,
          courseName: newEvent.courseName
        };
        setEvents([...events, savedEvent]);
        toast({ title: "Success", description: "Event created and saved successfully" });
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast({ 
          title: "Error", 
          description: errorData.error || "Failed to save event",
          variant: "destructive"
        });
        return;
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error - could not save event",
        variant: "destructive"
      });
      return;
    }
    
    setCreateDialogOpen(false);
    setNewEvent({
      title: "",
      description: "",
      date: "",
      startTime: "09:00",
      endTime: "10:00",
      type: "class",
      location: "",
      courseName: ""
    });
  };

  const handleDeleteEvent = (eventId: number) => {
    setEvents(events.filter(e => e.id !== eventId));
    toast({ title: "Success", description: "Event deleted" });
  };

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'class': return 'bg-blue-100 text-blue-800 border-l-4 border-l-blue-500';
      case 'meeting': return 'bg-purple-100 text-purple-800 border-l-4 border-l-purple-500';
      case 'office_hours': return 'bg-green-100 text-green-800 border-l-4 border-l-green-500';
      case 'deadline': return 'bg-red-100 text-red-800 border-l-4 border-l-red-500';
      case 'event': return 'bg-orange-100 text-orange-800 border-l-4 border-l-orange-500';
      default: return 'bg-gray-100 text-gray-800 border-l-4 border-l-gray-500';
    }
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(e => e.date === dateStr);
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Generate calendar days
  const generateCalendarDays = () => {
    const days = [];
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push({ date: null, events: [] });
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), d);
      days.push({
        date,
        events: getEventsForDate(date),
        isToday: date.getTime() === today.getTime()
      });
    }

    return days;
  };

  const calendarDays = generateCalendarDays();
  const todayEvents = getEventsForDate(new Date()).sort((a, b) => a.startTime.localeCompare(b.startTime));

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Calendar</h1>
            <p className="text-gray-600">Manage your classes, meetings, and events</p>
          </div>
          <div className="flex gap-3">
            <Select value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="week">Week</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Event
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Event</DialogTitle>
                  <DialogDescription>Add a new event to your calendar.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="title">Event Title</Label>
                    <Input
                      id="title"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                      placeholder="Enter event title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Event Type</Label>
                    <Select value={newEvent.type} onValueChange={(v) => setNewEvent({ ...newEvent, type: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="class">Class</SelectItem>
                        <SelectItem value="meeting">Meeting</SelectItem>
                        <SelectItem value="office_hours">Office Hours</SelectItem>
                        <SelectItem value="deadline">Deadline</SelectItem>
                        <SelectItem value="event">Event</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newEvent.date}
                      onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startTime">Start Time</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={newEvent.startTime}
                        onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="endTime">End Time</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={newEvent.endTime}
                        onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="location">Location (Optional)</Label>
                    <Input
                      id="location"
                      value={newEvent.location}
                      onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                      placeholder="Room number or location"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                      placeholder="Add notes or details"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateEvent}>Create Event</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={() => navigateMonth(-1)}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <CardTitle>{monthName}</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => navigateMonth(1)}>
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, idx) => (
                  <div
                    key={idx}
                    className={`min-h-[100px] p-2 border rounded-lg ${
                      day.date ? 'bg-white hover:bg-gray-50 cursor-pointer' : 'bg-gray-50'
                    } ${day.isToday ? 'ring-2 ring-green-500' : ''}`}
                    onClick={() => day.date && setSelectedDate(day.date)}
                  >
                    {day.date && (
                      <>
                        <div className={`text-sm font-medium ${day.isToday ? 'text-green-600' : 'text-gray-700'}`}>
                          {day.date.getDate()}
                        </div>
                        <div className="mt-1 space-y-1">
                          {day.events.slice(0, 2).map((event) => (
                            <div
                              key={event.id}
                              className={`text-xs px-1 py-0.5 rounded truncate ${getEventTypeColor(event.type)}`}
                              title={event.title}
                            >
                              {event.startTime} {event.title}
                            </div>
                          ))}
                          {day.events.length > 2 && (
                            <div className="text-xs text-gray-500">
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
              <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded bg-blue-500" />
                  <span className="text-sm text-gray-600">Class</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded bg-purple-500" />
                  <span className="text-sm text-gray-600">Meeting</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded bg-green-500" />
                  <span className="text-sm text-gray-600">Office Hours</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded bg-red-500" />
                  <span className="text-sm text-gray-600">Deadline</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded bg-orange-500" />
                  <span className="text-sm text-gray-600">Event</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Today's Schedule */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Today's Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                {todayEvents.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No events scheduled for today</p>
                ) : (
                  <div className="space-y-3">
                    {todayEvents.map((event) => (
                      <div key={event.id} className={`p-3 rounded-lg ${getEventTypeColor(event.type)}`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{event.title}</h4>
                            <div className="flex items-center gap-2 text-sm mt-1">
                              <Clock className="h-3 w-3" />
                              {event.startTime} - {event.endTime}
                            </div>
                            {event.location && (
                              <div className="flex items-center gap-2 text-sm">
                                <MapPin className="h-3 w-3" />
                                {event.location}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Upcoming Deadlines</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {events
                    .filter(e => e.type === 'deadline' && new Date(e.date) >= new Date())
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .slice(0, 3)
                    .map((event) => (
                      <div key={event.id} className="flex items-center justify-between p-2 border rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{event.title}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(event.date).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteEvent(event.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
