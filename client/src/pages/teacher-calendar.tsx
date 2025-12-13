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
import { apiEndpoint } from "@/lib/config";
import { 
  Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight,
  Clock, MapPin, Users, BookOpen, Trash2, Edit, Loader2
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
  type: 'class' | 'meeting' | 'holiday' | 'exam' | 'announcement';
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

  // Edit event state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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
        apiEndpoint(`/api/schedule/me?startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`),
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
            type: e.eventType || 'class',
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
      
      const response = await fetch(apiEndpoint('/api/schedule/event'), {
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

  const handleDeleteEvent = async (eventId: number) => {
    setIsDeleting(eventId);
    try {
      const response = await fetch(apiEndpoint(`/api/schedule/event/${eventId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        setEvents(events.filter(e => e.id !== eventId));
        toast({ title: "Success", description: "Event deleted successfully" });
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast({ 
          title: "Error", 
          description: errorData.error || "Failed to delete event",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error - could not delete event",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const openEditDialog = (event: CalendarEvent) => {
    setEditingEvent(event);
    setEditDialogOpen(true);
  };

  const handleEditEvent = async () => {
    if (!editingEvent) return;

    setIsSaving(true);
    try {
      const startDateTime = new Date(`${editingEvent.date}T${editingEvent.startTime}:00`);
      const endDateTime = new Date(`${editingEvent.date}T${editingEvent.endTime}:00`);

      const response = await fetch(apiEndpoint(`/api/schedule/event/${editingEvent.id}`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          title: editingEvent.title,
          description: editingEvent.description,
          eventType: editingEvent.type,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          location: editingEvent.location
        })
      });

      if (response.ok) {
        setEvents(events.map(e => 
          e.id === editingEvent.id ? editingEvent : e
        ));
        toast({ title: "Success", description: "Event updated successfully" });
        setEditDialogOpen(false);
        setEditingEvent(null);
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast({ 
          title: "Error", 
          description: errorData.error || "Failed to update event",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error - could not update event",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'class': return 'bg-blue-500/20 text-blue-400 border-l-4 border-l-blue-500';
      case 'meeting': return 'bg-purple-500/20 text-purple-400 border-l-4 border-l-purple-500';
      case 'exam': return 'bg-red-500/20 text-red-400 border-l-4 border-l-red-500';
      case 'announcement': return 'bg-yellow-500/20 text-yellow-400 border-l-4 border-l-yellow-500';
      case 'holiday': return 'bg-green-500/20 text-green-400 border-l-4 border-l-green-500';
      case 'event': return 'bg-orange-500/20 text-orange-400 border-l-4 border-l-orange-500';
      default: return 'bg-slate-700/50 text-slate-400 border-l-4 border-l-slate-500';
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6" style={{ background: '#0a0f1a', minHeight: '100vh', padding: '1.5rem', margin: '-1.5rem' }}>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">My Calendar</h1>
            <p className="text-slate-400">Manage your classes, meetings, and events</p>
          </div>
          <div className="flex gap-3">
            <Select value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
              <SelectTrigger className="w-32 bg-slate-800/50 border-slate-700/50 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="month" className="text-white hover:bg-slate-700">Month</SelectItem>
                <SelectItem value="week" className="text-white hover:bg-slate-700">Week</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-yellow-500 hover:bg-yellow-400 text-slate-900">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Event
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-slate-800 border-slate-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Create Event</DialogTitle>
                  <DialogDescription className="text-slate-400">Add a new event to your calendar.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="title" className="text-slate-300">Event Title</Label>
                    <Input
                      id="title"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                      placeholder="Enter event title"
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="type" className="text-slate-300">Event Type</Label>
                    <Select value={newEvent.type} onValueChange={(v) => setNewEvent({ ...newEvent, type: v })}>
                      <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="class" className="text-white hover:bg-slate-700">Class</SelectItem>
                        <SelectItem value="meeting" className="text-white hover:bg-slate-700">Meeting</SelectItem>
                        <SelectItem value="exam" className="text-white hover:bg-slate-700">Exam</SelectItem>
                        <SelectItem value="announcement" className="text-white hover:bg-slate-700">Announcement</SelectItem>
                        <SelectItem value="holiday" className="text-white hover:bg-slate-700">Holiday</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="date" className="text-slate-300">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newEvent.date}
                      onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                      className="bg-slate-700/50 border-slate-600 text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startTime" className="text-slate-300">Start Time</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={newEvent.startTime}
                        onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                        className="bg-slate-700/50 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="endTime" className="text-slate-300">End Time</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={newEvent.endTime}
                        onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                        className="bg-slate-700/50 border-slate-600 text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="location" className="text-slate-300">Location (Optional)</Label>
                    <Input
                      id="location"
                      value={newEvent.location}
                      onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                      placeholder="Room number or location"
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description" className="text-slate-300">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                      placeholder="Add notes or details"
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)} className="border-slate-600 text-slate-300 hover:bg-slate-700">
                    Cancel
                  </Button>
                  <Button onClick={handleCreateEvent} className="bg-yellow-500 hover:bg-yellow-400 text-slate-900">Create Event</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar */}
          <Card className="lg:col-span-3 bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={() => navigateMonth(-1)} className="text-slate-300 hover:bg-slate-700/50 hover:text-white">
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <CardTitle className="text-white">{monthName}</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => navigateMonth(1)} className="text-slate-300 hover:bg-slate-700/50 hover:text-white">
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-sm font-medium text-slate-500 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, idx) => (
                  <div
                    key={idx}
                    className={`min-h-[100px] p-2 border border-slate-700/50 rounded-lg ${
                      day.date ? (day.events.length > 0 ? 'bg-blue-500/20 hover:bg-blue-500/30' : 'bg-slate-800/30 hover:bg-slate-700/50') + ' cursor-pointer' : 'bg-slate-900/30'
                    } ${day.isToday ? 'ring-2 ring-yellow-500' : ''}`}
                    onClick={() => day.date && setSelectedDate(day.date)}
                  >
                    {day.date && (
                      <>
                        <div className={`text-sm font-medium ${day.isToday ? 'bg-yellow-500 text-slate-900 w-6 h-6 rounded-full flex items-center justify-center' : day.events.length > 0 ? 'text-blue-400' : 'text-slate-300'}`}>
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
                            <div className="text-xs text-slate-500">
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
              <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-slate-700/50">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded bg-blue-500" />
                  <span className="text-sm text-slate-400">Class</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded bg-purple-500" />
                  <span className="text-sm text-slate-400">Meeting</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded bg-green-500" />
                  <span className="text-sm text-slate-400">Office Hours</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded bg-red-500" />
                  <span className="text-sm text-slate-400">Deadline</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded bg-orange-500" />
                  <span className="text-sm text-slate-400">Event</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Today's Schedule */}
          <div className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-lg text-white">Today's Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                {todayEvents.length === 0 ? (
                  <p className="text-slate-500 text-center py-4">No events scheduled for today</p>
                ) : (
                  <div className="space-y-3">
                    {todayEvents.map((event) => (
                      <div key={event.id} className={`p-3 rounded-lg ${getEventTypeColor(event.type)}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-white">{event.title}</h4>
                            <div className="flex items-center gap-2 text-sm mt-1 text-slate-300">
                              <Clock className="h-3 w-3" />
                              {event.startTime} - {event.endTime}
                            </div>
                            {event.location && (
                              <div className="flex items-center gap-2 text-sm text-slate-300">
                                <MapPin className="h-3 w-3" />
                                {event.location}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(event)}
                              className="h-8 w-8 hover:bg-slate-700/50"
                            >
                              <Edit className="h-4 w-4 text-blue-400" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteEvent(event.id)}
                              disabled={isDeleting === event.id}
                              className="h-8 w-8 hover:bg-slate-700/50"
                            >
                              {isDeleting === event.id ? (
                                <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
                              ) : (
                                <Trash2 className="h-4 w-4 text-red-400" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-lg text-white">Upcoming Exams</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {events
                    .filter(e => e.type === 'exam' && new Date(e.date) >= new Date())
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .slice(0, 3)
                    .map((event) => (
                      <div key={event.id} className="flex items-center justify-between p-2 border border-slate-700/50 rounded-lg bg-slate-700/30">
                        <div>
                          <p className="font-medium text-sm text-white">{event.title}</p>
                          <p className="text-xs text-slate-500">
                            {new Date(event.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(event)}
                            className="h-8 w-8 hover:bg-slate-700/50"
                          >
                            <Edit className="h-4 w-4 text-blue-400" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteEvent(event.id)}
                            disabled={isDeleting === event.id}
                            className="h-8 w-8 hover:bg-slate-700/50"
                          >
                            {isDeleting === event.id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-red-400" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit Event Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Event</DialogTitle>
            <DialogDescription className="text-slate-400">Update the event details</DialogDescription>
          </DialogHeader>
          {editingEvent && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title" className="text-slate-300">Title</Label>
                <Input
                  id="edit-title"
                  value={editingEvent.title}
                  onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                  placeholder="Event title"
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description" className="text-slate-300">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingEvent.description || ''}
                  onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                  placeholder="Event description"
                  rows={2}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-type" className="text-slate-300">Event Type</Label>
                <Select
                  value={editingEvent.type}
                  onValueChange={(value: any) => setEditingEvent({ ...editingEvent, type: value })}
                >
                  <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="class" className="text-white hover:bg-slate-700">Class</SelectItem>
                    <SelectItem value="meeting" className="text-white hover:bg-slate-700">Meeting</SelectItem>
                    <SelectItem value="exam" className="text-white hover:bg-slate-700">Exam</SelectItem>
                    <SelectItem value="announcement" className="text-white hover:bg-slate-700">Announcement</SelectItem>
                    <SelectItem value="holiday" className="text-white hover:bg-slate-700">Holiday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-date" className="text-slate-300">Date</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={editingEvent.date}
                  onChange={(e) => setEditingEvent({ ...editingEvent, date: e.target.value })}
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-start" className="text-slate-300">Start Time</Label>
                  <Input
                    id="edit-start"
                    type="time"
                    value={editingEvent.startTime}
                    onChange={(e) => setEditingEvent({ ...editingEvent, startTime: e.target.value })}
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-end" className="text-slate-300">End Time</Label>
                  <Input
                    id="edit-end"
                    type="time"
                    value={editingEvent.endTime}
                    onChange={(e) => setEditingEvent({ ...editingEvent, endTime: e.target.value })}
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-location" className="text-slate-300">Location</Label>
                <Input
                  id="edit-location"
                  value={editingEvent.location || ''}
                  onChange={(e) => setEditingEvent({ ...editingEvent, location: e.target.value })}
                  placeholder="Room or location"
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="border-slate-600 text-slate-300 hover:bg-slate-700">
                  Cancel
                </Button>
                <Button onClick={handleEditEvent} disabled={isSaving} className="bg-yellow-500 hover:bg-yellow-400 text-slate-900">
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
