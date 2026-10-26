import type { ReactNode } from 'react';

export function PageHeader({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <header className="flex items-end justify-between gap-4 pb-5 pt-2">
      <div className="min-w-0">
        <h1 className="t-title">{title}</h1>
        {children && <p className="mt-1.5 max-w-prose text-ink-soft">{children}</p>}
      </div>
      {action}
    </header>
  );
}
