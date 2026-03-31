import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { activeRoleVar } from '../api/cache';
import type { Workspace } from '../types/schema';
import { client } from '../api/mockApolloClient';

type Role = 'Admin' | 'Editor' | 'Viewer';
export type DataStrategy = 'APOLLO' | 'TANSTACK';
export type ErrorType = 'app' | 'content';

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
  latency: number;
  setLatency: (ms: number) => void;
  forceError: ErrorType | null;
  setForceError: (type: ErrorType | null) => void;
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
      latency: Number(localStorage.getItem('DEV_LATENCY')) || 0,
      setLatency: (ms) => {
        localStorage.setItem('DEV_LATENCY', ms.toString());
        set({ latency: ms });
      },
      forceError: null, // Don't persist this; we want a fresh start on reload
      setForceError: (type: ErrorType | null) => set({ forceError: type }),
    }),
    {
      name: 'app-storage', // key in localStorage
      onRehydrateStorage: (state) => {
        // This runs when hydration starts
        return () => {
          // This runs when hydration finishes
          state.setHasHydrated(true);

          // 🔥 Re-sync Apollo reactive var
          if (state.activeRole) {
            activeRoleVar(state.activeRole);
            // TODO:
            // Apollo reactive var dependency is not triggering TypePolicy recompute on hydration.
            // Attempted Query.currentRole bridge caused instability in list/detail views.
            // Revisit with safer dependency tracking or cache invalidation strategy
            // in order to see the actions change when switching to Apollo 
            client.reFetchObservableQueries();
          }
        };
      },
      partialize: (state) => ({ 
        activeRole: state.activeRole, 
        activeWorkspace: state.activeWorkspace,
      }),
    },
  )
);