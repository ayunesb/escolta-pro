#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');

// Simple lint runner that expands tracked files and calls the repo eslint.
// Usage: node ./scripts/lint-runner.js [--max-warnings=0] [--no-ignore]

function run(cmd) {
  console.log('$', cmd);
  execSync(cmd, { stdio: 'inherit', shell: true });
}

const args = process.argv.slice(2).join(' ');
const cwd = process.cwd();
// Build file list from git to avoid shell glob/ignore differences across OS/CI
let files = '';
try {
  files = execSync("git ls-files 'src/**/*.{ts,tsx,js,jsx}'", { cwd, encoding: 'utf8' }).trim();
} catch (e) {
  // fallback: lint the whole repo
  files = '';
}

const eslintConfig = path.join(cwd, '.eslintrc.cjs');
const baseCmd = files ? `pnpm exec eslint -c ${JSON.stringify(eslintConfig)} --no-ignore ${files}` : `pnpm exec eslint -c ${JSON.stringify(eslintConfig)} --no-ignore .`;

try {
  run(`${baseCmd} ${args}`);
} catch (e) {
  process.exit(e.status ?? 1);
}
