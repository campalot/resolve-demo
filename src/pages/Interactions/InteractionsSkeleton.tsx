import styles from "./Interactions.module.scss"; // Use your existing CSS
import skeletonStyles from "./InteractionsSkeleton.module.scss"; // New shimmer styles
import paginationStyles from "../../components/Pagination/Pagination.module.scss";
import { Toolbar } from "../../components/Toolbars/Toolbar";

export const InteractionsSkeleton = ({ rows = 10 }) => {
  return (
    <section>
      <h1>Interactions</h1>
      <div className={styles.paginationBar}>
        <nav className={paginationStyles.pagination}>
          <div className={skeletonStyles.pagination} />
        </nav>
      </div>
      <Toolbar>
        <Toolbar.Top>
          <div className={skeletonStyles.search} />
          <Toolbar.SortGroup>
            <div className={skeletonStyles.sort} />
          </Toolbar.SortGroup>
        </Toolbar.Top>
        <Toolbar.Bottom>
          <div className={skeletonStyles.status} />
          <div className={skeletonStyles.dateRange} />
        </Toolbar.Bottom>
      </Toolbar>
      <ul className={styles.list}>
        {Array.from({ length: rows }).map((_, i) => (
          <li key={i} className={styles.row}>
            <div className={styles.rowLink} style={{ cursor: "default" }}>
              <div className={styles.main}>
                <div className={styles.titleRow}>
                  {/* Title Skeleton */}
                  <div className={skeletonStyles.title} />
                  {/* Badge Skeleton */}
                  <div className={skeletonStyles.badge} />
                </div>
                <div className={styles.meta}>
                  {/* Meta text line */}
                  <div className={skeletonStyles.textLine} />
                </div>
              </div>

              <div className={styles.side}>
                {/* Status Badge Skeleton */}
                <div className={skeletonStyles.status} />
                {/* Date Skeleton */}
                <div className={skeletonStyles.date} />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};
