
import { useQuery } from "@apollo/client";
import { GET_WORKSPACES } from "../graphql/queries/getWorkspaces";

export function useWorkspacesList() {
  const { data, loading, error } = useQuery(GET_WORKSPACES, {
    fetchPolicy: 'cache-first',
  });

  return {
    workspaces: data?.workspaces ?? [],
    loading,
    error,
  };

}
