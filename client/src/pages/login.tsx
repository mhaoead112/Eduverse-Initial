import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Mail, Lock, LogIn, AlertCircle, Loader2, GraduationCap, BookOpen, Users, Award } from 'lucide-react';
import { apiEndpoint } from '@/lib/config';
import { useAuth } from '@/hooks/useAuth';

interface LoginCredentials {
  email: string;
  password: string;
}

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login, isAuthenticated, user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<LoginCredentials>({
    email: '',
    password: ''
  });

  // Redirect if already authenticated
  if (isAuthenticated && user) {
    const roleRoutes: Record<string, string> = {
      student: '/student/dashboard',
      teacher: '/teacher/dashboard',
      parent: '/parent/dashboard',
      admin: '/admin/dashboard'
    };
    setLocation(roleRoutes[user.role] || '/');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.email || !formData.password) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Use AuthContext login to properly set state
      const result = await login({
        username: formData.email, // API accepts username or email
        email: formData.email,
        password: formData.password
      });

      if (result.success) {
        // Get user from localStorage (set by login function)
        const storedUser = localStorage.getItem('eduverse_user');
        const userData = storedUser ? JSON.parse(storedUser) : null;

        // Track login streak for students
        if (userData?.role === 'student') {
          const storedToken = localStorage.getItem('eduverse_token');
          if (storedToken) {
            fetch(apiEndpoint('/api/streaks/login'), {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${storedToken}`,
                'Content-Type': 'application/json'
              },
            }).catch(err => console.error('Failed to track login:', err));
          }
        }

        toast({
          title: 'Login Successful',
          description: `Welcome back, ${userData?.fullName || 'User'}!`,
        });

        // Redirect based on role
        const roleRoutes: Record<string, string> = {
          student: '/student/dashboard',
          teacher: '/teacher/dashboard',
          parent: '/parent/dashboard',
          admin: '/admin/dashboard'
        };

        setTimeout(() => {
          setLocation(roleRoutes[userData?.role] || '/');
        }, 300);
      } else {
        toast({
          title: 'Login Failed',
          description: result.error || 'Invalid email or password',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Login Failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#003366] via-[#004080] to-[#0055aa] relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-white/5 rounded-full blur-2xl animate-pulse delay-500"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-white">
          {/* School Logo */}
          <div className="mb-8">
            <img 
              src="/nies-logo.png" 
              alt="NIES Logo" 
              className="w-400 h-2000 object-contain drop-shadow-2xl"
            />
          </div>
          
          {/* <h1 className="text-4xl font-bold mb-4 text-center">
            مدارس النيل المصرية الدولية
          </h1> */}
          {/* <h2 className="text-2xl font-semibold mb-2 text-[#D4AF37]">
            Nile Egyptian International Schools
          </h2> */}
          
          {/* Features */}
          <div className="grid grid-cols-2 gap-6 mt-8 max-w-md">
            <div className="flex items-center gap-3 bg-white/10 rounded-xl p-4 backdrop-blur-sm opacity-0 animate-fade-in-up" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
              <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-[#D4AF37]" />
              </div>
              <span className="text-sm font-medium">Excellence in Education</span>
            </div>
            <div className="flex items-center gap-3 bg-white/10 rounded-xl p-4 backdrop-blur-sm opacity-0 animate-fade-in-up" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
              <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-[#D4AF37]" />
              </div>
              <span className="text-sm font-medium">Smart Learning</span>
            </div>
            <div className="flex items-center gap-3 bg-white/10 rounded-xl p-4 backdrop-blur-sm opacity-0 animate-fade-in-up" style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
              <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-[#D4AF37]" />
              </div>
              <span className="text-sm font-medium">Connected Community</span>
            </div>
            <div className="flex items-center gap-3 bg-white/10 rounded-xl p-4 backdrop-blur-sm opacity-0 animate-fade-in-up" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
              <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                <Award className="h-5 w-5 text-[#D4AF37]" />
              </div>
              <span className="text-sm font-medium">Achieve More</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 md:p-8 bg-gradient-to-br from-gray-50 to-white">
        <div className="w-full max-w-md opacity-0 animate-fade-in-up" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-6">
            <div className="flex justify-center mb-4">
              <img 
                src="/nies-logo.png" 
                alt="NIES Logo" 
                className="w-24 h-24 object-contain"
              />
            </div>
            <h1 className="text-xl font-bold text-[#003366]">
              Nile Egyptian International Schools
            </h1>
            <p className="text-sm text-gray-600 mt-1">فرع أسيوط الجديدة</p>
          </div>

          {/* Login Card */}
          <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="space-y-1 p-6 pb-4">
              <CardTitle className="text-2xl sm:text-3xl font-bold text-center text-[#003366]">
                Welcome Back
              </CardTitle>
              <CardDescription className="text-center text-sm sm:text-base text-gray-600">
                Sign in to access your learning portal
              </CardDescription>
            </CardHeader>

          <CardContent className="p-6 pt-2">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#003366] transition-colors" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-10 h-12 text-base border-gray-200 focus:border-[#003366] focus:ring-[#003366]/20 rounded-xl transition-all"
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                  <button
                    type="button"
                    onClick={() => setLocation('/forgot-password')}
                    className="text-sm text-[#003366] hover:text-[#D4AF37] font-medium transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#003366] transition-colors" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10 pr-12 h-12 text-base border-gray-200 focus:border-[#003366] focus:ring-[#003366]/20 rounded-xl transition-all"
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#003366] transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-[#003366] to-[#004080] hover:from-[#002244] hover:to-[#003366] h-12 rounded-xl text-base font-semibold shadow-lg shadow-[#003366]/25 transition-all duration-300 hover:shadow-xl hover:shadow-[#003366]/30 hover:-translate-y-0.5"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5 mr-2" />
                    Sign In
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* Demo Login Link */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 rounded-xl text-base font-medium border-2 border-gray-200 hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 transition-all"
              onClick={() => setLocation('/demo')}
            >
              <GraduationCap className="h-5 w-5 mr-2 text-[#D4AF37]" />
              Try Demo Login
            </Button>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 p-6 pt-2 border-t border-gray-100">
            <div className="text-sm text-center text-gray-600">
              Need help accessing your account?{' '}
              <button
                onClick={() => setLocation('/contact')}
                className="text-[#003366] font-semibold hover:text-[#D4AF37] transition-colors"
              >
                Contact Support
              </button>
            </div>
          </CardFooter>
        </Card>

        {/* Footer Links */}
        <div className="mt-8 text-center">
          <button
            onClick={() => setLocation('/')}
            className="text-sm text-gray-600 hover:text-[#003366] transition-colors inline-flex items-center gap-2"
          >
            ← Back to Home
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}
