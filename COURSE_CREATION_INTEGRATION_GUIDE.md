# Course Creation Feature - Integration Guide

## Quick Start

### 1. Access the Course Creation Form

**For Teachers/Admins:**
```
Navigate to: http://localhost:5173/create-course
```

The page is protected and requires:
- User authentication (must be logged in)
- User role: `teacher` or `admin`

### 2. Log In with Demo Account

Use these credentials to test the feature:

```
Role: Teacher
Username: teacher_demo
Password: demo123

OR

Role: Admin
Username: admin_demo
Password: demo123
```

To create demo users, call:
```bash
POST http://localhost:3000/api/auth/create-demo-users
```

### 3. Fill Out the Course Form

Required Fields:
- **Course Title** (3-255 characters)
- **Course Description** (10-2000 characters)

Example:
```
Title: "Introduction to Web Development"
Description: "Learn HTML, CSS, and JavaScript fundamentals to build modern, responsive websites. This course covers industry best practices and real-world project examples."
```

### 4. Submit the Form

Click "Create Course" button to:
1. Validate form data
2. Send POST request to `/api/courses`
3. Include JWT token in Authorization header
4. Create course in database

### 5. Receive Confirmation

Upon success:
- ✓ Green success message appears
- ✓ Form automatically resets
- ✓ Course ID returned in response
- ✓ New course available in system

---

## Component Architecture

```
App (Router)
│
└─ /create-course (Route)
   │
   ├─ ProtectedRoute (Role: teacher, admin)
   │  │
   │  └─ CreateCoursePage
   │     │
   │     ├─ DashboardLayout
   │     │
   │     ├─ CreateCourseForm (main form)
   │     │  ├─ Form validation
   │     │  ├─ JWT authentication
   │     │  ├─ API communication
   │     │  └─ Error/Success handling
   │     │
   │     └─ Info Sidebar
   │        ├─ Quick Tips
   │        ├─ Help Section
   │        └─ Course Status
   │
   └─ CoursesList (optional - show created courses)
```

---

## Data Flow

### Creating a Course

```
1. User fills form
   ↓
2. Form validation (client-side)
   ↓
3. User clicks "Create Course"
   ↓
4. Get JWT from localStorage via useAuth hook
   ↓
5. POST request to /api/courses with:
   - Headers: { Authorization: "Bearer <jwt>" }
   - Body: { title, description }
   ↓
6. Backend validates:
   - JWT token validity
   - User role (teacher/admin)
   - Input data (Zod schema)
   ↓
7. Database stores course with teacherId = authenticated user's ID
   ↓
8. Return success response with course data
   ↓
9. Display success message
   ↓
10. Reset form for next course
```

### Fetching Courses

```
GET /api/courses
│
├─ Teacher/Admin: Returns courses they created
├─ Student: Returns courses they're enrolled in
└─ Public: Returns all published courses
```

---

## API Endpoints Reference

### Create Course
```
POST /api/courses
Content-Type: application/json
Authorization: Bearer <jwt_token>

Request Body:
{
  "title": "Course Title",
  "description": "Course Description"
}

Response (201):
{
  "message": "Course created successfully",
  "course": {
    "id": "course_xyz123",
    "title": "Course Title",
    "description": "Course Description",
    "teacherId": "user_abc123",
    "isPublished": false,
    "createdAt": "2025-11-16T10:30:00Z",
    "updatedAt": "2025-11-16T10:30:00Z"
  }
}
```

### Get User's Courses
```
GET /api/courses/user
Authorization: Bearer <jwt_token>

Response (200):
[
  {
    "id": "course_1",
    "title": "Web Development",
    "description": "...",
    "teacherId": "user_abc123",
    "isPublished": false,
    "createdAt": "2025-11-16T10:30:00Z",
    "updatedAt": "2025-11-16T10:30:00Z"
  }
]
```

### Get Specific Course
```
GET /api/courses/:courseId

Response (200):
{
  "id": "course_xyz123",
  "title": "Web Development",
  "description": "...",
  "teacherId": "user_abc123",
  "isPublished": false,
  "createdAt": "2025-11-16T10:30:00Z",
  "updatedAt": "2025-11-16T10:30:00Z"
}
```

### Update Course
```
PUT /api/courses/:courseId
Content-Type: application/json
Authorization: Bearer <jwt_token>

Request Body:
{
  "title": "Updated Title",
  "description": "Updated Description",
  "isPublished": true
}

Response (200):
{
  "message": "Course updated successfully",
  "course": { ... }
}
```

### Delete Course
```
DELETE /api/courses/:courseId
Authorization: Bearer <jwt_token>

Response (200):
{
  "message": "Course deleted successfully",
  "courseId": "course_xyz123"
}
```

### Enroll Student
```
POST /api/courses/:courseId/enroll
Authorization: Bearer <jwt_token>

Response (201):
{
  "message": "Successfully enrolled in course",
  "enrollment": {
    "id": "enrollment_123",
    "studentId": "user_student123",
    "courseId": "course_xyz123",
    "enrolledAt": "2025-11-16T11:00:00Z"
  }
}
```

---

## State Management

### Form State
```typescript
interface FormData {
  title: string;
  description: string;
}
```

### UI State
```typescript
interface UIState {
  loading: boolean;           // Form submission in progress
  error: string | null;       // Error message if any
  success: boolean;           // Success confirmation
  validationErrors: {
    title?: string;
    description?: string;
  };
}
```

### Auth State (from useAuth hook)
```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  getAuthHeaders: () => HeadersInit;
}
```

---

## Error Handling

### Common Errors and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "You must be logged in" | No JWT token | Login with credentials |
| "Your session has expired" | JWT expired | Re-login to get new token |
| "Insufficient permissions" | User role is not teacher/admin | Admin must elevate role |
| "Validation failed" | Title too short/long or missing description | Check field requirements |
| "Failed to create course" | Server error | Check server logs, retry |
| "Network error" | Connection issue | Check internet, try again |

### Error Message Examples

**Validation Error:**
```json
{
  "message": "Validation failed",
  "errors": {
    "title": ["Course title must be at least 3 characters"],
    "description": ["Course description must be at least 10 characters"]
  }
}
```

**Authentication Error:**
```json
{
  "message": "Your session has expired. Please log in again.",
  "error": "Unauthorized"
}
```

**Permission Error:**
```json
{
  "message": "You do not have permission to create courses. Only teachers and admins can create courses.",
  "error": "Forbidden"
}
```

---

## Testing Checklist

### Frontend Testing

- [ ] Form displays correctly
- [ ] Character count updates in real-time
- [ ] Validation errors appear for empty fields
- [ ] Validation errors appear for fields below minimum length
- [ ] Validation errors clear when typing
- [ ] Loading state shows during submission
- [ ] Success message appears after creation
- [ ] Form resets after successful creation
- [ ] Error message appears on server error
- [ ] Authenticated user name displays
- [ ] Clear form button clears all inputs
- [ ] Back button navigates away
- [ ] Page is not accessible for unauthenticated users
- [ ] Page is not accessible for students

### Backend Testing

```bash
# Test endpoint exists
curl http://localhost:3000/api/courses

# Test course creation
curl -X POST http://localhost:3000/api/courses \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Course",
    "description": "This is a test course with a valid description"
  }'

# Test missing authentication
curl -X POST http://localhost:3000/api/courses \
  -H "Content-Type: application/json" \
  -d '{"title": "Test", "description": "Test description"}'

# Test invalid role
# (Use student token instead of teacher token)
```

### Database Testing

```sql
-- Check if courses table exists
SELECT * FROM courses;

-- Check if course was created
SELECT * FROM courses WHERE teacher_id = 'user_xyz123';

-- Check enrollments table
SELECT * FROM enrollments WHERE course_id = 'course_xyz123';
```

---

## Performance Considerations

1. **Form Validation:** Real-time validation happens as user types (no debounce needed for simple validation)

2. **API Response Time:** Typical response time < 500ms for course creation

3. **Database Indexes:** Recommended indexes:
   - `courses.teacherId`
   - `courses.isPublished`
   - `enrollments.studentId`
   - `enrollments.courseId`

4. **Caching:** Consider caching:
   - List of courses (invalidate on create)
   - User's courses (invalidate on create/update)

---

## Security Best Practices

1. **JWT Validation:**
   - Token checked on every protected endpoint
   - Token expiry: 2 hours
   - Token refresh on login

2. **Authorization:**
   - Role-based access control
   - Users can only edit/delete own courses (or admins can)
   - Teachers can't create courses with other teachers as owner

3. **Input Validation:**
   - Client-side validation for UX
   - Server-side validation for security
   - Zod schema enforces type safety

4. **CORS:**
   - API endpoints protected by CORS middleware
   - Only authorized origins allowed

5. **Rate Limiting:**
   - Should implement rate limiting on course creation (prevent spam)
   - Currently uses auth middleware for basic protection

---

## Future Enhancements

### Phase 2
- [ ] Course images/thumbnails
- [ ] Rich text editor for description
- [ ] Course categories
- [ ] Course difficulty levels
- [ ] Course prerequisites

### Phase 3
- [ ] Bulk course import
- [ ] Course templates
- [ ] Course scheduling
- [ ] Enrollment analytics
- [ ] Course recommendations

### Phase 4
- [ ] AI-assisted course creation
- [ ] Automated course content generation
- [ ] Prerequisite validation
- [ ] Learning outcome tracking

---

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] JWT secret key secure
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Error logging configured
- [ ] Database backups enabled
- [ ] SSL/TLS certificates valid
- [ ] Authentication tests passing
- [ ] Frontend build optimized
- [ ] API documentation updated

---

## Support Resources

- **Documentation:** See `COURSE_CREATION_FEATURE.md`
- **API Reference:** See `/api/courses` endpoints
- **Database Schema:** See `shared/schema.ts`
- **Frontend Components:** See `client/src/components/`
- **Test Credentials:** Run `/api/auth/create-demo-users`

---

## Troubleshooting

### Issue: Form not submitting
- Check browser console for errors
- Verify JWT token is valid
- Check network tab for failed requests
- Ensure POST endpoint is accessible

### Issue: Validation error persists
- Clear browser cache and localStorage
- Refresh page
- Re-login to get fresh token

### Issue: Course not created despite success message
- Check database directly
- Review server logs for errors
- Verify database connection

### Issue: Permission denied
- Check user role in localStorage
- Verify role matches allowed roles (teacher/admin)
- Contact admin to update user role

---

## Version History

- **v1.0** (2025-11-16)
  - Initial release
  - Basic course creation
  - Form validation
  - Error handling
  - JWT authentication

---

## License

This feature is part of the EduVerse platform and follows the project's license.
