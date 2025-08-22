const tseslint = (await import('@typescript-eslint/eslint-plugin')).default;
const tsParser = (await import('@typescript-eslint/parser')).default;

export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser
    },
    plugins: {
      '@typescript-eslint': tseslint
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'off'
    }
  }
];
