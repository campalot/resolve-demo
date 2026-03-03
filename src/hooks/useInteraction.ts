import { useQuery } from "@apollo/client";
import { GET_INTERACTION } from "../graphql/queries/getInteraction";
import { useWorkspace } from "../contexts/Workspace/WorkspaceContext";
import type { Interaction } from "../graphql/types";

type GetInteractionData = {
  interaction: Interaction;
};

type GetInteractionVars = {
  workspaceId: string;
  interactionId: string;
};

export function useInteraction(interactionId?: string) {
  const workspace = useWorkspace();
  const { data, loading, error } = useQuery<
    GetInteractionData,
    GetInteractionVars
  >(GET_INTERACTION, {
    variables: {
      workspaceId: workspace.id,
      interactionId: interactionId ?? "",
    },
    skip: !interactionId,
  });

  return {
    interaction: data?.interaction ?? null,
    loading,
    error,
    hasId: Boolean(interactionId),
  };
}

