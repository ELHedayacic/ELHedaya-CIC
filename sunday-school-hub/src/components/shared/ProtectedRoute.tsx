import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import LoadingScreen from "@/components/shared/LoadingScreen";

export function ProtectedRoute({
  children,
  requireStaff = false,
}: {
  children: React.ReactNode;
  requireStaff?: boolean;
}) {
  const { user, profile, loading, isStaff } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Wait for the profile to actually finish loading before deciding
  // whether this user counts as staff — checking isStaff any earlier
  // could see a momentary "not staff yet" state and redirect an admin
  // away before their role has loaded.
  if (!profile) return <LoadingScreen />;

  // Accounts admins create directly (temp password, no email link) must
  // change that password before reaching anything else — checked here,
  // not just right after login, so it's enforced no matter how someone
  // lands back in the app (a stale tab, a bookmark, a page reload).
  if (profile.must_change_password) {
    return <Navigate to="/set-password" replace />;
  }

  if (requireStaff && !isStaff) {
    return <Navigate to="/portal" replace />;
  }

  return <>{children}</>;
}
