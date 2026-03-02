/**
 * Sharp Adapter
 * Зона ответственности: Реализация операций с изображениями через Sharp
 */

import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { ISharpAdapter, ImageMetadata, SharpResizeOptions, SharpConvertOptions, ExtractOptions, TrimResult, ExtendOptions } from '../interfaces/ISharpAdapter';

export class SharpAdapter implements ISharpAdapter {

  /**
   * Получить метаданные изображения
   */
  async getMetadata(inputPath: string): Promise<ImageMetadata> {
    const metadata = await sharp(inputPath).metadata();

    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format || 'unknown',
      hasAlpha: metadata.hasAlpha || false,
      isAnimated: !!metadata.pages && metadata.pages > 1,
      pages: metadata.pages,
    };
  }

  /**
   * Изменить размер изображения
   */
  async resize(
    inputPath: string,
    outputPath: string,
    options: SharpResizeOptions
  ): Promise<void> {
    const { width, height, fit = 'fill', kernel = 'lanczos3' } = options;

    const pipeline = sharp(inputPath, { animated: true });

    // Выбираем kernel
    const kernelOption = kernel === 'nearest'
      ? sharp.kernel.nearest
      : sharp.kernel.lanczos3;

    pipeline.resize({
      width,
      height,
      fit,
      kernel: kernelOption,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    });

    // Определяем формат по расширению выходного файла
    const ext = path.extname(outputPath).toLowerCase();
    await this.applyFormat(pipeline, ext);

    await pipeline.toFile(outputPath);
  }

  /**
   * Конвертировать изображение в другой формат
   */
  async convert(
    inputPath: string,
    outputPath: string,
    options: SharpConvertOptions
  ): Promise<void> {
    const { format, quality = 80, lossless = false, effort = 4, animated = false } = options;

    const pipeline = sharp(inputPath, { animated });

    switch (format) {
      case 'webp':
        pipeline.webp({ quality, lossless, effort, loop: 0 });
        break;
      case 'png':
        pipeline.png({ quality, effort });
        break;
      case 'jpeg':
        pipeline.jpeg({ quality });
        break;
      case 'gif':
        pipeline.gif({ effort: effort as 1|2|3|4|5|6|7|8|9|10 });
        break;
      case 'avif':
        pipeline.avif({ quality, effort });
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    await pipeline.toFile(outputPath);
  }

  /**
   * Извлечь регион из изображения
   */
  async extract(
    inputPath: string,
    outputPath: string,
    options: ExtractOptions
  ): Promise<void> {
    const { left, top, width, height } = options;

    const metadata = await sharp(inputPath).metadata();
    const isAnimated = !!metadata.pages && metadata.pages > 1;

    const pipeline = sharp(inputPath, {
      animated: isAnimated,
      limitInputPixels: false,
    })
      .extract({ left, top, width, height });

    const ext = path.extname(outputPath).toLowerCase();
    await this.applyFormat(pipeline, ext);

    await pipeline.toFile(outputPath);
  }

  /**
   * Обрезать пустые области (trim)
   */
  async trim(
    inputPath: string,
    outputPath: string,
    threshold = 10
  ): Promise<TrimResult> {
    const metadata = await sharp(inputPath).metadata();
    const isAnimated = !!metadata.pages && metadata.pages > 1;

    if (!isAnimated) {
      const info = await sharp(inputPath)
        .trim({ threshold })
        .toFile(outputPath);

      return {
        trimOffsetLeft: (info as any).trimOffsetLeft || 0,
        trimOffsetTop: (info as any).trimOffsetTop || 0,
        width: info.width,
        height: info.height,
      };
    }

    // Для анимаций: композитинг всех фреймов для определения границ
    const frameBuffers: Buffer[] = [];
    for (let p = 0; p < metadata.pages!; p++) {
      frameBuffers.push(
        await sharp(inputPath, { page: p, limitInputPixels: false }).toBuffer()
      );
    }

    const compositeBuffer = await sharp({
      create: {
        width: metadata.width!,
        height: metadata.pageHeight || metadata.height!,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
      .composite(frameBuffers.map(input => ({ input, blend: 'over' })))
      .png()
      .toBuffer();

    const { info } = await sharp(compositeBuffer)
      .trim({ threshold })
      .toBuffer({ resolveWithObject: true });

    const ext = path.extname(outputPath).toLowerCase();
    const pipeline = sharp(inputPath, { animated: true, limitInputPixels: false })
      .extract({
        left: Math.abs(info.trimOffsetLeft || 0),
        top: Math.abs(info.trimOffsetTop || 0),
        width: info.width,
        height: info.height
      });

    await this.applyFormat(pipeline, ext);
    await pipeline.toFile(outputPath);

    return {
      trimOffsetLeft: info.trimOffsetLeft || 0,
      trimOffsetTop: info.trimOffsetTop || 0,
      width: info.width,
      height: info.height,
    };
  }

  /**
   * Добавить отступы к изображению
   */
  async extend(
    inputPath: string,
    outputPath: string,
    options: ExtendOptions
  ): Promise<void> {
    const { top = 0, bottom = 0, left = 0, right = 0, background = { r: 0, g: 0, b: 0, alpha: 0 } } = options;

    const metadata = await sharp(inputPath).metadata();
    const isAnimated = !!metadata.pages && metadata.pages > 1;

    const pipeline = sharp(inputPath, { animated: isAnimated })
      .extend({ top, bottom, left, right, background });

    const ext = path.extname(outputPath).toLowerCase();
    await this.applyFormat(pipeline, ext);
    await pipeline.toFile(outputPath);
  }

  /**
   * Нарезать изображение на фрагменты (tile grid)
   */
  async tile(
    inputPath: string,
    outputDir: string,
    columns: number,
    rows: number
  ): Promise<string[]> {
    await fs.mkdir(outputDir, { recursive: true });

    const metadata = await this.getMetadata(inputPath);
    const { width, height, isAnimated } = metadata;

    // Оптимизация: для grid 1×1 просто копируем файл
    if (columns === 1 && rows === 1) {
      const outputName = `tile_0_0.webp`;
      const outputPath = path.join(outputDir, outputName);
      await fs.copyFile(inputPath, outputPath);
      return [outputPath];
    }

    const tileWidth = Math.floor(width / columns);
    const tileHeight = Math.floor(height / rows);
    const results: string[] = [];
    const outputExt = '.webp';

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < columns; c++) {
        const left = c * tileWidth;
        const top = r * tileHeight;
        const extractWidth = c === columns - 1 ? width - left : tileWidth;
        const extractHeight = r === rows - 1 ? height - top : tileHeight;

        if (extractWidth <= 0 || extractHeight <= 0) {
          continue;
        }

        const outputName = `tile_${r}_${c}${outputExt}`;
        const outputPath = path.join(outputDir, outputName);

        await sharp(inputPath, {
          animated: isAnimated,
          limitInputPixels: false,
        })
          .extract({ left, top, width: extractWidth, height: extractHeight })
          .webp({ lossless: true, loop: 0 })
          .toFile(outputPath);

        results.push(outputPath);
      }
    }

    return results;
  }

  /**
   * Применить формат к pipeline
   */
  private async applyFormat(
    pipeline: sharp.Sharp,
    ext: string
  ): Promise<void> {
    switch (ext) {
      case '.gif':
        pipeline.gif({ effort: 6 });
        break;
      case '.webp':
        pipeline.webp({ quality: 80, effort: 4, loop: 0 });
        break;
      case '.png':
        pipeline.png({ quality: 80, effort: 4 });
        break;
      case '.jpg':
      case '.jpeg':
        pipeline.jpeg({ quality: 80 });
        break;
      case '.avif':
        pipeline.avif({ quality: 50, effort: 4 });
        break;
      default:
        // По умолчанию webp
        pipeline.webp({ quality: 80, effort: 4, loop: 0 });
    }
  }
}
