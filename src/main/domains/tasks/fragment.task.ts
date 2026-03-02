import { promises as fs } from 'fs';
import { nanoid } from 'nanoid';
import { RescaledImage, ImageFragment } from '@/shared/domains/image-processing/types';
import { SharpAdapter } from '@/main/domains/media-processing/adapters/SharpAdapter';

export async function execute(input: RescaledImage): Promise<ImageFragment[]> {
  const startTime = Date.now();
  console.log(`[fragment] START: ${input.originalFileName}, grid=${input.settings.fragmentColumns}x${input.settings.fragmentRows}, isAnimated=${input.isAnimated}`);
  
  const sharpAdapter = new SharpAdapter();
  const outputDir = input.tempPath.replace(/\.[^.]+$/, '_fragments');
  await fs.mkdir(outputDir, { recursive: true });

  const columns = input.settings.fragmentColumns;
  const rows = input.settings.fragmentRows;
  
  const tileStart = Date.now();
  const fragmentPaths = await sharpAdapter.tile(input.tempPath, outputDir, columns, rows);
  console.log(`[fragment] Sharp tile (${fragmentPaths.length} fragments): ${Date.now() - tileStart}ms`);
  
  const tileWidth = Math.floor(input.width / columns);
  const tileHeight = Math.floor(input.height / rows);
  
  const results: ImageFragment[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < columns; c++) {
      const index = r * columns + c;
      if (index >= fragmentPaths.length) continue;

      const fragmentId = nanoid();
      const metadata = await sharpAdapter.getMetadata(fragmentPaths[index]);

      results.push({
        sessionId: input.sessionId,
        fragmentId,
        tempPath: fragmentPaths[index],
        format: input.format,
        width: metadata.width,
        height: metadata.height,
        isAnimated: input.isAnimated,
        row: r,
        col: c,
        originalFileName: input.originalFileName,
        packId: input.packId,
        packType: input.packType,
        groupId: input.groupId
      });
    }
  }

  console.log(`[fragment] DONE: ${Date.now() - startTime}ms total`);
  return results;
}
