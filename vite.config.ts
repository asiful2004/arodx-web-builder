import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const DEFAULT_PROJECT_ID = "qnrbjvnqphilduycfdgz";
const DEFAULT_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFucmJqdm5xcGhpbGR1eWNmZGd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MDg2NTMsImV4cCI6MjA4ODM4NDY1M30.L5YQx1UqaTmadrtSKiHvpt1o4vjm1v4eWC9wfJ-M9ts";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const projectId = (env.VITE_SUPABASE_PROJECT_ID || DEFAULT_PROJECT_ID).trim();
  const safeSupabaseUrl = `https://${projectId}.supabase.co`;

  return {
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(safeSupabaseUrl),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(DEFAULT_PUBLISHABLE_KEY),
      "import.meta.env.VITE_SUPABASE_PROJECT_ID": JSON.stringify(projectId),
    },
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            "vendor-react": ["react", "react-dom", "react-router-dom"],
            "vendor-query": ["@tanstack/react-query"],
            "vendor-motion": ["framer-motion"],
          },
        },
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        react: path.resolve(__dirname, "node_modules/react"),
        "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
      },
      dedupe: ["react", "react-dom"],
    },
  };
});
