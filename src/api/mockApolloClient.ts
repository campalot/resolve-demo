import { ApolloClient, InMemoryCache, ApolloLink, Observable } from "@apollo/client";
import type { Observer } from "@apollo/client";
import { getMockDb } from "../mocks/mockDB";
import type { 
  Identity, 
  IdentityRecord, 
  Interaction,
  InteractionActivity,
  InteractionActivityMetadataRecord_Decision,
  InteractionActivityMetadataRecord_Reviewer,
  InteractionActivityRecord,
  InteractionParty,
  InteractionRecord,
  InteractionState,
  ToastNotification,
} from "../graphql/types";
import { WORKFLOW } from "../graphql/types";
import { parseDate } from "../helpers";
import { transitionInteraction } from "../mocks/mockActivities";
import { buildInteractionToastMessage } from "../pages/InteractionDetail/buildInteractionMetadata";
import { activeRoleVar } from "./cache";
import { ROLE_PERMISSIONS } from "../types/permissions";
import { persistDb } from "../mocks/mockDB";
import { backendLogger } from "./logger";

export function isMemberOfWorkspace(workspaceId: string | string[], targetWorkspaceId: string) {
  if (Array.isArray(workspaceId)) {
    return workspaceId.includes(targetWorkspaceId);
  }
  return workspaceId === targetWorkspaceId;
}

// To simulate a little network latency with queries and mutations 
const withLatency = <T>(
  observer: Observer<T>,
  fn: () => void,
  delay = 400
) => {
  setTimeout(() => {
    try {
      fn();
      observer.complete?.();
    } catch (e) {
      observer.error?.(e as Error);
    }
  }, delay);
};

// Match the text of multiple interaction properties to a search query
function interactionMatchesQuery(
  interaction: Interaction,
  query: string
) {
  if (interaction.title.toLowerCase().includes(query)) return true;

  return interaction.parties.some((party) =>
    party.identity?.name.toLowerCase().includes(query)
  );
}

function getProfileInteractionsAndActivities(workspaceId: string, identityId: string){
  const mockDb = getMockDb();
  let activities = mockDb.interactionActivities.filter((activity) => {
    return activity.workspaceId === workspaceId;
  })
  activities = activities.filter((activity) => {
    const isActor =
      activity?.actorId === identityId;
    const actor = mockDb.identities.find((i) => i.id === activity?.actorId);
    const isActorCompany = actor?.companyId === identityId;

    const isNextReviewer =
      activity?.metadata.__typename ===
        "InteractionActivityMetadataRecord_Reviewer" &&
      activity.metadata.nextReviewer.identityId === identityId;

    const isDecisionMaker =
      activity?.metadata.__typename ===
        "InteractionActivityMetadataRecord_Decision" &&
      activity.metadata.decisionMakerId === identityId;

    return isActor || isActorCompany || isNextReviewer || isDecisionMaker;
  });

  const activityInteractionIds = new Set(
    activities
      .map((a) => a?.interactionId)
      .filter(Boolean) // Remove null/undefined IDs
  );

  let interactions = mockDb.interactions.filter((interaction) => {
    return interaction.workspaceId === workspaceId;
  })

  interactions = interactions.filter((interaction) => {
    const isPartyOrReviewer = 
        interaction.parties.some((p) => p?.identityId === identityId) || 
        interaction.currentReviewerId === identityId;

    // Check if this interaction is referenced by any filtered activity
    const isLinkedToActivity = activityInteractionIds.has(interaction.id);

    return isPartyOrReviewer || isLinkedToActivity;
  });

  return { activities, interactions}
}


// Begin Projection Layer
function resolveInteraction(interaction: InteractionRecord): Interaction {
  const currentRole = activeRoleVar();
  // Use that role to filter the buttons/actions
  const workflowActions = WORKFLOW[interaction.status].allowedActions;
  const permittedActions = workflowActions.filter(action => 
    ROLE_PERMISSIONS[currentRole].includes(action)
  );

  const mockDb = getMockDb();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { creatorId, currentReviewerId, ...resolvedInteraction } =  {
    __typename: "Interaction" as const,
    ...interaction,
    creator: mockDb.identities.find((id: Identity) => id.id === interaction.creatorId)!,
    currentReviewer: mockDb.identities.find((id: Identity) => id.id === interaction.currentReviewerId) || null,
    notifications: [],
    parties: interaction.parties.map((party) => {
      const identity = mockDb.identities.find(
        (id: Identity) => id.id === party.identityId
      );

      if (!identity) return null;

      return ({
        role: party.role,
        identity,
      })
    }).filter((party): party is InteractionParty => party !== null),
  };

  return {
    ...resolvedInteraction,
    permittedActions,
  };
}

type IdentityStats = {
  total: number;
  active: number;
  awaiting: number;
  lastActivityAt: number | null;
}

function resolveIdentityStats(workspaceId: string, identityId: string): IdentityStats {
  const { activities, interactions } = getProfileInteractionsAndActivities(workspaceId, identityId);

  const lastActivityAt = activities.length
    ? Math.max(...activities.map(a => new Date(a.occurredAt).getTime()))
    : null;

  const total = interactions.length;
  const decidedCount = interactions.filter(
    (i) => i.status === "APPROVED" || i.status === "REJECTED",
  ).length;
  const active = total - decidedCount;

  const reviewerActivities = activities.filter(
    (activity) => activity.metadata.__typename === "InteractionActivityMetadataRecord_Reviewer"
  );
  const awaiting = reviewerActivities.filter(
    (activity) => (activity.metadata as InteractionActivityMetadataRecord_Reviewer)
    .nextReviewer.identityId === identityId).length;

  return {
    total,
    active,
    awaiting,
    lastActivityAt,
  }
}

function resolveIdentity(identity: IdentityRecord): Identity & { stats: IdentityStats} {
  const mockDb = getMockDb();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { companyId, ...resolvedIdentity } =  {
    ...identity,
    __typename: "Identity" as const,
    company: mockDb.identities.find((id: IdentityRecord) => id.id === identity.companyId),
    stats: resolveIdentityStats(identity.workspaceId, identity.id),
  };

  return resolvedIdentity;
}


// Activity uses a reduced identity projection to simulate
// field-level selection and prevent unintended cache merging.
function projectIdentityForActivity(
  identityId: string
): Identity | null {
  const mockDb = getMockDb();
  const record = mockDb.identities.find(
    (id) => id.id === identityId
  );

  if (!record) return null;

  return {
    __typename: "Identity",
    id: record.id,
    workspaceId: record.workspaceId,
    name: record.name,
    type: record.type,
    status: record.status,
    country: record.country,
    createdAt: record.createdAt,
    company: record.companyId
      ? mockDb.identities.find(i => i.id === record.companyId)
      : undefined,
  };
}

function resolveInteractionActivity(interactionActivity: InteractionActivityRecord): InteractionActivity | null {
  switch (interactionActivity.metadata.__typename) {
    case 'InteractionActivityMetadataRecord_Reviewer': {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { actorId, ...resolvedActivity } = {
        ...interactionActivity,
        __typename: "InteractionActivity" as const,
        actor: projectIdentityForActivity(interactionActivity.actorId)!,
        metadata: {
          ...interactionActivity.metadata,
          __typename: "InteractionActivityMetadata_Reviewer" as const,
          nextReviewer: {
            ...interactionActivity.metadata.nextReviewer,
            identity: projectIdentityForActivity((interactionActivity.metadata as InteractionActivityMetadataRecord_Reviewer).nextReviewer?.identityId)!,
          }
        },
      };
      return resolvedActivity;
      break;
    }

    case 'InteractionActivityMetadataRecord_Decision': {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { actorId, ...resolvedActivity } = {
        ...interactionActivity,
        __typename: "InteractionActivity" as const,
        actor: projectIdentityForActivity(interactionActivity.actorId)!,
        metadata: {
          ...interactionActivity.metadata,
           __typename: "InteractionActivityMetadata_Decision" as const,
          decisionMaker: projectIdentityForActivity((interactionActivity.metadata as InteractionActivityMetadataRecord_Decision).decisionMakerId)!,
        },
      };
      return resolvedActivity;
      break;
    }

    case 'InteractionActivityMetadata_Created':
    case 'InteractionActivityMetadata_Comment':
    case 'InteractionActivityMetadata_Status': {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { actorId, ...resolvedActivity } = {
        ...interactionActivity,
        __typename: "InteractionActivity" as const,
        actor: projectIdentityForActivity(interactionActivity.actorId)!,
        metadata: {
          ...interactionActivity.metadata,
        },
      };
      return resolvedActivity;
      break;
    }
  }
  return null;
}
// End Projection Layer






const dynamicMockLink = new ApolloLink((operation) => {
  return new Observable((observer) => {
    const mockDb = getMockDb();
    const { operationName, variables } = operation;

    if (operationName === 'GetWorkspaces') {
        withLatency(observer, () => {
          const workspaces = mockDb.workspaces;
          observer.next({
            data: {
              workspaces,
            }
          });
        }, 200);
    } else if (operationName === 'GetWorkspace') {
        withLatency(observer, () => {
          const { workspaceId } = variables ?? {};
          const workspace = mockDb.workspaces.find(
            (w) => w.id === workspaceId
          );
          if (!workspace) {
            observer.error(new Error("Workspace not found"));
            return;
          }
          observer.next({
            data: {
              workspace: {
                ...workspace,
                __typename: "Workspace",
              },
            }
          });
        }, 200);
    } else if (operationName === 'GetInteractions') {
        withLatency(observer, () => {
          const { workspaceId, sortBy, filters = {}, offset = 0, limit = 50 } = variables ?? {};
          let resolved = mockDb.interactions.map(resolveInteraction);

          resolved = resolved.filter((interaction) => interaction.workspaceId === workspaceId);

          if (filters.status && filters.status.length > 0) {
            resolved = resolved.filter((interaction) => filters.status.includes(interaction.status.toLowerCase()));
          }

          if (filters.type && filters.type.length > 0) {
            resolved = resolved.filter((interaction) => filters.type.includes(interaction.type.toLowerCase()));
          }

          if (filters.identityId) {
            resolved = resolved.filter((interaction) =>
              interaction.parties.some(
                (p) => p?.identity.id === filters.identityId
              )
            );
          }

          if (filters.parties && filters.parties.length > 0) {
            resolved = resolved.filter((interaction) => {
              return interaction.parties.some(
                (p) => filters.parties.includes(p?.identity.id) 
              )
            }
            );
          }

          if (filters.searchQuery) {
            const q = filters.searchQuery.toLowerCase();
            resolved = resolved.filter((i: Interaction) => interactionMatchesQuery(i, q));
          }

          if (filters.startDate) {
            resolved = resolved.filter((i: Interaction) => parseDate(i.updatedAt) > filters.startDate);
          }
          if (filters.endDate) {
            resolved = resolved.filter((i: Interaction) => parseDate(i.updatedAt) < filters.endDate);
          }

          if (sortBy) {
            if (sortBy === "recent") {
              resolved = resolved.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
            } else if (sortBy === "oldest") {
              resolved = resolved.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
            } else if (sortBy === "created") {
              resolved = resolved.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            }
          }

          const batch = resolved.slice(offset, offset + limit);

          observer.next({
              data: {
                interactions: {
                  results: batch,
                  pageInfo: {
                    __typename: "PageInfo",
                    hasMore: offset + limit < resolved.length,
                    total: resolved.length,
                  },
                }   
              },
          });
        });
    } else if (operationName === 'GetInteractionActivities') {
       withLatency(observer, () => {
          const { workspaceId, filters = {}, offset = 0, limit = 50 } = variables ?? {};
          let resolved = mockDb.interactionActivities
            .map(resolveInteractionActivity)
            .filter(Boolean);
          resolved = resolved.filter((ia) => ia?.workspaceId === workspaceId);

          // Create a clean version with no nulls
          let resolvedActivities = resolved.filter((a): a is InteractionActivity => a !== null);

          if (filters.interactionId) {
            resolvedActivities = resolvedActivities.filter((activity: InteractionActivity) => activity.interactionId === filters.interactionId);
          }

          const comments = resolvedActivities.filter((activity: InteractionActivity) => activity.type === "COMMENT_ADDED").length;

          const batch = resolvedActivities.slice(offset, offset + limit);

          observer.next({
              data: {
                interactionActivities: {
                  results: batch,
                  pageInfo: {
                    __typename: "PageInfo",
                    hasMore: offset + limit < resolvedActivities.length,
                    total: resolvedActivities.length,
                    comments,
                  },
                }   
              },
          });
        });
    } else if (operationName === 'GetInteraction') {
      const interaction = mockDb.interactions.find(
        (i) => i.workspaceId === variables.workspaceId && i.id === variables.interactionId
      );
       if (!interaction) {
        observer.error(new Error("Interaction not found"));
        return;
      }
       withLatency(observer, () => {
        observer.next({
            data: {
              interaction: resolveInteraction(interaction),
            },
        });
      });
      
    } else if (operationName === 'TransitionInteraction') {
      backendLogger.startGroup(operationName, variables);

      // Start the "Clock" for the whole operation
      backendLogger.latencyStart(250); 

      const { id, action, actorId, workspaceId } = variables ?? {};
      const currentRole = activeRoleVar();

      // "Server-side" check if user has permission to perform action
      const isAllowed = ROLE_PERMISSIONS[currentRole].includes(action);
      backendLogger.security(currentRole, action, isAllowed);

      if (!isAllowed) {
        // Fail path: End the group inside the error latency block
        withLatency(observer, () => {
          backendLogger.latencyEnd(403);
          observer.error(new Error(`Security: Role '${currentRole}' is not authorized to '${action}'`));
          backendLogger.endGroup();
        }, 100);
        return;
      }

      const interactionIndex = mockDb.interactions.findIndex(
        (i) => i.id === id
      );

      if (interactionIndex === -1) {
        observer.error(new Error("Interaction not found"));
        return;
      }

      const interaction = mockDb.interactions[interactionIndex];

      const { updatedInteraction, newActivities } =
        transitionInteraction(
          interaction,
          action,
          actorId,
          workspaceId
        );
      backendLogger.sideEffect(`Generated ${newActivities.length} activity records`, newActivities);

      mockDb.interactions[interactionIndex] = updatedInteraction;
      mockDb.interactionActivities.unshift(...newActivities);

      persistDb(mockDb); 
      backendLogger.storage("Throttled save queued to LocalStorage");

      const resolvedUpdatedInteraction = resolveInteraction(updatedInteraction);

      const actorRecord = mockDb.identities.find((i) => i.id === actorId);

      const actor = actorRecord && resolveIdentity(actorRecord);

      const notifications: ToastNotification[] = [];

      notifications.push({
        __typename: "ToastNotification",
        message: buildInteractionToastMessage(resolvedUpdatedInteraction, actor?.name || "Unknown actor"),
        type: action === 'APPROVE' ? 'success' : 'info'
      });

      // Conditional "Reviewer Added" Toast
      if (resolvedUpdatedInteraction.currentReviewer && action === 'SUBMIT') {
        notifications.push({
          __typename: "ToastNotification",
          message: buildInteractionToastMessage(resolvedUpdatedInteraction, resolvedUpdatedInteraction.currentReviewer?.name || "Unknown reviewer", true),
          type: 'info'
        });
      }

      const finalData = {
        ...resolvedUpdatedInteraction,
        __typename: "Interaction",
        notifications: notifications || [], // Fallback to empty array
      };

      withLatency(observer, () => {
        backendLogger.latencyEnd(200);
        observer.next({
          data: {
            transitionInteraction: finalData,
          }
        });
        backendLogger.endGroup();
      }, 250);

      
    } else if (operationName === "InteractionsReferenceData") {
      withLatency(observer, () => {
          const { workspaceId } = variables ?? {};
          let workspaceInteractions: InteractionRecord[] = [];
          if (workspaceId) {
            workspaceInteractions = mockDb.interactions.filter((interaction) => interaction.workspaceId === workspaceId);
          }
          const resolved = workspaceInteractions.map(resolveInteraction);
      
          const parties = Array.from(
            new Map(
              resolved
                .flatMap(int => int.parties)
                .flatMap(party => party?.identity || [])
                .map(ident => [ident.id, { __typename: "Identity", id: ident.id, name: ident.name }])
            ).values()
          );
          const interactionStatuses = Array.from(new Set(resolved.map((int) => int.status)));
          const interactionTypes = Array.from(new Set(resolved.map((int) => int.type)));

          observer.next({
              data: {
                parties,
                interactionStatuses,
                interactionTypes,
              },
          });
        });
      
    } else if (operationName === "GetSearchResults") {
      withLatency(observer, () => {
        const { workspaceId, queryString, offset = 0, limit = 10 } = variables;

        const normalizedQuery = queryString?.toLowerCase().trim() ?? "";

        const mockedDBTranslation = mockDb.interactions.map(resolveInteraction);

        const matchingIdentities =
          normalizedQuery.length === 0
            ? []
            : mockDb.identities
                .filter((identity: Identity) =>
                  identity.workspaceId === workspaceId &&
                  identity.name?.toLowerCase().includes(normalizedQuery)
                )
                .map((identity: Identity) => ({
                  __typename: "Identity",
                  ...identity,
                }));
      
        const matchingInteractions = normalizedQuery.length === 0
          ? []
          : mockedDBTranslation.filter((interaction) => interactionMatchesQuery(interaction, normalizedQuery) && interaction.workspaceId === workspaceId);

        const allResults = [
          ...matchingIdentities,
          ...matchingInteractions,
        ];

        const batch = allResults.slice(offset, offset + limit);

        observer.next({
          data: {
            search: {
              __typename: "SearchResponse",
              results: batch,
              pageInfo: {
                __typename: "PageInfo",
                hasMore: offset + limit < allResults.length,
                total: allResults.length,
              },
            },
          }
        });
      }, 300);
    } else if (operationName === "GetInteractionsByIdentity") {
      withLatency(observer, () => {
        const { identityId } = variables;

        const resolvedInteractions = mockDb.interactions
          .map(resolveInteraction)
          .filter((interaction) =>
            interaction.parties.some(
              (party) => party?.identity.id === identityId
            )
          );

        observer.next({
          data: {
            interactionsByIdentity: resolvedInteractions,
          },
        });
      });
    } else if (operationName === 'GetProfile') {
        withLatency(observer, () => {
          const { workspaceId, identityId } = variables ?? {};
          const { activities, interactions } = getProfileInteractionsAndActivities(workspaceId, identityId);
          const resolvedInteractions = interactions.map(resolveInteraction);
          const resolvedActivities = activities.map((ia) => resolveInteractionActivity(ia));

          const identityRecord = mockDb.identities.find((id) => id.id === identityId && id.workspaceId === workspaceId);
          const identity = identityRecord ? resolveIdentity(identityRecord) : undefined;

          observer.next({
              data: {
                identity,
                interactionsByIdentity: resolvedInteractions,
                activityByActor: resolvedActivities,
              },
          });
        });
    } else if (operationName === 'GetIdentities') {
        withLatency(observer, () => {
          const { workspaceId, sortBy, filters = {}, offset = 0, limit = 12 } = variables ?? {};

          let resolved = mockDb.identities
                .filter((identity: IdentityRecord) =>
                  identity.workspaceId === workspaceId 
                )
                .map((identity: IdentityRecord) => resolveIdentity(identity));

          if (filters.status && filters.status.length > 0) {
            resolved = resolved.filter((identity) => filters.status.includes(identity.status.toLowerCase()));
          }

          if (filters.type && filters.type.length > 0) {
            const normalizedTypes = filters.type.map((type: string) => type.toLowerCase());
            resolved = resolved.filter((identity) => normalizedTypes.includes(identity.type.toLowerCase()));
          }

          if (filters.identityId) {
            resolved = resolved.filter((identity) => identity.id === filters.identityId);
          }

          if (filters.searchText) {
            const q = filters.searchText.toLowerCase();
            resolved = resolved.filter((identity) => identity.name?.toLowerCase().includes(q));
          }

          if (sortBy) {
            if (sortBy === "name") {
              resolved = resolved.sort((a, b) => a.name.localeCompare(b.name));
            } else if (sortBy === "interactions") {
              resolved = resolved.sort((a, b) => b.stats.total - a.stats.total);
            } else if (sortBy === "active") {
              resolved = resolved.sort((a, b) => b.stats.active - a.stats.active);
            } else if (sortBy === "recent") {
              resolved = resolved.sort((a, b) => (b.stats.lastActivityAt ?? 0) - (a.stats.lastActivityAt ?? 0));
            }
          } else {
            resolved = resolved.sort((a, b) => a.name.localeCompare(b.name));
          }

          const batch = resolved.slice(offset, offset + limit);
          

          observer.next({
              data: {
                identities: {
                  results: batch,
                  pageInfo: {
                    __typename: "PageInfo",
                    hasMore: offset + limit < resolved.length,
                    total: resolved.length,
                  },
                }   
              },
          });
        });
    } else {
      // Fallback or error
      observer.error(new Error(`Unhandled operation: ${operationName}`));
      return;
    }
  });
});

export const client = new ApolloClient({
  link: dynamicMockLink,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          search: {
            keyArgs: ["workspaceId", "queryString"],
            merge(existing, incoming, { args }) {
              const offset = args?.offset ?? 0;
              // 1. Maintain the existing results or start fresh
              const mergedResults = existing ? [...existing.results] : [];
              
              // 2. Splice incoming results into the specific offset position
              for (let i = 0; i < incoming.results.length; ++i) {
                mergedResults[offset + i] = incoming.results[i];
              }

              // 3. Return a combined object, but ensure the structure is stable
              return {
                ...incoming,
                results: mergedResults,
              };
            },
          },
          interactionActivities: {
            // 1. Tell Apollo which variables define a "unique" list
            keyArgs: ["filters", "workspaceId"], 

            // 2. Define how to handle incoming pages
            merge(existing, incoming, { args }) {
              const offset = args?.offset ?? 0;
              
              // If offset is 0, it's a fresh fetch (like the Mutation refetch)
              // We return the incoming data to reset the list
              if (offset === 0) return incoming;

              // Otherwise, it's a "Load More" action
              // We take the existing results and append the new ones
              const mergedResults = existing ? [...existing.results] : [];
              return {
                ...incoming,
                results: [...mergedResults, ...incoming.results],
              };
            },
          },
        },
      },
      Identity: {
        fields: {
          // Force these to return null instead of undefined
          company: { read(existing) { return existing ?? null; } },
          avatarUrl: { read(existing) { return existing ?? null; } },
        }
      },
      Interaction: {
        fields: {
          notifications: {
            // This tells Apollo: "If it's missing, just return an empty array"
            read(existing = []) { return existing; },
            // Don't try to merge it into the database permanently
            merge: false, 
          },
          permittedActions: {
            read(_, { readField }) {
              // 1. Get the current status from the cache
              const status = readField('status') as InteractionState;
              
              // 2. Get the current role from our Reactive Var
              const currentRole = activeRoleVar(); 

              // 3. Re-calculate exactly like we do in the MockLink
              const workflowActions = WORKFLOW[status]?.allowedActions || [];
              return workflowActions.filter(action => 
                ROLE_PERMISSIONS[currentRole].includes(action)
              );
            }
          },
        },
      },
    },
  }),
});