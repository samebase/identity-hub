import { convexAuth } from "@samebase/convex-auth-tanstack-start/vite";
import { convexSsr } from "@samebase/convex-hosting-tanstack-start/vite";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite-plus";

export default defineConfig({
  fmt: {
    ignorePatterns: ["**/_generated/**", "src/routeTree.gen.ts"],
    printWidth: 100,
    proseWrap: "always",
  },
  lint: {
    options: { typeAware: true },
    plugins: ["eslint", "typescript"],
    env: { builtin: true },
    ignorePatterns: ["**/_generated", "src/routeTree.gen.ts"],
    rules: {
      "typescript/no-floating-promises": "error",
      "typescript/no-deprecated": "error",
    },
  },
  plugins: [
    convexSsr(),
    convexAuth(),
    tailwindcss(),
    // The sign-in page is the one page without a session: a file of the build, so that a visitor
    // without a session never reaches the renderer (src/server.ts).
    tanstackStart({
      prerender: {
        enabled: true,
        autoStaticPathsDiscovery: false,
        crawlLinks: false,
        failOnError: true,
      },
      pages: [{ path: "/signin", prerender: { outputPath: "/signin/index.html" } }],
    }),
    react(),
  ],
});
