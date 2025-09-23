// Run ESLint programmatically with legacy CJS config to avoid flat-config/ESM loader issues.
const { ESLint } = require('eslint');
const path = require('path');

async function main() {
  const args = process.argv.slice(2);
  const files = args.length ? args : ['src'];
  let config;
  try {
    // Load the legacy CJS config
    config = require(path.resolve(__dirname, '..', '.eslintrc.cjs'));
  } catch (err) {
    console.error('Could not load .eslintrc.cjs:', err);
    process.exit(2);
  }

  // Create ESLint instance with the config as overrideConfig
  const eslint = new ESLint({
    overrideConfig: config,
  });

  try {
    const results = await eslint.lintFiles(files);
    const formatter = await eslint.loadFormatter('stylish');
    const resultText = formatter.format(results);
    console.log(resultText);
    const errorCount = results.reduce((s, r) => s + r.errorCount, 0);
    process.exit(errorCount > 0 ? 1 : 0);
  } catch (err) {
    console.error('ESLint run failed:', err);
    process.exit(2);
  }
}

main();
