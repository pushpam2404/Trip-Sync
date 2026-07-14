/**
 * UIContext — Handles global UI states (theme, active modal, active tab).
 * Split from the original monolithic AppContext.
 */
import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { Theme, ModalType, TabId } from '../types';

interface UIContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  activeModal: ModalType;
  setActiveModal: (modal: ModalType) => void;
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
}

const UIContext = createContext<UIContextValue | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  // Theme state
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem('tripsync-theme');
      if (stored === 'light' || stored === 'dark') return stored;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'dark';
    }
  });

  // Active tab state
  const [activeTab, setActiveTabState] = useState<TabId>(() => {
    try {
      const stored = localStorage.getItem('tripsync-activeTab');
      if (stored === 'sakha' || stored === 'planner' || stored === 'destinations' || stored === 'history') {
        return stored as TabId;
      }
      return 'sakha';
    } catch {
      return 'sakha';
    }
  });

  // Active modal state
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  // Sync theme class to document element
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('tripsync-theme', theme);
  }, [theme]);

  // Sync active tab to localStorage
  const setActiveTab = (tab: TabId) => {
    setActiveTabState(tab);
    localStorage.setItem('tripsync-activeTab', tab);
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const value: UIContextValue = {
    theme,
    setTheme,
    activeModal,
    setActiveModal,
    activeTab,
    setActiveTab,
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within an UIProvider');
  }
  return context;
}
