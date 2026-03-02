import { WorkerStage } from '../../pipeline/stages/WorkerStage';
import { ITaskBalancerService } from '../../task-balancer/services/ITaskBalancerService';
import { TaskPriority } from '../../task-balancer/enums';
import { ImageInput, DetectedImage } from '../../../../shared/domains/image-processing/types';
import { ProcessingStage, StageWeight } from '../enums';
import { PipelineData } from '../../pipeline/core/PipelineData';
import { appendFileSync } from 'fs';
import { join } from 'path';
import { getFFmpegPath, getFFprobePath } from '../../../utils/ffmpeg-path';

const LOG_PATH = join(process.cwd(), 'progress.log');

function log(message: string): void {
  const timestamp = new Date().toISOString();
  appendFileSync(LOG_PATH, `[${timestamp}] ${message}\n`);
}

export class DetectConvertStage extends WorkerStage<ImageInput, DetectedImage> {
  constructor(taskBalancer: ITaskBalancerService) {
    super(
      taskBalancer,
      ProcessingStage.DETECT_CONVERT,
      StageWeight.DETECT_CONVERT,
      TaskPriority.HIGH
    );
  }

  protected getTaskType(): string {
    return 'detect-convert';
  }

  async *process(
    data: PipelineData<ImageInput>,
    signal: AbortSignal
  ): AsyncGenerator<PipelineData<DetectedImage>> {
    if (signal.aborted) {
      throw new Error('Processing aborted');
    }

    log(`[DetectConvertStage] START: imageId=${data.payload.path}`);

    const result = await this.taskBalancer.execute<ImageInput, DetectedImage>({
      taskType: this.getTaskType(),
      data: { ...data.payload, ffmpegPath: getFFmpegPath(), ffprobePath: getFFprobePath() },
      priority: this.priority,
      weight: this.weight
    });

    if (signal.aborted) {
      throw new Error('Processing aborted');
    }
    
    log(`[DetectConvertStage] YIELD: sessionId=${result.sessionId}`);
    yield data.withPayload(result);
    log(`[DetectConvertStage] END: imageId=${data.payload.path}`);
  }
}
