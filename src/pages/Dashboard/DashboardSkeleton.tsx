import styles from "./Dashboard.module.scss";
import skeletonStyles from "./DashboardSkeleton.module.scss"; // New shimmer styles
import cardStyles from "../../components/Cards/ActivityCard.module.scss"

export const DashboardSkeleton = ({ cards = 5 }) => {
  return (
    <div className={styles.dashboardFeed}>
      <h1>Activity</h1>
      <ul className={styles.dashboardList}>
         {Array.from({ length: cards }).map((_, i) => {
          return (
            <li key={i}>
              <div className={cardStyles.card}>
                <div className={skeletonStyles.icon} />
                <section className={cardStyles.main}>
                  <header className={cardStyles.header}>
                    <div>
                      <div className={skeletonStyles.title} />
                    </div>
                  </header>
                  <div className={cardStyles.timestamp}>
                    <div className={skeletonStyles.timestampLine} />
                  </div>
                  <div className={cardStyles.body}>
                    <span className={cardStyles.interactionTitle}>
                      <div className={skeletonStyles.interactionTitleLine} />
                    </span>
                    <span className={cardStyles.interactionId}>
                      <div className={skeletonStyles.interactionIdLine} />
                    </span>
                    <div className={cardStyles.eventText}>
                      <div className={cardStyles.activityLayout}>
                        <div className={skeletonStyles.activityLayoutLine} />
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
