import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { AppLayout } from '@/components/layout/AppLayout';
import { PermissionRoute } from '@/components/auth/PermissionRoute';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { MapPage } from '@/pages/MapPage';
import { ArchivedMapPage } from '@/pages/ArchivedMapPage';
import { IncidentsPage } from '@/pages/IncidentsPage';
import { AdminUsersPage } from '@/pages/AdminUsersPage';
import { useRealtime } from '@/hooks/useRealtime';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AuthenticatedApp />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function AuthenticatedApp() {
  useRealtime();

  return (
    <AppLayout>
      <Routes>
        <Route
          path="/"
          element={
            <PermissionRoute permission="view_dashboard">
              <DashboardPage />
            </PermissionRoute>
          }
        />
        <Route
          path="/map"
          element={
            <PermissionRoute permission="view_map">
              <MapPage />
            </PermissionRoute>
          }
        />
        <Route
          path="/map/archived"
          element={
            <PermissionRoute permission="view_map">
              <ArchivedMapPage />
            </PermissionRoute>
          }
        />
        <Route
          path="/incidents"
          element={
            <PermissionRoute permission="view_incidents">
              <IncidentsPage />
            </PermissionRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <PermissionRoute permission="manage_users">
              <AdminUsersPage />
            </PermissionRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}
