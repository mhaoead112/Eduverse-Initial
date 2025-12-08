# Lesson Upload Feature - Code Examples

## Frontend Examples

### Basic Component Usage

```tsx
import { LessonUploadForm } from "@/components/LessonUploadForm";

// Simple usage with courses
const courses = [
  { id: "1", title: "Mathematics 101" },
  { id: "2", title: "Physics Basics" }
];

export function MyComponent() {
  return <LessonUploadForm courses={courses} />;
}
```

### Form Validation Example

```tsx
// This is already implemented in LessonUploadForm, but here's the pattern:

const validateForm = (): boolean => {
  const errors: Record<string, string> = {};

  if (!selectedCourse) {
    errors.course = "Please select a course";
  }

  if (!lessonTitle.trim()) {
    errors.lessonTitle = "Lesson title is required";
  } else if (lessonTitle.length > 255) {
    errors.lessonTitle = "Title must be 255 characters or less";
  }

  if (!selectedFile) {
    errors.file = "Please select a file to upload";
  } else if (!ALLOWED_FILE_TYPES.includes(selectedFile.type)) {
    errors.file = "File type not allowed";
  } else if (selectedFile.size > MAX_FILE_SIZE) {
    errors.file = "File size exceeds 50MB limit";
  }

  setErrors(errors);
  return Object.keys(errors).length === 0;
};
```

### File Upload with Progress

```tsx
// Create FormData and XMLHttpRequest
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const formData = new FormData();
  formData.append("courseId", selectedCourse);
  formData.append("lessonTitle", lessonTitle);
  formData.append("file", selectedFile);

  const xhr = new XMLHttpRequest();

  // Track progress
  xhr.upload.addEventListener("progress", (event) => {
    if (event.lengthComputable) {
      const percentComplete = (event.loaded / event.total) * 100;
      setUploadProgress(Math.round(percentComplete));
    }
  });

  // Handle completion
  xhr.addEventListener("load", () => {
    if (xhr.status === 201) {
      // Success
      toast({ title: "Success!", description: "Lesson uploaded" });
      // Reset form
      setLessonTitle("");
      setSelectedFile(null);
    }
  });

  // Handle errors
  xhr.addEventListener("error", () => {
    toast({ title: "Error", description: "Upload failed", variant: "destructive" });
  });

  xhr.open("POST", "http://localhost:3001/api/lessons/upload");
  xhr.setRequestHeader("Authorization", `Bearer ${token}`);
  xhr.send(formData);
};
```

### Using useAuth Hook for Authorization

```tsx
import { useAuth } from "@/hooks/useAuth";

export function LessonManager() {
  const { user, token, getAuthHeaders } = useAuth();

  // Check if user can upload
  if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
    return <div>Access Denied</div>;
  }

  // Use auth headers for API calls
  const fetchLessons = async (courseId: string) => {
    const response = await fetch(
      `/api/courses/${courseId}/lessons`,
      {
        headers: getAuthHeaders()
      }
    );
    return response.json();
  };

  return <div>Lesson Management</div>;
}
```

### File Type Detection

```tsx
const getFileIcon = (fileType: string): string => {
  const icons: Record<string, string> = {
    'application/pdf': '📄',
    'application/msword': '📝',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
    'application/vnd.ms-powerpoint': '📊',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': '📊',
  };

  for (const [mime, icon] of Object.entries(icons)) {
    if (fileType.includes(mime)) return icon;
  }

  if (fileType.includes('image')) return '🖼️';
  if (fileType.includes('text')) return '📃';
  return '📦';
};

// Usage
const icon = getFileIcon(lesson.fileType); // Returns emoji
```

### Drag and Drop Handling

```tsx
const handleDragOver = (e: React.DragEvent) => {
  e.preventDefault();
  setIsDragging(true);
};

const handleDragLeave = (e: React.DragEvent) => {
  e.preventDefault();
  setIsDragging(false);
};

const handleDrop = (e: React.DragEvent) => {
  e.preventDefault();
  setIsDragging(false);

  const files = e.dataTransfer.files;
  if (files && files.length > 0) {
    setSelectedFile(files[0]);
  }
};

// JSX
<div
  onDragOver={handleDragOver}
  onDragLeave={handleDragLeave}
  onDrop={handleDrop}
  className={`border-2 border-dashed rounded-lg p-6 ${
    isDragging ? "bg-blue-100 border-blue-500" : "bg-gray-50"
  }`}
>
  Drop files here
</div>
```

---

## Backend Examples

### Express Route with Multer

```typescript
// POST /api/lessons/upload
app.post(
  "/api/lessons/upload",
  authMiddleware,
  requireRole(['teacher', 'admin']),
  upload.single('file'),
  async (req: AuthenticatedRequest, res) => {
    try {
      // Validate file
      if (!req.file) {
        return res.status(400).json({ message: "No file provided" });
      }

      // Validate form data
      const { courseId, lessonTitle } = req.body;
      if (!courseId || !lessonTitle) {
        fs.unlinkSync(req.file.path); // Clean up
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Create lesson record (would go to database)
      const lesson = {
        id: generateId(),
        courseId,
        title: lessonTitle,
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileType: req.file.mimetype,
        fileSize: req.file.size.toString(),
        createdAt: new Date().toISOString()
      };

      res.status(201).json({
        message: "Lesson uploaded successfully",
        lesson
      });
    } catch (error) {
      // Clean up file on error
      if (req.file) fs.unlinkSync(req.file.path);
      res.status(500).json({ message: "Upload failed" });
    }
  }
);
```

### Multer Configuration

```typescript
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain',
      'image/webp'
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'));
    }
  }
});
```

### GET Lessons Endpoint

```typescript
app.get("/api/courses/:courseId/lessons", async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!courseId) {
      return res.status(400).json({ message: "Course ID is required" });
    }

    // TODO: Fetch from database
    // const lessons = await db.query.lessons.findMany({
    //   where: eq(lessons.courseId, courseId),
    //   orderBy: desc(lessons.createdAt)
    // });

    // For now, return empty
    res.json({
      lessons: [],
      message: "Lessons retrieved successfully"
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve lessons",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});
```

### DELETE Lesson Endpoint

```typescript
app.delete(
  "/api/lessons/:lessonId",
  authMiddleware,
  requireRole(['teacher', 'admin']),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { lessonId } = req.params;

      if (!lessonId) {
        return res.status(400).json({ message: "Lesson ID is required" });
      }

      // TODO: Implement
      // 1. Find lesson
      // 2. Verify user owns the course
      // 3. Delete file from disk
      // 4. Delete lesson record

      res.json({
        message: "Lesson deleted successfully",
        lessonId
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to delete lesson",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
);
```

---

## Database Examples

### Zod Schema

```typescript
import { z } from 'zod';

export const insertLessonSchema = createInsertSchema(lessons).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  title: z.string()
    .min(1, "Lesson title is required")
    .max(255, "Title must be 255 characters or less"),
  courseId: z.string().min(1, "Course ID is required"),
  fileName: z.string().min(1, "File name is required"),
  filePath: z.string().min(1, "File path is required"),
  fileType: z.string().min(1, "File type is required"),
  fileSize: z.string().min(1, "File size is required"),
});

export type Lesson = typeof lessons.$inferSelect;
export type InsertLesson = z.infer<typeof insertLessonSchema>;
```

### Drizzle Schema

```typescript
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

export const lessons = pgTable("lessons", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  courseId: text("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: 'cascade' }),
  title: text("title").notNull(),
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: text("file_size").notNull(),
  createdAt: timestamp('created_at')
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date()),
});
```

### Migration SQL

```sql
CREATE TABLE "lessons" (
  "id" text PRIMARY KEY NOT NULL,
  "course_id" text NOT NULL,
  "title" text NOT NULL,
  "file_name" text NOT NULL,
  "file_path" text NOT NULL,
  "file_type" text NOT NULL,
  "file_size" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now()
);

ALTER TABLE "lessons" 
ADD CONSTRAINT "lessons_course_id_courses_id_fk" 
FOREIGN KEY ("course_id") 
REFERENCES "public"."courses"("id") 
ON DELETE cascade 
ON UPDATE no action;
```

---

## Integration Examples

### Integrating with React Query

```typescript
import { useMutation, useQuery } from "@tanstack/react-query";

// Upload lesson
const uploadMutation = useMutation({
  mutationFn: async (formData: FormData) => {
    const response = await fetch('/api/lessons/upload', {
      method: 'POST',
      body: formData,
      headers: getAuthHeaders()
    });
    return response.json();
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['lessons'] });
    toast({ title: "Success", description: "Lesson uploaded" });
  },
  onError: (error) => {
    toast({ title: "Error", description: error.message, variant: "destructive" });
  }
});

// Fetch lessons
const { data: lessons, isLoading } = useQuery({
  queryKey: ['lessons', courseId],
  queryFn: async () => {
    const response = await fetch(
      `/api/courses/${courseId}/lessons`,
      { headers: getAuthHeaders() }
    );
    return response.json();
  }
});

// Usage
const handleSubmit = async (formData) => {
  uploadMutation.mutate(formData);
};
```

### Error Handling

```typescript
const handleFileUpload = async (file: File) => {
  try {
    // Validation
    if (file.size > 50 * 1024 * 1024) {
      throw new Error("File too large (max 50MB)");
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', /* ... */];
    if (!allowedTypes.includes(file.type)) {
      throw new Error("File type not supported");
    }

    // Upload
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/lessons/upload', {
      method: 'POST',
      body: formData,
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Upload failed");
    }

    return await response.json();
  } catch (error) {
    console.error("Upload error:", error);
    toast({
      title: "Upload Failed",
      description: error instanceof Error ? error.message : "Unknown error",
      variant: "destructive"
    });
    throw error;
  }
};
```

---

## Testing Examples

### Jest Test for Validation

```typescript
describe('LessonUploadForm', () => {
  it('should validate required fields', () => {
    const { getByText, getByTestId } = render(
      <LessonUploadForm courses={[]} />
    );

    fireEvent.click(getByTestId('submit-button'));

    expect(getByText(/course is required/i)).toBeInTheDocument();
    expect(getByText(/lesson title is required/i)).toBeInTheDocument();
    expect(getByText(/no file provided/i)).toBeInTheDocument();
  });

  it('should upload file successfully', async () => {
    const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const { getByTestId } = render(
      <LessonUploadForm courses={[{ id: '1', title: 'Test' }]} />
    );

    // Select course
    fireEvent.change(getByTestId('course-select'), { target: { value: '1' } });

    // Enter title
    fireEvent.change(getByTestId('title-input'), { target: { value: 'Test Lesson' } });

    // Select file
    fireEvent.change(getByTestId('file-input'), { target: { files: [mockFile] } });

    // Submit
    fireEvent.click(getByTestId('submit-button'));

    // Assert success message appears
    await expect(getByText(/uploaded successfully/i)).toBeInTheDocument();
  });
});
```

---

## Performance Optimization Examples

### Lazy Load Lessons

```typescript
const [lessons, setLessons] = useState<Lesson[]>([]);
const [isLoading, setIsLoading] = useState(false);
const [hasMore, setHasMore] = useState(true);
const [page, setPage] = useState(0);

const loadMoreLessons = async () => {
  setIsLoading(true);
  try {
    const response = await fetch(
      `/api/courses/${courseId}/lessons?page=${page}&limit=10`,
      { headers: getAuthHeaders() }
    );
    const data = await response.json();
    
    setLessons(prev => [...prev, ...data.lessons]);
    setHasMore(data.hasMore);
    setPage(prev => prev + 1);
  } finally {
    setIsLoading(false);
  }
};
```

### Debounce Title Input

```typescript
import { useMemo } from 'react';
import { debounce } from 'lodash';

const handleTitleChange = useMemo(
  () => debounce((value: string) => {
    setLessonTitle(value);
    validateTitle(value);
  }, 300),
  []
);
```

---

For more information, see the main documentation files:
- `LESSON_UPLOAD_FEATURE.md` - Comprehensive documentation
- `LESSON_UPLOAD_QUICK_REFERENCE.md` - Quick reference guide
