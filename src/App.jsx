import { Routes, Route } from 'react-router-dom';

import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import ComingSoon from './components/ComingSoon.jsx';

import LoginPage from './pages/LoginPage.jsx';
import PrivacyPage from './pages/PrivacyPage.jsx';
import RoleRedirect from './pages/RoleRedirect.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

import StudentDashboard from './pages/student/StudentDashboard.jsx';
import StudentFeedbackForm from './pages/student/StudentFeedbackForm.jsx';
import StudentSubmissionConfirmation from './pages/student/StudentSubmissionConfirmation.jsx';
import StudentReflections from './pages/student/StudentReflections.jsx';

import StaffDashboard from './pages/staff/StaffDashboard.jsx';
import StaffClassSummary from './pages/staff/StaffClassSummary.jsx';
import StaffReflection from './pages/staff/StaffReflection.jsx';

import ManagementDashboard from './pages/management/ManagementDashboard.jsx';

import { ROLES } from './utils/constants.js';

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />

      {/* Role redirect */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <RoleRedirect />
          </ProtectedRoute>
        }
      />

      {/* Student */}
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
            <Layout><StudentDashboard /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/feedback"
        element={
          <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
            <Layout><StudentFeedbackForm /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/feedback/confirmation"
        element={
          <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
            <Layout><StudentSubmissionConfirmation /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/reflections"
        element={
          <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
            <Layout><StudentReflections /></Layout>
          </ProtectedRoute>
        }
      />

      {/* Staff */}
      <Route
        path="/staff/dashboard"
        element={
          <ProtectedRoute allowedRoles={[ROLES.STAFF]}>
            <Layout><StaffDashboard /></Layout>
          </ProtectedRoute>
        }
      />
      {/* The "Class Summary" sidebar link lands on the dashboard,
          which lists classes; specific class summary lives at /:classId. */}
      <Route
        path="/staff/summary"
        element={
          <ProtectedRoute allowedRoles={[ROLES.STAFF]}>
            <Layout><StaffDashboard /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/summary/:classId"
        element={
          <ProtectedRoute allowedRoles={[ROLES.STAFF]}>
            <Layout><StaffClassSummary /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/reflection"
        element={
          <ProtectedRoute allowedRoles={[ROLES.STAFF]}>
            <Layout><StaffReflection /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/reflection/:classId"
        element={
          <ProtectedRoute allowedRoles={[ROLES.STAFF]}>
            <Layout><StaffReflection /></Layout>
          </ProtectedRoute>
        }
      />

      {/* Management */}
      <Route
        path="/management/dashboard"
        element={
          <ProtectedRoute allowedRoles={[ROLES.MANAGEMENT]}>
            <Layout><ManagementDashboard /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/management/cycles"
        element={
          <ProtectedRoute allowedRoles={[ROLES.MANAGEMENT]}>
            <Layout><ComingSoon title="Feedback Cycles" phase="Phase 4" /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/management/reports"
        element={
          <ProtectedRoute allowedRoles={[ROLES.MANAGEMENT]}>
            <Layout><ComingSoon title="Reports" phase="Phase 4" /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/management/settings"
        element={
          <ProtectedRoute allowedRoles={[ROLES.MANAGEMENT]}>
            <Layout><ComingSoon title="Admin Settings" phase="Phase 4" /></Layout>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}