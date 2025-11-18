import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar, Clock, MapPin, Users, Video, Bell,
  ChevronLeft, ChevronRight, Plus, Download
} from "lucide-react";

interface ScheduleEvent {
  id: string;
  title: string;
  course: string;
  type: 'class' | 'exam' | 'assignment-due' | 'event' | 'meeting';
  startTime: string;
  endTime: string;
  location: string;
  isOnline: boolean;
  color: string;
  teacher: string;
  description?: string;
}

interface DaySchedule {
  date: string;
  dayOfWeek: string;
  isToday: boolean;
  events: ScheduleEvent[];
}

const mockWeekSchedule: DaySchedule[] = [
  {
    date: '2024-01-15',
    dayOfWeek: 'Monday',
    isToday: true,
    events: [
      {
        id: '1',
        title: 'Advanced Mathematics',
        course: 'MATH 301',
        type: 'class',
        startTime: '09:00',
        endTime: '10:30',
        location: 'Room 204',
        isOnline: false,
        color: 'blue',
        teacher: 'Dr. Johnson'
      },
      {
        id: '2',
        title: 'Physics Lab',
        course: 'PHYS 201',
        type: 'class',
        startTime: '11:00',
        endTime: '13:00',
        location: 'Science Lab 3',
        isOnline: false,
        color: 'green',
        teacher: 'Prof. Anderson'
      },
      {
        id: '3',
        title: 'Literature Discussion',
        course: 'ENG 205',
        type: 'class',
        startTime: '14:00',
        endTime: '15:30',
        location: 'Online',
        isOnline: true,
        color: 'purple',
        teacher: 'Ms. Williams'
      },
      {
        id: '4',
        title: 'Calculus Problem Set Due',
        course: 'MATH 301',
        type: 'assignment-due',
        startTime: '23:59',
        endTime: '23:59',
        location: 'Online Submission',
        isOnline: true,
        color: 'orange',
        teacher: 'Dr. Johnson',
        description: 'Complete problems 1-20 from Chapter 5'
      }
    ]
  },
  {
    date: '2024-01-16',
    dayOfWeek: 'Tuesday',
    isToday: false,
    events: [
      {
        id: '5',
        title: 'Computer Science',
        course: 'CS 305',
        type: 'class',
        startTime: '10:00',
        endTime: '11:30',
        location: 'Computer Lab 1',
        isOnline: false,
        color: 'orange',
        teacher: 'Dr. Chen'
      },
      {
        id: '6',
        title: 'Chemistry',
        course: 'CHEM 202',
        type: 'class',
        startTime: '13:00',
        endTime: '14:30',
        location: 'Room 301',
        isOnline: false,
        color: 'red',
        teacher: 'Prof. Martinez'
      },
      {
        id: '7',
        title: 'Study Group: Physics',
        course: 'PHYS 201',
        type: 'meeting',
        startTime: '16:00',
        endTime: '17:30',
        location: 'Library Room B',
        isOnline: false,
        color: 'green',
        teacher: 'Student Group'
      }
    ]
  },
  {
    date: '2024-01-17',
    dayOfWeek: 'Wednesday',
    isToday: false,
    events: [
      {
        id: '8',
        title: 'Advanced Mathematics',
        course: 'MATH 301',
        type: 'class',
        startTime: '09:00',
        endTime: '10:30',
        location: 'Room 204',
        isOnline: false,
        color: 'blue',
        teacher: 'Dr. Johnson'
      },
      {
        id: '9',
        title: 'World History',
        course: 'HIST 210',
        type: 'class',
        startTime: '11:00',
        endTime: '12:30',
        location: 'Room 105',
        isOnline: false,
        color: 'yellow',
        teacher: 'Mr. Thompson'
      },
      {
        id: '10',
        title: 'Chemistry Midterm',
        course: 'CHEM 202',
        type: 'exam',
        startTime: '14:00',
        endTime: '16:00',
        location: 'Hall A',
        isOnline: false,
        color: 'red',
        teacher: 'Prof. Martinez',
        description: 'Covers chapters 1-5. Bring calculator.'
      }
    ]
  },
  {
    date: '2024-01-18',
    dayOfWeek: 'Thursday',
    isToday: false,
    events: [
      {
        id: '11',
        title: 'Computer Science',
        course: 'CS 305',
        type: 'class',
        startTime: '10:00',
        endTime: '11:30',
        location: 'Computer Lab 1',
        isOnline: false,
        color: 'orange',
        teacher: 'Dr. Chen'
      },
      {
        id: '12',
        title: 'Literature Workshop',
        course: 'ENG 205',
        type: 'class',
        startTime: '13:00',
        endTime: '14:30',
        location: 'Online',
        isOnline: true,
        color: 'purple',
        teacher: 'Ms. Williams'
      }
    ]
  },
  {
    date: '2024-01-19',
    dayOfWeek: 'Friday',
    isToday: false,
    events: [
      {
        id: '13',
        title: 'Physics Lab',
        course: 'PHYS 201',
        type: 'class',
        startTime: '11:00',
        endTime: '13:00',
        location: 'Science Lab 3',
        isOnline: false,
        color: 'green',
        teacher: 'Prof. Anderson'
      },
      {
        id: '14',
        title: 'World History',
        course: 'HIST 210',
        type: 'class',
        startTime: '14:00',
        endTime: '15:30',
        location: 'Room 105',
        isOnline: false,
        color: 'yellow',
        teacher: 'Mr. Thompson'
      },
      {
        id: '15',
        title: 'Programming Project Due',
        course: 'CS 305',
        type: 'assignment-due',
        startTime: '23:59',
        endTime: '23:59',
        location: 'Online Submission',
        isOnline: true,
        color: 'orange',
        teacher: 'Dr. Chen',
        description: 'Web application with authentication'
      }
    ]
  }
];

const typeConfig = {
  class: { label: 'Class', color: 'bg-blue-500', icon: Users },
  exam: { label: 'Exam', color: 'bg-red-500', icon: Bell },
  'assignment-due': { label: 'Due', color: 'bg-orange-500', icon: Clock },
  event: { label: 'Event', color: 'bg-purple-500', icon: Calendar },
  meeting: { label: 'Meeting', color: 'bg-green-500', icon: Users }
};

function EventCard({ event }: { event: ScheduleEvent }) {
  const config = typeConfig[event.type];
  const Icon = config.icon;
  
  return (
    <Card className={`border-l-4 border-${event.color}-500 hover:shadow-md transition-all duration-200`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge className={`${config.color} text-white`}>
                {config.label}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {event.course}
              </Badge>
            </div>
            <h3 className="font-semibold text-lg">{event.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{event.teacher}</p>
          </div>
          <Icon className={`h-5 w-5 text-${event.color}-600`} />
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Clock className="h-4 w-4" />
            <span>{event.startTime} - {event.endTime}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            {event.isOnline ? <Video className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
            <span>{event.location}</span>
          </div>
        </div>

        {event.description && (
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 border-t pt-2">
            {event.description}
          </p>
        )}

        {event.isOnline && (
          <Button size="sm" className="w-full mt-3 bg-eduverse-blue hover:bg-eduverse-blue/90">
            <Video className="h-4 w-4 mr-2" />
            Join Online
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function DayView({ day }: { day: DaySchedule }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold">{day.dayOfWeek}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{day.date}</p>
        </div>
        {day.isToday && (
          <Badge className="bg-eduverse-blue text-white">Today</Badge>
        )}
      </div>
      
      {day.events.length > 0 ? (
        <div className="space-y-4">
          {day.events
            .sort((a, b) => a.startTime.localeCompare(b.startTime))
            .map(event => (
              <EventCard key={event.id} event={event} />
            ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-600 dark:text-gray-400">No events scheduled</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function StudentSchedule() {
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);

  const stats = {
    totalClasses: mockWeekSchedule.reduce((sum, day) => 
      sum + day.events.filter(e => e.type === 'class').length, 0
    ),
    upcomingExams: mockWeekSchedule.reduce((sum, day) => 
      sum + day.events.filter(e => e.type === 'exam').length, 0
    ),
    assignmentsDue: mockWeekSchedule.reduce((sum, day) => 
      sum + day.events.filter(e => e.type === 'assignment-due').length, 0
    ),
    onlineClasses: mockWeekSchedule.reduce((sum, day) => 
      sum + day.events.filter(e => e.isOnline).length, 0
    )
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Schedule</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your classes, exams, and events
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button className="bg-eduverse-blue hover:bg-eduverse-blue/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Classes</p>
                  <p className="text-2xl font-bold">{stats.totalClasses}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                  <Bell className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Exams</p>
                  <p className="text-2xl font-bold">{stats.upcomingExams}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Due</p>
                  <p className="text-2xl font-bold">{stats.assignmentsDue}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <Video className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Online</p>
                  <p className="text-2xl font-bold">{stats.onlineClasses}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Week Navigation */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={() => setCurrentWeekOffset(currentWeekOffset - 1)}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous Week
              </Button>
              <h3 className="font-semibold">
                {currentWeekOffset === 0 ? 'This Week' : `Week ${currentWeekOffset > 0 ? '+' : ''}${currentWeekOffset}`}
              </h3>
              <Button variant="outline" size="sm" onClick={() => setCurrentWeekOffset(currentWeekOffset + 1)}>
                Next Week
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Schedule Views */}
        <Tabs defaultValue="week" className="space-y-4">
          <TabsList>
            <TabsTrigger value="week">Week View</TabsTrigger>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          </TabsList>

          <TabsContent value="week" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {mockWeekSchedule.map(day => (
                <DayView key={day.date} day={day} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="today" className="space-y-4">
            <div className="max-w-2xl">
              <DayView day={mockWeekSchedule.find(d => d.isToday) || mockWeekSchedule[0]} />
            </div>
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {mockWeekSchedule
                .flatMap(day => day.events)
                .filter(event => event.type === 'exam' || event.type === 'assignment-due')
                .sort((a, b) => a.startTime.localeCompare(b.startTime))
                .map(event => (
                  <EventCard key={event.id} event={event} />
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
