const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const replacements = [
  // Layouts & background
  { from: /bg-\[#0d1117\]\/80/g, to: 'bg-white/80' },
  { from: /bg-\[#0d1117\]/g, to: 'bg-slate-50' },
  { from: /bg-\[#161b22\]/g, to: 'bg-white' },
  { from: /bg-white\/5/g, to: 'bg-white' },
  { from: /bg-white\/3/g, to: 'bg-slate-50' },
  { from: /border-white\/10/g, to: 'border-slate-200' },
  { from: /border-white\/5/g, to: 'border-slate-100' },
  
  // Text colors
  { from: /text-gray-100/g, to: 'text-slate-900' },
  { from: /text-gray-200/g, to: 'text-slate-800' },
  { from: /text-gray-300/g, to: 'text-slate-700' },
  { from: /text-gray-400/g, to: 'text-slate-500' },
  { from: /text-gray-500/g, to: 'text-slate-400' },
  { from: /text-gray-600/g, to: 'text-slate-300' },
  { from: /text-white/g, to: 'text-slate-900' },
  { from: /rgba\(255,255,255,0\.1\)/g, to: '#e2e8f0' },
  
  // Recharts specific SVG styling
  { from: /stroke="#374151"/g, to: 'stroke="#e2e8f0"' }, // grid lines
  { from: /stroke="#21262d"/g, to: 'stroke="#e2e8f0"' }, // gauge background
  { from: /#161b22/g, to: '#ffffff' }, // tooltip bg
  { from: /#9ca3af/g, to: '#64748b' }, // label text fill
];

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Specifically fix skeleton cards
      if (file === 'SkeletonCard.jsx') {
        content = content.replace(/bg-white\/5/g, 'bg-white');
      }

      // Heatmap grid empty state
      if (file === 'HeatmapGrid.jsx') {
        content = content.replace(/bg-white\/5/g, 'bg-slate-100');
      }

      for (const { from, to } of replacements) {
        content = content.replace(from, to);
      }
      
      // Fine-tuning Navbar
      if (file === 'Navbar.jsx') {
        content = content.replace(/bg-white border/g, 'bg-white shadow-sm border');
      }

      fs.writeFileSync(fullPath, content);
      console.log('Processed', fullPath);
    }
  }
}

processDir(srcDir);

// Fix index.css
const cssPath = path.join(srcDir, 'index.css');
let css = fs.readFileSync(cssPath, 'utf8');
css = css.replace(/background: #0d1117; color: #e6edf3;/g, 'background: #f8fafc; color: #0f172a;');
css = css.replace(/0 0 0 1px #3b82f6, 0 0 16px 2px rgba\(59,130,246,0.2\)/g, '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)');
css = css.replace(/linear-gradient\(90deg, #21262d 25%, #30363d 50%, #21262d 75%\)/g, 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)');
fs.writeFileSync(cssPath, css);
console.log('Processed', cssPath);

console.log('Migration complete!');
