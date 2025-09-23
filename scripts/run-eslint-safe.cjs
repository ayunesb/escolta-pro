const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const pkgPath = path.join(repoRoot, 'package.json');
const backupPath = pkgPath + '.backup-eslint';

function run(files) {
  // backup package.json
  fs.copyFileSync(pkgPath, backupPath);
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  if (pkg.type === 'module') {
    delete pkg.type;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  }

  try {
    const args = ['eslint', '--config', '.eslintrc.cjs', '--ext', '.ts,.tsx', ...files];
    console.log('Running: npx ' + args.join(' '));
    const res = spawnSync('npx', args, { stdio: 'inherit', cwd: repoRoot });
    return res.status;
  } finally {
    // restore package.json
    fs.copyFileSync(backupPath, pkgPath);
    fs.unlinkSync(backupPath);
  }
}

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('Usage: node run-eslint-safe.cjs <file1> [file2] ...');
  process.exit(2);
}

const status = run(files);
process.exit(status);
