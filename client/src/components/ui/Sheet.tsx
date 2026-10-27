import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { CloseIcon } from './icons';

const FOCUSABLE = 'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Change this when the content swaps to another view, so focus moves into the new view. */
  focusKey?: string;
}

/** Modal dialog: bottom sheet on phones, centred on wider screens. Esc and the scrim close it. */
export function Sheet({ open, onClose, title, children, focusKey }: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  // Stay mounted for the length of the exit animation, which is plain CSS so it cannot hang.
  const [mounted, setMounted] = useState(open);
  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    const timer = setTimeout(() => setMounted(false), 160);
    return () => clearTimeout(timer);
  }, [open]);

  const state = open ? 'open' : 'closed';

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel)?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault();
        firstItem.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [open]);

  // Moving between views inside one open sheet: put focus on the first control of the new view.
  useEffect(() => {
    if (!open || focusKey === undefined) return;
    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
    // skip the close button, which comes first in the DOM
    const target = Array.from(panel?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).find((el) => el.getAttribute('aria-label') !== 'Close') ?? first;
    target?.focus();
  }, [focusKey, open]);

  if (!open && !mounted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="sheet-scrim absolute inset-0" data-state={state} onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        data-state={state}
        className="sheet-panel pb-safe relative max-h-[88dvh] w-full overflow-y-auto rounded-t-[var(--radius-sheet)] border border-line bg-surface px-5 pt-5 shadow-2xl outline-none sm:max-w-md sm:rounded-[var(--radius-sheet)]"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id={titleId} className="t-heading text-xl">{title}</h2>
          <button type="button" className="icon-btn -mr-2 -mt-2" onClick={onClose} aria-label="Close">
            <CloseIcon className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
