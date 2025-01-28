import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { reactRouterHonoServer } from "react-router-hono-server/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tailwindcss(),
    reactRouterHonoServer({ runtime: "bun" }),
    reactRouter(),
    tsconfigPaths(),
  ],
  build: {
    cssMinify: true,
    ssr: false,
  },
});
