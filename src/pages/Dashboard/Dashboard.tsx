import React, { useEffect, useRef } from "react";
import type { InteractionActivity } from "../../graphql/types";
import { useInteractionActivities } from "../../hooks/useInteractionActivities";
import { activityRenderers } from "./activityRenderer";
import styles from "./Dashboard.module.scss";

export const Dashboard: React.FC = () => {
  const feedRef = useRef<HTMLDivElement>(null);
  // At the bottom of the list
  const sentinelRef = useRef(null);
  const { results, loading, error, hasMore, fetchNextPage } =
    useInteractionActivities({
      filters: {},
    });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // entries[0] is the sentinel <li>
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchNextPage();
        }
      },
      {
        // Set the <ul> as the container to watch
        root: feedRef.current,
        // trigger when 10% of the 1px sentinel is visible
        //threshold: 0.1,
        threshold: 0,
        // Trigger when the sentinel is 200px away from the bottom of the viewport
        rootMargin: "0px 0px 200px 0px",
      },
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, fetchNextPage]);

  return (
    <div
      ref={feedRef}
      className={styles.dashboardFeed}
    >
      <h1>Activity</h1>
      <ul role="feed" aria-busy={loading} className={styles.dashboardList}>
        {results.map((activity: InteractionActivity) => {
          const CardComponent = activityRenderers[activity.type];
          return (
            <li key={activity.id} role="article">
              <CardComponent activity={activity} />
            </li>
          );
        })}
        <li
          ref={sentinelRef}
          aria-hidden="true"
          style={{ height: "1px", listStyle: "none" }}
        />
      </ul>
      <div role="status" aria-live="polite">
        {loading && "Loading more results"}
        {error && "Failed to load results"}
      </div>
      <div aria-live="polite" className="sr-only">
        {loading && "Loading more results"}
        {!loading && !error && "20 more results loaded"}
        {error && "Failed to load results"}
      </div>
    </div>
  );
};