const fs = require('fs');
const path = require('path');

function walk(dir, cb) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      walk(full, cb);
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      cb(full);
    }
  }
}

const repoRoot = path.resolve(__dirname, '..');
const files = [];
walk(path.join(repoRoot, 'src'), (f) => files.push(f));

let changed = 0;
files.forEach((file) => {
  const src = fs.readFileSync(file, 'utf8');
  const replaced = src
    .replace(/console\.log\s*\(/g, 'console.warn(')
    .replace(/console\.info\s*\(/g, 'console.warn(')
    .replace(/console\.debug\s*\(/g, 'console.warn(');
  if (replaced !== src) {
    fs.writeFileSync(file, replaced, 'utf8');
    changed++;
    console.log('Updated', file);
  }
});

console.log('Files changed:', changed);
process.exit(0);
