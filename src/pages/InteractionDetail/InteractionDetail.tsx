import React, { useContext, useState } from "react";
import {
  useParams,
  Navigate,
  useLocation, 
  useNavigate,
} from "react-router-dom";
import { useMutation } from "@apollo/client/react";
import { TRANSITION_INTERACTION } from "../../graphql/mutations/transitionInteraction";
import { useInteraction } from "../../hooks/useInteraction";
import { ModalContext } from "../../components/Modals/ModalContext";
import { useWorkspacePath } from "../../hooks/useWorkspacePath";
import { InteractionActivity } from "./InteractionActivity";
import { InteractionOverview } from "./InteractionOverview";
import { InteractionSidebar } from "./InteractionSidebar";
import { ACTION_TO_STATUS, WORKFLOW } from "../../graphql/types";
import { GET_INTERACTION_ACTIVITIES } from "../../graphql/queries/getInteractionActivities";
import { GET_IDENTITIES } from "../../graphql/queries/getIdentities";
import { useWorkspace } from "../../contexts/Workspace/WorkspaceContext";
import { Box, Tab, Tabs, Typography } from "@mui/material";
import Button from "../../components/Buttons/Button";
import { ButtonType } from "../../components/Buttons/Button";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { useToast } from "../../contexts/Toast/ToastContext";
import type { ToastNotification } from "../../graphql/types";
import styles from "./InteractionDetail.module.scss";

const TABS = [
  { label: "Overview", path: "overview" },
  { label: "Activity", path: "activity" },
];

export const InteractionDetail: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [value, setValue] = useState(location.pathname);
  const workspace = useWorkspace();
  
  const { openModal, closeModal } = useContext(ModalContext);
  const currentUser = useCurrentUser();
  const { addToast } = useToast();

  const { interactionId, tabId } = useParams<{
    interactionId: string;
    tabId?: string;
  }>();
  const { interaction, loading, error, hasId } = useInteraction(interactionId);

  const [transitionInteraction] = useMutation(TRANSITION_INTERACTION, {
    refetchQueries: [
      {
        query: GET_INTERACTION_ACTIVITIES,
        variables: {
          filters: {
            interactionId,
          },
          workspaceId: workspace.id,
          offset: 0,
          limit: 20,
        },
      },
      {
        query: GET_INTERACTION_ACTIVITIES,
        variables: {
          filters: {},
          workspaceId: workspace.id,
        },
      },
      {
        query: GET_IDENTITIES,
        variables: {
          filters: {},
          workspaceId: workspace.id,
        },
      },
    ],
    awaitRefetchQueries: true,
    onCompleted: (data) => {
      const { notifications } = data.transitionInteraction;
      notifications.forEach(
        (notification: ToastNotification, index: number) => {
          const { message, type } = notification;
          setTimeout(() => {
            addToast(message, type);
          }, index * 150); // 0ms for the first, 150ms for the second, etc.
        },
      );
    },
  });

  const workspacePath = useWorkspacePath();

  // Guard rails
  if (!interaction || !hasId) {
    return <div>Invalid interaction</div>;
  }

  const allowedActions = WORKFLOW[interaction.status].allowedActions;
  const primaryparty = interaction.parties.find((party) => party.role === "Seller" || party.role === "Partner");

  const handleAction = (action: string) => {
    openModal(
      <div>
        <h2 id="modal-title">Confirm status update</h2>
        <p className={styles.confirmMessage}>
          Are you sure you want to uodate this interaction?
        </p>
        <div className={styles.actionsRow}>
          <Button
            buttonType={ButtonType.Primary}
            onClick={async () => {
              const nextStatus = ACTION_TO_STATUS[action];
              await transitionInteraction({
                variables: {
                  id: interactionId,
                  action,
                  actorId: currentUser.id,
                  workspaceId: workspace.id,
                },

                optimisticResponse: {
                  transitionInteraction: {
                    __typename: "Interaction",
                    ...interaction,
                    status: nextStatus,
                    updatedAt: new Date().toISOString(),
                  },
                },
              });
              closeModal();
            }}
          >
            Confirm
          </Button>
          <Button buttonType={ButtonType.Text} onClick={closeModal}>
            Cancel
          </Button>
        </div>
      </div>,
    );
  };

  const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
    // Update the state for the MUI component and navigate
    setValue(newValue);
    navigate(newValue);
  };

  const TAB_PATHS = new Set(TABS.map((tab) => tab.path));

  // Default tab redirect
  if (!tabId || !TAB_PATHS.has(tabId)) {
    return (
      <Navigate
        to={workspacePath(`interactions/${interactionId}/${TABS[0].path}`)}
        replace
      />
    );
  }

  if (loading) {
    return <div>Loading interaction…</div>;
  }

  if (error || !interaction) {
    return <div>Failed to load interaction</div>;
  }

  return (
    <>
      <Box className={styles.interactionDetail}>
        <Box className={styles.interactionDetailHeader}>
          <Box>
            <Typography
              variant="h4"
              className={styles.interactionDetailTitle}
            >
              {interaction.title}
            </Typography>
            <Typography className={styles.interactionDetailSubtitle}>
              <span className={styles.identifier}>{interaction.id}</span> ·{" "}
              {primaryparty?.identity.name}
            </Typography>
          </Box>
        </Box>

        <Box className={styles.interactionDetailBody}>
          <Box className={styles.interactionDetailMain}>
            <Tabs
              value={value}
              onChange={handleChange}
              role="navigation"
              aria-label="Interaction navigation tabs"
              className={styles.tabs}
            >
              {TABS.map((tab) => (
                <Tab
                  key={tab.label}
                  value={workspacePath(
                    `interactions/${interactionId}/${tab.path}`,
                  )}
                  label={tab.label}
                />
              ))}
            </Tabs>

            <Box className={styles.interactionDetailContent}>
              {tabId === "overview" && (
                <InteractionOverview interaction={interaction} />   
              )}

              {tabId === "activity" && (
                <InteractionActivity interactionId={interactionId || ""} />
              )}
            </Box>
          </Box>

          <Box className={styles.interactionDetailSidebar}>
            <InteractionSidebar
              interaction={interaction}
              handleAction={handleAction}
              allowedActions={allowedActions}
            />
          </Box>
        </Box>
      </Box>
    </>
  );
};;
