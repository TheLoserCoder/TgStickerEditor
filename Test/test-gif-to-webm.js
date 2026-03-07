#!/usr/bin/env node

const path = require('path');
const fs = require('fs').promises;
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function testGifToWebmFragment() {
  console.log('=== GIF → WebM → Fragment Test ===\n');
  
  const inputGif = path.join(__dirname, 'Asset', 'rickroll-roll.gif');
  const outputDir = path.join(__dirname, 'output');
  const fullWebm = path.join(outputDir, 'full_1024.webm');
  
  try {
    await fs.access(inputGif);
    console.log(`✓ Input: ${inputGif}\n`);
    
    // Шаг 1: GIF → WebM 1024x1024 с прозрачностью
    console.log('Step 1: Converting GIF to WebM 1024x1024 with alpha...');
    const convertCmd = `ffmpeg -y -i "${inputGif}" \
      -vf "fps=30,scale=1024:1024:flags=lanczos" \
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
    
    const stats = await fs.stat(fullWebm);
    const { stdout: probeOutput } = await execAsync(`ffprobe -v quiet -print_format json -show_format -show_streams "${fullWebm}"`);
    const metadata = JSON.parse(probeOutput);
    const videoStream = metadata.streams[0];
    
    console.log(`✓ Created WebM:`);
    console.log(`  Size: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log(`  Resolution: ${videoStream.width}x${videoStream.height}`);
    console.log(`  Pixel Format: ${videoStream.pix_fmt}`);
    console.log(`  Has Alpha: ${videoStream.pix_fmt.includes('yuva') ? 'YES ✓' : 'NO ✗'}`);
    console.log(`  Duration: ${metadata.format.duration}s\n`);
    
    // Шаг 2: Нарезка WebM на тайлы 2x2
    console.log('Step 2: Fragmenting WebM to 2x2 tiles...');
    
    const filterComplex = `
[0:v]split=4[v0][v1][v2][v3];
[v0]crop=512:512:0:0[t0];
[v1]crop=512:512:512:0[t1];
[v2]crop=512:512:0:512[t2];
[v3]crop=512:512:512:512[t3]
`.trim();
    
    const fragmentCmd = `ffmpeg -y -i "${fullWebm}" -filter_complex "${filterComplex}" \
      -map "[t0]" -c:v libvpx-vp9 -pix_fmt yuva420p -auto-alt-ref 0 -crf 40 -b:v 0 -deadline realtime -cpu-used 6 -row-mt 1 -an "${outputDir}/tile_0_0.webm" \
      -map "[t1]" -c:v libvpx-vp9 -pix_fmt yuva420p -auto-alt-ref 0 -crf 40 -b:v 0 -deadline realtime -cpu-used 6 -row-mt 1 -an "${outputDir}/tile_0_1.webm" \
      -map "[t2]" -c:v libvpx-vp9 -pix_fmt yuva420p -auto-alt-ref 0 -crf 40 -b:v 0 -deadline realtime -cpu-used 6 -row-mt 1 -an "${outputDir}/tile_1_0.webm" \
      -map "[t3]" -c:v libvpx-vp9 -pix_fmt yuva420p -auto-alt-ref 0 -crf 40 -b:v 0 -deadline realtime -cpu-used 6 -row-mt 1 -an "${outputDir}/tile_1_1.webm"`;
    
    await execAsync(fragmentCmd);
    console.log('✓ Fragmentation complete!\n');
    
    // Шаг 3: Проверка результатов
    console.log('Step 3: Checking tiles...\n');
    
    const tiles = ['tile_0_0.webm', 'tile_0_1.webm', 'tile_1_0.webm', 'tile_1_1.webm'];
    
    for (const tile of tiles) {
      const tilePath = path.join(outputDir, tile);
      const tileStats = await fs.stat(tilePath);
      const { stdout: tileProbe } = await execAsync(`ffprobe -v quiet -print_format json -show_format -show_streams "${tilePath}"`);
      const tileMetadata = JSON.parse(tileProbe);
      const tileStream = tileMetadata.streams[0];
      
      console.log(`${tile}:`);
      console.log(`  Size: ${(tileStats.size / 1024).toFixed(2)} KB ${tileStats.size <= 512 * 1024 ? '✓' : '✗ TOO LARGE'}`);
      console.log(`  Resolution: ${tileStream.width}x${tileStream.height}`);
      console.log(`  Pixel Format: ${tileStream.pix_fmt}`);
      console.log(`  Has Alpha: ${tileStream.pix_fmt.includes('yuva') ? 'YES ✓' : 'NO ✗'}`);
      console.log(`  Duration: ${tileMetadata.format.duration}s`);
      console.log();
    }
    
    console.log('=== Test completed successfully ===');
    
  } catch (error) {
    console.error('\n=== Test failed ===');
    console.error(error.message);
    if (error.stderr) {
      console.error('\nFFmpeg stderr:');
      console.error(error.stderr);
    }
    process.exit(1);
  }
}

testGifToWebmFragment();
