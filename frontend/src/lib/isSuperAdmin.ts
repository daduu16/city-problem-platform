import type { User, UserAccess } from '@/types';

export function isSuperAdmin(
  access: UserAccess | null | undefined,
  user?: User | null,
): boolean {
  return (
    access?.roleKey === 'super_admin' || user?.roleKey === 'super_admin'
  );
}
