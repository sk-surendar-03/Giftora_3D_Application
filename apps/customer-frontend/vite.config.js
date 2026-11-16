import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    dedupe: ['three'],
  },
  server: {
    proxy: {
      "/api": "https://api.jasvel3dmakers.co.in",
    },
  },
  worker: {
    format: "es",
  },
});
