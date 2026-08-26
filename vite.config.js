import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  if (mode === "production" && !env.VITE_API_URL?.trim()) {
    throw new Error("VITE_API_URL is required in production");
  }

  return {
    plugins: [react()],
    base: "./",
    server: {
      port: 5173,
      strictPort: true,
    },
  };
});
