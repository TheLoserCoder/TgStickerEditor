import { IPipelineStage } from '../../pipeline/interfaces/IPipelineStage';
import { PipelineData } from '../../pipeline/core/PipelineData';
import { ITaskBalancerService } from '../../task-balancer/services/ITaskBalancerService';
import { TaskPriority } from '../../task-balancer/enums';
import { RescaledImage, ImageFragment } from '../../../../shared/domains/image-processing/types';
import { ProcessingStage, StageWeight } from '../enums';
import { appendFileSync } from 'fs';
import { join } from 'path';

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
    log(`[FragmentationStage] START: imageId=${imageId}`);

    const fragments = await this.taskBalancer.execute<RescaledImage, ImageFragment[]>({
      taskType: 'fragment',
      data: data.payload,
      priority: this.priority,
      weight: this.weight
    });

    log(`[FragmentationStage] FRAGMENTED: imageId=${imageId}, fragmentsCount=${fragments.length}`);

    const remainingStages = 3;
    const pointsPerFragment = POINTS_PER_STAGE / fragments.length;
    log(`[FragmentationStage] Points per fragment per stage: ${pointsPerFragment} (${POINTS_PER_STAGE} / ${fragments.length})`);

    for (const fragment of fragments) {
      if (signal.aborted) {
        throw new Error('Processing aborted');
      }
      
      const fragmentData = data.withPayload(fragment).withMetadata({
        fragmentPoints: pointsPerFragment
      });
      
      log(`[FragmentationStage] YIELD: fragmentId=${fragment.fragmentId}, fragmentPoints=${pointsPerFragment}`);
      yield fragmentData;
    }

    log(`[FragmentationStage] END: imageId=${imageId}`);
  }
}
