/* eslint-disable react-refresh/only-export-components */
import { useEffect } from "react";
import { render } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { ApolloProvider } from "@apollo/client";
import { ModalProvider } from "../../src/components/Modals/ModalProvider";
import { ToastProvider } from "../../src/contexts/Toast/ToastProvider";
import { client } from "../../src/api/mockApolloClient";

interface LocationStateProps {
  pathname: string;
  search: string;
}

const locationRef = {
  current: null as LocationStateProps | null,
};

// Keep this component internal to avoid export conflicts
function LocationObserver() {
  const location = useLocation();

  useEffect(() => {
    // Updating a ref property inside useEffect is the standard 
    // way to handle side effects like this.
    locationRef.current = location;
  }, [location]);

  return null;
}

type Options = {
  route?: string;
};

export function renderWithRouter(
  ui: React.ReactElement,
  { route = "/w/alpha/dashboard" }: Options = {},
) {
  const result = render(
    <ToastProvider>
      <ModalProvider>
        <MemoryRouter initialEntries={[route]}>
          <ApolloProvider client={client}>
            <LocationObserver />
            {ui}
          </ApolloProvider>
        </MemoryRouter>
      </ModalProvider>
    </ToastProvider>,
  );

  return {
    ...result,
    getLocation: (): LocationStateProps => {
      if (!locationRef.current) {
        throw new Error("LocationObserver has not mounted yet.");
      }
      return locationRef.current;
    },
  };
}
