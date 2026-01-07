import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  // In Netlify, env vars come from process.env during build
  // In local dev, they come from .env files via loadEnv
  const geminiApiKey = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY;
  return {
    server: {
      port: 3000,
      host: "0.0.0.0",
      proxy: {
        "/api": {
          target: "http://localhost:3001",
          changeOrigin: true,
        },
      },
    },
    plugins: [react()],
    define: {
      "process.env.API_KEY": JSON.stringify(geminiApiKey),
      "process.env.GEMINI_API_KEY": JSON.stringify(geminiApiKey),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Split vendor chunks by package
            if (id.includes("node_modules")) {
              if (id.includes("react-dom") || id.includes("/react/")) {
                return "vendor-react";
              }
              if (id.includes("firebase")) {
                return "vendor-firebase";
              }
              if (id.includes("@google/genai")) {
                return "vendor-google";
              }
            }
          },
        },
      },
    },
  };
});
