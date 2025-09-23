const fs = require('fs')
const path = require('path')

function walk(dir) {
  const files = fs.readdirSync(dir)
  for (const f of files) {
    const full = path.join(dir, f)
    if (fs.statSync(full).isDirectory()) walk(full)
    else if (/\.(ts|tsx|js|jsx)$/.test(f)) {
      const txt = fs.readFileSync(full, 'utf8')
      if (txt.includes('as any')) console.log(full)
    }
  }
}

walk(process.cwd())
