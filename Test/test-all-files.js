#!/usr/bin/env node

const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function cleanOutput(outputDir) {
  try {
    await fs.rm(outputDir, { recursive: true, force: true });
    await fs.mkdir(outputDir, { recursive: true });
  } catch (e) {}
}

async function testFile(inputFile, outputDir, ffmpegBin) {
  const fileName = path.basename(inputFile);
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${fileName}`);
  console.log('='.repeat(60));
  
  const webpPath = path.join(outputDir, 'source.webp');
  const atlasPath = path.join(outputDir, 'atlas.png');
  const fullWebm = path.join(outputDir, 'full_1024.webm');
  
  try {
    // Шаг 1: Конвертация в WebP через Sharp
    console.log('\n[1/5] Converting to WebP...');
    await sharp(inputFile, { animated: true })
      .webp({ quality: 80, effort: 4, loop: 0 })
      .toFile(webpPath);
    
    const webpMeta = await sharp(webpPath).metadata();
    const frameCount = webpMeta.pages || 1;
    console.log(`  ✓ ${frameCount} frames`);
    
    // Получаем реальную длительность из WebP
    const { stdout: webpProbe } = await execAsync(`${path.join(__dirname, 'ffmpeg-7.0.2-amd64-static', 'ffprobe')} -v quiet -print_format json -show_format "${webpPath}"`);
    const webpInfo = JSON.parse(webpProbe);
    const originalDuration = parseFloat(webpInfo.format.duration) || (frameCount / 30);
    const originalFps = frameCount / originalDuration;
    
    console.log(`  ✓ Duration: ${originalDuration.toFixed(2)}s, FPS: ${originalFps.toFixed(1)}`);
    
    // Шаг 2: Создаем PNG атлас
    console.log('\n[2/5] Creating PNG atlas...');
    const frameWidth = 1024;
    const frameHeight = 1024;
    const atlasHeight = frameHeight * frameCount;
    
    const frames = [];
    for (let i = 0; i < frameCount; i++) {
      const frame = await sharp(webpPath, { page: i })
        .resize(frameWidth, frameHeight, { fit: 'fill', kernel: 'lanczos3' })
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
    
    // Шаг 3: PNG атлас → WebM с сохранением таймингов
    console.log('\n[3/5] Converting atlas to WebM...');
    
    // Вычисляем нужный FPS и setpts для сохранения длительности
    const targetDuration = Math.min(originalDuration, 2.99);
    const targetFps = frameCount / targetDuration;
    const setptsFactor = originalDuration > 2.99 ? 2.99 / originalDuration : 1;
    
    console.log(`  Target: ${targetDuration.toFixed(2)}s @ ${targetFps.toFixed(1)} FPS`);
    
    const convertCmd = `${ffmpegBin} -y -loop 1 -framerate ${targetFps} -i "${atlasPath}" \
      -vf "crop=${frameWidth}:${frameHeight}:0:'n*${frameHeight}',format=yuva420p" \
      -frames:v ${frameCount} \
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
    
    console.log(`  ✓ WebM: ${(webmStats.size / 1024).toFixed(0)} KB`);
    console.log(`  ✓ Format: ${videoStream.pix_fmt} ${videoStream.pix_fmt.includes('yuva') ? '(alpha ✓)' : '(no alpha)'}`);
    console.log(`  ✓ Duration: ${metadata.format.duration}s`);
    
    // Шаг 4: Нарезка на тайлы
    console.log('\n[4/5] Fragmenting to 2x2 tiles...');
    
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
    console.log(`  ✓ Created 4 tiles`);
    
    // Шаг 5: Проверка результатов
    console.log('\n[5/5] Checking tiles...\n');
    
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
      
      console.log(`  ${tile}: ${(tileStats.size / 1024).toFixed(0)} KB ${sizeOk ? '✓' : '✗'} | ${tileStream.pix_fmt} ${hasAlpha ? '✓' : '✗'} | ${tileMetadata.format.duration}s`);
      
      if (!sizeOk) allGood = false;
    }
    
    console.log(`\n  Result: ${allGood ? '✓ ALL CHECKS PASSED' : '⚠ SIZE ISSUES'}`);
    return allGood;
    
  } catch (error) {
    console.error(`\n  ✗ FAILED: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('=== Multi-File Fragment Test ===\n');
  
  const assetDir = path.join(__dirname, 'Asset');
  const outputDir = path.join(__dirname, 'output');
  const ffmpegBin = path.join(__dirname, 'ffmpeg-7.0.2-amd64-static', 'ffmpeg');
  
  // Очищаем output
  await cleanOutput(outputDir);
  console.log('✓ Output directory cleaned\n');
  
  // Получаем все файлы
  const files = await fs.readdir(assetDir);
  const testFiles = files.filter(f => f.endsWith('.gif') || f.endsWith('.webp'));
  
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
