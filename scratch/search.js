const fs = require('fs');
const path = require('path');

function searchDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      searchDir(fullPath);
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.ts') || fullPath.endsWith('.mjs') || fullPath.endsWith('.cjs')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('.encrypted')) {
        console.log(`FOUND in ${fullPath}`);
        const lines = content.split('\n');
        for (let i=0; i<lines.length; i++) {
          if (lines[i].includes('.encrypted')) {
            console.log(`Line ${i+1}: ${lines[i].trim()}`);
          }
        }
      }
    }
  }
}

searchDir('node_modules/better-auth');
