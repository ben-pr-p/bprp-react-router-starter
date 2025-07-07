import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [reactRouter(), tailwindcss(), tsconfigPaths()],
  build: {
    cssMinify: true,
    ssr: false,
  },
  resolve:
    process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test"
      ? {}
      : {
          alias: {
            "react-dom/server": "react-dom/server.node",
          },
        },
  optimizeDeps: {
    include: ["lucide-react"],
    exclude: [
      "fsevents",
      "@heroicons/react",
      // "@measured/puck", "react-twc"
    ],
  },
  test: {
    exclude: ["node_modules", "app/test/e2e"],
  },
});
