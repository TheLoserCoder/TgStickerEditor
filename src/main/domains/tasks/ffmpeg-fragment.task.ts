import { promises as fs } from 'fs';
import { nanoid } from 'nanoid';
import { RescaledImage, ImageFragment } from '@/shared/domains/image-processing/types';
import { FFmpegAdapter } from '@/main/domains/media-processing/adapters/FFmpegAdapter';
import { ImageFormat } from '@/shared/domains/image-processing/enums';
import path from 'path';

const MAX_DURATION = 2.99;
const MAX_FILE_SIZE = 512 * 1024;
const INITIAL_CRF = 30;
const MAX_CRF = 50;

export async function execute(input: RescaledImage): Promise<ImageFragment[]> {
  const startTime = Date.now();
  console.log(`[ffmpeg-fragment] START: ${input.originalFileName}, grid=${input.settings.fragmentColumns}x${input.settings.fragmentRows}`);
  
  try {
    const ffmpegAdapter = new FFmpegAdapter(
      input.ffmpegPath || 'ffmpeg',
      input.ffprobePath || 'ffprobe'
    );

    const outputDir = path.join(path.dirname(input.tempPath), `${nanoid()}_fragments`);
    await fs.mkdir(outputDir, { recursive: true });

    const columns = input.settings.fragmentColumns;
    const rows = input.settings.fragmentRows;
    const tileSize = Math.floor(input.width / columns);

    // Фрагментация с начальным CRF
    const fragmentStart = Date.now();
    let result = await ffmpegAdapter.fragmentToWebM(
      input.tempPath,
      outputDir,
      columns,
      rows,
      tileSize,
      MAX_DURATION,
      INITIAL_CRF
    );
    console.log(`[ffmpeg-fragment] Initial fragmentation: ${Date.now() - fragmentStart}ms`);

    // Проверяем размеры и пересжимаем если нужно
    const fragments: ImageFragment[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < columns; c++) {
        const index = r * columns + c;
        let tilePath = result.paths[index];

        // Binary search для CRF если файл слишком большой
        const stats = await fs.stat(tilePath);
        if (stats.size > MAX_FILE_SIZE) {
          console.log(`[ffmpeg-fragment] Tile [${r},${c}] too large (${stats.size}), recompressing...`);
          tilePath = await binarySearchCRF(
            ffmpegAdapter,
            input.tempPath,
            outputDir,
            c,
            r,
            columns,
            tileSize,
            MAX_DURATION,
            MAX_FILE_SIZE
          );
        }

        const fragmentId = nanoid();
        fragments.push({
          sessionId: input.sessionId,
          fragmentId,
          tempPath: tilePath,
          format: ImageFormat.WEBM,
          width: tileSize,
          height: tileSize,
          isAnimated: true,
          row: r,
          col: c,
          originalFileName: input.originalFileName,
          packId: input.packId,
          packType: input.packType,
          groupId: input.groupId,
          conversionParams: {
            duration: result.duration,
            fps: result.fps,
            frameCount: result.frameCount
          }
        });
      }
    }

    console.log(`[ffmpeg-fragment] DONE: ${Date.now() - startTime}ms total`);
    return fragments;
  } catch (error) {
    console.error(`[ffmpeg-fragment] ERROR: ${error instanceof Error ? error.message : String(error)}`);
    console.error(`[ffmpeg-fragment] Stack: ${error instanceof Error ? error.stack : 'N/A'}`);
    throw error;
  }
}

async function binarySearchCRF(
  adapter: FFmpegAdapter,
  inputPath: string,
  outputDir: string,
  col: number,
  row: number,
  columns: number,
  tileSize: number,
  maxDuration: number,
  targetSize: number
): Promise<string> {
  let minCRF = INITIAL_CRF;
  let maxCRFValue = MAX_CRF;
  let bestPath = '';

  while (minCRF <= maxCRFValue) {
    const midCRF = Math.floor((minCRF + maxCRFValue) / 2);
    const testPath = path.join(outputDir, `tile_${row * columns + col}_crf${midCRF}.webm`);

    // Создаем один тайл с текущим CRF
    await adapter.fragmentToWebM(
      inputPath,
      outputDir,
      columns,
      1,
      tileSize,
      maxDuration,
      midCRF
    );

    const stats = await fs.stat(testPath);
    
    if (stats.size <= targetSize) {
      bestPath = testPath;
      maxCRFValue = midCRF - 1;
    } else {
      minCRF = midCRF + 1;
    }
  }

  return bestPath;
}
