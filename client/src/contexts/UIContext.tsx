/**
 * UIContext: theme and the trip-setup sheets that any screen can open.
 */
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Theme, ModalType } from '../types';

interface UIContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  activeModal: ModalType;
  setActiveModal: (modal: ModalType) => void;
}

const UIContext = createContext<UIContextValue | undefined>(undefined);

const readTheme = (): Theme => {
  try {
    const stored = localStorage.getItem('tripsync-theme');
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
};

export function UIProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(readTheme);
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    try {
      localStorage.setItem('tripsync-theme', theme);
    } catch {
      // ignore
    }
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#101312' : '#f1f2ec');
  }, [theme]);

  return (
    <UIContext.Provider value={{ theme, setTheme, activeModal, setActiveModal }}>{children}</UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (!context) throw new Error('useUI must be used within a UIProvider');
  return context;
}
