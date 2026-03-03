import React from "react";
import type { HTMLAttributes } from "react";
import { useInteractionActivities } from "../../hooks/useInteractionActivities";
import { Box } from "@mui/material";
import { TimelineHeader } from "./TimelineHeader";
import styles from "./InteractionActivity.module.scss";
import { getActivityIcon } from "../../components/Badges/helpers";
import type { InteractionActivity as InteractionActivityType } from "../../graphql/types";


type InteractionActivityProps = {
  interactionId: string;
};

export const InteractionActivity: React.FC<InteractionActivityProps> = ({
  interactionId,
}) => {
  const { results, loading, error } =
      useInteractionActivities({
        filters: {
          interactionId, 
        },
      });

  if (error) return <div>Failed to load activities</div>;
  if (loading) return <div>Loading interaction timeline...</div>;

  return (
    <Box className={styles.timeline}>
      {results.map((activity: InteractionActivityType) => {
        const IconComponent: React.FC<HTMLAttributes<SVGElement>> =
          getActivityIcon(activity) || null;
        return (
          <Box key={activity.id} className={styles.timelineItem}>
            <IconComponent className={styles.timelineIcon} />
            <Box className={styles.timelineContent}>
              <TimelineHeader activity={activity} />
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};
