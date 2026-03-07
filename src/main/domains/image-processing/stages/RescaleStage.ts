import { WorkerStage } from '../../pipeline/stages/WorkerStage';
import { ITaskBalancerService } from '../../task-balancer/services/ITaskBalancerService';
import { TaskPriority } from '../../task-balancer/enums';
import { TrimmedImage, RescaledImage } from '../../../../shared/domains/image-processing/types';
import { ProcessingStage, StageWeight } from '../enums';
import { PipelineData } from '../../pipeline/core/PipelineData';
import { getFFmpegPath, getFFprobePath } from '../../../utils/ffmpeg-path';

export class RescaleStage extends WorkerStage<TrimmedImage, RescaledImage> {
  constructor(taskBalancer: ITaskBalancerService) {
    super(
      taskBalancer,
      ProcessingStage.RESCALE,
      StageWeight.RESCALE,
      TaskPriority.HIGH
    );
  }

  protected getTaskType(): string {
    return 'rescale';
  }

  async *process(
    data: PipelineData<TrimmedImage>,
    signal: AbortSignal
  ): AsyncGenerator<PipelineData<RescaledImage>> {
    const result = await this.taskBalancer.execute<TrimmedImage, RescaledImage>({
      taskType: this.getTaskType(),
      data: data.payload,
      priority: this.priority,
      weight: this.weight
    });

    yield data.withPayload({
      ...result,
      ffmpegPath: getFFmpegPath(),
      ffprobePath: getFFprobePath()
    });
  }
}
