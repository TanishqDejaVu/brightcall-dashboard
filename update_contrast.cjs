const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const replacements = [
  // Text colors - improving contrast for light mode
  { from: /text-blue-400/g, to: 'text-blue-600' },
  { from: /text-emerald-400/g, to: 'text-emerald-600' },
  { from: /text-amber-400/g, to: 'text-amber-600' },
  { from: /text-red-400/g, to: 'text-red-600' },
  { from: /text-purple-400/g, to: 'text-purple-600' },
  { from: /text-indigo-400/g, to: 'text-indigo-600' },
  { from: /text-teal-400/g, to: 'text-teal-600' },
  { from: /text-orange-400/g, to: 'text-orange-600' },
  
  // Background colors - matching the badge background with text
  { from: /bg-emerald-400\/10/g, to: 'bg-emerald-100 text-emerald-700' },
  { from: /bg-amber-400\/10/g, to: 'bg-amber-100 text-amber-700' },
  { from: /bg-red-400\/10/g, to: 'bg-red-100 text-red-700' },
  
  // Progress bar in Dashboard
  { from: /bg-blue-500/g, to: 'bg-blue-600' },
  { from: /bg-white\/10/g, to: 'bg-slate-200' },
];

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      let changed = false;
      for (const { from, to } of replacements) {
        if (content.match(from)) {
          content = content.replace(from, to);
          changed = true;
        }
      }
      
      if (changed) {
        fs.writeFileSync(fullPath, content);
        console.log('Contrast upgraded in', fullPath);
      }
    }
  }
}

processDir(srcDir);
