import { IPipelineStage } from '../../pipeline/interfaces/IPipelineStage';
import { PipelineData } from '../../pipeline/core/PipelineData';
import { ITaskBalancerService } from '../../task-balancer/services/ITaskBalancerService';
import { TaskPriority } from '../../task-balancer/enums';
import { RescaledImage, ImageFragment } from '../../../../shared/domains/image-processing/types';
import { ProcessingStage, StageWeight } from '../enums';
import { appendFileSync } from 'fs';
import { promises as fs } from 'fs';
import { join } from 'path';
import { getFFmpegPath, getFFprobePath } from '../../../utils/ffmpeg-path';

const POINTS_PER_STAGE = 10;
const LOG_PATH = join(process.cwd(), 'progress.log');

function log(message: string): void {
  const timestamp = new Date().toISOString();
  appendFileSync(LOG_PATH, `[${timestamp}] ${message}\n`);
}

export class FragmentationStage implements IPipelineStage<RescaledImage, ImageFragment> {
  readonly name = ProcessingStage.FRAGMENT;
  readonly weight = StageWeight.FRAGMENT;

  constructor(
    private readonly taskBalancer: ITaskBalancerService,
    private readonly priority: TaskPriority = TaskPriority.NORMAL
  ) {}

  async *process(
    data: PipelineData<RescaledImage>,
    signal: AbortSignal
  ): AsyncGenerator<PipelineData<ImageFragment>> {
    if (signal.aborted) {
      throw new Error('Processing aborted');
    }

    const imageId = data.payload.sessionId;
    const { fragmentColumns, fragmentRows } = data.payload.settings;
    const totalFragments = fragmentColumns * fragmentRows;
    
    log(`[FragmentationStage] START: imageId=${imageId}, grid=${fragmentColumns}x${fragmentRows}`);

    try {
      const outputDir = data.payload.tempPath.replace(/\.[^.]+$/, '_fragments');
      await fs.mkdir(outputDir, { recursive: true });
      
      const pointsPerFragment = POINTS_PER_STAGE / totalFragments;
      log(`[FragmentationStage] Points per fragment: ${pointsPerFragment}`);
      
      // Запускаем нарезку ВСЕХ тайлов параллельно
      const promises: Promise<ImageFragment>[] = [];
      for (let row = 0; row < fragmentRows; row++) {
        for (let col = 0; col < fragmentColumns; col++) {
          const promise = this.taskBalancer.execute<any, ImageFragment>({
            taskType: 'fragment-single',
            data: {
              imagePath: data.payload.tempPath,
              outputDir,
              row,
              col,
              cellSize: data.payload.cellSize,
              isAnimated: data.payload.isAnimated,
              sessionId: data.payload.sessionId,
              format: data.payload.format,
              frameTimings: data.payload.frameTimings,
              originalFileName: data.payload.originalFileName,
              packId: data.payload.packId,
              packType: data.payload.packType,
              groupId: data.payload.groupId
            },
            priority: this.priority,
            weight: 1.0 / totalFragments
          });
          promises.push(promise);
        }
      }
      
      log(`[FragmentationStage] Launched ${promises.length} parallel tasks`);
      
      // Yield по мере завершения
      let completedCount = 0;
      
      for (const promise of promises) {
        if (signal.aborted) {
          throw new Error('Processing aborted');
        }
        
        const fragment = await promise;
        completedCount++;
        
        log(`[FragmentationStage] Fragment ready (${completedCount}/${totalFragments}): tile=[${fragment.row},${fragment.col}]`);
        
        const fragmentWithPaths = {
          ...fragment,
          ffmpegPath: getFFmpegPath(),
          ffprobePath: getFFprobePath()
        };
        
        const fragmentData = data.withPayload(fragmentWithPaths).withMetadata({
          fragmentPoints: pointsPerFragment
        });
        
        yield fragmentData;
      }

      log(`[FragmentationStage] END: imageId=${imageId}`);
    } catch (error) {
      log(`[FragmentationStage] ERROR: imageId=${imageId}, error=${error instanceof Error ? error.message : String(error)}`);
      log(`[FragmentationStage] Stack: ${error instanceof Error ? error.stack : 'N/A'}`);
      throw error;
    }
  }
}
