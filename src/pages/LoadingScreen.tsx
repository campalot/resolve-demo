import { useLocation } from "react-router-dom";
import { InteractionsSkeleton } from "./Interactions/InteractionsSkeleton";
import { IdentitiesSkeleton } from "./Identities/IdentitiesSkeleton";
import { DashboardSkeleton } from "./Dashboard/DashboardSkeleton";

export const LoadingScreen = () => {
  const { pathname } = useLocation();

  if (pathname.includes("/interactions")) return <InteractionsSkeleton />;
  if (pathname.includes("/people")) return <IdentitiesSkeleton />;
  if (pathname.includes("/dashboard")) return <DashboardSkeleton />;

  return (
    <div className="loading-screen">
      <p>Simulating API...</p>
    </div>
  );
};
