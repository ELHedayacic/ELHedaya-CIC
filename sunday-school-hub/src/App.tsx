import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import LoadingScreen from "@/components/shared/LoadingScreen";

import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/auth/LoginPage";
import SignupPage from "@/pages/auth/SignupPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import SetPasswordPage from "@/pages/auth/SetPasswordPage";
import NotFound from "@/pages/NotFound";

const PortalLayout = lazy(() => import("@/pages/portal/PortalLayout"));
const ParentDashboard = lazy(() => import("@/pages/portal/ParentDashboard"));
const MyStudents = lazy(() => import("@/pages/portal/MyStudents"));
const RegisterStudent = lazy(() => import("@/pages/portal/RegisterStudent"));
const ParentSchedule = lazy(() => import("@/pages/portal/ParentSchedule"));
const ParentHomework = lazy(() => import("@/pages/portal/ParentHomework"));
const ParentProgress = lazy(() => import("@/pages/portal/ParentProgress"));
const ParentMessages = lazy(() => import("@/pages/portal/ParentMessages"));
const ParentPayments = lazy(() => import("@/pages/portal/ParentPayments"));
const ParentSettings = lazy(() => import("@/pages/portal/ParentSettings"));

const AdminLayout = lazy(() => import("@/pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminClasses = lazy(() => import("@/pages/admin/AdminClasses"));
const AdminSchedule = lazy(() => import("@/pages/admin/AdminSchedule"));
const AdminStudents = lazy(() => import("@/pages/admin/AdminStudents"));
const AdminHomework = lazy(() => import("@/pages/admin/AdminHomework"));
const AdminProgress = lazy(() => import("@/pages/admin/AdminProgress"));
const AdminMessages = lazy(() => import("@/pages/admin/AdminMessages"));
const AdminPayments = lazy(() => import("@/pages/admin/AdminPayments"));
const AdminFees = lazy(() => import("@/pages/admin/AdminFees"));
const AdminStaff = lazy(() => import("@/pages/admin/AdminStaff"));
const AdminFamilies = lazy(() => import("@/pages/admin/AdminFamilies"));

export default function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/set-password" element={<SetPasswordPage />} />

        <Route
          path="/portal"
          element={
            <ProtectedRoute>
              <PortalLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<ParentDashboard />} />
          <Route path="students" element={<MyStudents />} />
          <Route path="students/new" element={<RegisterStudent />} />
          <Route path="schedule" element={<ParentSchedule />} />
          <Route path="homework" element={<ParentHomework />} />
          <Route path="progress" element={<ParentProgress />} />
          <Route path="messages" element={<ParentMessages />} />
          <Route path="payments" element={<ParentPayments />} />
          <Route path="settings" element={<ParentSettings />} />
        </Route>

        <Route
          path="/admin"
          element={
            <ProtectedRoute requireStaff>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="classes" element={<AdminClasses />} />
          <Route path="schedule" element={<AdminSchedule />} />
          <Route path="students" element={<AdminStudents />} />
          <Route path="homework" element={<AdminHomework />} />
          <Route path="progress" element={<AdminProgress />} />
          <Route path="messages" element={<AdminMessages />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="fees" element={<AdminFees />} />
          <Route path="staff" element={<AdminStaff />} />
          <Route path="families" element={<AdminFamilies />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
