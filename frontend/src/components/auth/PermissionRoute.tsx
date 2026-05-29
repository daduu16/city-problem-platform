import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

export function PermissionRoute({
  permission,
  children,
}: {
  permission: string;
  children: React.ReactNode;
}) {
  const can = useAuthStore((s) => s.can);
  if (!can(permission)) return <Navigate to="/" replace />;
  return <>{children}</>;
}
