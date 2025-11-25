import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { 
  CalendarIcon, Clock, MapPin, Users, Search,
  Star, Calendar as CalendarLucide, Filter,
  Trophy, BookOpen, Coffee, Music, GraduationCap,
  ChevronRight, User, Settings
} from "lucide-react";
import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, isSameDay, parseISO, isAfter, isBefore } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Event } from "@shared/schema";

export default function Events() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [view, setView] = useState<"list" | "calendar">("list");
  const { toast } = useToast();

  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ['/api/events', { upcoming: 'true' }],
  });

  // Event registration mutation
  const registerMutation = useMutation({
    mutationFn: async (eventId: string) => {
      return apiRequest('POST', `/api/events/${eventId}/register`);
    },
    onSuccess: () => {
      toast({
        title: "Registration Successful",
        description: "You have been registered for this event!",
      });
      // Invalidate and refetch events to update UI
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
    },
    onError: (error) => {
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Failed to register for event",
        variant: "destructive",
      });
    },
  });

  // Event details handler
  const handleViewDetails = (eventId: string, eventTitle: string) => {
    // For now, show a toast with event details since we don't have a detail route yet
    // In the future, this could navigate to `/events/${eventId}`
    toast({
      title: `Event Details: ${eventTitle}`,
      description: `Viewing details for event ID: ${eventId}`,
    });
  };

  // Event registration handler
  const handleRegisterEvent = (eventId: string) => {
    // Ensure we're passing the correct string ID, not the object
    if (typeof eventId === 'string' && eventId.trim()) {
      registerMutation.mutate(eventId);
    } else {
      toast({
        title: "Registration Error", 
        description: "Invalid event ID provided",
        variant: "destructive",
      });
    }
  };

  const categories = [
    { id: "all", name: "All Events", icon: CalendarLucide, color: "bg-blue-500" },
    { id: "school", name: "School", icon: GraduationCap, color: "bg-green-500" },
    { id: "academic", name: "Academic", icon: BookOpen, color: "bg-purple-500" },
    { id: "sports", name: "Sports", icon: Trophy, color: "bg-yellow-500" },
    { id: "social", name: "Social", icon: Coffee, color: "bg-pink-500" },
    { id: "holiday", name: "Holiday", icon: Music, color: "bg-red-500" },
  ];

  const eventTypes = [
    { id: "general", name: "General", color: "bg-gray-500" },
    { id: "meeting", name: "Meeting", color: "bg-blue-500" },
    { id: "workshop", name: "Workshop", color: "bg-green-500" },
    { id: "competition", name: "Competition", color: "bg-yellow-500" },
    { id: "celebration", name: "Celebration", color: "bg-pink-500" },
  ];

  const filteredEvents = useMemo(() => {
    if (!events) return [];
    
    let filtered = events;
    
    if (selectedCategory !== "all") {
      filtered = filtered.filter(event => event.category === selectedCategory);
    }
    
    if (selectedDate && view === "calendar") {
      filtered = filtered.filter(event => 
        isSameDay(new Date(event.startDate), selectedDate)
      );
    }
    
    return filtered.sort((a, b) => {
      // Sort by featured status first, then by start date
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });
  }, [events, selectedCategory, selectedDate, view]);

  // Get events for calendar display
  const calendarEvents = useMemo(() => {
    if (!events || !selectedDate) return [];
    
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    
    return events.filter(event => {
      const eventDate = new Date(event.startDate);
      return isAfter(eventDate, monthStart) && isBefore(eventDate, monthEnd);
    });
  }, [events, selectedDate]);

  const getEventTypeColor = (eventType: string) => {
    return eventTypes.find(type => type.id === eventType)?.color || "bg-gray-500";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-eduverse-light via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-eduverse-blue mx-auto mb-4"></div>
          <p className="text-eduverse-gray">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* SEO Meta Tags */}
      <title>EduVerse Live Events - Educational Events & Workshops Calendar</title>
      <meta name="description" content="Join educational events, workshops, and activities at EduVerse. Discover upcoming learning opportunities in our vibrant community calendar." />
      
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50">
        {/* Indigo/Blue Theme Header */}
        <header className="bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 text-white shadow-xl" data-testid="events-header">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-6">
              <span className="text-6xl animate-bounce">📅</span>
              <h1 className="text-5xl font-bold">
                Live Events Calendar
              </h1>
            </div>
            <p className="text-indigo-100 max-w-2xl mx-auto text-xl">
              Discover upcoming events, workshops, and activities in our vibrant educational community.
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* View Toggle */}
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              <Button
                variant={view === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setView("list")}
                className="rounded-none"
                data-testid="button-list-view"
              >
                <Filter className="h-4 w-4 mr-2" />
                List View
              </Button>
              <Button
                variant={view === "calendar" ? "default" : "ghost"}
                size="sm"
                onClick={() => setView("calendar")}
                className="rounded-none"
                data-testid="button-calendar-view"
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                Calendar View
              </Button>
            </div>
            
            {/* Category Filters */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className={`${
                      selectedCategory === category.id 
                        ? `${category.color} text-white` 
                        : 'border-gray-300'
                    }`}
                    data-testid={`filter-${category.id}`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {category.name}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </header>
      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {view === "calendar" ? (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Calendar */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    Events Calendar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border w-full"
                    modifiers={{
                      eventDay: calendarEvents.map(event => new Date(event.startDate))
                    }}
                    modifiersStyles={{
                      eventDay: { backgroundColor: 'var(--eduverse-blue)', color: 'white' }
                    }}
                    data-testid="calendar-widget"
                  />
                  
                  <div className="mt-4 text-sm text-gray-600">
                    <p className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-eduverse-blue"></div>
                      Days with events
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Selected Day Events */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {selectedDate ? format(selectedDate, "EEEE, MMMM d") : "Select a Date"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {filteredEvents.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      No events scheduled for this day
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {filteredEvents.slice(0, 3).map((event) => (
                        <div 
                          key={event.id}
                          className="p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                          data-testid={`calendar-event-${event.id}`}
                        >
                          <h4 className="font-semibold text-sm text-gray-900 mb-1">
                            {event.title}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Clock className="h-3 w-3" />
                            {format(new Date(event.startDate), "h:mm a")}
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                              <MapPin className="h-3 w-3" />
                              {event.location}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          /* List View */
          (<div className="space-y-6">
            {filteredEvents?.length === 0 ? (
              <div className="text-center py-12">
                <CalendarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Events Found</h3>
                <p className="text-gray-500">
                  No upcoming events available for this category
                </p>
              </div>
            ) : (
              filteredEvents?.map((event) => (
                <Card 
                  key={event.id}
                  className={`hover:shadow-lg transition-shadow ${
                    event.isFeatured ? 'border-yellow-300 bg-yellow-50' : ''
                  }`}
                  data-testid={`event-${event.id}`}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {event.isFeatured && (
                            <Badge className="bg-yellow-500 text-white">
                              <Star className="h-3 w-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                          <Badge 
                            variant="secondary"
                            className={`${
                              categories.find(cat => cat.id === event.category)?.color || 'bg-gray-500'
                            } text-white`}
                          >
                            {categories.find(cat => cat.id === event.category)?.name || event.category}
                          </Badge>
                          <Badge 
                            variant="outline"
                            className={`${getEventTypeColor(event.eventType)} text-white border-0`}
                          >
                            {eventTypes.find(type => type.id === event.eventType)?.name || event.eventType}
                          </Badge>
                        </div>
                        
                        <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                          {event.title}
                        </CardTitle>
                        
                        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4" />
                            {format(new Date(event.startDate), "MMM dd, yyyy")}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {format(new Date(event.startDate), "h:mm a")} - {format(new Date(event.endDate), "h:mm a")}
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              {event.location}
                            </div>
                          )}
                          {event.maxAttendees && (
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              Max {event.maxAttendees} attendees
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {event.description && (
                      <p className="text-gray-700 mb-4 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          Event Organizer
                        </div>
                        {event.registrationRequired && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Registration Required
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        {event.registrationRequired && (
                          <Button 
                            size="sm"
                            className="bg-eduverse-blue hover:bg-eduverse-blue/90"
                            onClick={() => handleRegisterEvent(event.id)}
                            disabled={registerMutation.isPending}
                            data-testid={`button-register-${event.id}`}
                          >
                            {registerMutation.isPending ? "Registering..." : "Register Now"}
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-eduverse-blue hover:text-eduverse-blue hover:bg-eduverse-light"
                          onClick={() => handleViewDetails(event.id, event.title)}
                          data-testid={`button-details-${event.id}`}
                        >
                          View Details
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>)
        )}
      </main>
    </div>
    </>
  );
}