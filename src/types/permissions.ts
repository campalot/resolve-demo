import type { Role } from "../api/cache";
import type { InteractionAction } from "../graphql/types";

export const ROLE_PERMISSIONS: Record<Role, InteractionAction[]> = {
  Admin: ["SUBMIT", "APPROVE", "REJECT", "RESUBMIT"],
  Editor: ["SUBMIT", "RESUBMIT"], 
  Viewer: [],
};