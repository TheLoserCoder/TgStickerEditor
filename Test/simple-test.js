const path = require('path');
const fs = require('fs').promises;

// Простой тест для проверки FFmpeg
const { FFmpegAdapter } = require('../dist-main/domains/media-processing/adapters/FFmpegAdapter');

async function simpleTest() {
  console.log('=== Simple FFmpeg Fragment Test ===\n');
  
  const inputPath = path.join(__dirname, 'Asset', 'rickroll-roll.gif');
  const outputDir = path.join(__dirname, 'output');
  
  try {
    // Проверяем файл
    await fs.access(inputPath);
    console.log(`✓ Input file found: ${inputPath}\n`);
    
    const adapter = new FFmpegAdapter('ffmpeg', 'ffprobe');
    
    // Получаем метаданные
    console.log('Getting metadata...');
    const metadata = await adapter.getMetadata(inputPath);
    console.log(`✓ Metadata:`, metadata);
    console.log();
    
    // Тестируем фрагментацию
    console.log('Testing fragmentToWebM...');
    const result = await adapter.fragmentToWebM(
      inputPath,
      outputDir,
      2, // columns
      2, // rows
      512, // tileSize
      2.99, // maxDuration
      30 // crf
    );
    
    console.log(`✓ Fragmentation complete!`);
    console.log(`  Duration: ${result.duration}s`);
    console.log(`  FPS: ${result.fps}`);
    console.log(`  Frames: ${result.frameCount}`);
    console.log(`  Tiles: ${result.paths.length}\n`);
    
    // Проверяем размеры файлов
    console.log('Checking output files:');
    for (let i = 0; i < result.paths.length; i++) {
      const stats = await fs.stat(result.paths[i]);
      console.log(`  tile_${i}.webm: ${(stats.size / 1024).toFixed(2)} KB`);
    }
    
    console.log('\n=== Test completed successfully ===');
    
  } catch (error) {
    console.error('\n=== Test failed ===');
    console.error(error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

simpleTest();
