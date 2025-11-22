import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface CreateCourseFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CreateCourseForm({ onSuccess, onCancel }: CreateCourseFormProps) {
  const { user, token, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Validation function
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Course title is required';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'Course title must be at least 3 characters';
    } else if (formData.title.length > 255) {
      newErrors.title = 'Course title must not exceed 255 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Course description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Course description must be at least 10 characters';
    } else if (formData.description.length > 2000) {
      newErrors.description = 'Course description must not exceed 2000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset states
    setServerError(null);
    setSuccess(false);

    // Validate form
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields correctly',
        variant: 'destructive'
      });
      return;
    }

    // Check authentication
    if (!isAuthenticated || !token) {
      setServerError('You must be logged in to create a course');
      toast({
        title: 'Authentication Required',
        description: 'Please log in to create a course',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      const port = '3001';
      const response = await fetch(`http://localhost:${port}/api/courses`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim(),
          isPublished: false
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle validation errors from server
        if (response.status === 400 && errorData.errors) {
          const fieldErrors: Record<string, string> = {};
          for (const [field, messages] of Object.entries(errorData.errors)) {
            fieldErrors[field] = Array.isArray(messages) ? messages[0] : messages;
          }
          setErrors(fieldErrors);
          setServerError(errorData.message || 'Validation failed');
          toast({
            title: 'Validation Error',
            description: errorData.message || 'Please check your input',
            variant: 'destructive'
          });
          return;
        }

        // Handle other errors
        setServerError(errorData.message || 'Failed to create course');
        toast({
          title: 'Error',
          description: errorData.message || 'Failed to create course',
          variant: 'destructive'
        });
        return;
      }

      const result = await response.json();
      
      // Success
      setSuccess(true);
      setFormData({ title: '', description: '' });
      setErrors({});
      
      toast({
        title: 'Success',
        description: 'Course created successfully!',
        variant: 'default'
      });

      // Call onSuccess callback after a brief delay to show success state
      if (onSuccess) {
        setTimeout(onSuccess, 1500);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      setServerError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
      // Clear success message after 3 seconds
      if (success) {
        setTimeout(() => setSuccess(false), 3000);
      }
    }
  };

  // Handle field changes
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, title: value }));
    // Clear error when user starts typing
    if (errors.title) {
      setErrors(prev => ({ ...prev, title: '' }));
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, description: value }));
    // Clear error when user starts typing
    if (errors.description) {
      setErrors(prev => ({ ...prev, description: '' }));
    }
  };

  const handleReset = () => {
    setFormData({ title: '', description: '' });
    setErrors({});
    setServerError(null);
    setSuccess(false);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardTitle className="flex items-center gap-2">
          Create New Course
        </CardTitle>
        <CardDescription>
          Fill in the course details below. All fields are required.
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-6">
        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-green-900">Course Created Successfully!</p>
              <p className="text-sm text-green-700 mt-1">
                Your course "{formData.title}" has been created and is ready to use.
              </p>
            </div>
          </div>
        )}

        {/* Server Error Message */}
        {serverError && !success && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-900">Error Creating Course</p>
              <p className="text-sm text-red-700 mt-1">{serverError}</p>
            </div>
          </div>
        )}

        {/* Authentication Check */}
        {!isAuthenticated && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              You must be logged in as a teacher or administrator to create a course.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Course Title Field */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Course Title <span className="text-red-500">*</span>
            </label>
            <Input
              id="title"
              type="text"
              placeholder="e.g., Introduction to Python Programming"
              value={formData.title}
              onChange={handleTitleChange}
              disabled={isLoading}
              className={errors.title ? 'border-red-500' : ''}
              maxLength={255}
              aria-describedby={errors.title ? 'title-error' : undefined}
            />
            <div className="flex justify-between items-start mt-2">
              {errors.title && (
                <p id="title-error" className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.title}
                </p>
              )}
              <p className={`text-xs ml-auto ${formData.title.length >= 240 ? 'text-yellow-600' : 'text-gray-500'}`}>
                {formData.title.length}/255 characters
              </p>
            </div>
          </div>

          {/* Course Description Field */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Course Description <span className="text-red-500">*</span>
            </label>
            <Textarea
              id="description"
              placeholder="Describe what students will learn in this course. Be specific about topics, skills, and learning outcomes."
              value={formData.description}
              onChange={handleDescriptionChange}
              disabled={isLoading}
              className={`min-h-32 resize-none ${errors.description ? 'border-red-500' : ''}`}
              maxLength={2000}
              aria-describedby={errors.description ? 'description-error' : undefined}
            />
            <div className="flex justify-between items-start mt-2">
              {errors.description && (
                <p id="description-error" className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.description}
                </p>
              )}
              <p className={`text-xs ml-auto ${formData.description.length >= 1900 ? 'text-yellow-600' : 'text-gray-500'}`}>
                {formData.description.length}/2000 characters
              </p>
            </div>
          </div>

          {/* Authenticated User Info */}
          {isAuthenticated && user && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
              <p className="text-blue-900">
                Creating course as: <span className="font-semibold">{user.fullName}</span> ({user.role})
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel || handleReset}
              disabled={isLoading}
            >
              {onCancel ? 'Cancel' : 'Reset'}
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !isAuthenticated}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Course...
                </>
              ) : (
                <>
                  <span>✨</span>
                  Create Course
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Helper Text */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-600 border border-gray-200">
          <p className="font-medium text-gray-700 mb-2">✓ Tips for Creating a Course:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Use a clear, descriptive title that reflects the course content</li>
            <li>Provide a detailed description of what students will learn</li>
            <li>Include key topics and learning outcomes in the description</li>
            <li>Courses are created as unpublished by default</li>
            <li>You can edit or delete your courses after creation</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
