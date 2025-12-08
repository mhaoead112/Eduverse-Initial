# Course Creation Feature Documentation

## Overview

This document describes the implementation of the course creation feature for the EduVerse platform, allowing authenticated teachers and administrators to create new courses with a user-friendly form interface.

## Features

### 1. **Frontend Components**

#### `CreateCourseForm.tsx`
Located in: `client/src/components/CreateCourseForm.tsx`

A reusable form component that handles:
- **Form Fields:**
  - Course Title (required, 3-255 characters)
  - Course Description (required, 10-2000 characters)

- **Validation:**
  - Real-time validation on user input
  - Server-side validation via API
  - Field-level error messages
  - Character count indicators

- **Authentication:**
  - JWT token extraction from auth context
  - Authorization header inclusion: `Authorization: Bearer <token>`
  - User authentication status checking

- **States:**
  - **Loading:** Shows spinner and disables form during submission
  - **Success:** Displays success message, resets form, auto-hides after 5 seconds
  - **Error:** Shows user-friendly error messages with specific status handling
  - **Validation Errors:** Field-specific validation feedback

- **User Feedback:**
  - Success confirmation with CheckCircle icon
  - Error alerts with AlertCircle icon
  - Character count display
  - Loading spinner during request
  - Authenticated user display
  - Clear form button
  - Close button (optional, when rendered in modal/dialog)

### 2. **Frontend Page**

#### `create-course.tsx`
Located in: `client/src/pages/create-course.tsx`

A full-page component featuring:
- **Layout:** Wrapped in `DashboardLayout` for consistent UI
- **Protection:** Uses `ProtectedRoute` with role restriction (teacher, admin)
- **Navigation:** Back button to return to previous page
- **Sections:**
  - Create Course Form (2/3 width)
  - Quick Tips sidebar
  - Help section
  - Course status information

### 3. **Backend Endpoints**

#### POST `/api/courses`
**Authorization Required:** Yes (JWT Bearer token)
**Allowed Roles:** teacher, admin

**Request Body:**
```json
{
  "title": "Introduction to Web Development",
  "description": "Learn the fundamentals of HTML, CSS, and JavaScript to build modern web applications."
}
```

**Response (Success - 201):**
```json
{
  "message": "Course created successfully",
  "course": {
    "id": "course_xyz123",
    "title": "Introduction to Web Development",
    "description": "Learn the fundamentals...",
    "teacherId": "user_abc123",
    "isPublished": false,
    "createdAt": "2025-11-16T10:30:00Z",
    "updatedAt": "2025-11-16T10:30:00Z"
  }
}
```

**Error Responses:**
- **400:** Validation error or invalid data
- **401:** Unauthorized (expired/invalid token)
- **403:** Forbidden (insufficient permissions - user is not teacher/admin)

#### Additional Course Endpoints

**GET `/api/courses`** (Public)
- Fetch all published courses

**GET `/api/courses/user`** (Protected)
- Fetch user's courses (created if teacher, enrolled if student)

**GET `/api/courses/:id`** (Public)
- Fetch specific course details

**PUT `/api/courses/:id`** (Protected, teacher/admin)
- Update course information

**DELETE `/api/courses/:id`** (Protected, teacher/admin)
- Delete a course

**POST `/api/courses/:courseId/enroll`** (Protected)
- Enroll a student in a course

**DELETE `/api/courses/:courseId/enroll`** (Protected)
- Unenroll a student from a course

### 4. **Data Schema**

#### Course Table
```typescript
export const courses = pgTable("courses", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  title: text("title").notNull(),
  description: text("description"),
  teacherId: text("teacher_id")
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  isPublished: boolean("is_published").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});
```

#### Enrollment Table
```typescript
export const enrollments = pgTable("enrollments", {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  studentId: text('student_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  courseId: text('course_id')
    .notNull()
    .references(() => courses.id, { onDelete: 'cascade' }),
  enrolledAt: timestamp('enrolled_at').defaultNow().notNull(),
});
```

### 5. **Validation Schema**

```typescript
export const insertCourseSchema = createInsertSchema(courses)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    title: z.string()
      .min(3, "Course title must be at least 3 characters")
      .max(255),
    description: z.string()
      .min(10, "Course description must be at least 10 characters")
      .max(2000),
    teacherId: z.string()
      .min(1, "Teacher ID is required"),
    isPublished: z.boolean().optional().default(false),
  });
```

## Usage

### For Teachers/Admins

1. **Navigate to Course Creation:**
   - Go to `/create-course` route
   - Or find "Create Course" link in teacher dashboard

2. **Fill Form:**
   - Enter course title (min 3 characters)
   - Enter course description (min 10 characters)
   - Form validates in real-time

3. **Submit:**
   - Click "Create Course" button
   - JWT token automatically included in request
   - Form shows loading state during submission

4. **Confirmation:**
   - Success message displayed
   - Form automatically resets
   - Course ID returned in response

### For Integration

#### Using the Form Component Standalone

```tsx
import { CreateCourseForm } from '@/components/CreateCourseForm';

function MyPage() {
  return (
    <CreateCourseForm 
      onSuccess={() => console.log('Course created!')}
      onClose={() => setShowForm(false)}
    />
  );
}
```

#### API Integration

```typescript
// Client-side
const headers = getAuthHeaders(); // From useAuth hook
const response = await fetch('/api/courses', {
  method: 'POST',
  headers,
  body: JSON.stringify({
    title: 'My Course',
    description: 'Course description...'
  })
});
const data = await response.json();
```

## Error Handling

### Frontend Error Messages

| Scenario | Message |
|----------|---------|
| Not authenticated | "You must be logged in to create a course" |
| Expired token | "Your session has expired. Please log in again." |
| Insufficient permissions | "You do not have permission to create courses. Only teachers and admins can create courses." |
| Validation error | Shows specific field errors |
| Network error | "Failed to create course" with error details |

### Validation Rules

**Course Title:**
- ✓ Required
- ✓ Minimum 3 characters
- ✓ Maximum 255 characters

**Course Description:**
- ✓ Required
- ✓ Minimum 10 characters
- ✓ Maximum 2000 characters

## Technical Details

### Authentication Flow

1. User logs in → JWT token stored in localStorage
2. User navigates to `/create-course`
3. `ProtectedRoute` verifies authentication and role
4. Form loads with authenticated user info displayed
5. On submission:
   - `getAuthHeaders()` retrieves JWT from localStorage
   - JWT included in `Authorization: Bearer <token>` header
   - Backend validates token and user role
   - Course created with teacherId = authenticated user's ID

### State Management

**Form State:**
```typescript
const [formData, setFormData] = useState({
  title: '',
  description: ''
});
```

**UI State:**
```typescript
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [success, setSuccess] = useState(false);
const [validationErrors, setValidationErrors] = useState({
  title?: string;
  description?: string;
});
```

## Security Considerations

1. **JWT Authentication:** All requests require valid JWT token
2. **Role-Based Access Control:** Only teachers and admins can create courses
3. **Server-Side Validation:** Input validation happens on backend
4. **CORS Protection:** API endpoint protected by middleware
5. **Token Refresh:** Expired tokens trigger re-authentication
6. **Input Sanitization:** Trim and validate all inputs

## Testing

### Manual Testing Checklist

- [ ] Teacher can create course successfully
- [ ] Admin can create course successfully
- [ ] Student cannot access create course page (redirected)
- [ ] Unauthenticated user cannot create course
- [ ] Form validation shows errors for empty fields
- [ ] Form validation shows errors for short title/description
- [ ] Success message displays after creation
- [ ] Form resets after successful creation
- [ ] Error message displays on server error
- [ ] Loading state shows during submission
- [ ] Character count updates in real-time
- [ ] Clear form button works
- [ ] Back button navigation works

### Example Test Credentials

```
Teacher:
  Username: teacher_demo
  Password: demo123
  Role: teacher

Admin:
  Username: admin_demo
  Password: demo123
  Role: admin
```

## File Structure

```
EduVerse-Initial/
├── client/src/
│   ├── components/
│   │   └── CreateCourseForm.tsx       # Reusable form component
│   ├── pages/
│   │   └── create-course.tsx          # Full page component
│   ├── hooks/
│   │   └── useAuth.ts                 # Authentication hook
│   └── App.tsx                        # Route configuration
├── server/
│   ├── routes.ts                      # API endpoints
│   └── middleware/auth.ts             # Authentication middleware
└── shared/
    └── schema.ts                      # Zod schemas and types
```

## Future Enhancements

1. **Course Images/Thumbnails:**
   - Add image upload for course cover
   - Display thumbnails in course list

2. **Rich Text Editor:**
   - Replace textarea with rich text editor
   - Support formatting, links, embedded media

3. **Categories & Tags:**
   - Assign courses to categories
   - Add searchable tags

4. **Difficulty Levels:**
   - Beginner, Intermediate, Advanced
   - Filter by difficulty

5. **Prerequisites:**
   - Define prerequisite courses
   - Validate enrollment permissions

6. **Course Templates:**
   - Pre-built course structures
   - Quick-start templates

7. **Bulk Operations:**
   - Import courses from CSV
   - Batch course creation

8. **Analytics:**
   - Track course creation metrics
   - Monitor enrollment numbers

## Support & Maintenance

### Common Issues

**Issue:** Form submission fails with 401
- **Solution:** Check if JWT token is expired; user needs to re-login

**Issue:** Form shows "Insufficient permissions"
- **Solution:** User role must be 'teacher' or 'admin'; contact admin to change role

**Issue:** Validation error doesn't clear
- **Solution:** Errors auto-clear when user starts typing; check field requirements

### Debugging

Enable development mode for detailed error messages:
```typescript
// In CreateCourseForm.tsx
console.error('Course creation error:', err);  // Logs full error
```

## API Response Examples

### Success Response
```json
{
  "message": "Course created successfully",
  "course": {
    "id": "course_1a2b3c4d5e",
    "title": "Introduction to Web Development",
    "description": "A comprehensive guide to modern web development...",
    "teacherId": "user_xyz123",
    "isPublished": false,
    "createdAt": "2025-11-16T10:30:00Z",
    "updatedAt": "2025-11-16T10:30:00Z"
  }
}
```

### Validation Error Response
```json
{
  "message": "Validation failed",
  "errors": {
    "title": [
      "Course title must be at least 3 characters"
    ],
    "description": [
      "Course description must be at least 10 characters"
    ]
  }
}
```

### Permission Error Response
```json
{
  "message": "You do not have permission to create courses. Only teachers and admins can create courses.",
  "error": "Forbidden"
}
```

## License

This feature is part of the EduVerse platform and follows the same license as the main project.
