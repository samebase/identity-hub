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
  // Every page needs a session, so nothing prerenders.
  plugins: [convexSsr(), convexAuth(), tailwindcss(), tanstackStart(), react()],
});
