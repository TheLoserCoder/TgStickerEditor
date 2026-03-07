import * as detectConvertTask from '../src/main/domains/tasks/detect-convert.task';
import * as rescaleTask from '../src/main/domains/tasks/rescale.task';
import * as ffmpegFragmentTask from '../src/main/domains/tasks/ffmpeg-fragment.task';
import { ImageInput } from '../src/shared/domains/image-processing/types';
import { StickerPackType } from '../src/shared/domains/sticker-pack/enums';
import { RescaleQuality } from '../src/shared/domains/image-processing/enums';
import * as path from 'path';
import { promises as fs } from 'fs';

async function test() {
  console.log('=== FFmpeg Fragment Test ===\n');

  const inputPath = path.join(__dirname, 'Asset', 'rickroll-roll.gif');
  const outputDir = path.join(__dirname, 'output');

  // Проверяем существование входного файла
  try {
    await fs.access(inputPath);
  } catch {
    console.error(`Input file not found: ${inputPath}`);
    process.exit(1);
  }

  const input: ImageInput = {
    filePath: inputPath,
    originalFileName: 'rickroll-roll.gif',
    packId: 'test-pack',
    packType: StickerPackType.STICKER,
    groupId: 'test-group',
    settings: {
      enableAnimation: true,
      enableTrim: false,
      rescaleQuality: RescaleQuality.LANCZOS3,
      fragmentColumns: 2,
      fragmentRows: 2,
      borderSize: 0
    },
    ffmpegPath: 'ffmpeg',
    ffprobePath: 'ffprobe'
  };

  try {
    // Шаг 1: Detect & Convert
    console.log('Step 1: Detect & Convert...');
    const detected = await detectConvertTask.execute(input);
    console.log(`✓ Detected: ${detected.width}x${detected.height}, animated=${detected.isAnimated}\n`);

    // Шаг 2: Rescale
    console.log('Step 2: Rescale to 1024x1024...');
    const rescaled = await rescaleTask.execute(detected);
    console.log(`✓ Rescaled: ${rescaled.width}x${rescaled.height}\n`);

    // Шаг 3: FFmpeg Fragment
    console.log('Step 3: FFmpeg Fragment to WebM tiles...');
    const fragments = await ffmpegFragmentTask.execute(rescaled);
    console.log(`✓ Created ${fragments.length} fragments\n`);

    // Копируем результаты в output
    console.log('Copying results to output directory...');
    for (const fragment of fragments) {
      const fileName = `tile_${fragment.row}_${fragment.col}.webm`;
      const destPath = path.join(outputDir, fileName);
      await fs.copyFile(fragment.tempPath, destPath);
      
      const stats = await fs.stat(destPath);
      console.log(`✓ ${fileName}: ${stats.size} bytes (${(stats.size / 1024).toFixed(2)} KB)`);
    }

    console.log('\n=== Test completed successfully ===');
    console.log(`Output directory: ${outputDir}`);
    
  } catch (error) {
    console.error('\n=== Test failed ===');
    console.error(error);
    process.exit(1);
  }
}

test();
