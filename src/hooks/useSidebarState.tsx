
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SidebarContextType {
  isOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  openSidebar: () => void;
  shouldCreateNewChatOnLoad: boolean;
  setShouldCreateNewChatOnLoad: (should: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebarState = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    return { isOpen: true, toggle: ()=>{}, open: ()=>{}, close: ()=>{} };
  }
  return context;
};

export const SidebarProvider = ({ children }: { children: ReactNode }) => {
  // Sidebar open state: default closed; persisted under new key to reset defaults
  const STORAGE_KEY = 'daryle_sidebarOpen_v2';
  const [isOpen, setIsOpen] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) return JSON.parse(saved);
      if (typeof window !== 'undefined') {
        // Default: open on >= 640px (tablet/desktop), closed on smaller (mobile)
        return window.matchMedia('(min-width: 640px)').matches;
      }
    } catch {}
    return false;
  });

  // Track if we should create a new chat when the user first loads the page
  const [shouldCreateNewChatOnLoad, setShouldCreateNewChatOnLoad] = useState(false);

  // Persist state changes to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(isOpen));
  }, [isOpen]);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => setIsOpen(false);
  const openSidebar = () => setIsOpen(true);

  // Global shortcut: Ctrl/Cmd + B toggles the left sidebar.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && (e.key === 'b' || e.key === 'B')) {
        const target = e.target as HTMLElement | null;
        const tag = target?.tagName;
        // Don't hijack while typing in inputs / contenteditable
        if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return;
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <SidebarContext.Provider value={{
      isOpen,
      toggleSidebar,
      closeSidebar,
      openSidebar,
      shouldCreateNewChatOnLoad,
      setShouldCreateNewChatOnLoad
    }}>
      {children}
    </SidebarContext.Provider>
  );
};
