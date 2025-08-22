const js = require("@eslint/js");
const globals = require("globals");
const reactHooks = require("eslint-plugin-react-hooks");
const reactRefresh = require("eslint-plugin-react-refresh");
const tseslint = require("@typescript-eslint/eslint-plugin");

module.exports = {
  root: true,
  ignorePatterns: ["dist"],
  env: {
    browser: true,
    es2020: true,
    node: true,
  },
  extends: [
    js.configs.recommended,
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended"
  ],
  plugins: ["@typescript-eslint", "react-hooks", "react-refresh"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    ecmaFeatures: {
      jsx: true
    }
  },
  rules: {
    "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
    "@typescript-eslint/no-unused-vars": "off",
    // Add more rules as needed
  },
  overrides: [
    {
      files: ["tailwind.config.*"],
      rules: {
        "@typescript-eslint/no-require-imports": "off"
      }
    },
    {
      files: ["supabase/functions/**/*.ts"],
      rules: {
        "@typescript-eslint/no-explicit-any": "off"
      }
    }
  ]
};
