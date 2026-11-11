import { create } from 'zustand';

interface UIStore {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isSidebarOpen: localStorage.getItem('sidebar_open') !== 'false',
  toggleSidebar: () =>
    set((state) => {
      const next = !state.isSidebarOpen;
      localStorage.setItem('sidebar_open', String(next));
      return { isSidebarOpen: next };
    }),
  openSidebar: () => {
    localStorage.setItem('sidebar_open', 'true');
    set({ isSidebarOpen: true });
  },
  closeSidebar: () => {
    localStorage.setItem('sidebar_open', 'false');
    set({ isSidebarOpen: false });
  },
}));

