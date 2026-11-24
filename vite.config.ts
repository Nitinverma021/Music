import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// A globally-set NODE_ENV=development would otherwise make `vite build` bundle React's slow dev build.
if (process.argv.includes("build")) process.env.NODE_ENV = "production";

export default defineConfig({
  // Relative base so the build works on any static host (GitHub Pages, Netlify, Vercel…)
  base: "./",
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg"],
      manifest: {
        name: "Musicsite",
        short_name: "Musicsite",
        description: "A fast, offline-first music player for your own library.",
        theme_color: "#09090b",
        background_color: "#09090b",
        display: "standalone",
        start_url: ".",
        icons: [
          { src: "icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
          { src: "icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,woff2}"],
      },
    }),
  ],
  build: {
    target: "es2022",
    chunkSizeWarningLimit: 600,
  },
  test: {
    environment: "node",
  },
});
