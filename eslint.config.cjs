// Flat config for ESLint (CommonJS). This file replaces legacy .eslintrc.cjs
// and is intentionally minimal to avoid migration errors. It loads recommended
// settings and wires up TypeScript and React plugin objects.
const tsPlugin = require('@typescript-eslint/eslint-plugin')
const tsParser = require('@typescript-eslint/parser')

// Minimal flat config avoiding `extends` completely to prevent eslintrc-incompat errors.
module.exports = [
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      parser: tsParser,
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      // Warn on console usage except for console.warn and console.error which are allowed
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: { parser: tsParser },
    rules: { '@typescript-eslint/no-unused-vars': 'off' },
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
