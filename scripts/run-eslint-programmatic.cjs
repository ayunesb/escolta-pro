#!/usr/bin/env node
/* Run ESLint programmatically using the legacy config to avoid CLI flat-config issues */
const { ESLint } = require('eslint');
const fs = require('fs');
const path = require('path');

async function main() {
  const repoRoot = path.resolve(__dirname, '..');
  const rawArgs = process.argv.slice(2);
  const files = rawArgs.filter(a => !a.startsWith('-'));
  if (files.length === 0) {
    console.error('Usage: node run-eslint-programmatic.cjs <file1> [file2] ... [--max-warnings N]');
    process.exit(2);
  }
  // Load .eslintrc.cjs
  const configPath = path.resolve(repoRoot, '.eslintrc.cjs');
  if (!fs.existsSync(configPath)) {
    console.error('.eslintrc.cjs not found');
    process.exit(2);
  }
  // eslint supports passing overrideConfigFile
  const eslint = new ESLint({
    overrideConfigFile: configPath,
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    ignorePath: path.resolve(repoRoot, '.eslintignore'),
    useEslintrc: false,
  });

  const results = await eslint.lintFiles(files);
  const formatter = await eslint.loadFormatter('stylish');
  const resultText = formatter.format(results);
  console.log(resultText);
  const errorCount = results.reduce((s, r) => s + r.errorCount, 0);
  const warningCount = results.reduce((s, r) => s + r.warningCount, 0);

  // Respect --max-warnings if provided
  const mwIndex = rawArgs.findIndex(a => a === '--max-warnings' || a === '--max-warnings=0');
  if (mwIndex !== -1) {
    let val = 0;
    if (rawArgs[mwIndex] && rawArgs[mwIndex].includes('=')) {
      val = parseInt(rawArgs[mwIndex].split('=')[1] || '0', 10);
    } else {
      val = parseInt(rawArgs[mwIndex + 1] || '0', 10);
    }
    if (warningCount > val) {
      console.error(`Too many warnings: ${warningCount} (max ${val})`);
      process.exit(2);
    }
  }

  process.exit(errorCount > 0 ? 2 : 0);
}

main().catch(err => {
  console.error(err);
  process.exit(2);
});
