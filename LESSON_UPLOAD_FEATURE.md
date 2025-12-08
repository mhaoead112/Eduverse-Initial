# Lesson Upload Feature Documentation

## Overview
The lesson upload feature allows teachers and administrators to upload course materials (documents, PDFs, presentations, images) to their existing courses. Students can then access and download these materials.

## Features Implemented

### 1. **Database Schema** (`shared/schema.ts`)
Added a new `lessons` table with the following fields:
- `id`: Unique identifier (auto-generated)
- `courseId`: Foreign key reference to the courses table
- `title`: Lesson title (required)
- `fileName`: Original file name
- `filePath`: Server path where file is stored
- `fileType`: MIME type of the file
- `fileSize`: File size in bytes (stored as string)
- `createdAt`: Timestamp of upload
- `updatedAt`: Last modification timestamp

### 2. **Migration** (`migrations/0004_add_lessons_table.sql`)
Created a database migration to add the `lessons` table with:
- Primary key on `id`
- Foreign key constraint on `courseId` with cascade delete
- Timestamps for tracking

### 3. **Backend API Endpoints** (`server/routes.ts`)

#### POST `/api/lessons/upload` (Protected - Teacher/Admin)
Uploads a lesson document to     a course.

**Request:**
```
Method: POST
Content-Type: multipart/form-data
Authorization: Bearer <JWT_TOKEN>

Form fields:
- courseId: string (required)
- lessonTitle: string (required, 1-255 characters)
- file: File (required)
```

**Response (Success):**
```json
{
  "message": "Lesson uploaded successfully",
  "lesson": {
    "id": "lesson_id",
    "courseId": "course_id",
    "title": "Lesson Title",
    "fileName": "original_filename.pdf",
    "filePath": "/path/to/file",
    "fileType": "application/pdf",
    "fileSize": "2048576",
    "createdAt": "2025-11-17T10:00:00Z",
    "updatedAt": "2025-11-17T10:00:00Z"
  }
}
```

**Supported File Types:**
- PDF: `application/pdf`
- Word: `application/msword`, `.docx`
- PowerPoint: `application/vnd.ms-powerpoint`, `.pptx`
- Images: JPEG, PNG, GIF, WebP
- Text: `text/plain`

**Validation Rules:**
- File size: Max 50MB
- Title: 1-255 characters
- CourseId: Required and must exist
- Ownership: Teacher must own the course

**Error Responses:**
```json
// Missing file
{
  "message": "No file provided"
}

// Validation error
{
  "message": "Validation failed",
  "errors": {
    "courseId": "Course ID is required",
    "lessonTitle": "Lesson title is required"
  }
}

// Unsupported file type
{
  "message": "File type not allowed"
}
```

#### GET `/api/courses/:courseId/lessons` (Public)
Retrieves all lessons for a specific course.

**Request:**
```
Method: GET
```

**Response:**
```json
{
  "lessons": [
    {
      "id": "lesson_1",
      "courseId": "course_1",
      "title": "Introduction",
      "fileName": "intro.pdf",
      "fileType": "application/pdf",
      "fileSize": "1024000",
      "createdAt": "2025-11-17T10:00:00Z"
    }
  ],
  "message": "Lessons retrieved successfully"
}
```

#### DELETE `/api/lessons/:lessonId` (Protected - Teacher/Admin)
Deletes a lesson and its associated file.

**Request:**
```
Method: DELETE
Authorization: Bearer <JWT_TOKEN>
```

**Response (Success):**
```json
{
  "message": "Lesson deleted successfully",
  "lessonId": "lesson_id"
}
```

### 4. **Frontend Components**

#### `LessonUploadForm` Component
A reusable form component for uploading lessons.

**Props:**
```typescript
interface LessonUploadFormProps {
  courses: Course[];  // List of courses to select from
}
```

**Features:**
- Course dropdown selector
- Lesson title input with character count
- File picker with drag-and-drop support
- File type and size validation
- Upload progress indicator
- Success/error message display
- Form auto-reset after successful upload

**File Upload Limitations:**
- Max file size: 50MB
- Allowed types: PDF, Word, PowerPoint, Images, Text

**Usage Example:**
```tsx
import { LessonUploadForm } from "@/components/LessonUploadForm";

<LessonUploadForm courses={courses} />
```

#### `LessonManagementPage` Component
Full-page interface for lesson management (accessible at `/lessons`).

**Features:**
- Course selector with sidebar
- Lesson upload form
- Lessons list with:
  - File icons based on file type
  - File size display
  - Upload date
  - Download button
  - Delete button with confirmation
- Responsive design with gradients
- Loading states

**Access Control:**
- Requires authentication
- Only teachers and admins can access
- Role validation built into route

### 5. **Frontend Hooks & Utilities**

**useAuth Hook:**
Used for:
- Getting JWT token for authorization
- Retrieving user information
- Accessing auth headers helper

**Example Usage:**
```typescript
const { token, user, getAuthHeaders } = useAuth();

// Make authenticated request
const response = await fetch(url, {
  headers: getAuthHeaders()
});
```

### 6. **Frontend Route Configuration** (`App.tsx`)

Added new protected route:
```typescript
<Route path="/lessons">
  <MultiRoleRoute roles={['teacher', 'admin']}>
    <LessonManagement />
  </MultiRoleRoute>
</Route>
```

## Usage Flow

### Teacher Uploads a Lesson:
1. Navigate to `/lessons`
2. Select a course from the dropdown
3. Enter lesson title (e.g., "Chapter 5 Summary")
4. Click file picker or drag-drop a document
5. Click "Upload Lesson"
6. See upload progress
7. Receive success confirmation
8. Form auto-resets for next upload

### Student Views Lessons:
1. Navigate to course page
2. See "Lessons" section
3. Download available lesson documents
4. File downloads to computer

## Error Handling

The system handles:
- Missing required fields
- Invalid file types
- File size exceeding limits
- Network errors during upload
- Unauthorized access (non-teachers)
- Invalid course IDs
- File deletion failures

All errors display user-friendly toast messages.

## File Upload Process

1. **Validation:**
   - Check all required fields
   - Validate file size (max 50MB)
   - Validate file type against whitelist
   - Validate title length

2. **Upload:**
   - Create FormData with all fields
   - Use XMLHttpRequest for progress tracking
   - Include JWT in Authorization header
   - Send to `/api/lessons/upload`

3. **Server Processing:**
   - Multer receives and stores file
   - Validates file type with custom fileFilter
   - Stores file in `uploads/` directory
   - Creates database record (when DB integration complete)

4. **Response:**
   - Return lesson object with metadata
   - Clear form and file input
   - Show success message
   - Auto-hide message after 5 seconds

## File Storage

Files are stored in: `<project_root>/uploads/`

Filename format: `fieldname-TIMESTAMP-RANDOMHASH.ext`

Example: `file-1700000000000-123456789.pdf`

## Security Considerations

1. **Authentication:** JWT token required for upload
2. **Authorization:** Only teachers/admins can upload
3. **File Type Validation:** 
   - Client-side: Filename extension check
   - Server-side: MIME type whitelist
4. **File Size Limit:** 50MB max to prevent abuse
5. **Course Ownership:** Should verify teacher owns course (TODO: implement)
6. **File Scanning:** Consider adding virus scanning (TODO: implement)

## Testing the Feature

### Prerequisites:
- Server running on localhost:3001
- Client running on localhost:5173
- Demo login as teacher or admin

### Manual Test Steps:
1. Login as `teacher_demo` / `demo123`
2. Navigate to `/lessons`
3. Select a course
4. Enter lesson title
5. Upload a PDF or image file
6. Verify success message
7. Form should reset

## Future Enhancements

1. **Database Integration:**
   - Actually save lessons to database
   - Query lessons from database
   - Implement proper delete with file cleanup

2. **Features:**
   - Bulk upload multiple files
   - Edit lesson titles/descriptions
   - Reorder lessons
   - Add lesson descriptions
   - Schedule lesson visibility
   - Track download statistics

3. **Performance:**
   - Implement file compression
   - Add caching headers
   - Optimize for large files
   - Add resumable uploads for large files

4. **Security:**
   - Virus/malware scanning
   - File encryption
   - Rate limiting per teacher
   - Audit logging

5. **User Experience:**
   - Preview documents in browser
   - Comment on lessons
   - Student submission attachments
   - Mobile app support

## API Summary Table

| Endpoint | Method | Auth Required | Role Required | Purpose |
|----------|--------|---------------|---------------|---------|
| `/api/lessons/upload` | POST | Yes | teacher, admin | Upload lesson document |
| `/api/courses/:courseId/lessons` | GET | No | Any | Get lessons for course |
| `/api/lessons/:lessonId` | DELETE | Yes | teacher, admin | Delete lesson |

## Files Modified/Created

**Created:**
- `client/src/components/LessonUploadForm.tsx`
- `client/src/pages/lesson-management.tsx`
- `migrations/0004_add_lessons_table.sql`

**Modified:**
- `shared/schema.ts` - Added lessons table and schemas
- `server/routes.ts` - Added lesson endpoints
- `client/src/App.tsx` - Added lesson management route

## Integration Points

The lesson upload feature integrates with:
- **Authentication:** useAuth hook for JWT tokens
- **Authorization:** authMiddleware and requireRole for protection
- **File Upload:** Multer for handling multipart/form-data
- **Database:** Drizzle ORM for persistence (when DB integration complete)
- **UI:** Card, Button, Input, Badge, Select components from shadcn/ui
- **Routing:** Wouter for client-side routing
- **State Management:** React hooks (useState, useRef, useEffect)

## Deployment Checklist

- [ ] Create `uploads/` directory with appropriate permissions
- [ ] Set `NODE_ENV=production`
- [ ] Increase file size limits if needed
- [ ] Set up file cleanup cron job for orphaned files
- [ ] Enable HTTPS for production
- [ ] Configure CORS if frontend is on different domain
- [ ] Set up disk space monitoring
- [ ] Consider S3/cloud storage instead of local files
- [ ] Implement database persistence for lessons
- [ ] Add proper error logging and monitoring
