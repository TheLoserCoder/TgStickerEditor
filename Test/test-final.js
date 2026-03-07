#!/usr/bin/env node

const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const detectConvertTask = require('../dist-main/tasks/detect-convert.task');
const rescaleTask = require('../dist-main/tasks/rescale.task');

const MAX_DURATION = 2.99;
const MAX_TILE_SIZE = 512 * 1024;
const MIN_CRF = 32;
const MAX_CRF = 50;

let cachedCrf = null;

async function cleanOutput(outputDir) {
  try {
    await fs.rm(outputDir, { recursive: true, force: true });
    await fs.mkdir(outputDir, { recursive: true });
  } catch (e) {}
}

function getTileCoordinates(columns, rows, tileSize, frameHeight) {
  const coords = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < columns; c++) {
      coords.push({
        row: r,
        col: c,
        x: c * tileSize,
        y: r * tileSize,
        index: r * columns + c
      });
    }
  }
  return coords;
}

async function convertAtlasToTiles(atlasPath, outputDir, fileName, frameCount, originalFps, frameHeight, ffmpegBin, crf, tileCoords) {
  const originalDuration = frameCount / originalFps;
  let targetFps = originalFps;
  let setptsFactor = 1;
  
  if (originalDuration > MAX_DURATION) {
    setptsFactor = MAX_DURATION / originalDuration;
  }
  
  let filterComplex = `[0:v]fps=${targetFps},setpts=${setptsFactor}*PTS,format=yuva420p,split=${tileCoords.length}`;
  filterComplex += tileCoords.map(t => `[v${t.index}]`).join('');
  filterComplex += ';';
  
  const tiles = [];
  for (let i = 0; i < tileCoords.length; i++) {
    const coord = tileCoords[i];
    filterComplex += `[v${coord.index}]crop=512:512:${coord.x}:${coord.y}+'n*${frameHeight}'[t${coord.index}]`;
    if (i < tileCoords.length - 1) filterComplex += ';';
    
    tiles.push({
      name: `${fileName}_tile_${coord.row}_${coord.col}.webm`,
      path: path.join(outputDir, `${fileName}_tile_${coord.row}_${coord.col}.webm`),
      index: coord.index
    });
  }
  
  let cmd = `${ffmpegBin} -y -loop 1 -framerate ${targetFps} -i "${atlasPath}" -filter_complex "${filterComplex}"`;
  
  for (const tile of tiles) {
    cmd += ` -map "[t${tile.index}]" -frames:v ${frameCount} -c:v libvpx-vp9 -pix_fmt yuva420p -auto-alt-ref 0 -crf ${crf} -b:v 0 -deadline realtime -cpu-used 6 -row-mt 1 -an "${tile.path}"`;
  }
  
  await execAsync(cmd);
  
  return tiles;
}

async function testFile(inputFile, outputDir, ffmpegBin) {
  const fileName = path.basename(inputFile, path.extname(inputFile));
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${fileName}`);
  console.log('='.repeat(60));
  
  const fileOutputDir = path.join(outputDir, fileName);
  await fs.mkdir(fileOutputDir, { recursive: true });
  
  const atlasPath = path.join(fileOutputDir, 'atlas.png');
  
  try {
    console.log('\n[1/5] Detect & Convert...');
    const detected = await detectConvertTask.execute({
      filePath: inputFile,
      originalFileName: fileName,
      packId: 'test',
      packType: 'STICKER',
      groupId: 'test',
      settings: {
        enableAnimation: true,
        enableTrim: false,
        rescaleQuality: 'lanczos3',
        fragmentColumns: 2,
        fragmentRows: 2,
        borderSize: 0
      },
      ffmpegPath: ffmpegBin,
      ffprobePath: ffmpegBin.replace('ffmpeg', 'ffprobe')
    });
    
    console.log(`  ✓ Format: ${detected.format}, ${detected.width}x${detected.height}`);
    console.log(`  ✓ Animated: ${detected.isAnimated}`);
    
    if (!detected.isAnimated) {
      console.log('  ⚠ Skipping static image');
      return true;
    }
    
    console.log('\n[2/5] Rescale to 1024x1024...');
    const rescaled = await rescaleTask.execute(detected);
    console.log(`  ✓ Rescaled: ${rescaled.width}x${rescaled.height}`);
    
    const metadata = await sharp(rescaled.tempPath).metadata();
    const frameCount = metadata.pages || 1;
    
    const ffprobeBin = path.join(__dirname, 'ffmpeg-7.0.2-amd64-static', 'ffprobe');
    const { stdout: originalProbe } = await execAsync(`${ffprobeBin} -v quiet -print_format json -show_streams "${inputFile}"`);
    const originalInfo = JSON.parse(originalProbe);
    const originalStream = originalInfo.streams[0];
    
    let originalFps = 25;
    if (originalStream.r_frame_rate) {
      const [num, den] = originalStream.r_frame_rate.split('/').map(Number);
      originalFps = den > 0 ? num / den : 25;
    }
    
    const originalDuration = frameCount / originalFps;
    console.log(`  ✓ Frames: ${frameCount}, FPS: ${originalFps.toFixed(1)}, Duration: ${originalDuration.toFixed(2)}s`);
    
    console.log('\n[3/5] Creating PNG atlas...');
    const frameWidth = rescaled.width;
    const frameHeight = rescaled.height;
    const atlasHeight = frameHeight * frameCount;
    
    const frames = [];
    for (let i = 0; i < frameCount; i++) {
      const frame = await sharp(rescaled.tempPath, { page: i })
        .ensureAlpha()
        .toBuffer();
      frames.push(frame);
    }
    
    await sharp({
      create: {
        width: frameWidth,
        height: atlasHeight,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
    .composite(frames.map((buffer, i) => ({
      input: buffer,
      top: i * frameHeight,
      left: 0
    })))
    .png()
    .toFile(atlasPath);
    
    console.log(`  ✓ Atlas: ${frameWidth}x${atlasHeight} (${frameCount} frames)`);
    
    console.log('\n[4/5] Aggregate tile coordinates...');
    const tileCoords = getTileCoordinates(2, 2, 512, frameHeight);
    console.log(`  ✓ Aggregated ${tileCoords.length} tile coordinates`);
    
    console.log('\n[5/5] Binary search for optimal CRF...');
    
    let minCrf = cachedCrf ? Math.max(MIN_CRF, cachedCrf - 5) : MIN_CRF;
    let maxCrf = cachedCrf ? Math.min(MAX_CRF, cachedCrf + 5) : MAX_CRF;
    let bestCrf = maxCrf;
    
    if (cachedCrf) {
      console.log(`  Using cached CRF=${cachedCrf} as starting point`);
    }
    
    while (minCrf <= maxCrf) {
      const midCrf = Math.floor((minCrf + maxCrf) / 2);
      console.log(`  Testing CRF=${midCrf} (range: ${minCrf}-${maxCrf})`);
      
      const tiles = await convertAtlasToTiles(
        atlasPath, fileOutputDir, fileName,
        frameCount, originalFps, frameHeight,
        ffmpegBin, midCrf, tileCoords
      );
      
      let maxSize = 0;
      for (const tile of tiles) {
        const stats = await fs.stat(tile.path);
        maxSize = Math.max(maxSize, stats.size);
      }
      
      console.log(`    Max tile size: ${(maxSize / 1024).toFixed(0)} KB`);
      
      if (maxSize <= MAX_TILE_SIZE) {
        bestCrf = midCrf;
        maxCrf = midCrf - 1;
      } else {
        minCrf = midCrf + 1;
      }
    }
    
    console.log(`  ✓ Optimal CRF: ${bestCrf}`);
    cachedCrf = bestCrf;
    
    const finalTiles = await convertAtlasToTiles(
      atlasPath, fileOutputDir, fileName,
      frameCount, originalFps, frameHeight,
      ffmpegBin, bestCrf, tileCoords
    );
    
    console.log(`  ✓ Created ${finalTiles.length} tiles`);
    
    console.log('\n[Results]');
    
    let allGood = true;
    
    for (const tile of finalTiles) {
      const tileStats = await fs.stat(tile.path);
      const { stdout: tileProbe } = await execAsync(`${ffprobeBin} -v quiet -print_format json -show_format -show_streams "${tile.path}"`);
      const tileMetadata = JSON.parse(tileProbe);
      const tileStream = tileMetadata.streams[0];
      
      const hasAlpha = tileStream.pix_fmt.includes('yuva');
      const sizeOk = tileStats.size <= MAX_TILE_SIZE;
      
      console.log(`  ${tile.name}:`);
      console.log(`    Size: ${(tileStats.size / 1024).toFixed(0)} KB ${sizeOk ? '✓' : '✗'}`);
      console.log(`    Format: ${tileStream.pix_fmt} ${hasAlpha ? '✓' : '✗'}`);
      console.log(`    Duration: ${tileMetadata.format.duration}s`);
      
      if (!sizeOk || !hasAlpha) allGood = false;
    }
    
    console.log(`\n  Result: ${allGood ? '✓ ALL CHECKS PASSED' : '⚠ SOME ISSUES'}`);
    return allGood;
    
  } catch (error) {
    console.error(`\n  ✗ FAILED: ${error.message}`);
    if (error.stderr) {
      console.error(`  Stderr: ${error.stderr.substring(0, 500)}`);
    }
    return false;
  }
}

async function main() {
  console.log('=== Final Test: Coordinate Aggregation + CRF Cache ===\n');
  
  const assetDir = path.join(__dirname, 'Asset');
  const outputDir = path.join(__dirname, 'output');
  const ffmpegBin = path.join(__dirname, 'ffmpeg-7.0.2-amd64-static', 'ffmpeg');
  
  await cleanOutput(outputDir);
  console.log('✓ Output directory cleaned\n');
  
  const files = await fs.readdir(assetDir);
  const testFiles = files.filter(f => (f.endsWith('.gif') || f.endsWith('.webp')) && !f.includes('_anim') && !f.includes('_rescale'));
  
  console.log(`Found ${testFiles.length} files to test:`);
  testFiles.forEach(f => console.log(`  - ${f}`));
  
  const results = [];
  
  for (const file of testFiles) {
    const inputPath = path.join(assetDir, file);
    const success = await testFile(inputPath, outputDir, ffmpegBin);
    results.push({ file, success });
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  results.forEach(r => {
    console.log(`  ${r.success ? '✓' : '✗'} ${r.file}`);
  });
  
  const allPassed = results.every(r => r.success);
  console.log(`\n${allPassed ? '✓ ALL TESTS PASSED' : '⚠ SOME TESTS FAILED'}`);
  
  console.log('\n' + '='.repeat(60));
  console.log('Creating HTML previews...');
  console.log('='.repeat(60));
  
  const dirs = await fs.readdir(outputDir);
  for (const dir of dirs) {
    const dirPath = path.join(outputDir, dir);
    const stat = await fs.stat(dirPath);
    if (!stat.isDirectory()) continue;
    
    const files = await fs.readdir(dirPath);
    const tiles = files.filter(f => f.endsWith('.webm') && f.includes('tile')).sort();
    
    if (tiles.length === 0) continue;
    
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
    <p>✓ Coordinate aggregation</p>
    <p>✓ Direct PNG atlas → WebM tiles</p>
    <p>✓ CRF caching between files</p>
    <p>✓ Binary search for optimal quality</p>
    <p>Total tiles: ${tiles.length}</p>
  </div>
</body>
</html>`;
    
    await fs.writeFile(path.join(dirPath, 'preview.html'), html);
    console.log(`  ✓ Created preview.html for ${dir}`);
  }
  
  console.log('\n✓ All HTML previews created');
}

main();
