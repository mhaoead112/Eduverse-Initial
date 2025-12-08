# EduVerse - Comprehensive Code Audit Report

**Date:** December 4, 2025  
**Auditor:** Code Quality Assessment  
**Project Type:** Learning Management System (LMS)  
**Tech Stack:** Node.js/Express, React, PostgreSQL (Drizzle ORM), WebSocket, TanStack Query

---

## 1. Architecture Overview

### 1.1 Overall System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (React + Vite)                     │
│  ┌─────────┐  ┌──────────┐  ┌─────────┐  ┌─────────────────┐   │
│  │ Pages   │  │Components│  │  Hooks  │  │ TanStack Query  │   │
│  │ (70+)   │  │  (60+)   │  │   (6)   │  │  (Data Cache)   │   │
│  └────┬────┘  └────┬─────┘  └────┬────┘  └────────┬────────┘   │
│       └────────────┼─────────────┴─────────────────┘            │
│                    │                                             │
└────────────────────┼─────────────────────────────────────────────┘
                     │ HTTP/WS (Port 3001)
┌────────────────────┼─────────────────────────────────────────────┐
│                    ▼         SERVER (Express.js)                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                      API Routes (23 files)                    │ │
│  │  auth, courses, lessons, assignments, users, admin, parent   │ │
│  │  study-groups, conversations, notifications, events...       │ │
│  └─────────────────────────┬───────────────────────────────────┘ │
│                            │                                      │
│  ┌─────────────────────────▼───────────────────────────────────┐ │
│  │                   Services Layer (14 files)                   │ │
│  │  auth, course, lesson, assignment, user, admin, parent...    │ │
│  └─────────────────────────┬───────────────────────────────────┘ │
│                            │                                      │
│  ┌────────────────┐  ┌─────▼──────┐  ┌─────────────────────────┐ │
│  │  Auth (JWT)    │  │ Drizzle DB │  │  WebSocket (ws)        │ │
│  │  Middleware    │  │   Layer    │  │  Real-time Chat        │ │
│  └────────────────┘  └─────┬──────┘  └─────────────────────────┘ │
└────────────────────────────┼─────────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│                     DATABASE (PostgreSQL)                         │
│  ┌───────────────┐ ┌───────────────┐ ┌────────────────────────┐  │
│  │ Core Tables   │ │ Messaging     │ │ Academic               │  │
│  │ - users       │ │ - messages    │ │ - courses, lessons     │  │
│  │ - enrollments │ │ - studyGroups │ │ - assignments, grades  │  │
│  │ - events      │ │ - blockedUsers│ │ - submissions          │  │
│  └───────────────┘ └───────────────┘ └────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### 1.2 Directory Structure

```
Eduverse-Initial/
├── client/                     # React Frontend (Vite)
│   └── src/
│       ├── components/         # Reusable UI components (60+)
│       │   ├── ui/             # shadcn/ui primitives (46)
│       │   ├── group-chat/     # Chat-specific components
│       │   └── modals/         # Modal dialogs
│       ├── pages/              # Page components (70+)
│       ├── hooks/              # Custom React hooks (6)
│       └── lib/                # Utilities, API client
├── server/                     # Express Backend
│   ├── src/
│   │   ├── api/                # Route handlers (23 files)
│   │   ├── services/           # Business logic (14 files)
│   │   ├── db/                 # Database connection & schema
│   │   └── middleware/         # Auth, error handling
│   ├── routes.ts               # Legacy routes (2353 lines)
│   └── storage.ts              # Legacy storage layer
├── shared/                     # Shared types & schema
│   └── schema.ts               # Drizzle schema + Zod validation
├── migrations/                 # SQL migrations
└── uploads/                    # User-uploaded files
```

### 1.3 Technology Stack Summary

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, wouter (routing), TanStack Query |
| UI | Tailwind CSS, shadcn/ui, Radix UI primitives |
| Backend | Express.js, Node.js |
| Database | PostgreSQL with Drizzle ORM |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Real-time | WebSocket (ws library) |
| Validation | Zod |
| AI | OpenAI API (Study Buddy feature) |

---

## 2. API/Frontend Map

### 2.1 Authentication Flow

| Frontend Action | API Endpoint | Backend Handler |
|-----------------|--------------|-----------------|
| Login Form | `POST /api/auth/login` | `auth.routes.ts → auth.service.ts` |
| Registration | `POST /api/auth/register` | Creates student account + JWT |
| Logout | `POST /api/auth/logout` | Clears auth cookie |
| Get Current User | `GET /api/auth/me` | Returns user from JWT |

### 2.2 Student Features

| Page | Route | API Endpoints | Status |
|------|-------|---------------|--------|
| Dashboard | `/student` | `/api/courses`, `/api/enrollments` | ✅ Works |
| Courses | `/student/courses` | `/api/courses`, `/api/enrollments` | ✅ Works |
| Lessons | `/student/courses/:id/lessons` | `/api/lessons/:courseId` | ✅ Works |
| Assignments | `/student/assignments` | `/api/assignments` | ✅ Works |
| Grades | `/student/grades` | `/api/grades/student/:id` | ⚠️ Mock data fallback |
| Schedule | `/student/schedule` | Missing endpoint | ❌ **100% Mock Data** |
| Calendar | `/student/calendar` | `/api/events` | ⚠️ Demo fallback |
| Report Cards | `/student/report-cards` | `/api/report-cards` | ✅ Works |
| AI Buddy | `/student/ai-buddy` | `/api/ai/chat` | ✅ Works |
| Messages | `/student/messages` | `/api/conversations` | ✅ Works |

### 2.3 Teacher Features

| Page | Route | API Endpoints | Status |
|------|-------|---------------|--------|
| Dashboard | `/teacher` | `/api/analytics/teacher` | ⚠️ Mock data fallback |
| Courses | `/teacher/courses` | `/api/courses` | ✅ Works |
| Create Course | `/teacher/courses/create` | `POST /api/courses` | ✅ Works |
| Manage Course | `/teacher/courses/:id` | `/api/courses/:id` | ✅ Works |
| Assignments | `/teacher/assignments` | `/api/assignments` | ✅ Works |
| Submissions | `/teacher/assignments/:id/submissions` | `/api/submissions` | ✅ Works |
| Students | `/teacher/students` | `/api/users?role=student` | ⚠️ Needs work |
| Calendar | `/teacher/calendar` | `/api/events` | ⚠️ Demo events |
| Report Cards | `/teacher/report-cards` | `/api/report-cards` | ✅ Works |
| Analytics | `/teacher/analytics` | `/api/analytics/teacher` | ⚠️ Mock data |

### 2.4 Admin Features

| Page | Route | API Endpoints | Status |
|------|-------|---------------|--------|
| Dashboard | `/admin` | `/api/admin/stats` | ⚠️ Partial mock |
| Users | `/admin/users` | `/api/admin/users` | ⚠️ Demo fallback |
| Analytics | `/admin/analytics` | `/api/admin/analytics` | ❌ Mock data |
| Reports | `/admin/reports` | Missing endpoint | ❌ **Mock data** |
| Settings | `/admin/settings` | Missing endpoint | ❌ **TODO: Implement** |
| Calendar | `/admin/calendar` | `/api/events` | ⚠️ Demo fallback |
| Messages | `/admin/messages` | Missing endpoint | ❌ **Demo data** |

### 2.5 Parent Features

| Page | Route | API Endpoints | Status |
|------|-------|---------------|--------|
| Dashboard | `/parent` | `/api/parent/children` | ⚠️ Demo fallback |
| Children | `/parent/children` | `/api/parent/children` | ✅ Works |
| Grades | `/parent/grades` | `/api/parent/children/:id/grades` | ✅ Works |
| Attendance | `/parent/attendance` | `/api/parent/children/:id/attendance` | ✅ Works |
| Messages | `/parent/messages` | `/api/parent/messages/:id` | ⚠️ TODO in service |
| Calendar | `/parent/calendar` | Missing page | ❌ **Page doesn't exist** |

---

## 3. Business Logic & Project Overview

### 3.1 Intended Functionality

EduVerse is a comprehensive Learning Management System designed for K-12/higher education with the following core features:

**User Roles:**
- **Students**: Enroll in courses, view lessons, submit assignments, track progress
- **Teachers**: Create courses, upload content, grade submissions, communicate with students
- **Administrators**: Manage users, view analytics, system settings
- **Parents**: Monitor children's progress, communicate with teachers

**Core Features:**
1. **Course Management**: Create, publish, enroll in courses
2. **Content Delivery**: Upload lessons (PDF, video, documents)
3. **Assignments & Grading**: Create assignments, submit work, grade with feedback
4. **Real-time Messaging**: Study groups with WebSocket-based chat
5. **AI Study Buddy**: OpenAI-powered tutoring assistant
6. **Calendar/Events**: School events, class schedules
7. **Report Cards**: PDF report card storage and viewing
8. **Analytics**: Progress tracking, study streaks

### 3.2 Data Models & Relationships

```
users ──────┬──────────────────────────────────────────────────────┐
            │                                                       │
            ├─────< courses (teacherId) ────< lessons               │
            │                                                       │
            ├─────< enrollments >───── courses                      │
            │                                                       │
            ├─────< submissions >───── assignments                  │
            │                                                       │
            ├─────< grades (gradedBy)                               │
            │                                                       │
            ├─────< studyGroups (createdBy) ────< groupMembers >────┤
            │                                                       │
            ├─────< messages (senderId) ────< conversations         │
            │                                                       │
            ├─────< parentChildren (parentId) ────< users (childId) │
            │                                                       │
            └─────< attendance, events, notifications               │
```

---

## 4. Missing or Stubbed Features

### 4.1 Critical Missing Backend Endpoints

| Feature | Missing Endpoint | Required For |
|---------|-----------------|--------------|
| Student Schedule | `GET /api/schedule/:studentId` | `student-schedule.tsx` |
| Admin Settings | `GET/POST /api/admin/settings` | `admin-settings.tsx` |
| Admin Reports | `GET /api/admin/reports` | `admin-reports.tsx` |
| Admin Messages | `GET/POST /api/admin/messages` | `admin-messages.tsx` |
| Parent Calendar | N/A (page missing) | Parent dashboard button |
| Teacher Profile Edit | `PUT /api/users/:id/profile` | `teacher-profile.tsx` |

### 4.2 Pages Using 100% Mock Data

| Page | File | Issue |
|------|------|-------|
| Student Schedule | `student-schedule.tsx` | Uses `mockWeekSchedule` array |
| Student Grades | `student-grades.tsx` | Uses `mockGrades` array |
| Teacher Calendar | `teacher-calendar.tsx` | Uses `mockEvents` array |
| Admin Analytics | `admin-analytics.tsx` | Uses `mockData` throughout |
| Admin Reports | `admin-reports.tsx` | Uses `mockData` for reports |

### 4.3 Incomplete Service Implementations

```typescript
// server/src/services/parent.service.ts - Lines 218-227
export async function getParentTeacherMessages(parentId: string, teacherId: string) {
  // For now, return empty array
  // TODO: Implement parent-teacher messaging table
  return [];
}

export async function sendParentTeacherMessage(parentId: string, teacherId: string, content: string) {
  // For now, return success
  // TODO: Implement parent-teacher messaging
  return { id: createId(), senderId: parentId, ... };
}
```

### 4.4 Missing Database Tables

Based on service implementations that reference tables not in schema:

| Table | Referenced In | Status |
|-------|---------------|--------|
| `parent_teacher_messages` | parent.service.ts | ❌ Missing |
| `student_schedule` | Needed for schedule API | ❌ Missing |
| `system_settings` | Needed for admin settings | ❌ Missing |

### 4.5 Missing Page

The parent dashboard has a button to `/parent/calendar` but the page doesn't exist:
```tsx
// parent-dashboard.tsx line 142
<Button onClick={() => setLocation('/parent/calendar')}>
  <Calendar className="h-4 w-4 mr-2" />
  SchooCalendar
</
```

---

## 5. Non-Functional UI Elements

### 5.1 Placeholder Buttons

| Page | Button | Current Behavior | Should Do |
|------|--------|------------------|-----------|
| `student-schedule.tsx` | "Export" | No action | Export schedule as PDF/iCal |
| `student-schedule.tsx` | "Add Event" | No action | Open add event modal |
| `admin-reports.tsx` | "Export Report" | `// TODO` | Generate PDF/CSV report |
| `admin-settings.tsx` | "Save Settings" | `// TODO` | Save to backend |
| `teacher-analytics.tsx` | "Export Data" | Mock function | Real export |

### 5.2 Search/Filter Inputs Not Connected

| Page | Element | Issue |
|------|---------|-------|
| `DashboardLayout` | Global Search | Input exists but not functional |
| `admin-users.tsx` | Search filter | Local filter only, no API search |
| `teacher-students.tsx` | Student search | No implementation |

### 5.3 Navigation Links to Incomplete Pages

| From | Link | Target Status |
|------|------|---------------|
| Parent Dashboard | Calendar | Page missing |
| Admin Dashboard | View All Reports | Uses mock data |
| Teacher Dashboard | View Analytics | Uses mock data |

---

## 6. Mock Data Locations & Replacement Plan

### 6.1 Files with Mock Data

| File | Mock Variable | Lines | Backend API Needed |
|------|---------------|-------|-------------------|
| `mockStaff.ts` | `mockStaff` | All | `GET /api/staff` |
| `student-schedule.tsx` | `mockWeekSchedule` | 33-160 | `GET /api/schedule` |
| `student-grades.tsx` | `mockGrades` | 44-100 | Already has `GET /api/grades/student/:id` |
| `teacher-calendar.tsx` | `mockEvents` | 76-165 | Already has `GET /api/events` |
| `parent-dashboard.tsx` | Inline demo data | 68-90 | `GET /api/parent/children` works |
| `parent-grades.tsx` | Demo fallback | 73-95 | API exists but not called correctly |
| `parent-attendance.tsx` | Generated demo | 77-106 | API exists |
| `admin-analytics.tsx` | `mockData` | 45-175 | Need `GET /api/admin/analytics` |
| `admin-reports.tsx` | `mockData` | 126-845 | Need `GET /api/admin/reports` |

### 6.2 Backend Implementation Required

**New Endpoints to Create:**

```typescript
// 1. Student Schedule API
GET /api/schedule/:studentId
Returns: { schedule: ScheduleEvent[] }

// 2. Admin Analytics API
GET /api/admin/analytics
Returns: { 
  userGrowth: [], 
  courseStats: [], 
  engagementMetrics: [] 
}

// 3. Admin Reports API
GET /api/admin/reports
Returns: { 
  reports: Report[], 
  generated: Date 
}

// 4. Admin Settings API
GET /api/admin/settings
PUT /api/admin/settings
Returns/Accepts: { settings: SystemSettings }
```

---

## 7. UI/UX Review

### 7.1 Layout Issues

| Issue | Location | Severity | Recommendation |
|-------|----------|----------|----------------|
| Inconsistent card spacing | Various pages | Low | Standardize gap-4/gap-6 |
| Mobile responsiveness | Dashboard layouts | Medium | Add responsive breakpoints |
| Loading states | Many pages | Medium | Use skeleton loaders consistently |
| Empty states | Lists/tables | Medium | Add "no data" illustrations |

### 7.2 Navigation Improvements Needed

| Issue | Current | Recommendation |
|-------|---------|----------------|
| Breadcrumbs | Missing in most pages | Add breadcrumb trail |
| Back navigation | Inconsistent | Add back button consistently |
| Active route highlighting | Works | ✅ Good |
| Mobile menu | Works | ✅ Good |

### 7.3 Data Flow Issues

| Issue | Impact | Fix |
|-------|--------|-----|
| No optimistic updates | Slow perceived performance | Add TanStack Query mutations with optimistic update |
| No error recovery | Users stuck on error | Add retry buttons and error boundaries |
| No offline handling | App breaks offline | Add service worker / offline mode |
| Missing loading indicators | Users confused | Add skeleton loaders |

### 7.4 Validation & Error Handling

| Issue | Location | Fix |
|-------|----------|-----|
| Client-side validation missing | Form inputs | Use react-hook-form + Zod |
| Generic error messages | API calls | Show specific error messages |
| No form auto-save | Long forms | Add draft saving |
| Missing confirmation dialogs | Delete actions | Add confirmation modals |

### 7.5 User Feedback Improvements

| Action | Current Feedback | Should Have |
|--------|-----------------|-------------|
| Form submission | Toast only | Toast + redirect + success state |
| File upload | Progress bar exists | Add upload preview |
| Delete item | Immediate | Confirmation + undo option |
| API errors | Generic toast | Specific error + retry button |

---

## 8. Prioritized Fixes & Additions

### 8.1 Priority 1: CRITICAL (Production Blockers)

| # | Issue | Type | Effort |
|---|-------|------|--------|
| 1 | Student Schedule has no API | Backend | 4 hours |
| 2 | Admin Settings has no API | Backend | 3 hours |
| 3 | Parent Calendar page missing | Frontend | 2 hours |
| 4 | Remove console.log statements | Cleanup | 1 hour |
| 5 | Consolidate duplicate server entry points | Backend | 2 hours |

### 8.2 Priority 2: HIGH (Core Functionality)

| # | Issue | Type | Effort |
|---|-------|------|--------|
| 6 | Replace mock data in student-grades | Frontend | 2 hours |
| 7 | Replace mock data in teacher-calendar | Frontend | 2 hours |
| 8 | Add admin analytics API | Backend | 4 hours |
| 9 | Add admin reports API | Backend | 4 hours |
| 10 | Parent-teacher messaging service | Backend | 3 hours |
| 11 | Export functionality for reports | Both | 3 hours |

### 8.3 Priority 3: MEDIUM (UX Improvements)

| # | Issue | Type | Effort |
|---|-------|------|--------|
| 12 | Add global search functionality | Both | 4 hours |
| 13 | Add breadcrumb navigation | Frontend | 2 hours |
| 14 | Improve error handling/messages | Both | 3 hours |
| 15 | Add skeleton loaders | Frontend | 2 hours |
| 16 | Add empty state components | Frontend | 2 hours |
| 17 | Add confirmation dialogs | Frontend | 2 hours |

### 8.4 Priority 4: LOW (Polish)

| # | Issue | Type | Effort |
|---|-------|------|--------|
| 18 | Remove backup files (*-old-backup.tsx) | Cleanup | 0.5 hours |
| 19 | Consistent spacing/styling | Frontend | 2 hours |
| 20 | Add unit tests for services | Testing | 8 hours |
| 21 | Add API integration tests | Testing | 8 hours |

---

## 9. Example Code Snippets

### 9.1 Student Schedule API (Backend)

```typescript
// server/src/api/schedule.routes.ts
import express from 'express';
import { db } from '../db/index.js';
import { events, enrollments, courses } from '../db/schema.js';
import { eq, and, gte, lte } from 'drizzle-orm';
import { isAuthenticated } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/:studentId', isAuthenticated, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;
    
    // Get student's enrolled courses
    const studentEnrollments = await db
      .select({ courseId: enrollments.courseId })
      .from(enrollments)
      .where(eq(enrollments.studentId, studentId));
    
    const courseIds = studentEnrollments.map(e => e.courseId);
    
    if (courseIds.length === 0) {
      return res.json({ schedule: [] });
    }
    
    // Get events for those courses
    const scheduleEvents = await db
      .select({
        id: events.id,
        title: events.title,
        description: events.description,
        eventType: events.eventType,
        startTime: events.startTime,
        endTime: events.endTime,
        location: events.location,
        courseId: events.courseId,
        courseName: courses.title
      })
      .from(events)
      .leftJoin(courses, eq(events.courseId, courses.id))
      .where(
        and(
          inArray(events.courseId, courseIds),
          startDate ? gte(events.startTime, new Date(startDate as string)) : undefined,
          endDate ? lte(events.endTime, new Date(endDate as string)) : undefined
        )
      );
    
    res.json({ schedule: scheduleEvents });
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ error: 'Failed to fetch schedule' });
  }
});

export default router;
```

### 9.2 Replace Mock Data in student-schedule.tsx

```typescript
// client/src/pages/student-schedule.tsx
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

interface ScheduleEvent {
  id: string;
  title: string;
  courseName: string;
  eventType: string;
  startTime: string;
  endTime: string;
  location: string;
}

export default function StudentSchedule() {
  const { user, token } = useAuth();
  const [schedule, setSchedule] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && token) {
      fetchSchedule();
    }
  }, [user, token]);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);

      const response = await fetch(
        `http://localhost:3001/api/schedule/${user.id}?startDate=${startOfWeek.toISOString()}&endDate=${endOfWeek.toISOString()}`,
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
      setSchedule(data.schedule);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // ... rest of component using schedule state
}
```

### 9.3 Admin Settings API (Backend)

```typescript
// server/src/api/admin-settings.routes.ts
import express from 'express';
import { db } from '../db/index.js';
import { isAuthenticated, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

// In-memory for now, should be moved to DB table
let systemSettings = {
  siteName: 'EduVerse',
  maintenanceMode: false,
  allowRegistration: true,
  defaultRole: 'student',
  emailNotifications: true,
  maxUploadSize: 50,
  allowedFileTypes: ['pdf', 'doc', 'docx', 'mp4', 'jpg', 'png']
};

router.get('/', isAuthenticated, requireRole(['admin']), async (req, res) => {
  res.json({ settings: systemSettings });
});

router.put('/', isAuthenticated, requireRole(['admin']), async (req, res) => {
  try {
    const { settings } = req.body;
    systemSettings = { ...systemSettings, ...settings };
    res.json({ 
      message: 'Settings updated successfully',
      settings: systemSettings 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;
```

### 9.4 Parent Calendar Page

```typescript
// client/src/pages/parent-calendar.tsx
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface SchoolEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  eventType: string;
}

export default function ParentCalendar() {
  const { user, token } = useAuth();
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, [token]);

  const fetchEvents = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/events?isPublic=true', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">School Calendar</h1>
          <p className="text-gray-600">View upcoming school events and activities</p>
        </div>

        <div className="grid gap-4">
          {loading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="animate-spin h-8 w-8 border-2 border-pink-600 rounded-full mx-auto" />
              </CardContent>
            </Card>
          ) : events.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CalendarIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p>No upcoming events</p>
              </CardContent>
            </Card>
          ) : (
            events.map(event => (
              <Card key={event.id}>
                <CardHeader>
                  <CardTitle>{event.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    {new Date(event.startTime).toLocaleString()}
                  </p>
                  {event.description && (
                    <p className="mt-2">{event.description}</p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
```

### 9.5 Global Search Component

```typescript
// client/src/components/GlobalSearch.tsx
import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import debounce from "lodash/debounce";

interface SearchResult {
  type: 'course' | 'assignment' | 'user';
  id: string;
  title: string;
  description?: string;
}

export function GlobalSearch() {
  const { token } = useAuth();
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const searchAPI = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:3001/api/search?q=${encodeURIComponent(searchQuery)}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            credentials: 'include'
          }
        );

        if (response.ok) {
          const data = await response.json();
          setResults(data.results);
        }
      } catch (error) {
        console.error('Search error:', error);
      }
    }, 300),
    [token]
  );

  const handleSearch = (value: string) => {
    setQuery(value);
    setIsOpen(true);
    searchAPI(value);
  };

  const handleSelect = (result: SearchResult) => {
    switch (result.type) {
      case 'course':
        setLocation(`/student/courses/${result.id}/lessons`);
        break;
      case 'assignment':
        setLocation(`/student/assignments`);
        break;
      case 'user':
        setLocation(`/profile/${result.id}`);
        break;
    }
    setIsOpen(false);
    setQuery("");
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search courses, assignments..."
          className="pl-10"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => setIsOpen(true)}
        />
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full mt-1 w-full bg-white border rounded-lg shadow-lg z-50">
          {results.map((result) => (
            <button
              key={`${result.type}-${result.id}`}
              className="w-full text-left px-4 py-2 hover:bg-gray-100"
              onClick={() => handleSelect(result)}
            >
              <div className="font-medium">{result.title}</div>
              <div className="text-sm text-gray-500 capitalize">{result.type}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 10. Test Skeletons

### 10.1 Backend Service Test (Jest)

```typescript
// server/src/services/__tests__/course.service.test.ts
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createCourse, getCourseById, getTeacherCourses } from '../course.service';

// Mock the database
jest.mock('../../db/index', () => ({
  db: {
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn().mockResolvedValue([{ id: 'test-id', title: 'Test Course' }]),
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockResolvedValue([{ id: 'test-id', title: 'Test Course' }]),
  }
}));

describe('Course Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCourse', () => {
    it('should create a course with valid data', async () => {
      const courseData = {
        title: 'Test Course',
        description: 'A test course',
        teacherId: 'teacher-123'
      };

      const result = await createCourse(courseData);

      expect(result).toBeDefined();
      expect(result.title).toBe('Test Course');
    });

    it('should throw error if title is missing', async () => {
      await expect(createCourse({ description: 'test', teacherId: 'id' } as any))
        .rejects.toThrow();
    });
  });

  describe('getCourseById', () => {
    it('should return course when found', async () => {
      const result = await getCourseById('test-id');
      expect(result).toBeDefined();
    });

    it('should return null when not found', async () => {
      // Mock empty result
      const result = await getCourseById('non-existent');
      expect(result).toBeNull();
    });
  });
});
```

### 10.2 API Integration Test

```typescript
// server/src/api/__tests__/auth.routes.test.ts
import request from 'supertest';
import express from 'express';
import authRoutes from '../auth.routes';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Routes', () => {
  describe('POST /api/auth/login', () => {
    it('should return 400 if username is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ password: 'password123' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should return 401 for invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'nonexistent', password: 'wrong' });

      expect(response.status).toBe(401);
    });

    it('should return token for valid credentials', async () => {
      // This would need a test database setup
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser', password: 'correctpassword' });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
    });
  });
});
```

### 10.3 React Component Test

```typescript
// client/src/pages/__tests__/StudentDashboard.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import StudentDashboard from '../student-dashboard';

// Mock useAuth
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user', fullName: 'Test User', role: 'student' },
    token: 'mock-token',
    isLoading: false
  })
}));

// Mock fetch
global.fetch = jest.fn();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false }
  }
});

const renderWithProviders = (component: React.ReactNode) => {
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('StudentDashboard', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  it('renders welcome message with user name', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ courses: [], enrollments: [] })
    });

    renderWithProviders(<StudentDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Welcome/i)).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    renderWithProviders(<StudentDashboard />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('displays courses when loaded', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        courses: [
          { id: '1', title: 'Math 101', description: 'Basic math' }
        ]
      })
    });

    renderWithProviders(<StudentDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Math 101')).toBeInTheDocument();
    });
  });
});
```

---

## 11. Summary & Recommendations

### 11.1 Overall Assessment

| Area | Score | Notes |
|------|-------|-------|
| **Architecture** | 7/10 | Clean separation, but dual server entry points create confusion |
| **Code Quality** | 6/10 | Good patterns but inconsistent, mock data in production code |
| **Completeness** | 5/10 | Many features stubbed or using mock data |
| **UI/UX** | 7/10 | Modern design, but missing feedback patterns |
| **Security** | 7/10 | JWT + rate limiting good, but needs audit |
| **Testing** | 2/10 | Almost no tests present |
| **Documentation** | 6/10 | Many markdown files, but some outdated |

### 11.2 Immediate Actions Required

1. **Remove mock data** from production code (student-schedule, student-grades, etc.)
2. **Add missing API endpoints** for admin settings, student schedule
3. **Create parent-calendar.tsx** page
4. **Remove console.log statements** (7+ found)
5. **Consolidate server entry points** (routes.ts vs src/index.ts)

### 11.3 Estimated Total Effort

| Priority | Items | Effort |
|----------|-------|--------|
| Critical | 5 | ~12 hours |
| High | 6 | ~18 hours |
| Medium | 6 | ~15 hours |
| Low | 4 | ~18 hours |
| **Total** | **21** | **~63 hours** |

### 11.4 Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Mock data exposed in production | High | High | Replace before deploy |
| Dual server confusion | Medium | Medium | Consolidate to single entry |
| No tests = regressions | High | High | Add test suite |
| Performance issues | Medium | Medium | Add caching, optimize queries |

---

*Report generated by automated code audit system. Manual review recommended before implementing changes.*
