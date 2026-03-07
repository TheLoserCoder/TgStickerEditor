import { nanoid } from 'nanoid';
import sharp from 'sharp';
import { ImageFragment } from '@/shared/domains/image-processing/types';
import { ImageFormat } from '@/shared/domains/image-processing/enums';
import { StickerPackType } from '@/shared/domains/sticker-pack/enums';

interface FragmentSingleInput {
  imagePath: string;
  outputDir: string;
  row: number;
  col: number;
  cellSize: number;
  isAnimated: boolean;
  sessionId: string;
  format: ImageFormat;
  frameTimings?: number[];
  originalFileName: string;
  packId: string;
  packType: StickerPackType;
  groupId: string;
}

export async function execute(input: FragmentSingleInput): Promise<ImageFragment> {
  const startTime = Date.now();
  console.log(`[fragment-single] START: tile [${input.row},${input.col}]`);
  
  try {
    const left = input.col * input.cellSize;
    const top = input.row * input.cellSize;
    const outputPath = `${input.outputDir}/tile_${input.row}_${input.col}.webp`;
    
    if (!input.isAnimated) {
      // Статичное изображение
      await sharp(input.imagePath)
        .extract({ left, top, width: input.cellSize, height: input.cellSize })
        .webp({ lossless: true })
        .toFile(outputPath);
      
      console.log(`[fragment-single] DONE: tile [${input.row},${input.col}], ${Date.now() - startTime}ms`);
      
      return {
        sessionId: input.sessionId,
        fragmentId: nanoid(),
        tempPath: outputPath,
        format: ImageFormat.WEBP,
        width: input.cellSize,
        height: input.cellSize,
        isAnimated: false,
        row: input.row,
        col: input.col,
        originalFileName: input.originalFileName,
        packId: input.packId,
        packType: input.packType,
        groupId: input.groupId
      };
    }

    // Анимация - нарезаем WebP на куски
    await sharp(input.imagePath, { 
      animated: true,
      pages: -1,
      limitInputPixels: false 
    })
      .extract({ left, top, width: input.cellSize, height: input.cellSize })
      .webp({ lossless: false, quality: 90 })
      .toFile(outputPath);
    
    console.log(`[fragment-single] DONE: tile [${input.row},${input.col}], ${Date.now() - startTime}ms`);
    
    return {
      sessionId: input.sessionId,
      fragmentId: nanoid(),
      tempPath: outputPath,
      format: ImageFormat.WEBP,
      width: input.cellSize,
      height: input.cellSize,
      isAnimated: true,
      frameTimings: input.frameTimings,
      row: input.row,
      col: input.col,
      originalFileName: input.originalFileName,
      packId: input.packId,
      packType: input.packType,
      groupId: input.groupId
    };
  } catch (error) {
    console.error(`[fragment-single] ERROR: tile [${input.row},${input.col}], ${error instanceof Error ? error.message : String(error)}`);
    console.error(`[fragment-single] Stack: ${error instanceof Error ? error.stack : 'N/A'}`);
    throw error;
  }
}
