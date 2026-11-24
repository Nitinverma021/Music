import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import "./index.css";
import App from "./App";
import { audio, initEngine } from "./audio/engine";
import { usePlayer } from "./store/player";

initEngine();

if (import.meta.env.DEV) {
  // Handy for debugging in the browser console during development.
  Object.assign(window, { __musicsite: { usePlayer, audio } });
}
registerSW({ immediate: true });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
