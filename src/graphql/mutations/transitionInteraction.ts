import { gql } from "@apollo/client";
import { INTERACTION_DETAILS } from "../fragments/InteractionDetails";

export const TRANSITION_INTERACTION = gql`
  mutation TransitionInteraction(
    $id: ID!
    $action: InteractionAction!
    $actorId: ID!
    $workspaceId: ID!
  ) {
    transitionInteraction(
      id: $id
      action: $action
      actorId: $actorId
      workspaceId: $workspaceId
    ) {
      ...InteractionDetails
      notifications {   
        __typename  
        message
        type
      }
    }
  }
   ${INTERACTION_DETAILS}
`;

// export const TRANSITION_INTERACTION = gql`
//   mutation TransitionInteraction(
//     $id: ID!
//     $action: InteractionAction!
//     $actorId: ID!
//     $workspaceId: ID!
//   ) {
//     transitionInteraction(
//       id: $id
//       action: $action
//       actorId: $actorId
//       workspaceId: $workspaceId
//     ) {
//       interaction {
//         ...InteractionDetails
//       }
//       notifications {
//         __typename
//         message
//         type
//       }
//     }
//   }
//    ${INTERACTION_DETAILS}
// `;
