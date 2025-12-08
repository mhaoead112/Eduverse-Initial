# Quick Reference - Course Creation Feature

## 🚀 Getting Started (30 seconds)

### 1. Start the Server
```bash
npm run dev
```

### 2. Log In
Visit: `http://localhost:5173/demo`
- Username: `teacher_demo`
- Password: `demo123`

### 3. Create a Course
Go to: `http://localhost:5173/create-course`

### 4. Fill Form
- Title: "My First Course"
- Description: "Learn fundamentals and best practices"

### 5. Click "Create Course"
✓ Success! Your course is created

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `client/src/components/CreateCourseForm.tsx` | Main form component |
| `client/src/pages/create-course.tsx` | Full page wrapper |
| `client/src/components/CoursesList.tsx` | Display courses |
| `server/routes.ts` | API endpoints (lines 1378-1550) |
| `shared/schema.ts` | Data validation schemas |
| `client/src/App.tsx` | Route configuration |

---

## 🔗 API Endpoints

```
POST   /api/courses                    → Create course
GET    /api/courses                    → Get all courses
GET    /api/courses/user               → Get user's courses
GET    /api/courses/:id                → Get course details
PUT    /api/courses/:id                → Update course
DELETE /api/courses/:id                → Delete course
POST   /api/courses/:id/enroll         → Enroll student
DELETE /api/courses/:id/enroll         → Unenroll student
```

---

## 📋 Form Fields

| Field | Requirement |
|-------|-------------|
| Title | Min 3, Max 255 chars |
| Description | Min 10, Max 2000 chars |

---

## 🛡️ Authentication

Header format:
```
Authorization: Bearer <jwt_token>
```

Token stored in: `localStorage.eduverse_token`

---

## ✅ Validation Rules

**Title:**
```
✓ Required
✓ Min 3 characters
✓ Max 255 characters
✗ Empty = Error
✗ Too short = Error
```

**Description:**
```
✓ Required
✓ Min 10 characters
✓ Max 2000 characters
✗ Empty = Error
✗ Too short = Error
```

---

## 🎯 Access Control

| Role | Access |
|------|--------|
| teacher | ✓ Can create, edit, delete own courses |
| admin | ✓ Can create, edit, delete any course |
| student | ✗ Cannot create courses |
| unauthenticated | ✗ Must log in first |

---

## 🔴 Error Codes

| Code | Meaning | Fix |
|------|---------|-----|
| 400 | Validation error | Check field requirements |
| 401 | Unauthorized | Log in again |
| 403 | Forbidden | Must be teacher/admin |
| 404 | Not found | Course doesn't exist |
| 500 | Server error | Contact support |

---

## 🧪 Test Cases

1. **Happy Path:** Create course successfully
2. **Validation:** Empty title
3. **Validation:** Short description
4. **Auth:** No token
5. **Auth:** Expired token
6. **Permission:** Student user
7. **Success:** Form resets after creation
8. **Error:** Server error shown

---

## 📝 Example Request

```bash
curl -X POST http://localhost:3000/api/courses \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Web Development 101",
    "description": "Learn HTML, CSS, and JavaScript for building modern websites"
  }'
```

---

## 📦 Example Response

```json
{
  "message": "Course created successfully",
  "course": {
    "id": "course_xyz123",
    "title": "Web Development 101",
    "description": "Learn HTML, CSS, and JavaScript...",
    "teacherId": "user_abc123",
    "isPublished": false,
    "createdAt": "2025-11-16T10:30:00Z",
    "updatedAt": "2025-11-16T10:30:00Z"
  }
}
```

---

## 🎨 UI Components Used

- Button (submit, clear, cancel)
- Input (course title)
- Textarea (course description)
- Card (container)
- Alert (success/error)
- Badge (status indicator)
- Label (field labels)

---

## 📚 Documentation Files

1. `COURSE_CREATION_SUMMARY.md` - Overview of implementation
2. `COURSE_CREATION_FEATURE.md` - Complete feature documentation
3. `COURSE_CREATION_INTEGRATION_GUIDE.md` - Integration and testing guide

---

## 🔐 Security Features

✓ JWT authentication on all endpoints
✓ Role-based access control (RBAC)
✓ Input validation (client + server)
✓ Zod schema validation
✓ HTTP status codes
✓ Error handling
✓ CORS protection

---

## 💡 Quick Tips

### Test with Teacher Account
```
Username: teacher_demo
Password: demo123
Role: teacher
```

### Test with Admin Account
```
Username: admin_demo
Password: demo123
Role: admin
```

### Create Demo Users
```bash
POST http://localhost:3000/api/auth/create-demo-users
```

### Check Form State
Open browser DevTools Console and run:
```javascript
localStorage.getItem('eduverse_token')  // Check JWT
localStorage.getItem('eduverse_user')   // Check user info
```

---

## 🚨 Common Issues

### "You must be logged in"
→ Login first with valid credentials

### "Insufficient permissions"
→ User must be teacher or admin

### "Validation failed"
→ Check title (3-255) and description (10-2000) length

### "Session expired"
→ Log in again to refresh token

---

## 📊 Component Structure

```
CreateCoursePage (Full Page)
└── DashboardLayout
    ├── CreateCourseForm (Left: 2/3)
    │   ├── Input (Title)
    │   ├── Textarea (Description)
    │   ├── Validation Messages
    │   ├── Loading State
    │   ├── Success Message
    │   ├── Error Alert
    │   └── Action Buttons
    └── Sidebar (Right: 1/3)
        ├── Quick Tips
        ├── Help Section
        └── Course Status
```

---

## 🔄 Data Flow

```
User fills form
        ↓
Validates client-side
        ↓
Clicks "Create Course"
        ↓
Gets JWT from localStorage
        ↓
POST to /api/courses with headers
        ↓
Backend validates JWT + role
        ↓
Validates data with Zod schema
        ↓
Creates course in database
        ↓
Returns course object
        ↓
Shows success message
        ↓
Resets form
```

---

## 🎓 Usage Examples

### Basic Form Usage
```tsx
<CreateCourseForm 
  onSuccess={() => alert('Course created!')}
/>
```

### With Callback
```tsx
<CreateCourseForm 
  onSuccess={handleSuccess}
  onClose={handleClose}
/>
```

### Display Courses
```tsx
<CoursesList 
  filter="published"
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

---

## 📞 Support

Need help?
1. Check documentation files
2. Review error messages
3. Check browser console
4. Check server logs
5. Verify JWT token in localStorage
6. Ensure user role is correct

---

## ✨ Features Implemented

✅ Form with validation
✅ JWT authentication
✅ Role-based access control
✅ Loading states
✅ Error handling
✅ Success confirmation
✅ Form reset
✅ Character count
✅ Real-time validation
✅ Responsive design
✅ Type-safe code
✅ Complete documentation

---

## 🔗 Useful Links

- Frontend Form: `http://localhost:5173/create-course`
- API Docs: See `COURSE_CREATION_FEATURE.md`
- Integration: See `COURSE_CREATION_INTEGRATION_GUIDE.md`
- Source: `client/src/components/CreateCourseForm.tsx`

---

**Version:** 1.0  
**Last Updated:** November 16, 2025  
**Status:** ✅ Ready for Use
