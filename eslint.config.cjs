// Flat config for ESLint (CommonJS). This file replaces legacy .eslintrc.cjs
// and is intentionally minimal to avoid migration errors. It loads recommended
// settings and wires up TypeScript and React plugin objects.
const js = require('@eslint/js')
const globals = require('globals')
const tsPlugin = require('@typescript-eslint/eslint-plugin')
const tsParser = require('@typescript-eslint/parser')
const reactHooks = require('eslint-plugin-react-hooks')
const reactRefresh = require('eslint-plugin-react-refresh')

module.exports = [
  {
    // Base rules for all JS/TS files
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      parser: tsParser,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      'no-console': 'warn',
      '@typescript-eslint/no-unused-vars': 'off',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  {
    // TypeScript specific overrides
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
    },
    rules: {
      // Keep repo preferences
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  {
    files: ['tailwind.config.*'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    files: ['supabase/functions/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
]
// Minimal ESLint flat config shim to avoid requiring the project's ESM config
// This avoids ESM/CJS loader issues when running eslint under a package with
// "type": "module". The project also has .eslintrc.cjs which is the
// canonical config used by editors/CI.
module.exports = [];
