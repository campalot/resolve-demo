import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/base.scss";

async function enableMocking() {
  // MSW runs in all environments because this app has no real backend.
  // It simulates both REST and GraphQL APIs at the network level.
  const { worker } = await import("./api/mocks/browser");

  return worker.start({
    onUnhandledRequest: "bypass", // Don't warn about non-API requests (like CSS/images)
  });
}

enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
});
