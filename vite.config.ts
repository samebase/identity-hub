import { defineConfig } from "vite-plus";

export default defineConfig({
  fmt: {
    ignorePatterns: ["**/_generated/**"],
    printWidth: 100,
    proseWrap: "always",
  },
  lint: {
    options: { typeAware: true },
    plugins: ["eslint", "typescript"],
    env: { builtin: true },
    ignorePatterns: ["**/_generated"],
    rules: {
      "typescript/no-floating-promises": "error",
      "typescript/no-deprecated": "error",
    },
  },
});
