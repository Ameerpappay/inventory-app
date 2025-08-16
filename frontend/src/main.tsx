import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Simple environment check (optional)
import { env } from "./config/env";

if (env.DEBUG) {
  console.log("🌍 Environment:", env.NODE_ENV);
  console.log("🔗 API URL:", env.API_URL);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
