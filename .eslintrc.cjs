/* eslint-disable @typescript-eslint/no-var-requires */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  project: false,
  ecmaFeatures: { jsx: true },
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
    // Keep real errors strict but allow common patterns during active dev
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true, caughtErrors: 'none' }
    ],
    '@typescript-eslint/no-explicit-any': 'warn',
    'react-hooks/exhaustive-deps': 'warn',
    'import/order': 'warn',

    // Small papercuts
    'no-empty': 'warn',
    'no-case-declarations': 'warn',
  'no-extra-semi': 'warn',
  '@typescript-eslint/no-empty-object-type': 'warn',
  'react/no-unknown-property': 'warn',

    // Project uses the new JSX transform (React 17+): React doesn't need to be in scope.
    'react/react-in-jsx-scope': 'off',
    // Allow some unescaped entities in strings/JSX for convenience in content.
    'react/no-unescaped-entities': 'off',
    'react/prop-types': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
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

