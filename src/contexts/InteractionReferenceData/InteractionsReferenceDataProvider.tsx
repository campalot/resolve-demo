// import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { useQuery } from "@apollo/client";
import { useWorkspace } from "../Workspace/WorkspaceContext";
import type { InteractionsReferenceData } from "./InteractionsReferenceDataContext";
import { InteractionsReferenceDataContext } from "./InteractionsReferenceDataContext";

import { GET_INTERACTIONS_REFERENCE_DATA } from "../../graphql/queries/InteractionsReferenceData";

export const InteractionsReferenceDataProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const workspace = useWorkspace();
  const { data } = useQuery(GET_INTERACTIONS_REFERENCE_DATA, {
    variables: {
      workspaceId: workspace.id,
    },
    fetchPolicy: "cache-and-network",
  });

  const value: InteractionsReferenceData = {
    parties: data?.parties ?? [],
    statuses: data?.interactionStatuses ?? [],
    types: data?.interactionTypes ?? [],
  };

  return (
    <InteractionsReferenceDataContext.Provider value={value}>
      {children}
    </InteractionsReferenceDataContext.Provider>
  );
};
