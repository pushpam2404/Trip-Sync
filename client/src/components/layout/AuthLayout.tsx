import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../ui/Logo';
import { RoadArt } from '../ui/RoadArt';
import { ArrowLeftIcon } from '../ui/icons';

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Back link target, shown above the title. */
  back?: { to: string; label: string };
  /** For multi-step flows, e.g. { current: 1, total: 2 }. */
  step?: { current: number; total: number };
  /** Show the road drawing above the title on phones. */
  art?: boolean;
}

/** Two-column on desktop (brand on the left, form on the right), single column on phones. */
export function AuthLayout({ title, subtitle, children, footer, back, step, art = true }: AuthLayoutProps) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="hidden flex-col justify-between border-r border-line bg-surface p-12 lg:flex">
        <Logo />
        <div className="max-w-md">
          <RoadArt className="mb-10 w-full max-w-sm" />
          <p className="t-display">Road trips across India, planned in one place.</p>
          <p className="mt-5 max-w-sm text-lg text-ink-soft">
            Pick a route, find a stay, add petrol and food stops along the way, and ask Sakha when you are unsure.
          </p>
        </div>
        <p className="text-sm text-ink-muted">Maps by Mappls. Built as a student project.</p>
      </aside>

      <main className="pt-safe pb-safe flex flex-col px-5 sm:px-10">
        <div className="flex items-center justify-between py-5 lg:hidden">
          <Logo />
          {step && (
            <p className="text-sm font-semibold text-ink-soft">
              Step {step.current} of {step.total}
            </p>
          )}
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-6 lg:py-12">
          {back && (
            <Link to={back.to} className="mb-6 inline-flex min-h-11 items-center gap-2 self-start font-semibold text-ink-soft hover:text-ink">
              <ArrowLeftIcon className="size-4" aria-hidden="true" />
              {back.label}
            </Link>
          )}
          {step && (
            <div className="mb-5 hidden gap-1.5 lg:flex" aria-hidden="true">
              {Array.from({ length: step.total }).map((_, i) => (
                <span key={i} className={`h-1.5 flex-1 rounded-full ${i < step.current ? 'bg-accent' : 'bg-raised'}`} />
              ))}
            </div>
          )}
          {art && <RoadArt className="mb-6 h-24 w-48 lg:hidden" />}
          <h1 className="t-title">{title}</h1>
          {subtitle && <p className="mt-2 text-ink-soft">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-8 text-ink-soft">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
