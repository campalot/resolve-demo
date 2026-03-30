import styles from "./Identities.module.scss";
import skeletonStyles from "./IdentitiesSkeleton.module.scss";
import cardStyles from "../../components/Cards/PersonCard.module.scss"
import { Toolbar } from "../../components/Toolbars/Toolbar";


export const IdentitiesSkeleton = ({ count = 12 }) => {
  return (
    <section>
      <h1>
        People
      </h1>
      <div className={styles.paginationBar}>
        <nav className={styles.pagination}>
          <div
            className={`${skeletonStyles.bone} ${skeletonStyles.pagination}`}
          />
        </nav>
      </div>
      <Toolbar>
        <Toolbar.Top>
          <div className={`${skeletonStyles.bone} ${skeletonStyles.search}`} />
          <Toolbar.SortGroup>
            <div className={`${skeletonStyles.bone} ${skeletonStyles.sort}`} />
          </Toolbar.SortGroup>
        </Toolbar.Top>
        <Toolbar.Bottom>
          <div className={`${skeletonStyles.bone} ${skeletonStyles.status}`} />
        </Toolbar.Bottom>
      </Toolbar>
      <ul className={styles.list}>
        {Array.from({ length: count }).map((_, i) => (
          <li key={i} className={cardStyles.personCard}>
            {/* Mimic the PersonCard's internal layout */}
            <div className={cardStyles.cardLink}>
              <div className={cardStyles.personCardHeader}>
                <div className={skeletonStyles.avatarCircle} />
                <div>
                  <div className={skeletonStyles.nameLine} />
                  <div className={skeletonStyles.subLine} />
                </div>
              </div>
              <div className={cardStyles.personCardStats}>
                <div className={skeletonStyles.stats} />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};