import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { RoleGuard, PermissionGuard } from './utils/roleGuard';
import Layout from './components/layout/Layout';
import PageLoader from './components/ui/PageLoader';

import Login from './pages/auth/Login';
import SuperAdminLogin from './pages/auth/SuperAdminLogin';
import Register from './pages/auth/Register';
import { Unauthorized, NotFound } from './pages/shared/StatusPages';

// Super Admin
import SuperAdminDashboard from './pages/super-admin/Dashboard';
import Organizations from './pages/super-admin/Organizations';
import OrganizationDetail from './pages/super-admin/OrganizationDetail';
import SubscriptionPlans from './pages/super-admin/SubscriptionPlans';
import AuditLogs from './pages/super-admin/AuditLogs';
import SuperAdminTeam from './pages/super-admin/Team';

// Org Admin
import AdminDashboard from './pages/org-admin/Dashboard';
import Students from './pages/org-admin/Students';
import StudentProfile from './pages/org-admin/StudentProfile';
import Faculty from './pages/org-admin/Faculty';
import FacultyProfile from './pages/org-admin/FacultyProfile';
import FinanceTeam from './pages/org-admin/FinanceTeam';
import Courses from './pages/org-admin/Courses';
import CourseForm from './pages/org-admin/CourseForm';
import CourseDetail from './pages/org-admin/CourseDetail';
import LessonPreview from './pages/org-admin/LessonPreview';
import Categories from './pages/org-admin/Categories';
import Regions from './pages/org-admin/Regions';
import Enrollments from './pages/org-admin/Enrollments';
import AdminPayments from './pages/org-admin/Payments';
import ReportsOverview from './pages/org-admin/ReportsOverview';
import CoursePerformance from './pages/org-admin/CoursePerformance';
import StudentActivity from './pages/org-admin/StudentActivity';
import OrganizationSettings from './pages/org-admin/OrganizationSettings';
import CoursePlans from './pages/org-admin/CoursePlans';
import CertificateTemplates from './pages/org-admin/CertificateTemplates';
import CertificateTemplateBuilder from './pages/org-admin/CertificateTemplateBuilder';

// Faculty
import FacultyDashboard from './pages/faculty/Dashboard';
import FacultyCourses from './pages/faculty/Courses';
import GradingQueue from './pages/faculty/GradingQueue';
import FacultyCourseHub from './pages/faculty/CourseHub';
import ExamBuilder from './pages/faculty/ExamBuilder';
import ExamResults from './pages/faculty/ExamResults';
import FacultyExamAttemptReview from './pages/faculty/FacultyExamAttemptReview';
import AssignmentSubmissions from './pages/faculty/AssignmentSubmissions';
import VideoQuizManager from './pages/faculty/VideoQuizManager';


// Student
import StudentDashboard from './pages/student/Dashboard';
import BrowseCourses from './pages/student/BrowseCourses';
import CourseOverview from './pages/student/CourseOverview';
import MyCourses from './pages/student/MyCourses';
import CoursePlayer from './pages/student/CoursePlayer';
import TakeExam from './pages/student/TakeExam';
import ExamAttemptReview from './pages/student/ExamAttemptReview';
import StudentResults from './pages/student/Results';
import StudentCertificates from './pages/student/Certificates';
import StudentPayments from './pages/student/Payments';

// Shared
import Notifications from './pages/shared/Notifications';
import Profile from './pages/shared/Profile';

// Finance
import FinanceDashboard from './pages/finance/Dashboard';
import FinancePayments from './pages/finance/Payments';
import FinanceReportsOverview from './pages/finance/ReportsOverview';
import ScrollToTop from './components/ScrollToTop';

function RootRedirect() {
  const { user, role, loading, homeFor } = useAuth();
  if (loading) return <PageLoader />;
  const slug = localStorage.getItem('orgSlug');
  if (!user) {
    if (slug) return <Navigate to={`/${slug}/login`} replace />;
    return <Navigate to="/unauthorized" replace />;
  }
  return <Navigate to={homeFor(role)} replace />;
}

function AuthRedirect() {
  const location = useLocation();
  const slug = localStorage.getItem('orgSlug');
  if (slug) {
    const isRegister = location.pathname.includes('register');
    return <Navigate to={`/${slug}/${isRegister ? 'register' : 'login'}`} replace />;
  }
  return <Navigate to="/unauthorized" replace />;
}

export default function App() {
  return (
    <BrowserRouter basename="/macslearnfrontend">
      <ScrollToTop />
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#16223F', color: '#FDFCF9', fontSize: '13px', borderRadius: '8px' },
            success: { iconTheme: { primary: '#EFB35C', secondary: '#16223F' } },
          }}
        />
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<AuthRedirect />} />
          <Route path="/:slug/login" element={<Login />} />
          <Route path="/super-admin/login" element={<SuperAdminLogin />} />
          <Route path="/register" element={<AuthRedirect />} />
          <Route path="/:slug/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* SUPER ADMIN */}
          <Route
            element={
              <RoleGuard allowedRoles={['SUPER_ADMIN']}>
                <Layout />
              </RoleGuard>
            }
          >
            <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
            <Route path="/super-admin/organizations" element={<PermissionGuard allowedPermissions={['TRACK_ORGANIZATIONS']}><Organizations /></PermissionGuard>} />
            <Route path="/super-admin/organizations/:id" element={<PermissionGuard allowedPermissions={['TRACK_ORGANIZATIONS']}><OrganizationDetail /></PermissionGuard>} />
            <Route path="/super-admin/subscription-plans" element={<PermissionGuard allowedPermissions={['TRACK_ORGANIZATIONS', 'TRACK_FINANCE']}><SubscriptionPlans /></PermissionGuard>} />
            <Route path="/super-admin/audit-logs" element={<PermissionGuard allowedPermissions={['TRACK_USERS', 'TRACK_ORGANIZATIONS']}><AuditLogs /></PermissionGuard>} />
            <Route path="/super-admin/team" element={<PermissionGuard allowedPermissions={['MANAGE_ROLES']}><SuperAdminTeam /></PermissionGuard>} />
            <Route path="/super-admin/notifications" element={<Notifications />} />
            <Route path="/super-admin/profile" element={<Profile />} />
            <Route path="/super-admin/*" element={<NotFound />} />
          </Route>

          {/* ORG ADMIN */}
          <Route
            element={
              <RoleGuard allowedRoles={['ORG_USER']}>
                <Layout />
              </RoleGuard>
            }
          >
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/regions" element={<Regions />} />

            <Route path="/admin/students" element={<Students />} />
            <Route path="/admin/students/:id" element={<StudentProfile />} />
            <Route path="/admin/faculty" element={<Faculty />} />
            <Route path="/admin/faculty/:id" element={<FacultyProfile />} />
            <Route path="/admin/finance-team" element={<FinanceTeam />} />
            
             <Route path="/admin/categories" element={<Categories />} />
           <Route path="/admin/certificate-templates" element={<CertificateTemplates />} />
            <Route path="/admin/certificate-templates/create" element={<CertificateTemplateBuilder />} />
            <Route path="/admin/certificate-templates/:id" element={<CertificateTemplateBuilder />} />
            
             
            <Route path="/admin/courses" element={<Courses />} />
            <Route path="/admin/courses/create" element={<CourseForm />} />
            <Route path="/admin/courses/:id/edit" element={<CourseForm />} />
            <Route path="/admin/courses/:id" element={<CourseDetail />} />
            <Route path="/admin/courses/:id/lessons/:lessonId/preview" element={<LessonPreview />} />
            <Route path="/admin/courses/:id/lessons/:lessonId/video-quizzes" element={<VideoQuizManager />} />
            <Route path="/admin/courses/:id/exams/:examId" element={<ExamBuilder />} />
            <Route path="/admin/courses/:id/exams/:examId/results" element={<ExamResults />} />
            <Route path="/admin/courses/:id/assignments/:assignmentId/submissions" element={<AssignmentSubmissions />} />
           
            
            <Route path="/admin/enrollments" element={<Enrollments />} />
            <Route path="/admin/payments" element={<AdminPayments />} />
            <Route path="/admin/reports/overview" element={<ReportsOverview />} />
            <Route path="/admin/reports/course-performance" element={<CoursePerformance />} />
            <Route path="/admin/reports/student-activity" element={<StudentActivity />} />
            <Route path="/admin/settings/organization" element={<OrganizationSettings />} />
            <Route path="/admin/course-plans" element={<CoursePlans />} />
            
            <Route path="/admin/settings/profile" element={<Profile />} />
            <Route path="/admin/notifications" element={<Notifications />} />
            <Route path="/admin/profile" element={<Profile />} />
            <Route path="/admin/*" element={<NotFound />} />
          </Route>

          {/* FACULTY */}
          <Route
            element={
              <RoleGuard allowedRoles={['FACULTY']}>
                <Layout />
              </RoleGuard>
            }
          >
            <Route path="/faculty/dashboard" element={<FacultyDashboard />} />
            <Route path="/faculty/grading-queue" element={<GradingQueue />} />
            <Route path="/faculty/courses" element={<FacultyCourses />} />
            <Route path="/faculty/courses/create" element={<CourseForm />} />
            <Route path="/faculty/courses/:id/edit" element={<CourseForm />} />
            <Route path="/faculty/courses/:id" element={<FacultyCourseHub />} />
            <Route path="/faculty/courses/:id/lessons/:lessonId/preview" element={<LessonPreview />} />
            <Route path="/faculty/courses/:id/lessons/:lessonId/video-quizzes" element={<VideoQuizManager />} />
            <Route path="/faculty/courses/:id/exams/:examId" element={<ExamBuilder />} />
            <Route path="/faculty/courses/:id/exams/:examId/results" element={<ExamResults />} />
            <Route path="/faculty/courses/:id/exams/:examId/attempts/:attemptId/review" element={<FacultyExamAttemptReview />} />
            <Route path="/faculty/courses/:id/assignments/:assignmentId/submissions" element={<AssignmentSubmissions />} />
            <Route path="/faculty/notifications" element={<Notifications />} />
            <Route path="/faculty/profile" element={<Profile />} />
            <Route path="/faculty/*" element={<NotFound />} />
          </Route>

          {/* STUDENT */}
          <Route
            element={
              <RoleGuard allowedRoles={['STUDENT']}>
                <Layout />
              </RoleGuard>
            }
          >
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/courses" element={<BrowseCourses />} />
            <Route path="/student/courses/:id" element={<CourseOverview />} />
            <Route path="/student/my-courses" element={<MyCourses />} />
            <Route path="/student/my-courses/:id/learn" element={<CoursePlayer />} />
            <Route path="/student/my-courses/:id/exams/:examId/take" element={<TakeExam />} />
            <Route path="/student/my-courses/:id/exams/:examId/attempts/:attemptId/review" element={<ExamAttemptReview />} />
            <Route path="/student/results" element={<StudentResults />} />
            <Route path="/student/certificates" element={<StudentCertificates />} />
            <Route path="/student/payments" element={<StudentPayments />} />
            <Route path="/student/notifications" element={<Notifications />} />
            <Route path="/student/profile" element={<Profile />} />
            <Route path="/student/*" element={<NotFound />} />
          </Route>

          {/* FINANCE */}
          <Route
            element={
              <RoleGuard allowedRoles={['FINANCE']}>
                <Layout />
              </RoleGuard>
            }
          >
            <Route path="/finance/dashboard" element={<FinanceDashboard />} />
            <Route path="/finance/payments" element={<FinancePayments />} />
            <Route path="/finance/reports/overview" element={<FinanceReportsOverview />} />
            <Route path="/finance/notifications" element={<Notifications />} />
            <Route path="/finance/profile" element={<Profile />} />
            <Route path="/finance/*" element={<NotFound />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
