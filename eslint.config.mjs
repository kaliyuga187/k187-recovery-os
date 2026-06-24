import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";

export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "**/build/**",
      "**/data/**",
      "**/.operator/**",
      "**/reports/**",
      "**/coverage/**",
    ],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsparser,
      parserOptions: { ecmaVersion: 2023, sourceType: "module" },
    },
    plugins: { "@typescript-eslint": tseslint },
    rules: {
      // Be pragmatic: this MVP has a few intentional `any` casts in
      // transpilePackages boundaries. Don't block the build on them.
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-undef": "off", // TS handles this
      "no-unused-vars": "off",
    },
  },
];
