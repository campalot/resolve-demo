import { Navigate, Outlet, useParams } from "react-router-dom";
import { WorkspaceProvider } from "../contexts/Workspace/WorkspaceProvider";
import { useWorkspacesList } from "../hooks/useWorkspacesList";
import { LoadingScreen } from "../pages/LoadingScreen";
import { SimpleShellLayout } from "../layouts/SimpleShellLayout";
import type { Workspace } from "../graphql/types";

export function WorkspaceRouteBoundary() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { workspaces, loading } = useWorkspacesList();

  if (loading) {
    return (
    <SimpleShellLayout>
      <LoadingScreen />
    </SimpleShellLayout>
    );
  }

  const workspace =
    workspaceId && workspaces.find((w: Workspace) => w.id === workspaceId);

  if (!workspace) {
    return <Navigate to={`/w/${workspaces[0].id}/dashboard`} replace />;
  }

  return (
    <WorkspaceProvider workspace={workspace}>
      <Outlet />
    </WorkspaceProvider>
  );
}
