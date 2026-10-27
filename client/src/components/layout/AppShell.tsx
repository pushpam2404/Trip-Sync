import { Suspense, useEffect, useRef } from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Logo } from '../ui/Logo';
import { m } from '../ui/motion';
import { Spinner } from '../ui/Spinner';
import { HomeIcon, SakhaIcon, PlannerIcon, SavedIcon, HistoryIcon } from '../ui/icons';
import { TripSetupSheets } from '../trip/TripSetupSheets';

const NAV = [
  { to: '/', label: 'Home', icon: HomeIcon, end: true },
  { to: '/sakha', label: 'Sakha', icon: SakhaIcon },
  { to: '/planner', label: 'Planner', icon: PlannerIcon },
  { to: '/saved', label: 'Saved', icon: SavedIcon },
  { to: '/history', label: 'History', icon: HistoryIcon },
];

export const initials = (name?: string) => {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : parts[0].slice(0, 2)).toUpperCase();
};

export function AppShell() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  // Move focus to the page when the route changes, so keyboard and screen reader users start at the top.
  useEffect(() => {
    mainRef.current?.focus({ preventScroll: true });
    mainRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="flex h-dvh flex-col md:flex-row">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:font-semibold focus:text-on-accent"
      >
        Skip to content
      </a>

      {/* Desktop rail */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-surface px-4 py-6 md:flex">
        <Link to="/" className="mb-8 px-2" aria-label="TripSync home">
          <Logo />
        </Link>
        <nav aria-label="Main" className="flex flex-1 flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `relative flex min-h-11 items-center gap-3 rounded-[var(--radius-control)] px-3 font-semibold transition-colors ${
                  isActive ? 'bg-raised text-ink' : 'text-ink-soft hover:bg-raised hover:text-ink'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute inset-y-0 left-0 w-1 rounded-full bg-accent" aria-hidden="true" />}
                  <Icon className="size-5" aria-hidden="true" />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <Link
          to="/account"
          className="flex min-h-12 items-center gap-3 rounded-[var(--radius-control)] px-2 text-left transition-colors hover:bg-raised"
        >
          <span className="grid size-9 place-items-center rounded-full bg-ink font-display text-sm font-bold text-bg" aria-hidden="true">
            {initials(user?.name)}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-semibold leading-tight">{user?.name}</span>
            <span className="block text-sm text-ink-muted leading-tight">Account</span>
          </span>
        </Link>
      </aside>

      <div className="flex min-h-0 flex-1 flex-col">
        {/* Phone top bar */}
        <header className="pt-safe flex shrink-0 items-center justify-between border-b border-line bg-surface px-4 py-2 md:hidden">
          <Link to="/" aria-label="TripSync home">
            <Logo />
          </Link>
          <Link
            to="/account"
            aria-label="Account"
            className="grid size-11 place-items-center"
          >
            <span className="grid size-9 place-items-center rounded-full bg-ink font-display text-sm font-bold text-bg">
              {initials(user?.name)}
            </span>
          </Link>
        </header>

        <main id="main" ref={mainRef} tabIndex={-1} className="min-h-0 flex-1 overflow-y-auto outline-none">
          <Suspense
            fallback={
              <div className="grid h-full min-h-60 place-items-center">
                <Spinner label="Loading" />
              </div>
            }
          >
            {/* A short fade when the tab changes, so the switch reads as movement rather than a flash. */}
            <m.div key={pathname} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, ease: [0.25, 1, 0.5, 1] }} className="h-full">
              <Outlet />
            </m.div>
          </Suspense>
        </main>

        {/* Phone tab bar */}
        <nav
          aria-label="Main"
          className="shrink-0 border-t border-line bg-surface md:hidden"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <ul className="mx-auto grid max-w-md grid-cols-5">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-semibold transition-colors ${
                      isActive ? 'text-ink' : 'text-ink-muted'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && <span className="absolute inset-x-4 top-0 h-1 rounded-b-full bg-accent" aria-hidden="true" />}
                      <Icon className="size-5" aria-hidden="true" />
                      {label}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <TripSetupSheets />
    </div>
  );
}
