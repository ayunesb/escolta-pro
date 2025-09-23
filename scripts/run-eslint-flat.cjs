const { ESLint } = require('eslint');
const path = require('path');

async function main() {
  const eslint = new ESLint({
    overrideConfigFile: path.resolve(__dirname, '..', 'eslint.config.cjs'),
    fix: true,
  });

  const files = process.argv.slice(2);
  if (files.length === 0) files.push('.');

  try {
    const results = await eslint.lintFiles(files);
    await ESLint.outputFixes(results);
    const formatter = await eslint.loadFormatter('stylish');
    const text = formatter.format(results);
    console.log(text);
    const errors = results.reduce((s, r) => s + r.errorCount, 0);
    process.exit(errors > 0 ? 1 : 0);
  } catch (err) {
    console.error('eslint run error', err);
    process.exit(2);
  }
}

main();
