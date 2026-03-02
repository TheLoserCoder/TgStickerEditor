import { WorkerStage } from '../../pipeline/stages/WorkerStage';
import { ITaskBalancerService } from '../../task-balancer/services/ITaskBalancerService';
import { TaskPriority } from '../../task-balancer/enums';
import { TrimmedImage, RescaledImage } from '../../../../shared/domains/image-processing/types';
import { ProcessingStage, StageWeight } from '../enums';

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
}
