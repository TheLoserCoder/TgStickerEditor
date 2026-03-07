import { IPipelineStage } from '../../pipeline/interfaces/IPipelineStage';
import { PipelineData } from '../../pipeline/core/PipelineData';
import { ITaskBalancerService } from '../../task-balancer/services/ITaskBalancerService';
import { TaskPriority } from '../../task-balancer/enums';
import { ImageFragment, ProcessingSettings } from '../../../../shared/domains/image-processing/types';
import { ProcessingStage, StageWeight } from '../enums';

const POINTS_PER_STAGE = 10;

export class PaddingStage implements IPipelineStage<ImageFragment, ImageFragment> {
  readonly name = ProcessingStage.PADDING;
  readonly weight = StageWeight.PADDING;

  constructor(
    private readonly taskBalancer: ITaskBalancerService,
    private readonly priority: TaskPriority = TaskPriority.NORMAL
  ) {}

  async *process(
    data: PipelineData<ImageFragment>,
    signal: AbortSignal
  ): AsyncGenerator<PipelineData<ImageFragment>> {
    if (signal.aborted) {
      throw new Error('Processing aborted');
    }

    const settings = data.context.get<ProcessingSettings>('settings');
    if (!settings?.dividerMode) {
      yield data.withMetadata({ paddingPoints: POINTS_PER_STAGE });
      return;
    }

    const fragment = data.payload;
    const result = await this.taskBalancer.execute<any, ImageFragment>({
      taskType: 'padding-fragment',
      data: {
        fragmentPath: fragment.tempPath,
        cellSize: fragment.width,
        isAnimated: fragment.isAnimated,
        fragment
      },
      priority: this.priority,
      weight: 1.0
    });

    yield data.withPayload(result).withMetadata({ paddingPoints: POINTS_PER_STAGE });
  }
}
