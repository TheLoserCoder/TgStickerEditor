const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, 'output');

console.log('Creating HTML previews...\n');

const dirs = fs.readdirSync(outputDir);

for (const dir of dirs) {
  const dirPath = path.join(outputDir, dir);
  const stat = fs.statSync(dirPath);
  if (!stat.isDirectory()) continue;
  
  const files = fs.readdirSync(dirPath);
  const tiles = files.filter(f => f.endsWith('.webm') && f.includes('tile')).sort();
  
  if (tiles.length === 0) {
    console.log(`⚠ Skipping ${dir} (no tiles found)`);
    continue;
  }
  
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>${dir} - Tiles Preview</title>
  <style>
    body { margin: 20px; background: #222; color: #fff; font-family: monospace; }
    h1 { margin-bottom: 20px; }
    .grid { display: grid; grid-template-columns: repeat(2, 512px); gap: 2px; background: #000; width: fit-content; }
    video { width: 512px; height: 512px; display: block; }
    .info { margin-top: 20px; background: #333; padding: 10px; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>${dir}</h1>
  <div class="grid">
${tiles.map(tile => `    <video src="${tile}" autoplay loop muted></video>`).join('\n')}
  </div>
  <div class="info">
    <p>✓ Smart duration compression (setpts)</p>
    <p>✓ Binary CRF search for size optimization</p>
    <p>✓ One FFmpeg command for all tiles</p>
    <p>Total tiles: ${tiles.length}</p>
  </div>
</body>
</html>`;
  
  fs.writeFileSync(path.join(dirPath, 'preview.html'), html);
  console.log(`✓ Created preview.html for ${dir}`);
}

console.log('\n✓ All HTML previews created');
