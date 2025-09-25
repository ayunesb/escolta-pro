// Demo role helpers for quick programmatic switches in Demo Mode.
// Non-critical convenience; UI RoleSwitcher already persists role.

export type DemoRole = 'client' | 'company' | 'guard';

const STORAGE_KEY = 'demo_role';

export const getRole = (): DemoRole => {
  try {
    const url = new URL(window.location.href);
    const qp = url.searchParams.get('as');
    if (qp && ['client','company','guard'].includes(qp)) return qp as DemoRole;
    const stored = localStorage.getItem(STORAGE_KEY) as DemoRole | null;
    if (stored && ['client','company','guard'].includes(stored)) return stored;
  } catch {}
  return 'client';
};

export const setRole = (role: DemoRole) => {
  if (!['client','company','guard'].includes(role)) return;
  try { localStorage.setItem(STORAGE_KEY, role); } catch {}
  try {
    const url = new URL(window.location.href);
    url.searchParams.set('as', role);
    // Navigate via hard redirect to ensure any auth / context resets in demo facade.
    window.location.href = url.toString();
  } catch {
    // Fallback: soft reload
    window.location.reload();
  }
};
