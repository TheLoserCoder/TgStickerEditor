import { WorkerStage } from './WorkerStage';
import { ITaskBalancerService } from '../../task-balancer';
import { TaskPriority } from '../../task-balancer/enums';

/**
 * Пример стадии: вычисление факториала
 * Демонстрирует интеграцию Pipeline + TaskBalancer
 */
export class FactorialStage extends WorkerStage<
  { number: number },
  { result: number; duration: number }
> {
  constructor(taskBalancer: ITaskBalancerService) {
    super(
      taskBalancer,
      'factorial',
      0.5, // вес стадии
      TaskPriority.NORMAL
    );
  }

  protected getTaskType(): string {
    return 'factorial';
  }
}
