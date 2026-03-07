#!/usr/bin/env node

const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function testWebpToPngToWebm() {
  console.log('=== WebP → PNG Sequence → WebM → Fragment Test ===\n');
  
  const inputGif = path.join(__dirname, 'Asset', 'rickroll-roll.gif');
  const outputDir = path.join(__dirname, 'output');
  const pngDir = path.join(outputDir, 'png_frames');
  const webpPath = path.join(outputDir, 'source.webp');
  const fullWebm = path.join(outputDir, 'full_1024.webm');
  const ffmpegBin = path.join(__dirname, 'ffmpeg-7.0.2-amd64-static', 'ffmpeg');
  
  try {
    await fs.access(inputGif);
    console.log(`✓ Input: ${inputGif}\n`);
    
    // Шаг 1: GIF → WebP через Sharp (как в detect-convert)
    console.log('Step 1: Converting GIF to WebP via Sharp...');
    await sharp(inputGif, { animated: true })
      .webp({ quality: 80, effort: 4, loop: 0 })
      .toFile(webpPath);
    
    const webpStats = await fs.stat(webpPath);
    const webpMeta = await sharp(webpPath).metadata();
    console.log(`✓ WebP created: ${(webpStats.size / 1024).toFixed(2)} KB, ${webpMeta.pages} frames\n`);
    
    // Шаг 2: WebP → PNG последовательность через Sharp
    console.log('Step 2: Extracting PNG frames from WebP...');
    await fs.mkdir(pngDir, { recursive: true });
    
    const frameCount = webpMeta.pages || 1;
    for (let i = 0; i < frameCount; i++) {
      const framePath = path.join(pngDir, `frame_${String(i).padStart(4, '0')}.png`);
      await sharp(webpPath, { page: i })
        .resize(1024, 1024, { fit: 'fill', kernel: 'lanczos3' })
        .png()
        .toFile(framePath);
    }
    console.log(`✓ Extracted ${frameCount} PNG frames\n`);
    
    // Шаг 3: PNG sequence → WebM с прозрачностью
    console.log('Step 3: Converting PNG sequence to WebM...');
    const fps = 30;
    const duration = frameCount / fps;
    
    const convertCmd = `${ffmpegBin} -y -framerate ${fps} -i "${pngDir}/frame_%04d.png" \
      -vf "format=yuva420p" \
      -c:v libvpx-vp9 \
      -pix_fmt yuva420p \
      -auto-alt-ref 0 \
      -crf 30 \
      -b:v 0 \
      -deadline realtime \
      -cpu-used 6 \
      -row-mt 1 \
      -an \
      "${fullWebm}"`;
    
    await execAsync(convertCmd);
    
    const webmStats = await fs.stat(fullWebm);
    const { stdout: probeOutput } = await execAsync(`${path.join(__dirname, 'ffmpeg-7.0.2-amd64-static', 'ffprobe')} -v quiet -print_format json -show_format -show_streams "${fullWebm}"`);
    const metadata = JSON.parse(probeOutput);
    const videoStream = metadata.streams[0];
    
    console.log(`✓ WebM created:`);
    console.log(`  Size: ${(webmStats.size / 1024).toFixed(2)} KB`);
    console.log(`  Resolution: ${videoStream.width}x${videoStream.height}`);
    console.log(`  Pixel Format: ${videoStream.pix_fmt}`);
    console.log(`  Has Alpha: ${videoStream.pix_fmt.includes('yuva') ? 'YES ✓' : 'NO ✗'}`);
    console.log(`  Duration: ${metadata.format.duration}s`);
    console.log(`  Expected: ${duration.toFixed(2)}s\n`);
    
    // Шаг 4: Нарезка WebM на тайлы 2x2
    console.log('Step 4: Fragmenting WebM to 2x2 tiles...');
    
    const filterComplex = `
[0:v]split=4[v0][v1][v2][v3];
[v0]crop=512:512:0:0[t0];
[v1]crop=512:512:512:0[t1];
[v2]crop=512:512:0:512[t2];
[v3]crop=512:512:512:512[t3]
`.trim();
    
    const fragmentCmd = `${ffmpegBin} -y -i "${fullWebm}" -filter_complex "${filterComplex}" \
      -map "[t0]" -c:v libvpx-vp9 -pix_fmt yuva420p -auto-alt-ref 0 -crf 45 -b:v 0 -deadline realtime -cpu-used 6 -row-mt 1 -an "${outputDir}/tile_0_0.webm" \
      -map "[t1]" -c:v libvpx-vp9 -pix_fmt yuva420p -auto-alt-ref 0 -crf 45 -b:v 0 -deadline realtime -cpu-used 6 -row-mt 1 -an "${outputDir}/tile_0_1.webm" \
      -map "[t2]" -c:v libvpx-vp9 -pix_fmt yuva420p -auto-alt-ref 0 -crf 45 -b:v 0 -deadline realtime -cpu-used 6 -row-mt 1 -an "${outputDir}/tile_1_0.webm" \
      -map "[t3]" -c:v libvpx-vp9 -pix_fmt yuva420p -auto-alt-ref 0 -crf 45 -b:v 0 -deadline realtime -cpu-used 6 -row-mt 1 -an "${outputDir}/tile_1_1.webm"`;
    
    await execAsync(fragmentCmd);
    console.log('✓ Fragmentation complete!\n');
    
    // Шаг 5: Проверка результатов
    console.log('Step 5: Checking tiles...\n');
    
    const tiles = ['tile_0_0.webm', 'tile_0_1.webm', 'tile_1_0.webm', 'tile_1_1.webm'];
    let allGood = true;
    
    for (const tile of tiles) {
      const tilePath = path.join(outputDir, tile);
      const tileStats = await fs.stat(tilePath);
      const { stdout: tileProbe } = await execAsync(`${path.join(__dirname, 'ffmpeg-7.0.2-amd64-static', 'ffprobe')} -v quiet -print_format json -show_format -show_streams "${tilePath}"`);
      const tileMetadata = JSON.parse(tileProbe);
      const tileStream = tileMetadata.streams[0];
      
      const hasAlpha = tileStream.pix_fmt.includes('yuva');
      const sizeOk = tileStats.size <= 512 * 1024;
      
      console.log(`${tile}:`);
      console.log(`  Size: ${(tileStats.size / 1024).toFixed(2)} KB ${sizeOk ? '✓' : '✗ TOO LARGE'}`);
      console.log(`  Resolution: ${tileStream.width}x${tileStream.height}`);
      console.log(`  Pixel Format: ${tileStream.pix_fmt}`);
      console.log(`  Has Alpha: ${hasAlpha ? 'YES ✓' : 'NO ✗'}`);
      console.log(`  Duration: ${tileMetadata.format.duration}s`);
      console.log();
      
      if (!hasAlpha || !sizeOk) allGood = false;
    }
    
    console.log('=== Summary ===');
    console.log(`Pipeline: GIF → WebP (Sharp) → PNG frames (Sharp) → WebM (FFmpeg) → Tiles (FFmpeg)`);
    console.log(`Result: ${allGood ? '✓ ALL CHECKS PASSED' : '⚠ SOME ISSUES FOUND'}`);
    console.log(`Output: ${outputDir}`);
    
  } catch (error) {
    console.error('\n=== Test failed ===');
    console.error(error.message);
    if (error.stderr) {
      console.error('\nStderr:');
      console.error(error.stderr);
    }
    process.exit(1);
  }
}

testWebpToPngToWebm();
