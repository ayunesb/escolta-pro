#!/usr/bin/env node
// Portable lint runner (CommonJS) compatible with projects that set "type": "module"
// Expands tracked files and runs eslint via the project's package manager.

const { spawnSync } = require('child_process');
const path = require('path');

function gitTrackedFiles() {
  const res = spawnSync('git', ['ls-files'], { encoding: 'utf8' });
  if (res.error) throw res.error;
  if (res.status !== 0) throw new Error(res.stderr || 'git ls-files failed');
  return res.stdout.split('\n').filter(Boolean);
}

function filterFiles(files) {
  // Only lint JS/TS/TSX/JSX files in src, admin, client, components, pages, and root config files
  const patterns = [/\.jsx?$/, /\.tsx?$/];
  return files.filter(f => patterns.some(p => p.test(f)));
}

function runEslint(files, args) {
  const eslintPath = path.resolve('node_modules', '.bin', 'eslint');
  const cmd = process.platform === 'win32' ? 'node' : eslintPath;
  const spawnArgs = process.platform === 'win32' ? [eslintPath].concat(args).concat(files) : args.concat(files);

  // Prefer pnpm exec if available to ensure workspace bin resolution
  const runner = 'pnpm';
  // Force legacy config file to avoid ESLint flat-config auto-detection
  const runnerArgs = ['exec', 'eslint', '--config', '.eslintrc.cjs'].concat(args).concat(files);

  const res = spawnSync(runner, runnerArgs, { stdio: 'inherit' });
  if (res.error) throw res.error;
  process.exit(res.status);
}

function main() {
  const files = gitTrackedFiles();
  const targets = filterFiles(files);
  if (targets.length === 0) {
    console.log('No lintable files found.');
    return;
  }
  // Strip known npm/pnpm runner flags that eslint doesn't accept (e.g. --silent)
  const rawArgs = process.argv.slice(2);
  const args = rawArgs.filter(a => a !== '--silent' && a !== '--no-color');
  runEslint(targets, args);
}

main();
