const js = require("@eslint/js");
module.exports = {
  ignorePatterns: ["dist"],
  env: {
    browser: true,
    es2020: true,
    node: true,
  },
  // intentionally avoid `extends` to be compatible with flat-config detection
  plugins: ["@typescript-eslint", "react-hooks", "react-refresh"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },
  rules: {
    "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
    "@typescript-eslint/no-unused-vars": "off",
    "no-console": ["warn", { allow: ["warn", "error"] }],
  },
  overrides: [
    {
      files: ["tailwind.config.*"],
      rules: { "@typescript-eslint/no-require-imports": "off" },
    },
    {
      files: ["supabase/functions/**/*.ts"],
      rules: { "@typescript-eslint/no-explicit-any": "off" },
    },
  ],
};
