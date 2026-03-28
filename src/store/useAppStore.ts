import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { activeRoleVar } from '../api/cache';
import type { Workspace } from '../types/schema';

type Role = 'Admin' | 'Editor' | 'Viewer';
export type DataStrategy = 'APOLLO' | 'TANSTACK';

interface AppState {
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  activeRole: Role;
  activeWorkspace: Workspace | null;
  setActiveWorkspace: (workspace: Workspace) => void;
  isSyncing: boolean;
  setRole: (role: Role) => void;
  setSyncing: (bool: boolean) => void;
  dataStrategy: DataStrategy;
  setDataStrategy: (strategy: DataStrategy) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      activeRole: 'Admin' as Role,
      activeWorkspace: null,
      setActiveWorkspace: (workspace: Workspace) => set({ activeWorkspace: workspace }),
      isSyncing: false,
      setRole: (role) => {
        // 1. Update the Apollo world (triggers the TypePolicy read)
        activeRoleVar(role); 
        // 2. Update the Zustand world (triggers your React hooks)
        set({ activeRole: role });
      },
      setSyncing: (bool) => set({ isSyncing: bool }),
      dataStrategy: (localStorage.getItem('DATA_STRATEGY') as DataStrategy) || 'TANSTACK',
      setDataStrategy: (strategy) => {
        localStorage.setItem('DATA_STRATEGY', strategy);
        // Force a reload to ensure caches are purged and MSW re-binds
        window.location.reload(); 
      },
    }),
    {
      name: 'app-storage', // key in localStorage
      onRehydrateStorage: (state) => {
        // This runs when hydration starts
        return () => {
          // This runs when hydration finishes
          state.setHasHydrated(true);
        };
      },
      partialize: (state) => ({ 
        activeRole: state.activeRole, 
        activeWorkspace: state.activeWorkspace,
      }),
    },
  )
);