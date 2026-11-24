import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { toast } from "sonner";
import "./index.css";
import App from "./App";
import { audio, initEngine } from "./audio/engine";
import { usePlayer } from "./store/player";

initEngine();

if (import.meta.env.DEV) {
  // Handy for debugging in the browser console during development.
  Object.assign(window, { __musicsite: { usePlayer, audio } });
}
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    toast("A new version of Musicsite is available", {
      duration: Infinity,
      action: { label: "Reload", onClick: () => updateSW(true) },
    });
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
