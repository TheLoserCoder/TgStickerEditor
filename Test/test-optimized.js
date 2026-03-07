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
const MAX_TILE_SIZE = 256 * 1024;
const MIN_CRF = 32;
const MAX_CRF = 50;
const SHARP_CONCURRENCY = 4;

async function cleanOutput(outputDir) {
  try {
    await fs.rm(outputDir, { recursive: true, force: true });
    await fs.mkdir(outputDir, { recursive: true });
  } catch (e) {}
}

async function createMasterWebM(atlasPath, outputPath, frameCount, originalFps, frameHeight, ffmpegBin) {
  const originalDuration = frameCount / originalFps;
  let targetFps = originalFps;
  let setptsFactor = 1;
  
  if (originalDuration > MAX_DURATION) {
    setptsFactor = MAX_DURATION / originalDuration;
  }
  
  const cmd = `${ffmpegBin} -y -loop 1 -framerate ${targetFps} -i "${atlasPath}" \
    -vf "crop=1024:1024:0:'n*${frameHeight}',fps=${targetFps},setpts=${setptsFactor}*PTS,format=yuva420p" \
    -frames:v ${frameCount} \
    -c:v libvpx-vp9 \
    -pix_fmt yuva420p \
    -auto-alt-ref 0 \
    -crf 10 \
    -b:v 0 \
    -an \
    "${outputPath}"`;
  
  await execAsync(cmd);
}

async function convertMasterToTiles(masterPath, outputDir, fileName, ffmpegBin, crf) {
  const tileSize = 512;
  const columns = 2;
  const rows = 2;
  
  let filterComplex = `[0:v]split=4[v0][v1][v2][v3];`;
  
  const tiles = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < columns; c++) {
      const index = r * columns + c;
      const x = c * tileSize;
      const y = r * tileSize;
      
      filterComplex += `[v${index}]crop=${tileSize}:${tileSize}:${x}:${y}[t${index}]`;
      if (index < 3) filterComplex += ';';
      
      tiles.push({
        name: `${fileName}_tile_${r}_${c}.webm`,
        path: path.join(outputDir, `${fileName}_tile_${r}_${c}.webm`),
        index
      });
    }
  }
  
  let cmd = `${ffmpegBin} -y -i "${masterPath}" -filter_complex "${filterComplex}"`;
  
  for (const tile of tiles) {
    cmd += ` -map "[t${tile.index}]" -c:v libvpx-vp9 -pix_fmt yuva420p -auto-alt-ref 0 -crf ${crf} -b:v 0 -deadline realtime -cpu-used 6 -row-mt 1 -an "${tile.path}"`;
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
  const masterPath = path.join(fileOutputDir, 'master.webm');
  
  try {
    console.log('\n[1/6] Detect & Convert...');
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
    
    console.log('\n[2/6] Rescale to 1024x1024...');
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
    
    console.log('\n[3/6] Creating PNG atlas (parallel)...');
    const startAtlas = Date.now();
    const frameWidth = rescaled.width;
    const frameHeight = rescaled.height;
    const atlasHeight = frameHeight * frameCount;
    
    // Параллельное чтение кадров
    const framePromises = [];
    for (let i = 0; i < frameCount; i += SHARP_CONCURRENCY) {
      const batch = [];
      for (let j = 0; j < SHARP_CONCURRENCY && i + j < frameCount; j++) {
        batch.push(
          sharp(rescaled.tempPath, { page: i + j })
            .ensureAlpha()
            .toBuffer()
        );
      }
      framePromises.push(Promise.all(batch));
    }
    
    const frameBatches = await Promise.all(framePromises);
    const frames = frameBatches.flat();
    
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
    
    console.log(`  ✓ Atlas: ${frameWidth}x${atlasHeight} (${Date.now() - startAtlas}ms)`);
    
    console.log('\n[4/6] Creating master WebM (CRF=10)...');
    const startMaster = Date.now();
    await createMasterWebM(atlasPath, masterPath, frameCount, originalFps, frameHeight, ffmpegBin);
    console.log(`  ✓ Master WebM created (${Date.now() - startMaster}ms)`);
    
    console.log('\n[5/6] Binary search for optimal CRF (using master)...');
    
    let minCrf = MIN_CRF;
    let maxCrf = MAX_CRF;
    let bestCrf = maxCrf;
    
    while (minCrf <= maxCrf) {
      const midCrf = Math.floor((minCrf + maxCrf) / 2);
      console.log(`  Testing CRF=${midCrf} (range: ${minCrf}-${maxCrf})`);
      
      const tiles = await convertMasterToTiles(
        masterPath, fileOutputDir, fileName,
        ffmpegBin, midCrf
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
    
    console.log('\n[6/6] Final conversion with optimal CRF...');
    const finalTiles = await convertMasterToTiles(
      masterPath, fileOutputDir, fileName,
      ffmpegBin, bestCrf
    );
    
    console.log(`  ✓ Created 4 tiles`);
    
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
  console.log('=== Optimized Test: Parallel Sharp + Master WebM ===\n');
  
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
}

main();
  
  const allPassed = results.every(r => r.success);
  console.log(`\n${allPassed ? '✓ ALL TESTS PASSED' : '⚠ SOME TESTS FAILED'}`);
  
  // Создаём HTML превью
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
  <title>${dir} - Optimized Test</title>
  <style>
    body { margin: 20px; background: #222; color: #fff; font-family: monospace; }
    h1 { margin-bottom: 20px; }
    .grid { display: grid; grid-template-columns: repeat(2, 512px); gap: 2px; background: #000; width: fit-content; }
    video { width: 512px; height: 512px; display: block; }
    .info { margin-top: 20px; background: #333; padding: 10px; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>${dir} - Optimized</h1>
  <div class="grid">
${tiles.map(tile => `    <video src="${tile}" autoplay loop muted></video>`).join('\n')}
  </div>
  <div class="info">
    <p>✓ Parallel Sharp (${SHARP_CONCURRENCY} concurrent)</p>
    <p>✓ Master WebM (CRF=10) for binary search</p>
    <p>✓ One FFmpeg command per iteration</p>
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
