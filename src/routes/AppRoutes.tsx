import React from "react";
import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AppLayout } from "../layouts/AppLayout";
import { Dashboard } from "../pages/Dashboard/Dashboard";
import { Interactions } from "../pages/Interactions/Interactions";
import { InteractionDetail } from "../pages/InteractionDetail/InteractionDetail";
import { Profile } from "../pages/Profile/Profile";
import { Identities } from "../pages/Identities/Identities";
import { MobileSearchPage } from "../pages/Search/MobileSearchPage";
import { NotFound } from "../pages/NotFound";
import { InteractionsReferenceDataProvider } from "../contexts/InteractionReferenceData/InteractionsReferenceDataProvider";
import { WorkspaceRouteBoundary } from "./WorkspaceRouteBoundary";

const DEFAULT_WORKSPACE_ID = "alpha";

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Root redirect */}
      <Route
        path="/"
        element={
          <Navigate to={`/w/${DEFAULT_WORKSPACE_ID}/dashboard`} replace />
        }
      />
      {/* Workspace-scoped app */}
      <Route path="/w/:workspaceId" element={<WorkspaceRouteBoundary />}>
        {/* Full shell only exists inside workspace */}
        <Route element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="identities/:identityId" element={<Profile />} />
          <Route path="people" element={<Identities />} />

          <Route
            path="interactions"
            element={
              <InteractionsReferenceDataProvider>
                <Interactions />
              </InteractionsReferenceDataProvider>
            }
          />

          <Route
            path="interactions/:interactionId/:tabId?"
            element={<InteractionDetail />}
          />

          {/* Workspace-level 404 */}
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Full-screen search outside layout */}
        <Route path="search" element={<MobileSearchPage />} />
      </Route>

      {/* Global catch-all redirect */}
      <Route
        path="*"
        element={
          <Navigate to={`/w/${DEFAULT_WORKSPACE_ID}/dashboard`} replace />
        }
      />
    </Routes>
  );
};

export default AppRoutes;
