# Code Snippets - Course Creation Feature

## 🔧 Using the CreateCourseForm Component

### Standalone Form
```tsx
import { CreateCourseForm } from '@/components/CreateCourseForm';

export function MyPage() {
  const handleSuccess = () => {
    console.log('Course created successfully!');
    // Refresh course list or navigate
  };

  return (
    <div className="p-6">
      <CreateCourseForm onSuccess={handleSuccess} />
    </div>
  );
}
```

### Form with Close Callback
```tsx
import { CreateCourseForm } from '@/components/CreateCourseForm';

export function CourseModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Create Course</button>
      
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <CreateCourseForm 
              onSuccess={() => {
                setIsOpen(false);
                // Refresh list
              }}
              onClose={() => setIsOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
```

---

## 🌐 API Integration Examples

### Create Course Request
```typescript
const createCourse = async (title: string, description: string) => {
  const { getAuthHeaders } = useAuth();
  
  try {
    const response = await fetch('/api/courses', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        title,
        description
      })
    });

    if (!response.ok) {
      throw new Error(`Failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log('Course created:', data.course);
    return data.course;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};
```

### Fetch User's Courses
```typescript
const fetchUserCourses = async () => {
  const { getAuthHeaders } = useAuth();
  
  try {
    const response = await fetch('/api/courses/user', {
      headers: getAuthHeaders()
    });

    if (!response.ok) throw new Error('Failed to fetch courses');
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching courses:', error);
    throw error;
  }
};
```

### Fetch All Published Courses
```typescript
const fetchPublishedCourses = async () => {
  try {
    const response = await fetch('/api/courses');
    
    if (!response.ok) throw new Error('Failed to fetch courses');
    
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};
```

### Update Course
```typescript
const updateCourse = async (courseId: string, updates: Partial<Course>) => {
  const { getAuthHeaders } = useAuth();
  
  try {
    const response = await fetch(`/api/courses/${courseId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates)
    });

    if (!response.ok) throw new Error('Failed to update course');
    
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};
```

### Delete Course
```typescript
const deleteCourse = async (courseId: string) => {
  const { getAuthHeaders } = useAuth();
  
  if (!confirm('Delete this course?')) return;
  
  try {
    const response = await fetch(`/api/courses/${courseId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (!response.ok) throw new Error('Failed to delete course');
    
    console.log('Course deleted successfully');
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};
```

---

## 🔐 Authentication Examples

### Getting JWT Token
```typescript
import { useAuth } from '@/hooks/useAuth';

export function MyComponent() {
  const { token, user, getAuthHeaders } = useAuth();
  
  return (
    <div>
      <p>Logged in as: {user?.fullName}</p>
      <p>Role: {user?.role}</p>
      <p>Token exists: {!!token}</p>
    </div>
  );
}
```

### Making Authenticated Request
```typescript
const makeAuthenticatedRequest = async (endpoint: string) => {
  const { getAuthHeaders } = useAuth();
  
  const headers = getAuthHeaders();
  
  // headers will include: { Authorization: "Bearer <token>" }
  
  const response = await fetch(endpoint, { headers });
  return await response.json();
};
```

---

## 📝 Form Validation Examples

### Client-Side Validation
```typescript
const validateCourseData = (title: string, description: string) => {
  const errors: Record<string, string> = {};
  
  // Title validation
  if (!title.trim()) {
    errors.title = 'Course title is required';
  } else if (title.trim().length < 3) {
    errors.title = 'Course title must be at least 3 characters';
  } else if (title.trim().length > 255) {
    errors.title = 'Course title must not exceed 255 characters';
  }
  
  // Description validation
  if (!description.trim()) {
    errors.description = 'Course description is required';
  } else if (description.trim().length < 10) {
    errors.description = 'Course description must be at least 10 characters';
  } else if (description.trim().length > 2000) {
    errors.description = 'Course description must not exceed 2000 characters';
  }
  
  return errors;
};
```

### Using Zod Schema (Backend)
```typescript
import { insertCourseSchema } from '@shared/schema';

const validateCoursePayload = (data: unknown) => {
  try {
    const validated = insertCourseSchema.parse(data);
    return { valid: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        valid: false, 
        errors: error.flatten().fieldErrors 
      };
    }
    return { valid: false, errors: {} };
  }
};
```

---

## 🎯 Error Handling Examples

### Handle Authentication Error
```typescript
const handleAuthError = (response: Response) => {
  if (response.status === 401) {
    // Token expired, redirect to login
    localStorage.removeItem('eduverse_token');
    localStorage.removeItem('eduverse_user');
    window.location.href = '/demo';
  }
};
```

### Handle Permission Error
```typescript
const handlePermissionError = (error: any) => {
  if (error.response?.status === 403) {
    return 'You do not have permission to create courses. Only teachers and admins can create courses.';
  }
};
```

### Handle Validation Error
```typescript
const handleValidationError = (errors: Record<string, string[]>) => {
  const messages = Object.entries(errors)
    .map(([field, fieldErrors]) => `${field}: ${fieldErrors.join(', ')}`)
    .join('\n');
  
  console.error('Validation errors:', messages);
};
```

### Comprehensive Error Handler
```typescript
const handleApiError = (error: unknown): string => {
  if (error instanceof Response) {
    switch (error.status) {
      case 400:
        return 'Invalid data. Please check your inputs.';
      case 401:
        return 'Your session has expired. Please log in again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return 'An unexpected error occurred.';
    }
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unknown error occurred.';
};
```

---

## 📊 Data Flow Examples

### Complete Course Creation Flow
```typescript
export function CreateCourseHandler() {
  const { getAuthHeaders } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateCourse = async (title: string, description: string) => {
    setLoading(true);
    setError(null);

    try {
      // 1. Validate client-side
      const validationErrors = validateCourseData(title, description);
      if (Object.keys(validationErrors).length > 0) {
        throw new Error('Validation failed');
      }

      // 2. Get auth headers
      const headers = getAuthHeaders();
      if (!headers.Authorization) {
        throw new Error('Not authenticated');
      }

      // 3. Make API request
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim()
        })
      });

      // 4. Handle response
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create course');
      }

      // 5. Success
      const data = await response.json();
      console.log('Course created:', data.course);
      return data.course;

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;

    } finally {
      setLoading(false);
    }
  };

  return { handleCreateCourse, loading, error };
}
```

---

## 🧪 Testing Code Examples

### Test Course Creation
```typescript
describe('Course Creation', () => {
  it('should create a course successfully', async () => {
    const response = await fetch('/api/courses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${validToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Test Course',
        description: 'A test course description'
      })
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.course).toBeDefined();
    expect(data.course.title).toBe('Test Course');
  });

  it('should reject invalid token', async () => {
    const response = await fetch('/api/courses', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer invalid_token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Test Course',
        description: 'A test course description'
      })
    });

    expect(response.status).toBe(401);
  });

  it('should reject student role', async () => {
    const response = await fetch('/api/courses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${studentToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Test Course',
        description: 'A test course description'
      })
    });

    expect(response.status).toBe(403);
  });
});
```

---

## 🔗 Routing Examples

### Add Route to React Router
```tsx
// In App.tsx
import { Switch, Route } from "wouter";
import CreateCoursePage from "@/pages/create-course";
import { MultiRoleRoute } from "@/components/ProtectedRoute";

function Router() {
  return (
    <Switch>
      <Route path="/create-course">
        <MultiRoleRoute allowedRoles={['teacher', 'admin']}>
          <CreateCoursePage />
        </MultiRoleRoute>
      </Route>
    </Switch>
  );
}
```

---

## 🎨 Component Composition Examples

### Page with Form and List
```tsx
export function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleCourseCreated = (newCourse: Course) => {
    setCourses([...courses, newCourse]);
    setShowCreateForm(false);
  };

  return (
    <div className="space-y-6">
      <Button onClick={() => setShowCreateForm(!showCreateForm)}>
        {showCreateForm ? 'Hide Form' : 'Create Course'}
      </Button>

      {showCreateForm && (
        <CreateCourseForm 
          onSuccess={handleCourseCreated}
          onClose={() => setShowCreateForm(false)}
        />
      )}

      <CoursesList />
    </div>
  );
}
```

---

## 📱 Hook Usage Examples

### useAuth Hook
```typescript
const MyComponent = () => {
  const {
    user,              // Current user object
    token,             // JWT token
    isAuthenticated,   // Boolean
    getAuthHeaders,    // Function to get headers
    login,             // Function to login
    logout             // Function to logout
  } = useAuth();

  return (
    <div>
      {isAuthenticated ? (
        <>
          <p>Welcome {user?.fullName}</p>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <p>Please log in</p>
      )}
    </div>
  );
};
```

---

## 🚀 Quick Copy-Paste Solutions

### Quick API Call
```typescript
// Copy this and replace URL, method, and body as needed
const response = await fetch('URL', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('eduverse_token')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ /* data */ })
});
```

### Quick Error Handler
```typescript
try {
  // ... your code
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error(message);
  // Show error to user
}
```

### Quick Loading State
```typescript
const [loading, setLoading] = useState(false);

const handleSubmit = async () => {
  setLoading(true);
  try {
    // ... your code
  } finally {
    setLoading(false);
  }
};
```

---

## 📚 Reference Links

**Imports:**
```typescript
import { CreateCourseForm } from '@/components/CreateCourseForm';
import CreateCoursePage from '@/pages/create-course';
import { CoursesList } from '@/components/CoursesList';
import { useAuth } from '@/hooks/useAuth';
```

**Types:**
```typescript
import type { Course, InsertCourse } from '@shared/schema';
```

**Schemas:**
```typescript
import { insertCourseSchema, insertEnrollmentSchema } from '@shared/schema';
```

---

**Generated:** November 16, 2025  
**Version:** 1.0
