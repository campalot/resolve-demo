import React from "react";
import { BrowserRouter } from "react-router-dom";
import { ApolloProvider } from "@apollo/client";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import BreakpointProvider from "./contexts/Breakpoints/BreakpointProvider";
import { ModalProvider } from "./components/Modals/ModalProvider";
import { ToastProvider } from "./contexts/Toast/ToastProvider";
import { client } from "./api/mockApolloClient";
import AppRouting from "./routes/AppRoutes";

const App: React.FC = () => {
  return (
    <ApolloProvider client={client}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <BreakpointProvider>
          <ToastProvider>
            <ModalProvider>
              <BrowserRouter>
                <AppRouting />
              </BrowserRouter>
            </ModalProvider>
          </ToastProvider>
        </BreakpointProvider>
      </LocalizationProvider>
    </ApolloProvider>
  );
};

export default App;
