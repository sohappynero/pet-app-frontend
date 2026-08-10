import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/tokens.css";
import "./styles/petos.css";
import "./index.css";
import "./pet-chat.css";
import { hydrateFromPreferences } from "./lib/persistentStore";

hydrateFromPreferences().finally(() => {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
