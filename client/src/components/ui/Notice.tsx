import type { ReactNode } from 'react';
import { AlertIcon } from './icons';

/** Inline message. Errors are announced to screen readers as they appear. */
export function Notice({ children, tone = 'danger', action }: { children: ReactNode; tone?: 'danger' | 'info'; action?: ReactNode }) {
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={`callout flex items-start gap-3 ${tone === 'danger' ? 'callout-danger' : ''}`}
    >
      <AlertIcon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">{children}</div>
      {action}
    </div>
  );
}
