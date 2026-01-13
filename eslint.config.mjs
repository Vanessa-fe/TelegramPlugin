import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import tseslint from "typescript-eslint";

const tsconfigRootDir = dirname(fileURLToPath(import.meta.url));

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        project: ["packages/*/tsconfig.json"],
        tsconfigRootDir,
      },
    },
    files: ["packages/**/*.{ts,tsx}"],
    ignores: ["**/dist/**", "**/node_modules/**"],
    rules: {
      "@typescript-eslint/consistent-type-imports": "warn",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
    },
  },
  {
    files: ["packages/frontend/**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        project: ["packages/frontend/tsconfig.json"],
      },
    },
    rules: {},
  }
);
