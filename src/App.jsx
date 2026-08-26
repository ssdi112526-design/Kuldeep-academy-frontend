import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PermissionProvider } from './context/PermissionContext';
import { ToastProvider } from './context/ToastContext';
import { LanguageProvider } from './context/LanguageContext';
import ScrollToHash from './components/ScrollToHash';
import PageLoader from './components/ui/PageLoader';

const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Admin = lazy(() => import('./pages/Admin'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const CoachDashboard = lazy(() => import('./pages/CoachDashboard'));
const ParentDashboard = lazy(() => import('./pages/ParentDashboard'));
const Terms = lazy(() => import('./pages/Terms'));
const VideoDetail = lazy(() => import('./pages/VideoDetail'));
export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <PermissionProvider>
          <ToastProvider>
            <BrowserRouter>
              <ScrollToHash />
              <Suspense fallback={<PageLoader message="Loading page..." />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/admin/:sectionId" element={<Admin />} />
                  <Route path="/student" element={<StudentDashboard />} />
                  <Route path="/student/*" element={<StudentDashboard />} />
                  <Route path="/parent" element={<ParentDashboard />} />
                  <Route path="/parent/*" element={<ParentDashboard />} />
                  <Route path="/coach" element={<CoachDashboard />} />
                  <Route path="/coach/*" element={<CoachDashboard />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/videos/:slug" element={<VideoDetail />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </ToastProvider>
        </PermissionProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
