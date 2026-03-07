#!/usr/bin/env node

const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const detectConvertTask = require('../dist-main/tasks/detect-convert.task');
const rescaleTask = require('../dist-main/tasks/rescale.task');

async function cleanOutput(outputDir) {
  try {
    await fs.rm(outputDir, { recursive: true, force: true });
    await fs.mkdir(outputDir, { recursive: true });
  } catch (e) {}
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
    console.log('\n[1/4] Detect & Convert...');
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
    
    console.log('\n[2/4] Rescale to 1024x1024...');
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
    
    console.log(`  ✓ Frames: ${frameCount}, FPS: ${originalFps.toFixed(1)}`);
    
    console.log('\n[3/4] Creating PNG atlas...');
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
    
    console.log('\n[4/4] Direct PNG atlas → WebM tiles...');
    
    const tileSize = 512;
    const columns = 2;
    const rows = 2;
    
    const tiles = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < columns; c++) {
        const x = c * tileSize;
        const y = r * tileSize;
        tiles.push({
          name: `${fileName}_tile_${r}_${c}.webm`,
          path: path.join(fileOutputDir, `${fileName}_tile_${r}_${c}.webm`),
          x, y
        });
      }
    }
    
    // Создаём каждый тайл отдельной командой для правильного crop
    for (const tile of tiles) {
      const cmd = `${ffmpegBin} -y -loop 1 -framerate ${originalFps} -i "${atlasPath}" \
        -vf "crop=${tileSize}:${tileSize}:${tile.x}:${tile.y}+'n*${frameHeight}',format=yuva420p" \
        -frames:v ${frameCount} \
        -c:v libvpx-vp9 \
        -pix_fmt yuva420p \
        -auto-alt-ref 0 \
        -crf 45 \
        -b:v 0 \
        -deadline realtime \
        -cpu-used 6 \
        -row-mt 1 \
        -an \
        "${tile.path}"`;
      
      await execAsync(cmd);
    }
    
    console.log(`  ✓ Created 4 tiles`);
    
    console.log('\n[Results]');
    
    let allGood = true;
    
    for (const tile of tiles) {
      const tileStats = await fs.stat(tile.path);
      const { stdout: tileProbe } = await execAsync(`${ffprobeBin} -v quiet -print_format json -show_format -show_streams "${tile.path}"`);
      const tileMetadata = JSON.parse(tileProbe);
      const tileStream = tileMetadata.streams[0];
      
      const hasAlpha = tileStream.pix_fmt.includes('yuva');
      const sizeOk = tileStats.size <= 512 * 1024;
      
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
  console.log('=== Direct PNG Atlas → WebM Tiles Test (Fixed Crop) ===\n');
  
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
