import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Map, List, LogOut, PanelLeftClose, PanelLeftOpen, Settings } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';
import { az } from '@/i18n/az';
import { formatRole } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, can } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useUiStore();

  const nav = [
    { to: '/', label: az.nav.dashboard, icon: LayoutDashboard, permission: 'view_dashboard' },
    { to: '/map', label: az.nav.map, icon: Map, permission: 'view_map' },
    { to: '/incidents', label: az.nav.incidents, icon: List, permission: 'view_incidents' },
    ...(can('manage_users')
      ? [{ to: '/admin/users', label: az.nav.admin, icon: Settings, permission: 'manage_users' }]
      : []),
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={cn(
          'flex shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-in-out',
          sidebarCollapsed ? 'w-16' : 'w-56',
        )}
      >
        <div
          className={cn(
            'flex items-start gap-2 border-b border-sidebar-border',
            sidebarCollapsed ? 'justify-center p-2' : 'p-4',
          )}
        >
          {!sidebarCollapsed && (
            <div className="min-w-0 flex-1">
              <h1 className="text-sm font-semibold tracking-wide text-sidebar-primary">
                {az.app.title}
              </h1>
              <p className="mt-1 text-xs text-muted-foreground">{az.app.subtitle}</p>
            </div>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className={cn('shrink-0 text-muted-foreground', sidebarCollapsed && 'mx-auto')}
            aria-label={
              sidebarCollapsed ? az.nav.expandSidebar : az.nav.collapseSidebar
            }
          >
            {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </Button>
        </div>

        <nav className="flex-1 space-y-1 p-2">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              title={sidebarCollapsed ? label : undefined}
              className={({ isActive }) =>
                cn(
                  'flex items-center rounded-md text-sm font-medium transition-colors',
                  sidebarCollapsed ? 'justify-center px-2 py-2.5' : 'gap-2 px-3 py-2',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                )
              }
            >
              <Icon size={18} className="shrink-0" />
              {!sidebarCollapsed && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className={cn('border-t border-sidebar-border', sidebarCollapsed ? 'p-2' : 'p-3')}>
          {!sidebarCollapsed && (
            <>
              <p className="truncate text-sm font-medium">{user?.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {user?.roleKey ? formatRole(user.roleKey) : ''}
              </p>
              <Separator className="my-3" />
            </>
          )}
          <Button
            type="button"
            variant="ghost"
            size={sidebarCollapsed ? 'icon' : 'sm'}
            onClick={logout}
            title={az.nav.signOut}
            className={cn(
              'text-muted-foreground hover:text-destructive',
              !sidebarCollapsed && 'w-full justify-start gap-2',
            )}
          >
            <LogOut size={14} className="shrink-0" />
            {!sidebarCollapsed && az.nav.signOut}
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
