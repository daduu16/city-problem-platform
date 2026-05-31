import { Navigate } from 'react-router-dom';
import { isSuperAdmin } from '@/lib/isSuperAdmin';
import { useAuthStore } from '@/stores/authStore';

export function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const access = useAuthStore((s) => s.access);
  const user = useAuthStore((s) => s.user);
  if (!isSuperAdmin(access, user)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
