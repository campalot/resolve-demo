import React, { useContext, useEffect, useRef, useState } from "react";
import {
  useParams,
  Navigate,
  useLocation, 
  useNavigate,
} from "react-router-dom";
import { useReactiveVar } from "@apollo/client/react";
import { useMutation } from "@apollo/client/react";
import { activeRoleVar } from "../../api/cache";
import { TRANSITION_INTERACTION } from "../../graphql/mutations/transitionInteraction";
import { useInteraction } from "../../hooks/useInteraction";
import { ModalContext } from "../../components/Modals/ModalContext";
import { useWorkspacePath } from "../../hooks/useWorkspacePath";
import { InteractionActivity } from "./InteractionActivity";
import { InteractionOverview } from "./InteractionOverview";
import { InteractionSidebar } from "./InteractionSidebar";
import { ACTION_TO_STATUS } from "../../graphql/types";
import type { Identity, InteractionActivity as Activity } from "../../graphql/types";
import type { ClientActivity } from "./InteractionActivity";
import { useWorkspace } from "../../contexts/Workspace/WorkspaceContext";
import { Box, Tab, Tabs, Typography } from "@mui/material";
import Button from "../../components/Buttons/Button";
import { ButtonType } from "../../components/Buttons/Button";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { useToast } from "../../contexts/Toast/ToastContext";
import type { ToastNotification } from "../../graphql/types";
import { TRANSITION_METADATA } from "./buildInteractionMetadata";
import styles from "./InteractionDetail.module.scss";

const TABS = [
  { label: "Overview", path: "overview" },
  { label: "Activity", path: "activity" },
];

const COMMENT_PLACE_HOLDER = "Enter your notes here";
const MIN_CONDITIONAL_CHARACTERS = 20;
const CONDITIONAL_TOO_FEW_CHARACTERS_ERROR = `Please use at least ${MIN_CONDITIONAL_CHARACTERS} characters`;


type TransitionModalContentProps = {
  action: string;
  onConfirm: (comment: string) => Promise<void>;
  onCancel: () => void;
};

const TransitionModalContent: React.FC<TransitionModalContentProps> = ({
  action,
  onConfirm,
  onCancel,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comment, setComment] = useState("");
  const [showError, setShowError] = useState(false); // Track validation state

  const isRejecting = action === "REJECT";
  const charCount = comment.length;
  const isTooShort = charCount < MIN_CONDITIONAL_CHARACTERS;
  const displayError = isRejecting && showError && isTooShort;
  const meta = TRANSITION_METADATA[action];

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComment(event.target.value);
    // Clear error message once they start typing enough characters
    if (showError && event.target.value.length >= MIN_CONDITIONAL_CHARACTERS) {
      setShowError(false);
    }
  };

  const handleConfirm = async () => {
    // Validation logic
    if (isRejecting && isTooShort) {
      setShowError(true);
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(comment);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    // Focus the textarea immediately when the modal opens
    textareaRef.current?.focus();
  }, []);

  return (
    <div>
      <h2 id="modal-title">{meta.title}</h2>
      <p className={styles.confirmMessage}>{meta.body}</p>

      <div className={styles.textareaContainer}>
        <textarea
          className={`${styles.transitionComment} ${displayError ? styles.inputError : ""}`}
          onChange={handleTextChange}
          value={comment}
          placeholder={COMMENT_PLACE_HOLDER}
          rows={5}
          aria-describedby="comment-hint"
          aria-invalid={displayError}
          ref={textareaRef}
        />

        {/* Helper Hint / Error Message */}
        {isRejecting && (
          <div
            id="comment-info"
            className={styles.commentInfoRow}
            role={displayError ? "alert" : "status"}
          >
            <span className={displayError ? styles.errorText : styles.hintText}>
              {displayError
                ? CONDITIONAL_TOO_FEW_CHARACTERS_ERROR
                : `Required for rejection`}
            </span>

            <span
              className={`${styles.counter} ${isTooShort ? styles.counterPending : styles.counterSuccess}`}
            >
              {charCount} / {MIN_CONDITIONAL_CHARACTERS}
            </span>
          </div>
        )}
      </div>
      <div className={styles.actionsRow}>
        <Button
          buttonType={meta.type}
          isLoading={isSubmitting}
          onClick={handleConfirm}
          aria-describedby={displayError ? "comment-hint" : undefined}
        >
          {meta.confirmLabel}
        </Button>
        <Button
          buttonType={ButtonType.Text}
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};

export const InteractionDetail: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [value, setValue] = useState(location.pathname);
  const workspace = useWorkspace();
  const currentRole = useReactiveVar(activeRoleVar); 

  const { openModal, closeModal } = useContext(ModalContext);
  const currentUser = useCurrentUser();
  const { addToast } = useToast();

  const { interactionId, tabId } = useParams<{
    interactionId: string;
    tabId?: string;
  }>();
  const { interaction, loading, error, hasId } = useInteraction(interactionId);

  const [transitionInteraction] = useMutation(TRANSITION_INTERACTION, {
    update(cache, { data }) {
      const payload = data?.transitionInteraction;
      if (!payload || !payload.activities) return;

      cache.modify({
        id: `Identity:${currentUser.id}`,
        fields: {
          stats(existing) {
            return { ...existing, lastActivityAt: new Date().toISOString() };
          },
        },
      });

      cache.modify({
        fields: {
          interactionActivities(existingData = { results: [] }, { readField }) {
            const incomingActivities = payload.activities;
            const isOptimistic = incomingActivities.some(
              (a: ClientActivity) => a.id === "temp-skeleton-id",
            );

            // 1. Only "clean" the existing list if we are NOT currently
            // trying to put the skeleton in.
            const cleanExisting = isOptimistic
              ? existingData.results
              : existingData.results.filter(
                  (ref: Activity) =>
                    readField("id", ref) !== "temp-skeleton-id",
                );

            // 2. Filter out duplicates (standard logic)
            const newActivities = incomingActivities.filter(
              (incoming: Activity) =>
                !cleanExisting.some(
                  (existing: Activity) =>
                    readField("id", existing) === incoming.id,
                ),
            );

            return {
              ...existingData,
              results: [...newActivities, ...cleanExisting], // Skeleton goes to the top!
              pageInfo: {
                ...existingData.pageInfo,
                total:
                  (existingData.pageInfo?.total || 0) +
                  newActivities.filter((a: ClientActivity) => !a.isOptimistic)
                    .length,
              },
            };
          },
        },
      });

      // This deletes the 'identities' cache entries for THIS workspace.
      // The next time a component needs this list (like sort order needs 
      // to refresh), Apollo will automatically refetch it from the server. 
      // It's surgical refetching.
      cache.evict({
        id: "ROOT_QUERY",
        fieldName: "identities",
      });

      // This clears out the "dead" references
      cache.gc();
    },
    
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

  // The buttons are now "Server-Driven"
  const allowedActions = interaction.permittedActions ?? [];
  const primaryparty = interaction.parties.find(
    (party) => party.role === "Seller" || party.role === "Partner",
  );

  const handleAction = (action: string) => {
    const optimisticActor: Identity = {
      __typename: "Identity",
      id: currentUser.id,
      workspaceId: workspace.id,
      name: currentUser.name || "Current User",
      type: "Individual",
      status: "Active",
      createdAt: new Date().toISOString(),
      country: "US",
    };

    openModal(
      <TransitionModalContent
        action={action}
        onCancel={closeModal}
        onConfirm={async (comment: string) => {
          closeModal();
          await transitionInteraction({
            variables: {
              id: interactionId,
              action,
              actorId: currentUser.id,
              workspaceId: workspace.id,
              comment,
            },
            optimisticResponse: {
              transitionInteraction: {
                ...interaction,
                __typename: "Interaction",
                id: interactionId,
                status: ACTION_TO_STATUS[action],
                updatedAt: new Date().toISOString(),
                activities: [
                  {
                    id: "temp-skeleton-id",
                    __typename: "InteractionActivity",
                    workspaceId: workspace.id,
                    type: "SKELETON",
                    interactionId: interaction.id,
                    interactionTitle: interaction.title,
                    occurredAt: new Date().toISOString(),
                    actor: optimisticActor,
                    isOptimistic: true,
                    metadata: {
                      __typename: "InteractionActivityMetadata_Created",
                    },
                  },
                ],
                notifications: [],
              },
            },
          });
        }}
      />,
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
            <Typography variant="h4" className={styles.interactionDetailTitle}>
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
              role={currentRole}
            />
          </Box>
        </Box>
      </Box>
    </>
  );
};
