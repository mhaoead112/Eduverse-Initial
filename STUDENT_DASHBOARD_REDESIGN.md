# Student Dashboard Redesign & API Architecture

## Executive Summary
This document outlines a comprehensive redesign of the EduVerse student dashboard, focusing on improved UX/UI, clear data architecture, and robust API integration.

---

## 1. REDESIGNED DASHBOARD LAYOUT

### Design Philosophy
**Mobile-First, Scan-Optimized, Action-Oriented**

The redesigned dashboard prioritizes:
- **F-Pattern Reading**: Most important info at top-left, scanning left-to-right, top-to-bottom
- **Progressive Disclosure**: Show essentials first, details on-demand
- **Action Proximity**: Quick actions near relevant content
- **Visual Hierarchy**: Size, color, spacing guide attention
- **Cognitive Load Reduction**: Maximum 7±2 items per section

---

### Layout Structure (Desktop & Mobile)

```
┌─────────────────────────────────────────────────────────────┐
│ PERSONALIZED GREETING & TIME-SENSITIVE ALERTS               │
│ "Good morning, Alex! You have 2 assignments due today."    │
│ [Contextual CTA: Review Due Assignments →]                  │
└─────────────────────────────────────────────────────────────┘

┌────────────────┬──────────────┬──────────────┬──────────────┐
│ OVERVIEW STATS (Glanceable Metrics - 4 Cards)               │
├────────────────┼──────────────┼──────────────┼──────────────┤
│ 📚 Active      │ ✅ Completed │ 📝 Pending   │ 📊 Avg Grade │
│   Courses: 5   │  Tasks: 12   │  Tasks: 3    │   87.5%      │
│ +2 this week   │ This week    │ Due soon     │ ↑ 2.3%       │
└────────────────┴──────────────┴──────────────┴──────────────┘

┌─────────────────────────────────────┬───────────────────────┐
│ PRIMARY CONTENT (2/3 width)         │ SIDEBAR (1/3 width)   │
├─────────────────────────────────────┼───────────────────────┤
│ 🔔 PRIORITY ALERTS                  │ 📅 TODAY'S SCHEDULE   │
│ ┌─────────────────────────────────┐ │ ┌───────────────────┐ │
│ │ ⚠️ Assignment Due Today         │ │ │ 9:00 AM           │ │
│ │ "Calculus Quiz 3"               │ │ │ Advanced Math     │ │
│ │ Course: Mathematics             │ │ │ Room 204          │ │
│ │ [Submit Now] [View Details]     │ │ ├───────────────────┤ │
│ └─────────────────────────────────┘ │ │ 11:00 AM          │ │
│                                     │ │ │ Physics Lab       │ │
│ 📝 UPCOMING TASKS & ASSIGNMENTS     │ │ │ Lab Building A    │ │
│ ┌─────────────────────────────────┐ │ ├───────────────────┤ │
│ │ ✏️ Essay Draft - Literature     │ │ │ 2:00 PM           │ │
│ │ Due: Nov 27, 5:00 PM (2 days)   │ │ │ Study Group       │ │
│ │ Status: Not Started             │ │ │ Library           │ │
│ │ [Start] [Details]               │ │ └───────────────────┘ │
│ ├─────────────────────────────────┤ │                       │
│ │ 🧪 Lab Report - Physics         │ │ 📢 ANNOUNCEMENTS      │
│ │ Due: Nov 28, 11:59 PM (3 days)  │ │ ┌───────────────────┐ │
│ │ Status: In Progress (40%)       │ │ │ 📌 Exam Schedule  │ │
│ │ [Continue] [Details]            │ │ │ Math Finals moved │ │
│ │ └─────────────────────────────┘ │ │ │ to Dec 15         │ │
│                                     │ │ ├───────────────────┤ │
│ 📚 MY COURSES (Grid View)           │ │ │ New Materials     │ │
│ ┌────────┬────────┬────────┬──────┐ │ │ │ Physics Ch. 9     │ │
│ │Math 101│Phys 201│Lit 301 │CS 401│ │ │ │ uploaded          │ │
│ │━━━━90%━│━━━━75%━│━━━━85%━│━━95%━│ │ └───────────────────┘ │
│ │5 lessons│3 pend.│2 pend. │1 pend│ │                       │
│ └────────┴────────┴────────┴──────┘ │ 🔗 QUICK LINKS        │
│ [View All Courses]                  │ • Profile Settings    │
│                                     │ • Support Chat        │
│ 📊 PERFORMANCE OVERVIEW             │ • Resources Library   │
│ ┌─────────────────────────────────┐ │                       │
│ │ Grade Trend (Last 8 Weeks)      │ │                       │
│ │     [Line Chart: 78→82→85→87]   │ │                       │
│ │ Best: Computer Science (95%)    │ │                       │
│ │ Needs Attention: Physics (75%)  │ │                       │
│ └─────────────────────────────────┘ │                       │
└─────────────────────────────────────┴───────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 🏆 ACHIEVEMENTS & PROGRESS                                  │
│ [Recent Badge] [Streak Counter] [Leaderboard Position]      │
└─────────────────────────────────────────────────────────────┘
```

---

### Mobile Layout (Stacked Vertical)

```
┌─────────────────────┐
│ 👋 Welcome, Alex!   │
│ 2 tasks due today   │
├─────────────────────┤
│ [4 Stats Cards]     │
│ Swipeable Carousel  │
├─────────────────────┤
│ ⚠️ Priority Alerts  │
│ (Expandable)        │
├─────────────────────┤
│ 📅 Today's Schedule │
│ (Collapsible)       │
├─────────────────────┤
│ 📝 Upcoming Tasks   │
│ (List View)         │
├─────────────────────┤
│ 📚 My Courses       │
│ (Horizontal Scroll) │
├─────────────────────┤
│ 📢 Announcements    │
│ (Expandable)        │
└─────────────────────┘
```

---

## 2. UI/UX IMPROVEMENTS

### Visual Hierarchy

**Typography Scale**
```css
H1 (Greeting): 2rem (32px), Bold, Dark Gray (#1a202c)
H2 (Section): 1.5rem (24px), Semibold, Dark Gray
H3 (Card Title): 1.125rem (18px), Medium, Gray (#4a5568)
Body: 1rem (16px), Regular, Gray (#718096)
Small: 0.875rem (14px), Regular, Light Gray (#a0aec0)
```

**Color System**
```css
Primary (Actions): #3b82f6 (Blue 500)
Success (Completed): #10b981 (Green 500)
Warning (Due Soon): #f59e0b (Amber 500)
Danger (Overdue): #ef4444 (Red 500)
Neutral: Grays (#f7fafc to #1a202c)
Background: #ffffff / #111827 (Dark Mode)
```

**Spacing & Grid**
- Base unit: 4px (0.25rem)
- Component padding: 16px (1rem)
- Section margins: 24px (1.5rem)
- Card gap: 16px
- Responsive breakpoints: 640px (sm), 768px (md), 1024px (lg), 1280px (xl)

### Component Recommendations

| Element | Component | Justification |
|---------|-----------|---------------|
| Stats Overview | `<StatsCard>` with icon, value, trend | Quick visual scanning, data comparison |
| Tasks/Assignments | `<TaskCard>` with status badge, progress bar | Clear status indication, action proximity |
| Schedule | `<TimelineList>` with time markers | Temporal context, easy scanning |
| Courses | `<CourseCard>` with progress ring, thumbnail | Visual progress tracking |
| Announcements | `<NotificationCard>` with pin indicator | Prioritization, recency indication |
| Charts | `<LineChart>` (grades), `<ProgressRing>` (completion) | Data visualization, trend analysis |
| Quick Actions | `<ActionButton>` with icon + label | Accessibility, clarity |

### Accessibility Enhancements

**WCAG 2.1 AA Compliance**
- Minimum contrast ratio 4.5:1 for text, 3:1 for large text
- All interactive elements: 44x44px minimum touch target
- Keyboard navigation: Tab order follows visual hierarchy
- ARIA labels on all icons and interactive elements
- Focus indicators: 2px blue outline on all focusable elements
- Screen reader announcements for dynamic content updates

**Responsive Breakpoints**
```css
Mobile:  < 640px  (Single column, stacked)
Tablet:  640-1024px (2-column grid)
Desktop: > 1024px (3-column grid with sidebar)
```

**Loading States**
- Skeleton screens for initial load (no spinners)
- Progressive enhancement (stats → content → charts)
- Error states with retry actions
- Optimistic UI updates

---

## 3. DATA ARCHITECTURE

### Static vs Dynamic Data Mapping

| Module | Field | Type | Update Frequency | Source |
|--------|-------|------|------------------|--------|
| **GREETING** |
| | Time-based greeting | Static | Never (client-side logic) | Frontend |
| | Student name | Semi-static | On profile update | `GET /api/users/me` |
| | Alerts count | Dynamic | Real-time | `GET /api/students/alerts` |
| **STATS** |
| | Active courses count | Dynamic | On enrollment change | `GET /api/enrollments/student` |
| | Completed tasks | Dynamic | On submission | `GET /api/students/stats` |
| | Pending tasks count | Dynamic | Every 5 mins | `GET /api/students/stats` |
| | Average grade | Dynamic | On grade update | `GET /api/students/stats` |
| **SCHEDULE** |
| | Today's classes | Dynamic | Daily at midnight | `GET /api/students/schedule/today` |
| | Class time | Semi-static | On schedule change | Course metadata |
| | Room location | Semi-static | On schedule change | Course metadata |
| **TASKS** |
| | Assignment list | Dynamic | Real-time | `GET /api/students/assignments` |
| | Due dates | Static | Never (set at creation) | Assignment metadata |
| | Status (pending/done) | Dynamic | On submission | Submission records |
| | Progress % | Dynamic | Auto-calculated | Submission metadata |
| **GRADES** |
| | Recent grades | Dynamic | On grade publication | `GET /api/students/grades/recent` |
| | Grade trends | Dynamic | Weekly aggregation | `GET /api/students/performance` |
| | Best/worst subject | Dynamic | Calculated from grades | Backend aggregation |
| **ANNOUNCEMENTS** |
| | Announcement list | Dynamic | Real-time (polling/WebSocket) | `GET /api/announcements/student` |
| | Pinned status | Semi-static | On teacher update | Teacher action |
| | Read/unread | Dynamic | On student interaction | `PATCH /api/announcements/:id/read` |
| **COURSES** |
| | Enrolled courses | Dynamic | On enrollment | `GET /api/enrollments/student` |
| | Course progress % | Dynamic | On lesson completion | Calculated |
| | Lesson count | Semi-static | On lesson add/remove | Course metadata |
| **QUICK LINKS** |
| | Navigation links | Static | Never (hardcoded) | Frontend config |
| | Feature flags | Semi-static | On deployment | Feature config |

---

## 4. API ENDPOINT SPECIFICATIONS

### Base URL
```
Production: https://api.eduverse.com/v1
Development: http://localhost:3001/api
```

### Authentication
All endpoints require Bearer token in Authorization header:
```http
Authorization: Bearer <JWT_TOKEN>
```

---

### 4.1 Student Profile & Context

#### `GET /api/students/me`
Get authenticated student's profile and context.

**Request**
```http
GET /api/students/me
Authorization: Bearer <token>
```

**Response 200**
```json
{
  "id": "cuid_xyz",
  "username": "alex.johnson",
  "fullName": "Alex Johnson",
  "email": "alex@example.com",
  "role": "student",
  "avatar": "https://cdn.eduverse.com/avatars/xyz.jpg",
  "preferences": {
    "theme": "light",
    "notifications": true,
    "language": "en"
  },
  "metadata": {
    "enrollmentYear": 2023,
    "gradeLevel": "12",
    "major": "Computer Science"
  }
}
```

---

### 4.2 Dashboard Overview

#### `GET /api/students/dashboard`
Get comprehensive dashboard data in a single request (optimized for initial load).

**Request**
```http
GET /api/students/dashboard
Authorization: Bearer <token>
```

**Response 200**
```json
{
  "stats": {
    "activeCourses": 5,
    "completedTasks": 12,
    "pendingTasks": 3,
    "averageGrade": 87.5,
    "gradeChange": 2.3,
    "attendanceRate": 94.2
  },
  "alerts": [
    {
      "id": "alert_1",
      "type": "assignment_due",
      "severity": "high",
      "title": "Assignment Due Today",
      "message": "Calculus Quiz 3 is due at 11:59 PM",
      "courseId": "course_math101",
      "courseName": "Mathematics 101",
      "actionUrl": "/assignments/asgn_123",
      "actionLabel": "Submit Now",
      "createdAt": "2025-11-25T06:00:00Z"
    }
  ],
  "upcomingSchedule": [
    {
      "id": "sched_1",
      "courseId": "course_math101",
      "courseName": "Advanced Mathematics",
      "courseColor": "#3b82f6",
      "type": "class",
      "startTime": "2025-11-25T09:00:00Z",
      "endTime": "2025-11-25T10:30:00Z",
      "location": "Room 204, Main Building",
      "instructor": "Dr. Sarah Johnson",
      "isOnline": false,
      "meetingLink": null
    },
    {
      "id": "sched_2",
      "courseId": "course_phys201",
      "courseName": "Physics Laboratory",
      "courseColor": "#10b981",
      "type": "lab",
      "startTime": "2025-11-25T11:00:00Z",
      "endTime": "2025-11-25T13:00:00Z",
      "location": "Lab Building A",
      "instructor": "Prof. Michael Chen",
      "isOnline": false,
      "meetingLink": null
    }
  ],
  "recentAnnouncements": [
    {
      "id": "ann_1",
      "courseId": "course_math101",
      "courseName": "Mathematics 101",
      "title": "Exam Schedule Change",
      "content": "The final exam has been moved to December 15th.",
      "isPinned": true,
      "isRead": false,
      "createdAt": "2025-11-24T14:30:00Z",
      "author": {
        "id": "teacher_1",
        "name": "Dr. Sarah Johnson"
      }
    }
  ],
  "quickStats": {
    "todayClasses": 3,
    "unreadAnnouncements": 2,
    "upcomingDeadlines": 3,
    "newGrades": 1
  }
}
```

---

### 4.3 Enrollments

#### `GET /api/enrollments/student`
Get all courses the student is enrolled in.

**Request**
```http
GET /api/enrollments/student
Authorization: Bearer <token>
```

**Query Parameters**
- `status` (optional): `active` | `completed` | `all` (default: `active`)
- `include` (optional): `progress,stats,instructor` (comma-separated)

**Response 200**
```json
[
  {
    "id": "enroll_1",
    "courseId": "course_math101",
    "enrolledAt": "2025-09-01T08:00:00Z",
    "status": "active",
    "course": {
      "id": "course_math101",
      "title": "Advanced Mathematics",
      "description": "Calculus and Linear Algebra",
      "courseCode": "MATH-101",
      "credits": 4,
      "color": "#3b82f6",
      "thumbnail": "https://cdn.eduverse.com/courses/math101.jpg",
      "isPublished": true,
      "teacherId": "teacher_1",
      "teacher": {
        "id": "teacher_1",
        "name": "Dr. Sarah Johnson",
        "avatar": "https://cdn.eduverse.com/avatars/teacher1.jpg"
      }
    },
    "progress": {
      "completedLessons": 18,
      "totalLessons": 20,
      "percentage": 90.0,
      "lastAccessedAt": "2025-11-24T16:45:00Z"
    },
    "stats": {
      "pendingAssignments": 2,
      "averageGrade": 92.5,
      "attendance": 95.0
    }
  }
]
```

---

### 4.4 Assignments & Tasks

#### `GET /api/students/assignments`
Get all assignments for the student across all courses.

**Request**
```http
GET /api/students/assignments?status=pending&sort=dueDate&limit=10
Authorization: Bearer <token>
```

**Query Parameters**
- `status`: `pending` | `in_progress` | `submitted` | `graded` | `overdue` | `all`
- `courseId` (optional): Filter by specific course
- `sort`: `dueDate` | `createdAt` | `priority` (default: `dueDate`)
- `limit` (optional): Number of results (default: 20)
- `offset` (optional): Pagination offset

**Response 200**
```json
{
  "assignments": [
    {
      "id": "asgn_123",
      "courseId": "course_lit301",
      "courseName": "English Literature",
      "courseColor": "#8b5cf6",
      "title": "Essay: Modern Poetry Analysis",
      "description": "Analyze three poems from the Modernist era",
      "type": "essay",
      "maxScore": 100,
      "dueDate": "2025-11-27T17:00:00Z",
      "priority": "high",
      "estimatedTime": "4 hours",
      "status": "not_started",
      "submission": null,
      "grade": null,
      "createdAt": "2025-11-15T10:00:00Z",
      "resources": [
        {
          "id": "res_1",
          "type": "pdf",
          "name": "Poetry Analysis Guide.pdf",
          "url": "https://cdn.eduverse.com/resources/res_1.pdf"
        }
      ]
    },
    {
      "id": "asgn_124",
      "courseId": "course_phys201",
      "courseName": "Physics Laboratory",
      "courseColor": "#10b981",
      "title": "Lab Report: Electromagnetic Waves",
      "description": "Document findings from Lab Session 5",
      "type": "lab_report",
      "maxScore": 100,
      "dueDate": "2025-11-28T23:59:00Z",
      "priority": "medium",
      "estimatedTime": "3 hours",
      "status": "in_progress",
      "submission": {
        "id": "sub_456",
        "submittedAt": null,
        "draftSavedAt": "2025-11-24T18:20:00Z",
        "progress": 40,
        "autoSaveEnabled": true
      },
      "grade": null,
      "createdAt": "2025-11-20T09:00:00Z"
    }
  ],
  "pagination": {
    "total": 15,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  },
  "summary": {
    "pending": 3,
    "in_progress": 2,
    "submitted": 5,
    "graded": 5,
    "overdue": 0
  }
}
```

#### `POST /api/assignments/:id/submit`
Submit an assignment.

**Request**
```http
POST /api/assignments/asgn_123/submit
Content-Type: multipart/form-data
Authorization: Bearer <token>

{
  "content": "Essay text content...",
  "files": [<File Object>],
  "submittedAt": "2025-11-25T14:30:00Z"
}
```

**Response 201**
```json
{
  "id": "sub_789",
  "assignmentId": "asgn_123",
  "studentId": "student_1",
  "status": "submitted",
  "content": "Essay text content...",
  "files": [
    {
      "id": "file_1",
      "name": "essay_draft.pdf",
      "size": 524288,
      "type": "application/pdf",
      "url": "https://cdn.eduverse.com/submissions/file_1.pdf"
    }
  ],
  "submittedAt": "2025-11-25T14:30:00Z",
  "message": "Assignment submitted successfully"
}
```

---

### 4.5 Grades & Performance

#### `GET /api/students/grades`
Get all grades for the student.

**Request**
```http
GET /api/students/grades?courseId=course_math101&includeStats=true
Authorization: Bearer <token>
```

**Query Parameters**
- `courseId` (optional): Filter by course
- `includeStats` (optional): Include performance statistics
- `startDate`, `endDate` (optional): Filter by date range

**Response 200**
```json
{
  "grades": [
    {
      "id": "grade_1",
      "assignmentId": "asgn_101",
      "assignmentTitle": "Calculus Quiz 2",
      "courseId": "course_math101",
      "courseName": "Advanced Mathematics",
      "score": 92,
      "maxScore": 100,
      "percentage": 92.0,
      "letterGrade": "A",
      "feedback": "Excellent work! Clear understanding of derivatives.",
      "gradedBy": {
        "id": "teacher_1",
        "name": "Dr. Sarah Johnson"
      },
      "gradedAt": "2025-11-22T10:30:00Z",
      "submittedAt": "2025-11-20T16:45:00Z"
    }
  ],
  "stats": {
    "overallAverage": 87.5,
    "highestGrade": 95,
    "lowestGrade": 78,
    "totalAssignments": 12,
    "gradedAssignments": 10,
    "byGradeRange": {
      "A": 6,
      "B": 3,
      "C": 1,
      "D": 0,
      "F": 0
    },
    "byCourse": [
      {
        "courseId": "course_math101",
        "courseName": "Advanced Mathematics",
        "average": 92.5,
        "count": 5
      },
      {
        "courseId": "course_phys201",
        "courseName": "Physics Laboratory",
        "average": 85.0,
        "count": 3
      }
    ]
  }
}
```

#### `GET /api/students/performance`
Get performance analytics and trends.

**Request**
```http
GET /api/students/performance?period=8weeks
Authorization: Bearer <token>
```

**Query Parameters**
- `period`: `4weeks` | `8weeks` | `semester` | `year`
- `groupBy`: `week` | `month` (default: `week`)

**Response 200**
```json
{
  "trends": {
    "timeSeries": [
      {
        "period": "Week 1",
        "startDate": "2025-09-01",
        "endDate": "2025-09-07",
        "averageGrade": 78.0,
        "assignmentsGraded": 2
      },
      {
        "period": "Week 2",
        "startDate": "2025-09-08",
        "endDate": "2025-09-14",
        "averageGrade": 82.0,
        "assignmentsGraded": 3
      },
      {
        "period": "Week 8",
        "startDate": "2025-10-20",
        "endDate": "2025-10-26",
        "averageGrade": 87.5,
        "assignmentsGraded": 4
      }
    ],
    "overallTrend": "improving",
    "trendPercentage": 12.2
  },
  "strengths": [
    {
      "courseId": "course_cs401",
      "courseName": "Computer Science",
      "average": 95.0,
      "consistency": "high"
    }
  ],
  "improvementAreas": [
    {
      "courseId": "course_phys201",
      "courseName": "Physics Laboratory",
      "average": 75.0,
      "consistency": "medium",
      "recommendation": "Review lab procedures and seek tutoring"
    }
  ],
  "predictions": {
    "expectedSemesterGPA": 3.75,
    "confidenceLevel": "high"
  }
}
```

---

### 4.6 Schedule

#### `GET /api/students/schedule/today`
Get today's schedule.

**Request**
```http
GET /api/students/schedule/today?timezone=America/New_York
Authorization: Bearer <token>
```

**Query Parameters**
- `timezone`: IANA timezone (default: user's preference)
- `date` (optional): Specific date (ISO 8601)

**Response 200**
```json
{
  "date": "2025-11-25",
  "schedule": [
    {
      "id": "event_1",
      "type": "class",
      "courseId": "course_math101",
      "courseName": "Advanced Mathematics",
      "courseColor": "#3b82f6",
      "title": "Lecture: Differential Equations",
      "startTime": "2025-11-25T09:00:00-05:00",
      "endTime": "2025-11-25T10:30:00-05:00",
      "duration": 90,
      "location": {
        "type": "physical",
        "room": "Room 204",
        "building": "Main Building",
        "floor": 2,
        "capacity": 30
      },
      "instructor": {
        "id": "teacher_1",
        "name": "Dr. Sarah Johnson",
        "email": "s.johnson@eduverse.edu"
      },
      "attendance": {
        "required": true,
        "status": "pending"
      }
    },
    {
      "id": "event_2",
      "type": "office_hours",
      "courseId": "course_phys201",
      "courseName": "Physics Laboratory",
      "courseColor": "#10b981",
      "title": "Prof. Chen Office Hours",
      "startTime": "2025-11-25T14:00:00-05:00",
      "endTime": "2025-11-25T16:00:00-05:00",
      "duration": 120,
      "location": {
        "type": "hybrid",
        "room": "Office 315",
        "meetingLink": "https://zoom.us/j/123456789"
      },
      "instructor": {
        "id": "teacher_2",
        "name": "Prof. Michael Chen"
      },
      "attendance": {
        "required": false,
        "status": null
      }
    }
  ],
  "summary": {
    "totalEvents": 3,
    "totalDuration": 270,
    "freeSlots": [
      {
        "start": "2025-11-25T10:30:00-05:00",
        "end": "2025-11-25T11:00:00-05:00",
        "duration": 30
      }
    ]
  }
}
```

#### `GET /api/students/schedule/week`
Get week schedule.

**Request**
```http
GET /api/students/schedule/week?weekStart=2025-11-25
Authorization: Bearer <token>
```

**Response 200**
```json
{
  "weekStart": "2025-11-25",
  "weekEnd": "2025-12-01",
  "days": [
    {
      "date": "2025-11-25",
      "dayOfWeek": "Monday",
      "events": [/* Same structure as /today */]
    }
    // ... 7 days
  ],
  "summary": {
    "totalClasses": 15,
    "totalHours": 22.5,
    "busiestDay": "Wednesday",
    "freeDay": null
  }
}
```

---

### 4.7 Announcements

#### `GET /api/announcements/student`
Get all announcements for student's enrolled courses.

**Request**
```http
GET /api/announcements/student?unreadOnly=true&limit=20
Authorization: Bearer <token>
```

**Query Parameters**
- `unreadOnly` (optional): `true` | `false`
- `courseId` (optional): Filter by course
- `pinned` (optional): `true` (only pinned)
- `limit`, `offset`: Pagination

**Response 200**
```json
{
  "announcements": [
    {
      "id": "ann_1",
      "courseId": "course_math101",
      "courseName": "Advanced Mathematics",
      "courseColor": "#3b82f6",
      "title": "Exam Schedule Change",
      "content": "The final exam has been rescheduled to December 15th at 2:00 PM. Please mark your calendars accordingly.",
      "isPinned": true,
      "isRead": false,
      "priority": "high",
      "author": {
        "id": "teacher_1",
        "name": "Dr. Sarah Johnson",
        "role": "teacher",
        "avatar": "https://cdn.eduverse.com/avatars/teacher1.jpg"
      },
      "attachments": [
        {
          "id": "att_1",
          "name": "Updated_Exam_Schedule.pdf",
          "type": "application/pdf",
          "size": 204800,
          "url": "https://cdn.eduverse.com/announcements/att_1.pdf"
        }
      ],
      "createdAt": "2025-11-24T14:30:00Z",
      "updatedAt": "2025-11-24T14:30:00Z",
      "readAt": null
    }
  ],
  "pagination": {
    "total": 8,
    "limit": 20,
    "offset": 0,
    "hasMore": false
  },
  "summary": {
    "totalUnread": 2,
    "totalPinned": 1
  }
}
```

#### `PATCH /api/announcements/:id/read`
Mark announcement as read.

**Request**
```http
PATCH /api/announcements/ann_1/read
Authorization: Bearer <token>
```

**Response 200**
```json
{
  "id": "ann_1",
  "isRead": true,
  "readAt": "2025-11-25T10:15:00Z"
}
```

---

### 4.8 Lessons & Learning Resources

#### `GET /api/students/lessons`
Get all lessons across enrolled courses.

**Request**
```http
GET /api/students/lessons?courseId=course_math101&status=incomplete
Authorization: Bearer <token>
```

**Query Parameters**
- `courseId` (optional): Filter by course
- `status`: `all` | `complete` | `incomplete` | `in_progress`

**Response 200**
```json
{
  "lessons": [
    {
      "id": "lesson_1",
      "courseId": "course_math101",
      "courseName": "Advanced Mathematics",
      "title": "Introduction to Differential Equations",
      "description": "Learn the fundamentals of solving differential equations",
      "type": "video",
      "duration": 45,
      "order": 1,
      "content": {
        "videoUrl": "https://cdn.eduverse.com/lessons/lesson_1.mp4",
        "transcript": "https://cdn.eduverse.com/transcripts/lesson_1.txt",
        "slides": "https://cdn.eduverse.com/slides/lesson_1.pdf"
      },
      "resources": [
        {
          "id": "res_1",
          "name": "Practice Problems.pdf",
          "type": "pdf",
          "url": "https://cdn.eduverse.com/resources/res_1.pdf"
        }
      ],
      "progress": {
        "status": "in_progress",
        "percentage": 60,
        "lastAccessedAt": "2025-11-24T16:30:00Z",
        "completedAt": null,
        "timeSpent": 27
      },
      "prerequisites": [],
      "nextLesson": {
        "id": "lesson_2",
        "title": "Solving First-Order Equations"
      }
    }
  ],
  "stats": {
    "total": 20,
    "completed": 18,
    "inProgress": 1,
    "notStarted": 1,
    "overallProgress": 90.0
  }
}
```

---

### 4.9 Notifications & Alerts

#### `GET /api/students/alerts`
Get priority alerts and notifications.

**Request**
```http
GET /api/students/alerts?unreadOnly=true
Authorization: Bearer <token>
```

**Response 200**
```json
{
  "alerts": [
    {
      "id": "alert_1",
      "type": "assignment_due",
      "severity": "high",
      "title": "Assignment Due Today",
      "message": "Calculus Quiz 3 is due at 11:59 PM today",
      "metadata": {
        "assignmentId": "asgn_123",
        "courseId": "course_math101",
        "courseName": "Mathematics 101",
        "dueDate": "2025-11-25T23:59:00Z",
        "hoursRemaining": 14
      },
      "actions": [
        {
          "label": "Submit Now",
          "url": "/assignments/asgn_123/submit",
          "type": "primary"
        },
        {
          "label": "View Details",
          "url": "/assignments/asgn_123",
          "type": "secondary"
        }
      ],
      "isRead": false,
      "isDismissible": false,
      "expiresAt": "2025-11-26T00:00:00Z",
      "createdAt": "2025-11-25T06:00:00Z"
    },
    {
      "id": "alert_2",
      "type": "grade_published",
      "severity": "info",
      "title": "New Grade Available",
      "message": "Your grade for Physics Lab Report is now available",
      "metadata": {
        "gradeId": "grade_45",
        "assignmentId": "asgn_124",
        "courseId": "course_phys201",
        "score": 88,
        "maxScore": 100
      },
      "actions": [
        {
          "label": "View Grade",
          "url": "/grades/grade_45",
          "type": "primary"
        }
      ],
      "isRead": false,
      "isDismissible": true,
      "createdAt": "2025-11-24T15:20:00Z"
    }
  ],
  "summary": {
    "totalUnread": 3,
    "byType": {
      "assignment_due": 1,
      "grade_published": 1,
      "announcement": 1
    },
    "bySeverity": {
      "high": 1,
      "medium": 0,
      "low": 0,
      "info": 2
    }
  }
}
```

---

### 4.10 Achievements & Gamification

#### `GET /api/students/achievements`
Get student achievements and progress.

**Request**
```http
GET /api/students/achievements
Authorization: Bearer <token>
```

**Response 200**
```json
{
  "achievements": [
    {
      "id": "ach_1",
      "type": "attendance",
      "title": "Perfect Attendance",
      "description": "Attended all classes for 30 consecutive days",
      "icon": "calendar-check",
      "color": "#fbbf24",
      "tier": "gold",
      "earnedAt": "2025-10-15T10:00:00Z",
      "progress": {
        "current": 30,
        "required": 30,
        "percentage": 100
      }
    },
    {
      "id": "ach_2",
      "type": "grades",
      "title": "Math Wizard",
      "description": "Earn 10 A+ grades in Mathematics",
      "icon": "brain",
      "color": "#3b82f6",
      "tier": "platinum",
      "earnedAt": "2025-11-10T14:30:00Z",
      "progress": {
        "current": 10,
        "required": 10,
        "percentage": 100
      }
    },
    {
      "id": "ach_3",
      "type": "collaboration",
      "title": "Team Player",
      "description": "Participate in 5 study groups",
      "icon": "users",
      "color": "#10b981",
      "tier": "silver",
      "earnedAt": null,
      "progress": {
        "current": 3,
        "required": 5,
        "percentage": 60
      }
    }
  ],
  "stats": {
    "totalEarned": 12,
    "totalAvailable": 25,
    "points": 1250,
    "level": 8,
    "rank": "Honor Student",
    "leaderboard": {
      "position": 24,
      "totalStudents": 350
    }
  },
  "streaks": {
    "assignmentSubmissions": {
      "current": 15,
      "longest": 23,
      "lastSubmittedAt": "2025-11-25T14:30:00Z"
    },
    "dailyLogin": {
      "current": 42,
      "longest": 56,
      "lastLoginAt": "2025-11-25T08:15:00Z"
    }
  }
}
```

---

### 4.11 Quick Links & Resources

#### `GET /api/students/resources`
Get personalized learning resources and quick links.

**Request**
```http
GET /api/students/resources?category=all
Authorization: Bearer <token>
```

**Response 200**
```json
{
  "resources": {
    "academic": [
      {
        "id": "res_1",
        "title": "Writing Center",
        "description": "Get help with essays and research papers",
        "url": "/resources/writing-center",
        "icon": "pencil",
        "availability": "Mon-Fri 9AM-5PM"
      },
      {
        "id": "res_2",
        "title": "Math Tutoring",
        "description": "One-on-one tutoring sessions",
        "url": "/resources/tutoring/math",
        "icon": "calculator",
        "availability": "By appointment"
      }
    ],
    "technical": [
      {
        "id": "res_3",
        "title": "Library Database",
        "description": "Access research journals and e-books",
        "url": "https://library.eduverse.edu",
        "icon": "database",
        "external": true
      }
    ],
    "support": [
      {
        "id": "res_4",
        "title": "Help Center",
        "description": "FAQs and troubleshooting guides",
        "url": "/support",
        "icon": "help-circle"
      },
      {
        "id": "res_5",
        "title": "Live Chat Support",
        "description": "Chat with support team",
        "url": "/support/chat",
        "icon": "message-circle",
        "available": true
      }
    ]
  },
  "quickActions": [
    {
      "id": "qa_1",
      "label": "Submit Assignment",
      "url": "/assignments?status=pending",
      "icon": "upload",
      "badge": "3 pending"
    },
    {
      "id": "qa_2",
      "label": "View Grades",
      "url": "/grades",
      "icon": "bar-chart",
      "badge": "1 new"
    }
  ]
}
```

---

## 5. DESIGN JUSTIFICATION

### Why This Layout Order?

**1. Greeting + Alerts (Top)**
- **Why**: First thing students need to know - "What's urgent?"
- **Psychology**: Reduces anxiety by surfacing critical info immediately
- **Action**: Clear CTA ("Review Due Assignments") drives engagement

**2. Stats Cards (Second)**
- **Why**: High-level context before diving into details
- **Scanability**: 4-card grid allows quick visual comparison
- **Motivation**: Positive reinforcement (completed tasks, grade trends)

**3. Priority Alerts + Today's Schedule (Third, Side-by-Side)**
- **Why**: Time-sensitive information grouped together
- **Desktop**: 2/3 + 1/3 split prioritizes tasks over schedule
- **Mobile**: Stacked with alerts first (more actionable)

**4. Upcoming Tasks (Primary Content)**
- **Why**: Main reason students visit dashboard
- **Design**: Card-based with clear status indicators and action buttons
- **Proximity**: Actions ("Start", "Continue") right next to task info

**5. Courses + Announcements (Below Tasks)**
- **Why**: Less urgent but still important
- **Balance**: Courses get more space (2/3) as they're more complex
- **Announcements**: Compact sidebar for quick scanning

**6. Performance Charts (Bottom)**
- **Why**: Analytical data - less urgent, more reflective
- **Progressive Enhancement**: Can load asynchronously
- **Value**: Motivational when students scroll down

**7. Achievements (Footer)**
- **Why**: Gamification element - bonus, not critical
- **Engagement**: Encourages return visits
- **Psychology**: Positive reinforcement at end of session

---

### Static vs Dynamic Rationale

**Static Data** (Hardcoded or Config-Based)
- Quick links navigation (rarely changes)
- UI labels and text
- Feature flags (deployment-level)
- Time-based greetings (client-side logic)

**Semi-Static Data** (Infrequent Updates)
- Course schedules (change per semester)
- Instructor info (change per course)
- Room locations (change per term)
- Announcement pinned status (teacher-controlled)

**Dynamic Data** (Real-Time or Frequent)
- Assignment submissions (student actions)
- Grades (teacher grading)
- Task completion status (ongoing)
- Announcements (teacher posts)
- Attendance records (daily updates)

**Justification**: Separating data by update frequency enables:
- Smart caching strategies (static cached indefinitely, dynamic polled)
- Optimized API calls (batch semi-static on login, poll dynamic)
- Reduced server load (cache static at CDN edge)
- Better UX (instant UI for static, skeleton for dynamic)

---

### API Design Decisions

#### 1. **Single Dashboard Endpoint** (`/api/students/dashboard`)
**Why**: Reduces initial load from 10+ API calls to 1
**Trade-off**: Larger payload, but faster perceived performance
**When to use**: Initial page load only

#### 2. **Granular Endpoints** (e.g., `/assignments`, `/grades`)
**Why**: Allows targeted updates without full dashboard refresh
**When to use**: Background polling, user navigation

#### 3. **Consistent Response Schemas**
All endpoints follow:
```json
{
  "data": [...],          // Main content
  "pagination": {...},    // If paginated
  "summary": {...},       // Aggregate stats
  "metadata": {...}       // Optional context
}
```
**Why**: Predictable structure simplifies frontend logic

#### 4. **Nested Resource Inclusion** (e.g., `?include=progress,stats`)
**Why**: Flexibility - fetch related data without N+1 queries
**Implementation**: Database joins, not separate API calls

#### 5. **Timezone Handling**
All timestamps in ISO 8601 UTC, timezone conversion on client
**Why**: Single source of truth, consistent across users

#### 6. **Pagination Defaults**
- Default limit: 20
- Max limit: 100
**Why**: Balance between data completeness and performance

#### 7. **Status Enums**
Assignments: `not_started | in_progress | submitted | graded | overdue`
**Why**: Finite states enable UI logic (show "Start" vs "Continue")

#### 8. **Error Responses**
All errors return:
```json
{
  "error": {
    "code": "ASSIGNMENT_NOT_FOUND",
    "message": "Assignment with ID asgn_123 not found",
    "field": "id",
    "statusCode": 404
  }
}
```
**Why**: Consistent error handling, easier debugging

---

## 6. IMPLEMENTATION ROADMAP

### Phase 1: Core Dashboard (Week 1-2)
- [ ] Implement `/api/students/dashboard` endpoint
- [ ] Design stats cards component
- [ ] Create greeting + alerts section
- [ ] Build responsive grid layout

### Phase 2: Tasks & Schedule (Week 3-4)
- [ ] `/api/students/assignments` with filtering
- [ ] `/api/students/schedule/today` and `/week`
- [ ] Task card component with status badges
- [ ] Timeline schedule component

### Phase 3: Grades & Performance (Week 5-6)
- [ ] `/api/students/grades` and `/performance`
- [ ] Line chart for grade trends
- [ ] Performance analytics aggregation
- [ ] Subject comparison view

### Phase 4: Announcements & Notifications (Week 7)
- [ ] `/api/announcements/student` with read tracking
- [ ] `/api/students/alerts` priority system
- [ ] Real-time notification polling (or WebSocket)
- [ ] Badge counters for unread items

### Phase 5: Polish & Optimization (Week 8)
- [ ] Implement caching strategy
- [ ] Add skeleton loading states
- [ ] Optimize database queries (add indexes)
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Mobile responsiveness testing

---

## 7. PERFORMANCE TARGETS

| Metric | Target | Measurement |
|--------|--------|-------------|
| Initial Load (Dashboard) | < 2s | Time to Interactive |
| API Response Time | < 200ms | P95 latency |
| Skeleton to Content | < 500ms | Perceived performance |
| Mobile First Paint | < 1.5s | Lighthouse score |
| Accessibility Score | > 95 | Lighthouse audit |
| Bundle Size | < 300KB | Gzipped JS |

---

## 8. NEXT STEPS

1. **Review this design** with stakeholders (product, design, engineering)
2. **Create Figma mockups** based on wireframes above
3. **Set up database indexes** for new queries (enrollments, assignments by student)
4. **Implement `/api/students/dashboard`** as POC
5. **Build reusable components** (StatsCard, TaskCard, TimelineList)
6. **Conduct user testing** with 5-10 students for feedback
7. **Iterate** based on performance metrics and user behavior

---

**Document Version**: 1.0  
**Last Updated**: November 25, 2025  
**Authors**: GitHub Copilot (Frontend Architect) + Development Team
