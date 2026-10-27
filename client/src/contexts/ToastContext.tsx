import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { m, AnimatePresence } from '../components/ui/motion';
import { AlertIcon, OkIcon } from '../components/ui/icons';

type Tone = 'info' | 'error';
interface Toast {
  id: number;
  text: string;
  tone: Tone;
}

const ToastContext = createContext<(text: string, tone?: Tone) => void>(() => {});

/** Short messages for things that happen in the background, such as a save that was rolled back. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const notify = useCallback((text: string, tone: Tone = 'info') => {
    const id = ++counter.current;
    setToasts((prev) => [...prev.slice(-2), { id, text, tone }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  }, []);

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 z-[60] flex flex-col items-center gap-2 px-4"
        style={{ bottom: 'calc(5.25rem + env(safe-area-inset-bottom))' }}
        role="status"
        aria-live="polite"
      >
        <AnimatePresence>
          {toasts.map((t) => (
            <m.div
              key={t.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.12 } }}
              transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
              className={`pointer-events-auto flex max-w-md items-start gap-3 rounded-[var(--radius-control)] border-[1.5px] px-4 py-3 shadow-xl ${
                t.tone === 'error' ? 'border-danger bg-danger-soft text-danger' : 'border-line-strong bg-surface text-ink'
              }`}
            >
              {t.tone === 'error' ? <AlertIcon className="mt-0.5 size-5 shrink-0" aria-hidden="true" /> : <OkIcon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />}
              <span>{t.text}</span>
            </m.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
