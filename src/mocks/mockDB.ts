import { generateActivities } from "./mockActivities";
import { generateInteractions } from "./mockInteractions";
import { generateIdentities } from "./mockIdentities";
import { generateWorkspaces } from "./mockWorkspaces";
import type { IdentityRecord } from "../graphql/types";
import type { InteractionActivityRecord } from "../graphql/types";
import type { InteractionRecord } from "../graphql/types";
import type { Workspace } from "../graphql/types";

type MockDbProps = {
  identities: IdentityRecord[];
  interactions: InteractionRecord[];
  interactionActivities: InteractionActivityRecord[];
  workspaces: Workspace[];
}

function generateWorkspaceData(workspaceId: string) {
  const identities = generateIdentities(workspaceId);
  const interactions = generateInteractions(workspaceId, identities);
  const activities = generateActivities(workspaceId, interactions, identities);

  return { identities, interactions, activities };
}

/**
 * Factory function — generates a fresh DB
 */
function generateMockDb(): MockDbProps {
  const workspaces = generateWorkspaces();
  const workspaceData = workspaces.map((w) =>
    generateWorkspaceData(w.id)
  );

  return {
    identities: workspaceData.flatMap((d) => d.identities),
    interactions: workspaceData.flatMap((d) => d.interactions),
    interactionActivities: workspaceData.flatMap((d) => d.activities),
    workspaces, // not part of workspaceData
  };
}

/**
 * Module-scoped mutable instance
 */
let db: MockDbProps = generateMockDb();

/**
 * Getter used everywhere instead of importing object directly
 */
export function getMockDb(): MockDbProps {
  return db;
}

/**
 * Used in tests to reset state
 */
export function resetMockDb(): void {
  db = generateMockDb();
}


