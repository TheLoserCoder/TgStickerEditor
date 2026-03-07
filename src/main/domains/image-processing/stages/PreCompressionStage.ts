import { WorkerStage } from '../../pipeline/stages/WorkerStage';
import { ITaskBalancerService } from '../../task-balancer/services/ITaskBalancerService';
import { TaskPriority } from '../../task-balancer/enums';
import { RescaledImage } from '../../../../shared/domains/image-processing/types';
import { ProcessingStage, StageWeight } from '../enums';

export class PreCompressionStage extends WorkerStage<RescaledImage, RescaledImage> {
  constructor(taskBalancer: ITaskBalancerService) {
    super(
      taskBalancer,
      ProcessingStage.PRECOMPRESS,
      StageWeight.PRECOMPRESS,
      TaskPriority.HIGH
    );
  }

  protected getTaskType(): string {
    return 'precompress';
  }
}
