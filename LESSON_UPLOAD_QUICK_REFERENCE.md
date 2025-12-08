# Lesson Upload Feature - Quick Reference

## Access the Feature
**URL:** `http://localhost:5173/lessons`

**Required Role:** Teacher or Admin

**Demo Credentials:**
- Username: `teacher_demo`
- Password: `demo123`

---

## User Interface

### Left Panel: Upload Form
1. **Course Selection** - Dropdown to select which course to upload to
2. **Lesson Title** - Input field for the lesson name
3. **File Upload** - Drag-drop or click to select file
4. **Upload Button** - Submit form to upload

### Right Sidebar: Your Courses
- Shows all courses you own
- Click a course to view/manage its lessons

### Bottom Section: Lessons List
- Shows all lessons for selected course
- File icon indicates file type (PDF, Word, PowerPoint, Image, etc.)
- File size and upload date displayed
- Download button to retrieve file
- Delete button to remove lesson

---

## Supported File Types

| Type | Extensions | Icon |
|------|-----------|------|
| PDF | .pdf | 📄 |
| Word | .doc, .docx | 📝 |
| PowerPoint | .ppt, .pptx | 📊 |
| Images | .jpg, .jpeg, .png, .gif, .webp | 🖼️ |
| Text | .txt | 📃 |

---

## Validation Rules

| Field | Rule |
|-------|------|
| Course | Required |
| Title | 1-255 characters |
| File | Max 50MB |
| File Type | Must be supported format |

---

## API Endpoints

### Upload Lesson
```
POST /api/lessons/upload
Content-Type: multipart/form-data
Authorization: Bearer <TOKEN>

Body:
{
  courseId: "course_id",
  lessonTitle: "Lesson Title",
  file: <FILE>
}

Response (201):
{
  "message": "Lesson uploaded successfully",
  "lesson": { ... }
}
```

### Get Lessons for Course
```
GET /api/courses/:courseId/lessons

Response (200):
{
  "lessons": [ ... ],
  "message": "Lessons retrieved successfully"
}
```

### Delete Lesson
```
DELETE /api/lessons/:lessonId
Authorization: Bearer <TOKEN>

Response (200):
{
  "message": "Lesson deleted successfully",
  "lessonId": "lesson_id"
}
```

---

## Frontend Components

### LessonUploadForm
**Location:** `client/src/components/LessonUploadForm.tsx`

**Props:**
```typescript
interface LessonUploadFormProps {
  courses?: Course[]; // Array of Course objects
}
```

**Import:**
```tsx
import { LessonUploadForm } from "@/components/LessonUploadForm";
```

**Usage:**
```tsx
<LessonUploadForm courses={myCourses} />
```

### LessonManagementPage
**Location:** `client/src/pages/lesson-management.tsx`

**Access:** Route `/lessons`

**Features:**
- Full lesson management interface
- Course selector
- Lesson upload form
- Lessons list with download/delete
- Responsive design

---

## Database Schema

### Lessons Table
```sql
CREATE TABLE "lessons" (
  "id" text PRIMARY KEY,
  "course_id" text NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  "title" text NOT NULL,
  "file_name" text NOT NULL,
  "file_path" text NOT NULL,
  "file_type" text NOT NULL,
  "file_size" text NOT NULL,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
)
```

### Zod Schema
```typescript
export const insertLessonSchema = z.object({
  title: z.string().min(1).max(255),
  courseId: z.string().min(1),
  fileName: z.string().min(1),
  filePath: z.string().min(1),
  fileType: z.string().min(1),
  fileSize: z.string().min(1)
})
```

---

## Common Tasks

### Upload a Lesson
1. Go to `/lessons`
2. Select course from dropdown
3. Enter lesson title
4. Select file (drag-drop or click)
5. Click "Upload Lesson"
6. Wait for progress bar
7. See success message

### View Course Lessons
1. Go to `/lessons`
2. Click course name in sidebar
3. Lessons appear in bottom section
4. Each lesson shows file details

### Download Lesson
1. Go to `/lessons`
2. Find lesson in list
3. Click blue "Download" button
4. File downloads to computer

### Delete Lesson
1. Go to `/lessons`
2. Find lesson in list
3. Click red "Delete" button
4. Confirm deletion
5. Lesson removed from list

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Course is required" | Select a course from dropdown |
| "Lesson title is required" | Enter title in text field |
| "No file provided" | Click to select or drag-drop a file |
| "File type not allowed" | Use supported format (PDF, Word, etc.) |
| "File size exceeds 50MB" | Use smaller file (< 50MB) |
| "Access Denied" | Login as teacher or admin |
| "Network error" | Check server is running on :3001 |

---

## File Storage Location
- **Server:** `<project_root>/uploads/`
- **Format:** `fieldname-TIMESTAMP-RANDOM.ext`
- **Example:** `file-1700000000000-123456789.pdf`

---

## Route Protection
Route `/lessons` is protected by:
- `authMiddleware` - Requires valid JWT token
- `MultiRoleRoute` - Requires role: teacher or admin

Unauthorized users will be redirected to their dashboard.

---

## Integration Examples

### Check User Role
```typescript
const { user } = useAuth();
if (user?.role === 'teacher' || user?.role === 'admin') {
  // Can access lessons
}
```

### Get Auth Headers
```typescript
const { getAuthHeaders } = useAuth();
const headers = getAuthHeaders();
// { Authorization: "Bearer <token>", Content-Type: "application/json" }
```

### Make Authenticated Request
```typescript
const { getAuthHeaders } = useAuth();
const response = await fetch('/api/lessons/upload', {
  method: 'POST',
  headers: getAuthHeaders(),
  body: formData
});
```

---

## Performance Tips

1. **Compress Files** - Reduce file size before upload
2. **Use Supported Formats** - PDFs generally smaller than DOCX
3. **Batch Uploads** - Upload multiple lessons quickly
4. **Check Connection** - Use wired network for large files
5. **Clear Cache** - If lessons don't appear, refresh page

---

## Security Notes

✅ **Implemented:**
- JWT token required for upload
- Role-based access control (teachers/admins only)
- File type whitelist validation
- File size limits (50MB max)
- Input validation on title

⚠️ **To Implement:**
- Course ownership verification
- Virus/malware scanning
- File encryption at rest
- Rate limiting per user
- Audit logging

---

## Related Files

| File | Purpose |
|------|---------|
| `client/src/components/LessonUploadForm.tsx` | Reusable upload form component |
| `client/src/pages/lesson-management.tsx` | Full lesson management page |
| `server/routes.ts` | Backend API endpoints |
| `shared/schema.ts` | Database and validation schemas |
| `migrations/0004_add_lessons_table.sql` | Database migration |
| `client/src/App.tsx` | Route configuration |

---

## Status & Next Steps

✅ **Completed:**
- Backend API endpoints (upload, list, delete)
- Frontend components (upload form, management page)
- Database schema and migration
- File upload with progress tracking
- Validation and error handling
- Route protection and role-based access

🔄 **In Progress:**
- Database persistence (mock only)
- File cleanup on deletion

❌ **TODO:**
- Connect to actual database
- Implement file download endpoint
- Add course ownership verification
- Virus scanning
- Performance optimizations

---

For detailed information, see `LESSON_UPLOAD_FEATURE.md`
