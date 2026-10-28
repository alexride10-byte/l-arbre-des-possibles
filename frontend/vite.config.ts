import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), ["VITE_", "REACT_APP_"]);
  if (command === "build" && !/^https?:\/\//.test(env.REACT_APP_BACKEND_URL ?? "")) {
    throw new Error("REACT_APP_BACKEND_URL manquante : indiquez l'adresse du serveur (ex. https://enfance-plus-api.onrender.com) dans Render → enfance-plus → Environment.");
  }
  return {
  plugins: [react(), tailwindcss()],
  envPrefix: ["VITE_", "REACT_APP_"],
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  server: { host: "0.0.0.0", port: 3000, strictPort: true, allowedHosts: true, hmr: { clientPort: 443 } },
  build: { outDir: "build", sourcemap: false },
  };
});
