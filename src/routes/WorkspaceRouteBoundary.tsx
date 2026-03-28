import { useEffect } from "react";
import { Navigate, Outlet, useParams } from "react-router-dom";
import { WorkspaceProvider } from "../contexts/Workspace/WorkspaceProvider";
import { useWorkspacesList } from "../hooks/useWorkspacesList";
import { LoadingScreen } from "../pages/LoadingScreen";
import { SimpleShellLayout } from "../layouts/SimpleShellLayout";
import type { Workspace } from "../types/schema";
import { useAppStore } from "../store/useAppStore";
import { DEFAULT_WORKSPACE_ID } from "./AppRoutes";

export function WorkspaceRouteBoundary() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const hasHydrated = useAppStore((state) => state._hasHydrated);
  // A. Get the persisted workspace from Zustand first (Synchronous!)
  const persistedWorkspace = useAppStore((state) => state.activeWorkspace);
  const setPersistedWorkspace = useAppStore(
    (state) => state.setActiveWorkspace,
  );

  // B. Run the query (Always call this at the top level)
  const { workspaces, loading } = useWorkspacesList();

  // C. Find the workspace in the fresh data if it exists
  const freshWorkspace =
    workspaces?.find((w: Workspace) => w.id === workspaceId) || workspaces?.[0];

  // D. Update the store when fresh data arrives (Optional but good)
  useEffect(() => {
    if (freshWorkspace) {
      setPersistedWorkspace(freshWorkspace);
    }
  }, [freshWorkspace, setPersistedWorkspace]);

  // IMPORTANT: If Zustand hasn't finished reading localStorage,
  // do not show a loading screen or navigate yet.
  // 1. Wait for Zustand hydration
  if (!hasHydrated) return null;

  // 2. Logic Check: Do we have a match in the cache/store?
  const activeWorkspace = freshWorkspace || persistedWorkspace;
  const isMatch = activeWorkspace?.id === workspaceId;

  // 3. The "No-Flash" Spinner Logic
  // Only show the spinner if we are loading AND we don't have a matching workspace to show yet.
  if (loading && !isMatch) {
    return (
      <SimpleShellLayout>
        <LoadingScreen />
      </SimpleShellLayout>
    );
  }

  // 4. Handle Redirects (URL doesn't match the data we found)
  if (!loading && activeWorkspace && activeWorkspace.id !== workspaceId) {
    return <Navigate to={`/w/${activeWorkspace.id}/dashboard`} replace />;
  }

  // 5. Final Guard
  if (!activeWorkspace) {
    return <Navigate to={`/w/${DEFAULT_WORKSPACE_ID}/dashboard`} replace />;
  }

  // 6. Render
  return (
    <WorkspaceProvider workspace={activeWorkspace}>
      <Outlet />
    </WorkspaceProvider>
  );
}
