import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  root: "web",
  publicDir: "../public",
  base: "./",
  plugins: [react()],
  server: { allowedHosts: true },
  build: { outDir: "../dist", emptyOutDir: true, chunkSizeWarningLimit: 1200 },
});
