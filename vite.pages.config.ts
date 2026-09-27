import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/hk-traffic-alert/",
  root: path.resolve(import.meta.dirname, "client/pages"),
  publicDir: path.resolve(import.meta.dirname, "client/public"),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client/src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/pages"),
    emptyOutDir: true,
  },
});
