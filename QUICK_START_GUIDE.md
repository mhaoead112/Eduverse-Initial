# 🚀 Quick Start Guide - New Backend Features

## Prerequisites
1. PostgreSQL database running
2. Environment variables configured (.env file)
3. Node modules installed (`npm install` in both root and server directories)

## Step 1: Run Database Migrations

```bash
# Navigate to project root
cd "d:\VIisual Studio Code\EduVerse\Eduverse-Initial"

# Run migrations to create new tables
node run-migrations.js
```

This creates:
- `parent_children` - Links parents to students
- `events` - Calendar events
- `event_participants` - Event attendees
- `attendance` - Daily attendance tracking

## Step 2: Start the Server

```bash
# Start the development server
npm run dev
```

The server should start on `http://localhost:3001`

## Step 3: Test the New APIs

### Option A: Using the Test Script

1. Login to get JWT tokens:
```bash
# POST http://localhost:3001/api/auth/login
{
  "username": "admin",
  "password": "password123"
}
```

2. Copy the JWT token from the response

3. Edit `test-apis.js` and replace `YOUR_ADMIN_JWT_TOKEN_HERE` with your token

4. Run the test script:
```bash
node test-apis.js
# Uncomment the function calls at the bottom
```

### Option B: Using Postman/Thunder Client

Import these requests:

**Admin APIs:**
```
GET http://localhost:3001/api/admin/stats
GET http://localhost:3001/api/admin/stats/users
GET http://localhost:3001/api/admin/users
POST http://localhost:3001/api/admin/users
GET http://localhost:3001/api/admin/analytics
GET http://localhost:3001/api/admin/reports
```

**Parent APIs:**
```
GET http://localhost:3001/api/parent/children
POST http://localhost:3001/api/parent/link-child
GET http://localhost:3001/api/parent/children/:childId/grades
GET http://localhost:3001/api/parent/teachers
```

**Events APIs:**
```
GET http://localhost:3001/api/events
POST http://localhost:3001/api/events
PATCH http://localhost:3001/api/events/:id
```

## Step 4: Test the Frontend

### Admin Dashboard
1. Login as admin: `admin@eduverse.com` / `password123`
2. Navigate to Admin Dashboard
3. The stats should now load from real APIs instead of mock data
4. Try creating a new user
5. View analytics and reports

### Parent Dashboard
1. Create a parent user (or use existing)
2. Login as parent
3. Navigate to Parent Dashboard
4. Try linking a child using their username
5. View child's grades and attendance

### Teacher Calendar
1. Login as teacher
2. Navigate to Calendar
3. Create a new event
4. View events in calendar

## Step 5: Create Test Data

### Create Users via Admin Panel
```json
POST /api/admin/users

// Student
{
  "username": "student1",
  "email": "student1@school.edu",
  "fullName": "John Student",
  "role": "student",
  "password": "password123"
}

// Parent
{
  "username": "parent1",
  "email": "parent1@email.com",
  "fullName": "Mary Parent",
  "role": "parent",
  "password": "password123"
}

// Teacher
{
  "username": "teacher1",
  "email": "teacher1@school.edu",
  "fullName": "Sarah Teacher",
  "role": "teacher",
  "password": "password123"
}
```

### Link Parent to Child
```json
POST /api/parent/link-child
Authorization: Bearer <PARENT_TOKEN>

{
  "linkCode": "student1"
}
```

### Create an Event
```json
POST /api/events
Authorization: Bearer <TEACHER_TOKEN>

{
  "title": "Math Class",
  "description": "Algebra lesson",
  "eventType": "class",
  "startTime": "2025-12-04T09:00:00Z",
  "endTime": "2025-12-04T10:00:00Z",
  "location": "Room 101",
  "color": "#3b82f6"
}
```

### Enroll Student in Course
```json
POST /api/admin/enrollments
Authorization: Bearer <ADMIN_TOKEN>

{
  "studentId": "<STUDENT_ID>",
  "courseId": "<COURSE_ID>"
}
```

## Troubleshooting

### Error: "Cannot find module"
```bash
# Reinstall dependencies
npm install
cd server && npm install
```

### Error: "Table does not exist"
```bash
# Run migrations
node run-migrations.js
```

### Error: "Unauthorized"
- Check JWT token is valid
- Ensure token is sent in Authorization header: `Bearer <token>`
- Token may have expired, login again

### Error: "Role required"
- Check user has correct role
- Admin endpoints require admin role
- Some endpoints require specific roles

## Next Steps

1. **Update Admin Frontend Pages**
   - Replace mock data in `client/src/pages/admin-dashboard.tsx`
   - Update charts to use real analytics data
   - Connect user management table to API

2. **Enhance UI/UX**
   - Add loading skeletons
   - Improve error messages
   - Add success toasts
   - Better animations

3. **Add Missing Features**
   - Bulk user import UI
   - Export reports to PDF
   - Email notifications
   - Real-time updates with WebSockets

4. **Security Enhancements**
   - Add rate limiting
   - Implement refresh tokens
   - Add API request logging
   - CSRF protection

## API Documentation

See `BACKEND_IMPLEMENTATION_SUMMARY.md` for complete API documentation.

## Support

If you encounter issues:
1. Check server console for errors
2. Check browser console for frontend errors
3. Verify database connection
4. Ensure migrations have run
5. Check JWT token is valid
