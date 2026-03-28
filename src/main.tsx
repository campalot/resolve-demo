import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/base.scss";

async function enableMocking() {
  // Only enable in development
  if (import.meta.env.MODE !== "development") {
    return;
  }

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
