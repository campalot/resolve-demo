import { useEffect, useState } from "react";
import { useQuery } from "@apollo/client";
import { GET_SEARCH_RESULTS } from "../graphql/queries/getSearchResults";
import type { SearchResult } from "../graphql/types";
import { useWorkspace } from "../contexts/Workspace/WorkspaceContext";

export function useSearchResults(queryString: string, limit: number = 10) {
  const workspace = useWorkspace();
  const [offset, setOffset] = useState(0);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const { loading, error } = useQuery(GET_SEARCH_RESULTS, {
    variables: { workspaceId: workspace.id, queryString, offset, limit },
    skip: !queryString,
    notifyOnNetworkStatusChange: true,
    onCompleted: (data) => {
      if (!data?.search) return;
      
      const newResults = data.search.results;
      setResults((prev) => (offset === 0 ? newResults : [...prev, ...newResults]));
      setHasMore(data.search.pageInfo.hasMore);
    },
  });

  // Keep this to reset state when the user types a new search
  useEffect(() => {
    setOffset(0);
    setResults([]);
    setHasMore(true);
  }, [queryString]);

  const fetchNextPage = () => {
    if (!loading && hasMore) {
      setOffset((prev) => prev + limit);
    }
  };

  return { results, loading, error, hasMore, fetchNextPage };
}

