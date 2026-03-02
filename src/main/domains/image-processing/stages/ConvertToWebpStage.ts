import { WorkerStage } from '../../pipeline/stages/WorkerStage';
import { ITaskBalancerService } from '../../task-balancer/services/ITaskBalancerService';
import { TaskPriority } from '../../task-balancer/enums';
import { ImageFragment, ConvertedFragment } from '../../../../shared/domains/image-processing/types';
import { ProcessingStage, StageWeight } from '../enums';

export class ConvertToWebpStage extends WorkerStage<ImageFragment, ConvertedFragment> {
  constructor(taskBalancer: ITaskBalancerService) {
    super(
      taskBalancer,
      ProcessingStage.CONVERT_WEBP,
      StageWeight.CONVERT_WEBP,
      TaskPriority.HIGH
    );
  }

  protected getTaskType(): string {
    return 'convert-webp';
  }
}
