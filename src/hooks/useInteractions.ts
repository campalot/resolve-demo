
import { useQuery } from "@apollo/client";
import { GET_INTERACTIONS } from "../graphql/queries/getInteractions";
import type { InteractionFilters } from "../graphql/types";
import { useWorkspace } from "../contexts/Workspace/WorkspaceContext";

export function useInteractions({
  filters, 
  sortBy = "recent",
  page = 1,
  pageSize = 50,
}: {
  filters: InteractionFilters, 
  sortBy?: string,
  page: number;
  pageSize: number;
}) {
  const workspace = useWorkspace();
  const offset = (page - 1) * pageSize;
  const { data, previousData, loading, error } = useQuery(GET_INTERACTIONS, {
      variables: {
        offset,
        limit: pageSize,
        filters,
        sortBy,
        workspaceId: workspace.id,
      },
      notifyOnNetworkStatusChange: true,
    });

  return {
    interactions: data?.interactions.results ?? [],
    total: data?.interactions.pageInfo.total ?? 0,
    previousTotal: previousData?.interactions.pageInfo.total ?? 0,
    loading,
    error,
  };

}
