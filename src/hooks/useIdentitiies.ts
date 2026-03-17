
import { useQuery } from "@apollo/client";
import { GET_IDENTITIES } from "../graphql/queries/getIdentities";
import type { IdentityFilters } from "../graphql/types";
import { useWorkspace } from "../contexts/Workspace/WorkspaceContext";

export function useIdentities({
  filters, 
  sortBy = "name",
  page = 1,
  pageSize = 12,
}: {
  filters: IdentityFilters, 
  sortBy?: string,
  page: number;
  pageSize: number;
}) {
  const workspace = useWorkspace();
  const offset = (page - 1) * pageSize;
  const { data, previousData, error, networkStatus } = useQuery(GET_IDENTITIES, {
      variables: {
        offset,
        limit: pageSize,
        filters,
        sortBy,
        workspaceId: workspace.id,
      },
      fetchPolicy: 'cache-and-network',
      notifyOnNetworkStatusChange: true,
    });


  const loading = networkStatus === 1 && !data;
  const activeData = data || previousData;

  return {
    identities: activeData?.identities.results ?? [],
    total: activeData?.identities.pageInfo.total ?? 0,
    previousTotal: previousData?.identities.pageInfo.total ?? 0,
    loading,
    isRefetching: networkStatus === 4,
    isSorting: networkStatus === 2,
    error,
  };

}
