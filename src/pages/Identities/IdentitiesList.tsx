import type { IdentityCardProps } from "../../components/Cards/PersonCard";
import styles from "./Identities.module.scss";
import { PersonCard } from "../../components/Cards/PersonCard";

type IdentitiesListProps = {
  identities: IdentityCardProps[];
};

export const IdentitiesList: React.FC<IdentitiesListProps> = ({
  identities,
}) => {
  return (
    <ul className={styles.list}>
      {identities.map((identity: IdentityCardProps) => (
        <PersonCard
          identity={identity}
          key={identity.id}
        />
      ))}
    </ul>
  );
};
