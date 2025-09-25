import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface NavItem {
  label: string;
  path: string;
}

const nav: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Settings', path: '/settings' },
  { label: 'Stripe Failed Events', path: '/stripe-failed-events' },
];

export function AdminLayout({ currentPath, onNavigate, children }: { currentPath: string; onNavigate: (p: string) => void; children: ReactNode }) {
  const { user } = useAuth();
  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <aside className="w-56 border-r bg-muted/30 flex flex-col">
        <div className="p-4 font-semibold text-lg">Admin</div>
        <nav className="flex-1 space-y-1 px-2">
          {nav.map(item => {
            const active = item.path === currentPath;
            return (
              <button
                key={item.path}
                className={`w-full text-left px-3 py-2 rounded hover:bg-muted transition text-sm ${active ? 'bg-muted font-medium' : ''}`}
                onClick={() => onNavigate(item.path)}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="p-3 text-xs text-muted-foreground border-t truncate">{user?.email}</div>
      </aside>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}

export default AdminLayout;
