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

