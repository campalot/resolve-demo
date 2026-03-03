import { useQuery } from "@apollo/client";
import { GET_PROFILE } from "../graphql/queries/getProfile";
import { useWorkspace } from "../contexts/Workspace/WorkspaceContext";

export function useProfile(identityId?: string) {
  const workspace = useWorkspace();
  const { data, loading, error } = useQuery(GET_PROFILE, {
      variables: {
        workspaceId: workspace.id,
        identityId: identityId ?? "",
      },
      fetchPolicy: "cache-and-network",
      skip: !identityId,
    });

  return {
    identity: data?.identity ?? null,
    interactions: data?.interactionsByIdentity ?? [],
    activities: data?.activityByActor ?? [],
    loading,
    error,
  };

}
