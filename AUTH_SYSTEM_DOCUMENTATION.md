# EduVerse Authentication System

## Overview
Complete authentication system with login, registration, JWT token management, and role-based access control.

## Pages Created

### 1. Login Page (`/login`)
- **Location**: `client/src/pages/login.tsx`
- **Features**:
  - Email and password authentication
  - Password visibility toggle
  - Form validation
  - Error handling
  - Demo login link
  - Forgot password link (placeholder)
  - Automatic redirect based on user role
  - JWT token storage

### 2. Registration Page (`/register`)
- **Location**: `client/src/pages/register.tsx`
- **Features**:
  - Full name, email, password fields
  - Role selection (Student / Teacher / Parent / Admin)
  - Password strength indicator
  - Password confirmation with match validation
  - Form validation
  - Error handling
  - Terms and privacy policy links (placeholder)
  - Automatic login after registration

## API Integration

### Expected Backend Endpoints

#### 1. Register
```
POST /api/auth/register
Content-Type: application/json

Request Body:
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "student"
}

Response (Success - 201):
{
  "user": {
    "id": 1,
    "email": "john@example.com",
    "fullName": "John Doe",
    "role": "student"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Response (Error - 400):
{
  "message": "Email already exists"
}
```

#### 2. Login
```
POST /api/auth/login
Content-Type: application/json

Request Body:
{
  "email": "john@example.com",
  "password": "password123"
}

Response (Success - 200):
{
  "user": {
    "id": 1,
    "email": "john@example.com",
    "fullName": "John Doe",
    "role": "student"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Response (Error - 401):
{
  "message": "Invalid credentials"
}
```

#### 3. Logout
```
POST /api/auth/logout
Authorization: Bearer {token}

Response (Success - 200):
{
  "message": "Logged out successfully"
}
```

#### 4. Refresh Token (Optional)
```
POST /api/auth/refresh
Cookie: refresh_token

Response (Success - 200):
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

## JWT Token Management

### Storage
Tokens are stored in `localStorage` with the key `auth_token`:
```typescript
localStorage.setItem('auth_token', token);
localStorage.setItem('user', JSON.stringify(user));
```

### API Client Utility
**Location**: `client/src/lib/api-client.ts`

**Features**:
- Automatic JWT token injection in requests
- Token expiration checking
- Automatic logout on 401 responses
- Token refresh functionality
- Role-based access helpers

**Usage Example**:
```typescript
import { api } from '@/lib/api-client';

// GET request with auto JWT
const courses = await api.get('/api/courses');

// POST request with auto JWT
const newCourse = await api.post('/api/courses', {
  title: 'New Course',
  description: 'Course description'
});

// Request without auth
const publicData = await api.get('/api/public/data', { 
  requiresAuth: false 
});
```

### Helper Functions
```typescript
import { 
  getAuthToken, 
  isAuthenticated, 
  hasRole,
  clearAuthData 
} from '@/lib/api-client';

// Check if user is logged in
if (isAuthenticated()) {
  // User is logged in
}

// Check user role
if (hasRole('admin')) {
  // User is admin
}

if (hasRole(['teacher', 'admin'])) {
  // User is teacher or admin
}

// Manual logout
clearAuthData();
```

## Role-Based Access Control

### User Roles
- **Student**: Access to student dashboard, courses, assignments, grades
- **Teacher**: Access to teacher dashboard, class management, content creation
- **Parent**: Access to parent dashboard, child progress monitoring
- **Admin**: Full system access, user management, content moderation

### Route Protection
Routes are protected using the following components:
- `<PublicOnlyRoute>`: Accessible only when NOT logged in (login, register)
- `<StudentRoute>`: Requires student role
- `<TeacherRoute>`: Requires teacher role
- `<AdminRoute>`: Requires admin role
- `<MultiRoleRoute roles={['teacher', 'admin']}>`: Requires one of specified roles

### Automatic Redirects
After successful login/registration, users are redirected based on their role:
- Student → `/student`
- Teacher → `/teacher`
- Parent → `/parent`
- Admin → `/admin`

## Updated useAuth Hook

**Location**: `client/src/hooks/useAuth.ts`

**Features**:
- Supports both `auth_token` and legacy `eduverse_token`
- Automatic logout API call
- Token persistence across page reloads
- Loading state management

**Usage**:
```typescript
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { user, isAuthenticated, logout, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  return (
    <div>
      <h1>Welcome, {user.fullName}</h1>
      <p>Role: {user.role}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## Form Validation

### Login Validation
- Email format validation
- Required fields check
- Error messages for invalid credentials

### Registration Validation
- Full name (min 2 characters)
- Email format validation
- Password strength (min 6 characters)
- Password confirmation match
- Required role selection
- Real-time password strength indicator
- Password match indicator

## Security Features

1. **Password Visibility Toggle**: Users can show/hide passwords
2. **HTTPS Only**: Production should use HTTPS
3. **Token Expiration**: JWT tokens should have expiration (check server-side)
4. **Secure Storage**: Tokens in localStorage (consider httpOnly cookies for production)
5. **CSRF Protection**: Use credentials: 'include' for cookie-based sessions
6. **Role Verification**: Always verify roles on backend

## UI Components

### Login Page Features
- Clean, modern design
- EduVerse branding
- Responsive layout
- Loading states
- Error displays
- "Forgot password" link
- "Create account" link
- "Demo login" link

### Registration Page Features
- Multi-step validation
- Password strength meter
- Password match indicator
- Role selection dropdown
- Terms and privacy policy links
- Loading states
- Error displays

## Testing the Authentication

### 1. Test Registration
1. Navigate to `/register`
2. Fill in all required fields
3. Select a role
4. Submit the form
5. Verify you're redirected to the appropriate dashboard

### 2. Test Login
1. Navigate to `/login`
2. Enter registered credentials
3. Submit the form
4. Verify you're logged in and redirected correctly

### 3. Test Logout
1. While logged in, click logout in any dashboard
2. Verify you're redirected to home
3. Verify you can't access protected routes

### 4. Test Role-Based Access
1. Login as different roles
2. Verify correct dashboard access
3. Try accessing unauthorized routes
4. Verify proper redirects

## Backend Implementation Checklist

- [ ] Create `/api/auth/register` endpoint
- [ ] Create `/api/auth/login` endpoint
- [ ] Create `/api/auth/logout` endpoint
- [ ] Implement JWT token generation
- [ ] Implement JWT token verification middleware
- [ ] Add password hashing (bcrypt)
- [ ] Add email uniqueness validation
- [ ] Add role-based authorization
- [ ] Implement token refresh (optional)
- [ ] Add rate limiting for auth endpoints
- [ ] Set up CORS properly
- [ ] Configure cookie settings (httpOnly, secure, sameSite)

## Future Enhancements

- [ ] Email verification
- [ ] Password reset functionality
- [ ] Two-factor authentication (2FA)
- [ ] OAuth integration (Google, Microsoft)
- [ ] Remember me functionality
- [ ] Session management
- [ ] Account lockout after failed attempts
- [ ] Password complexity requirements
- [ ] Profile picture upload
- [ ] Email notifications

## Notes

- Demo login (`/demo`) remains available for quick testing
- All auth pages are marked as `PublicOnlyRoute` (redirect if already logged in)
- Navigation bar is hidden on all auth pages
- Token refresh happens automatically when making API calls
- Role checking happens both client-side (UX) and should happen server-side (security)
