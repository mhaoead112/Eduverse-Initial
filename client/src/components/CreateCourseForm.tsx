import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Loader2, BookOpen, FileText, Sparkles } from 'lucide-react';

interface CreateCourseFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CreateCourseForm({ onSuccess, onCancel }: CreateCourseFormProps) {
  const { user, token, isAuthenticated, getAuthHeaders } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

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
        headers: getAuthHeaders(),
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

  const getTitleProgress = () => {
    const length = formData.title.length;
    if (length === 0) return 0;
    return Math.min((length / 255) * 100, 100);
  };

  const getDescriptionProgress = () => {
    const length = formData.description.length;
    if (length === 0) return 0;
    return Math.min((length / 2000) * 100, 100);
  };

  return (
    <Card className="w-full shadow-xl border-0 rounded-3xl overflow-hidden bg-white">
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/5"></div>
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Course Details</h2>
            <p className="text-white/80 text-sm">Fill in the information below to create your course</p>
          </div>
        </div>
      </div>

      <CardContent className="p-8">
        {/* Success Message */}
        {success && (
          <div className="mb-8 p-5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl flex items-start gap-4 animate-in slide-in-from-top duration-300">
            <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-green-900 text-lg">Course Created Successfully!</p>
              <p className="text-green-700 mt-1">
                Your course is ready. Redirecting you now...
              </p>
            </div>
          </div>
        )}

        {/* Server Error Message */}
        {serverError && !success && (
          <div className="mb-8 p-5 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-2xl flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-red-900">Error Creating Course</p>
              <p className="text-red-700 mt-1">{serverError}</p>
            </div>
          </div>
        )}

        {/* Authentication Check */}
        {!isAuthenticated && (
          <div className="mb-8 p-5 bg-amber-50 border border-amber-200 rounded-2xl">
            <p className="text-amber-800 font-medium">
              ⚠️ You must be logged in as a teacher or administrator to create a course.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Course Title Field */}
          <div className="space-y-3">
            <label htmlFor="title" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                focusedField === 'title' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                <FileText className="w-4 h-4" />
              </div>
              Course Title
              <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                id="title"
                type="text"
                placeholder="e.g., Introduction to Python Programming"
                value={formData.title}
                onChange={handleTitleChange}
                onFocus={() => setFocusedField('title')}
                onBlur={() => setFocusedField(null)}
                disabled={isLoading}
                className={`h-14 text-lg rounded-xl border-2 transition-all duration-200 ${
                  errors.title 
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-200' 
                    : focusedField === 'title'
                    ? 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                maxLength={255}
                aria-describedby={errors.title ? 'title-error' : undefined}
              />
              {/* Progress bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100 rounded-b-xl overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    getTitleProgress() >= 90 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${getTitleProgress()}%` }}
                />
              </div>
            </div>
            <div className="flex justify-between items-center">
              {errors.title && (
                <p id="title-error" className="text-sm text-red-600 flex items-center gap-1.5 font-medium">
                  <AlertCircle className="w-4 h-4" />
                  {errors.title}
                </p>
              )}
              <p className={`text-xs ml-auto font-medium ${
                formData.title.length >= 240 ? 'text-amber-600' : 'text-gray-400'
              }`}>
                {formData.title.length}/255
              </p>
            </div>
          </div>

          {/* Course Description Field */}
          <div className="space-y-3">
            <label htmlFor="description" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                focusedField === 'description' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                <BookOpen className="w-4 h-4" />
              </div>
              Course Description
              <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Textarea
                id="description"
                placeholder="Describe what students will learn in this course. Be specific about topics, skills, and learning outcomes..."
                value={formData.description}
                onChange={handleDescriptionChange}
                onFocus={() => setFocusedField('description')}
                onBlur={() => setFocusedField(null)}
                disabled={isLoading}
                className={`min-h-[180px] text-base rounded-xl border-2 resize-none transition-all duration-200 ${
                  errors.description 
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-200' 
                    : focusedField === 'description'
                    ? 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                maxLength={2000}
                aria-describedby={errors.description ? 'description-error' : undefined}
              />
              {/* Progress bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100 rounded-b-xl overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    getDescriptionProgress() >= 90 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${getDescriptionProgress()}%` }}
                />
              </div>
            </div>
            <div className="flex justify-between items-center">
              {errors.description && (
                <p id="description-error" className="text-sm text-red-600 flex items-center gap-1.5 font-medium">
                  <AlertCircle className="w-4 h-4" />
                  {errors.description}
                </p>
              )}
              <p className={`text-xs ml-auto font-medium ${
                formData.description.length >= 1900 ? 'text-amber-600' : 'text-gray-400'
              }`}>
                {formData.description.length}/2000
              </p>
            </div>
          </div>

          {/* Creator Info Badge */}
          {isAuthenticated && user && (
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl border border-gray-200">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
                {user.fullName?.charAt(0).toUpperCase() || 'T'}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{user.fullName}</p>
                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
              </div>
              <div className="ml-auto px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                Course Creator
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel || handleReset}
              disabled={isLoading}
              className="flex-1 h-14 text-base font-semibold rounded-xl border-2 hover:bg-gray-50"
            >
              {onCancel ? 'Cancel' : 'Reset Form'}
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !isAuthenticated}
              className="flex-1 h-14 text-base font-semibold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Create Course
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
