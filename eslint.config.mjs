import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ["**/*.{js,ts}"],
    languageOptions: {
      sourceType: "commonjs",
    },
  },
  {
    files: ["tests/**/*.mjs", "scripts/**/*.mjs"],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ["supabase/functions/**/index.ts"],
    languageOptions: { globals: { Deno: "readonly" } },
  },
  [
    globalIgnores([
      "**/*.md",
      "./node_modules/*",
      "./.husky/*",
      "./.vscode/*",
      "dist/**",
      ".expo/**",
      "web-build/**",
      "coverage/**",
    ]),
  ],
  tseslint.configs.recommended,
]);
