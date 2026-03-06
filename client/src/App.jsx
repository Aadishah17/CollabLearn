import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ThemeProvider } from './components/user/ThemeContext';
import ProtectedRoute from './auth/ProtectedRoute';
import RouteLoader from './components/RouteLoader';
import ScrollToTop from './components/ScrollToTop';
import { GOOGLE_AUTH_ENABLED, GOOGLE_CLIENT_ID } from './config';

const CollabLearnLanding = lazy(() => import('./components/user/landingPage'));
const LoginPage = lazy(() => import('./auth/login'));
const SignupPage = lazy(() => import('./auth/signup'));
const Dashboard = lazy(() => import('./components/user/dashboard'));
const BrowseSkills = lazy(() => import('./components/user/browseSkills'));
const CalendarPage = lazy(() => import('./components/user/calendar'));
const CommunityPage = lazy(() => import('./components/user/community'));
const Achievements = lazy(() => import('./components/user/Achievements'));
const ProfilePage = lazy(() => import('./components/user/ProfilePage'));
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'));
const MessagesPage = lazy(() => import('./components/user/Messages'));
const PostPage = lazy(() => import('./components/user/PostPage'));
const BookingSessionPage = lazy(() => import('./components/user/bookSession'));
const SettingsPage = lazy(() => import('./components/user/settingsPage'));
const ModuleDashboard = lazy(() => import('./components/ModuleDashboard'));
const ModuleEditor = lazy(() => import('./components/ModuleEditor'));
const ManageUsers = lazy(() => import('./components/admin/manageUser'));
const ManagePosts = lazy(() => import('./components/admin/ManagePosts'));
const AnalyticsDashboard = lazy(() => import('./components/admin/Analytics'));
const AdminSettings = lazy(() => import('./components/admin/AdminSettings'));
const SkillRecommendations = lazy(() => import('./components/user/SkillRecommandation'));
const VideoCall = lazy(() => import('./components/user/Videocall'));
const SkillSessions = lazy(() => import('./components/user/SkillSessions'));
const GetPremium = lazy(() => import('./components/user/GetPremium'));
const GooglePayExample = lazy(() => import('./components/user/GooglePayExample'));
const Courses = lazy(() => import('./components/user/Courses'));
const CoursePlayer = lazy(() => import('./components/user/CoursePlayer'));
const Teach = lazy(() => import('./components/user/Teach'));
const AiLearningPage = lazy(() => import('./components/user/AiLearningPage'));
const NotFoundPage = lazy(() => import('./components/user/NotFoundPage'));

function App() {
  const routedApp = (
    <div>
      <ScrollToTop />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#09090b',
            color: '#fafafa',
            border: '1px solid rgba(255,255,255,0.12)',
          },
        }}
      />
      <Suspense fallback={<RouteLoader />}>
        <Routes>
          <Route path="/" element={<CollabLearnLanding />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/modules" element={<ProtectedRoute><ModuleDashboard /></ProtectedRoute>} />
          <Route path="/modules/create" element={<ProtectedRoute><ModuleEditor /></ProtectedRoute>} />
          <Route path="/modules/:id" element={<ProtectedRoute><ModuleEditor /></ProtectedRoute>} />
          <Route path="/browse-skills" element={<ProtectedRoute><BrowseSkills /></ProtectedRoute>} />
          <Route path="/skill-recommendations" element={<ProtectedRoute><SkillRecommendations /></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
          <Route path="/community" element={<ProtectedRoute><CommunityPage /></ProtectedRoute>} />
          <Route path="/post/:postId" element={<ProtectedRoute><PostPage /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
          <Route path="/achievements" element={<ProtectedRoute><Achievements /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/book-session" element={<ProtectedRoute><BookingSessionPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/skill-sessions" element={<ProtectedRoute><SkillSessions /></ProtectedRoute>} />
          <Route path="/video-call" element={<ProtectedRoute><VideoCall /></ProtectedRoute>} />
          <Route path="/video-call/:roomID" element={<ProtectedRoute><VideoCall /></ProtectedRoute>} />
          <Route path="/ai-learning" element={<ProtectedRoute><AiLearningPage /></ProtectedRoute>} />
          <Route path="/admin/manage-users" element={<ProtectedRoute><ManageUsers /></ProtectedRoute>} />
          <Route path="/admin/manage-posts" element={<ProtectedRoute><ManagePosts /></ProtectedRoute>} />
          <Route path="/admin/analytics" element={<ProtectedRoute><AnalyticsDashboard /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute><AdminSettings /></ProtectedRoute>} />
          <Route path="/get-premium" element={<ProtectedRoute><GetPremium /></ProtectedRoute>} />
          <Route path="/payment" element={<ProtectedRoute><GooglePayExample /></ProtectedRoute>} />
          <Route path="/courses" element={<ProtectedRoute><Courses /></ProtectedRoute>} />
          <Route path="/courses/:id/learn" element={<ProtectedRoute><CoursePlayer /></ProtectedRoute>} />
          <Route path="/teach" element={<Teach />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </div>
  );

  const appContent = <ThemeProvider>{routedApp}</ThemeProvider>;

  if (!GOOGLE_AUTH_ENABLED) {
    return appContent;
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {appContent}
    </GoogleOAuthProvider>
  );
}

export default App;
