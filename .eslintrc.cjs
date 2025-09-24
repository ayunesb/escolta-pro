/* eslint-disable @typescript-eslint/no-var-requires */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: false,
  },
  env: {
    es2022: true,
    browser: true,
    node: true,
    jest: true,
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  settings: {
    react: { version: 'detect' },
  },
  rules: {
    'no-case-declarations': 'warn',
    'react/prop-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/ban-ts-comment': 'off',
    'import/order': ['warn', { 'newlines-between': 'always' }],
  },
  ignorePatterns: [
    'dist/',
    'build/',
    'coverage/',
    '**/*.config.*',
    '**/*.d.ts',
    'supabase/functions/**/dist/**',
  ],
};
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
