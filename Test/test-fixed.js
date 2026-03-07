#!/usr/bin/env node

const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Импортируем таски
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
  const fullWebm = path.join(fileOutputDir, 'full_1024.webm');
  
  try {
    // Шаг 1: detect-convert (GIF/WebP → WebP)
    console.log('\n[1/5] Detect & Convert...');
    const detected = await detectConvertTask.execute({
      filePath: inputFile,
      originalFileName: fileName,
      packId: 'test',
      packType: 'STICKER', // StickerPackType.STICKER
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
    
    // Шаг 2: rescale (WebP → 1024x1024 WebP с правильными отступами)
    console.log('\n[2/5] Rescale to 1024x1024...');
    const rescaled = await rescaleTask.execute(detected);
    
    console.log(`  ✓ Rescaled: ${rescaled.width}x${rescaled.height}`);
    
    // Получаем метаданные
    const metadata = await sharp(rescaled.tempPath).metadata();
    const frameCount = metadata.pages || 1;
    
    // Получаем оригинальный FPS из исходного файла
    const ffprobeBin = path.join(__dirname, 'ffmpeg-7.0.2-amd64-static', 'ffprobe');
    const { stdout: originalProbe } = await execAsync(`${ffprobeBin} -v quiet -print_format json -show_streams "${inputFile}"`);
    const originalInfo = JSON.parse(originalProbe);
    const originalStream = originalInfo.streams[0];
    
    // Парсим FPS (формат "25/1" или "30000/1001")
    let originalFps = 25; // default
    if (originalStream.r_frame_rate) {
      const [num, den] = originalStream.r_frame_rate.split('/').map(Number);
      originalFps = den > 0 ? num / den : 25;
    }
    
    // Получаем длительность из rescaled WebP
    const { stdout: webpProbe } = await execAsync(`${ffprobeBin} -v quiet -print_format json -show_format "${rescaled.tempPath}"`);
    const webpInfo = JSON.parse(webpProbe);
    const originalDuration = parseFloat(webpInfo.format.duration) || (frameCount / originalFps);
    
    console.log(`  ✓ Frames: ${frameCount}, Original FPS: ${originalFps.toFixed(1)}, Duration: ${originalDuration.toFixed(2)}s`);
    
    // Шаг 3: Создаем PNG атлас из rescaled WebP с прозрачным пикселем
    console.log('\n[3/5] Creating PNG atlas with transparent pixel...');
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
    
    // Создаём прозрачный пиксель (RGBA: 0,0,0,254) - почти непрозрачный
    const transparentPixel = Buffer.from([0, 0, 0, 254]);
    
    await sharp({
      create: {
        width: frameWidth,
        height: atlasHeight,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
    .composite([
      ...frames.map((buffer, i) => ({
        input: buffer,
        top: i * frameHeight,
        left: 0
      })),
      // Добавляем пиксель с alpha=254 в правый нижний угол
      {
        input: transparentPixel,
        raw: { width: 1, height: 1, channels: 4 },
        top: atlasHeight - 1,
        left: frameWidth - 1,
        blend: 'over'
      }
    ])
    .png()
    .toFile(atlasPath);
    
    console.log(`  ✓ Atlas: ${frameWidth}x${atlasHeight} (${frameCount} frames + alpha pixel)`);
    
    // Шаг 4: PNG атлас → WebM с оригинальным FPS
    console.log('\n[4/5] Converting atlas to animated WebM...');
    
    const targetDuration = Math.min(originalDuration, 2.99);
    const targetFps = originalFps; // Используем оригинальный FPS!
    
    console.log(`  Target: ${targetDuration.toFixed(2)}s @ ${targetFps.toFixed(1)} FPS (original FPS preserved)`);
    
    // Используем crop filter для извлечения кадров из атласа
    // ВАЖНО: убираем format=yuva420p из фильтра, используем только -pix_fmt yuva420p + -strict -2
    const convertCmd = `${ffmpegBin} -y \
      -loop 1 \
      -framerate ${targetFps} \
      -i "${atlasPath}" \
      -vf "crop=${frameWidth}:${frameHeight}:0:'n*${frameHeight}'" \
      -frames:v ${frameCount} \
      -c:v libvpx-vp9 \
      -pix_fmt yuva420p \
      -auto-alt-ref 0 \
      -strict -2 \
      -crf 30 \
      -b:v 0 \
      -deadline realtime \
      -cpu-used 6 \
      -row-mt 1 \
      -an \
      "${fullWebm}"`;
    
    await execAsync(convertCmd);
    
    const webmStats = await fs.stat(fullWebm);
    const { stdout: probeOutput } = await execAsync(`${ffprobeBin} -v quiet -print_format json -show_format -show_streams "${fullWebm}"`);
    const webmMetadata = JSON.parse(probeOutput);
    const videoStream = webmMetadata.streams[0];
    
    console.log(`  ✓ WebM: ${(webmStats.size / 1024).toFixed(0)} KB`);
    console.log(`  ✓ Format: ${videoStream.pix_fmt} ${videoStream.pix_fmt.includes('yuva') ? '(alpha ✓)' : '(no alpha)'}`);
    console.log(`  ✓ Duration: ${webmMetadata.format.duration}s`);
    console.log(`  ✓ Frames: ${videoStream.nb_frames || 'N/A'}`);
    
    // Шаг 5: Нарезка на тайлы
    console.log('\n[5/5] Fragmenting to 2x2 tiles...');
    
    const filterComplex = `
[0:v]split=4[v0][v1][v2][v3];
[v0]crop=512:512:0:0[t0];
[v1]crop=512:512:512:0[t1];
[v2]crop=512:512:0:512[t2];
[v3]crop=512:512:512:512[t3]
`.trim();
    
    const fragmentCmd = `${ffmpegBin} -y -i "${fullWebm}" -filter_complex "${filterComplex}" \
      -map "[t0]" -c:v libvpx-vp9 -pix_fmt yuva420p -auto-alt-ref 0 -crf 45 -b:v 0 -deadline realtime -cpu-used 6 -row-mt 1 -an "${fileOutputDir}/${fileName}_tile_0_0.webm" \
      -map "[t1]" -c:v libvpx-vp9 -pix_fmt yuva420p -auto-alt-ref 0 -crf 45 -b:v 0 -deadline realtime -cpu-used 6 -row-mt 1 -an "${fileOutputDir}/${fileName}_tile_0_1.webm" \
      -map "[t2]" -c:v libvpx-vp9 -pix_fmt yuva420p -auto-alt-ref 0 -crf 45 -b:v 0 -deadline realtime -cpu-used 6 -row-mt 1 -an "${fileOutputDir}/${fileName}_tile_1_0.webm" \
      -map "[t3]" -c:v libvpx-vp9 -pix_fmt yuva420p -auto-alt-ref 0 -crf 45 -b:v 0 -deadline realtime -cpu-used 6 -row-mt 1 -an "${fileOutputDir}/${fileName}_tile_1_1.webm"`;
    
    await execAsync(fragmentCmd);
    console.log(`  ✓ Created 4 tiles`);
    
    // Проверка результатов
    console.log('\n[Results]');
    
    const tiles = [
      `${fileName}_tile_0_0.webm`,
      `${fileName}_tile_0_1.webm`,
      `${fileName}_tile_1_0.webm`,
      `${fileName}_tile_1_1.webm`
    ];
    
    let allGood = true;
    
    for (const tile of tiles) {
      const tilePath = path.join(fileOutputDir, tile);
      const tileStats = await fs.stat(tilePath);
      const { stdout: tileProbe } = await execAsync(`${ffprobeBin} -v quiet -print_format json -show_format -show_streams "${tilePath}"`);
      const tileMetadata = JSON.parse(tileProbe);
      const tileStream = tileMetadata.streams[0];
      
      const hasAlpha = tileStream.pix_fmt.includes('yuva');
      const sizeOk = tileStats.size <= 512 * 1024;
      const framesOk = (tileStream.nb_frames || 0) === frameCount;
      
      console.log(`  ${tile}:`);
      console.log(`    Size: ${(tileStats.size / 1024).toFixed(0)} KB ${sizeOk ? '✓' : '✗'}`);
      console.log(`    Format: ${tileStream.pix_fmt} ${hasAlpha ? '✓' : '✗'}`);
      console.log(`    Duration: ${tileMetadata.format.duration}s`);
      console.log(`    Frames: ${tileStream.nb_frames || 'N/A'} ${framesOk ? '✓' : '✗'}`);
      
      if (!sizeOk || !framesOk) allGood = false;
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
  console.log('=== Multi-File Fragment Test (Fixed) ===\n');
  
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
