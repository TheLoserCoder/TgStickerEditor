#!/usr/bin/env node

const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function test() {
  const ffmpegBin = path.join(__dirname, 'ffmpeg-7.0.2-amd64-static', 'ffmpeg');
  const ffprobeBin = path.join(__dirname, 'ffmpeg-7.0.2-amd64-static', 'ffprobe');
  const atlasPath = path.join(__dirname, 'output/test2/atlas.png');
  const outputDir = path.join(__dirname, 'output/direct_tiles');
  
  console.log('Testing direct PNG atlas → WebM tiles...\n');
  
  const frameCount = 8;
  const fps = 10;
  const tileSize = 512;
  
  // Создаём 4 тайла напрямую из PNG атласа
  const cmd = `${ffmpegBin} -y \
    -loop 1 \
    -framerate ${fps} \
    -i "${atlasPath}" \
    -vf "crop=${tileSize}:${tileSize}:0:'n*1024',format=yuva420p" \
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
    "${outputDir}/tile_0_0.webm" \
    \
    -vf "crop=${tileSize}:${tileSize}:512:'n*1024',format=yuva420p" \
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
    "${outputDir}/tile_0_1.webm"`;
  
  await execAsync(`mkdir -p "${outputDir}"`);
  await execAsync(cmd);
  
  console.log('Checking tiles...\n');
  
  for (const tile of ['tile_0_0.webm', 'tile_0_1.webm']) {
    const tilePath = path.join(outputDir, tile);
    const { stdout } = await execAsync(`${ffprobeBin} -v quiet -print_format json -show_streams "${tilePath}"`);
    const metadata = JSON.parse(stdout);
    const stream = metadata.streams[0];
    
    console.log(`${tile}:`);
    console.log(`  Format: ${stream.pix_fmt} ${stream.pix_fmt.includes('yuva') ? '✓' : '✗'}`);
  }
}

test().catch(console.error);
