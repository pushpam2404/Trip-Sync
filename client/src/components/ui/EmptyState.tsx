import type { ComponentType, ReactNode } from 'react';

export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-start gap-3 py-12">
      <span className="grid size-12 place-items-center rounded-full border-2 border-dashed border-line-strong text-ink-soft">
        <Icon className="size-5" />
      </span>
      <h2 className="t-heading">{title}</h2>
      <p className="text-ink-soft">{children}</p>
      {action}
    </div>
  );
}
