import { WorkerStage } from '../../pipeline/stages/WorkerStage';
import { ITaskBalancerService } from '../../task-balancer/services/ITaskBalancerService';
import { TaskPriority } from '../../task-balancer/enums';
import { DetectedImage, TrimmedImage } from '../../../../shared/domains/image-processing/types';
import { ProcessingStage, StageWeight } from '../enums';

export class TrimStage extends WorkerStage<DetectedImage, TrimmedImage> {
  constructor(taskBalancer: ITaskBalancerService) {
    super(
      taskBalancer,
      ProcessingStage.TRIM,
      StageWeight.TRIM,
      TaskPriority.NORMAL
    );
  }

  protected getTaskType(): string {
    return 'trim';
  }
}
