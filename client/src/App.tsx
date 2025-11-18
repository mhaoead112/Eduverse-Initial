import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { 
  PublicOnlyRoute, 
  StudentRoute, 
  TeacherRoute, 
  AdminRoute,
  MultiRoleRoute,
  ProtectedRoute 
} from "@/components/ProtectedRoute";
import Home from "@/pages/home";
import About from "@/pages/about";
import Programs from "@/pages/programs";
import Subjects from "@/pages/subjects";
import Admissions from "@/pages/admissions";
import Contact from "@/pages/contact";
import AiChat from "@/pages/ai-chat";
import GroupChat from "@/pages/group-chat";
import ARLearning from "@/pages/ar-learning";
import EmotionalLearning from "@/pages/emotional-learning";
import Avatars from "@/pages/avatars";
import LMSStructure from "@/pages/lms-structure";
import TeacherDashboard from "@/pages/teacher-dashboard";
import TeacherClasses from "@/pages/teacher-classes";
import TeacherStudents from "@/pages/teacher-students";
import TeacherAssessments from "@/pages/teacher-assessments";
import TeacherContent from "@/pages/teacher-content";
import TeacherAnalytics from "@/pages/teacher-analytics";
import TeacherCommunication from "@/pages/teacher-communication";
import TeacherProfile from "@/pages/teacher-profile";
import PortalLanding from "@/pages/portal-landing";
import News from "@/pages/news";
import Events from "@/pages/events";
import StaffDirectory from "@/pages/staff";
import NotFound from "@/pages/not-found";
import DemoLogin from "@/components/DemoLogin";
// Import new dashboard pages
import StudentDashboard from "@/pages/student-dashboard";
import StudentCoursesPage from "@/pages/student-courses";
import StudentProgressPage from "@/pages/student-progress";
import TeacherDashboardEnhanced from "@/pages/teacher-dashboard-enhanced";
import AdminDashboard from "@/pages/admin-dashboard";
import LessonManagement from "@/pages/lesson-management";
import CreateCoursePage from "@/pages/create-course";
import StudentCourseLessons from "@/pages/student-course-lessons";
import StudentAssignments from "@/pages/student-assignments";
import StudentGrades from "@/pages/student-grades";
import StudentSchedule from "@/pages/student-schedule";

function Router() {
  const [location] = useLocation();
  
  // Check if current route is a dashboard route
  const isDashboardRoute = location.startsWith('/student') || 
                          location.startsWith('/teacher') || 
                          location.startsWith('/admin') || 
                          location.startsWith('/parent') ||
                          location.startsWith('/dashboard');
  
  return (
    <div className="min-h-screen flex flex-col">
      {!isDashboardRoute && <Navigation />}
      <main className="flex-1">
        <Switch>
          {/* Demo login route - high priority */}
          <Route path="/demo">
            <PublicOnlyRoute>
              <DemoLogin />
            </PublicOnlyRoute>
          </Route>
          
          {/* Public home page */}
          <Route path="/home">
            <Home />
          </Route>
          
          {/* Redirect root to home page - no login required */}
          <Route path="/" component={Home} />
          
          {/* Role-based dashboard routes */}
          <Route path="/student">
            <StudentRoute>
              <StudentDashboard />
            </StudentRoute>
          </Route>

          <Route path="/student/progress">
            <StudentRoute>
              <StudentProgressPage />
            </StudentRoute>
          </Route>

          <Route path="/student/courses">
            <StudentRoute>
              <StudentCoursesPage />
            </StudentRoute>
          </Route>

          <Route path="/student/courses/:courseId/lessons">
            <StudentRoute>
              <StudentCourseLessons />
            </StudentRoute>
          </Route>

          <Route path="/student/assignments">
            <StudentRoute>
              <StudentAssignments />
            </StudentRoute>
          </Route>

          <Route path="/student/grades">
            <StudentRoute>
              <StudentGrades />
            </StudentRoute>
          </Route>

          <Route path="/student/schedule">
            <StudentRoute>
              <StudentSchedule />
            </StudentRoute>
          </Route>
          
          <Route path="/teacher">
            <TeacherRoute>
              <TeacherDashboardEnhanced />
            </TeacherRoute>
          </Route>
          
          <Route path="/admin">
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          </Route>

          {/* Admin Courses Management - Admin only */}
          <Route path="/admin/courses">
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          </Route>

          <Route path="/admin/courses/create">
            <AdminRoute>
              <CreateCoursePage />
            </AdminRoute>
          </Route>

          {/* Admin Lessons Management - Admin only */}
          <Route path="/admin/lessons">
            <AdminRoute>
              <LessonManagement />
            </AdminRoute>
          </Route>
          
          {/* Protected teacher sub-routes */}
          <Route path="/teacher/classes">
            <TeacherRoute>
              <TeacherClasses />
            </TeacherRoute>
          </Route>
          <Route path="/teacher/students">
            <TeacherRoute>
              <TeacherStudents />
            </TeacherRoute>
          </Route>
          <Route path="/teacher/assessments">
            <TeacherRoute>
              <TeacherAssessments />
            </TeacherRoute>
          </Route>
          <Route path="/teacher/content">
            <TeacherRoute>
              <TeacherContent />
            </TeacherRoute>
          </Route>
          <Route path="/teacher/analytics">
            <TeacherRoute>
              <TeacherAnalytics />
            </TeacherRoute>
          </Route>
          <Route path="/teacher/communication">
            <TeacherRoute>
              <TeacherCommunication />
            </TeacherRoute>
          </Route>
          <Route path="/teacher/profile">
            <TeacherRoute>
              <TeacherProfile />
            </TeacherRoute>
          </Route>

          {/* Teacher Courses - Teacher/Admin only */}
          <Route path="/teacher/courses">
            <TeacherRoute>
              <TeacherClasses />
            </TeacherRoute>
          </Route>

          <Route path="/teacher/courses/create">
            <TeacherRoute>
              <CreateCoursePage />
            </TeacherRoute>
          </Route>

          {/* Teacher Lessons Management - Teacher/Admin only */}
          <Route path="/teacher/lessons">
            <TeacherRoute>
              <LessonManagement />
            </TeacherRoute>
          </Route>

          {/* Lesson Management - Teacher/Admin only (legacy route) */}
          <Route path="/lessons">
            <MultiRoleRoute roles={['teacher', 'admin']}>
              <LessonManagement />
            </MultiRoleRoute>
          </Route>

          {/* Course Creation - Teacher/Admin only (legacy route) */}
          <Route path="/courses/create">
            <MultiRoleRoute roles={['teacher', 'admin']}>
              <CreateCoursePage />
            </MultiRoleRoute>
          </Route>

          {/* Now publicly accessible - no login required */}
          <Route path="/ai-chat" component={AiChat} />
          <Route path="/group-chat" component={GroupChat} />
          <Route path="/ar-learning" component={ARLearning} />
          <Route path="/emotional-learning" component={EmotionalLearning} />
          <Route path="/avatars" component={Avatars} />
          
          {/* Public accessible routes (but enhanced when authenticated) */}
          <Route path="/home" component={Home} />
          <Route path="/about" component={About} />
          <Route path="/programs" component={Programs} />
          <Route path="/subjects" component={Subjects} />
          <Route path="/admissions" component={Admissions} />
          <Route path="/contact" component={Contact} />
          <Route path="/lms-structure" component={LMSStructure} />
          <Route path="/portal" component={PortalLanding} />
          <Route path="/news" component={News} />
          <Route path="/events" component={Events} />
          <Route path="/staff" component={StaffDirectory} />
          
          {/* Fallback */}
          <Route component={NotFound} />
        </Switch>
      </main>
      {!isDashboardRoute && <Footer />}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
