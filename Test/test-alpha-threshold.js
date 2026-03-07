#!/usr/bin/env node

const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function test() {
  const ffmpegBin = path.join(__dirname, 'ffmpeg-7.0.2-amd64-static', 'ffmpeg');
  const ffprobeBin = path.join(__dirname, 'ffmpeg-7.0.2-amd64-static', 'ffprobe');
  const atlasPath = path.join(__dirname, 'output/test2/atlas.png');
  const outputPath = path.join(__dirname, 'output/test_alpha_threshold.webm');
  
  console.log('Testing -alpha_threshold 0...\n');
  
  const cmd = `${ffmpegBin} -y \
    -loop 1 \
    -framerate 10 \
    -i "${atlasPath}" \
    -vf "crop=1024:1024:0:'n*1024'" \
    -frames:v 8 \
    -c:v libvpx-vp9 \
    -pix_fmt yuva420p \
    -alpha_threshold 0 \
    -auto-alt-ref 0 \
    -crf 30 \
    -b:v 0 \
    -deadline realtime \
    -cpu-used 6 \
    -row-mt 1 \
    -an \
    "${outputPath}"`;
  
  await execAsync(cmd);
  
  const { stdout } = await execAsync(`${ffprobeBin} -v quiet -print_format json -show_streams "${outputPath}"`);
  const metadata = JSON.parse(stdout);
  const stream = metadata.streams[0];
  
  console.log(`Result: ${stream.pix_fmt}`);
  console.log(stream.pix_fmt.includes('yuva') ? '✓ Alpha preserved!' : '✗ Alpha lost');
}

test();
