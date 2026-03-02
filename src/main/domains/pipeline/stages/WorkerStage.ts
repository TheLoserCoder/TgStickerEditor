import { IPipelineStage } from '../interfaces/IPipelineStage';
import { PipelineData } from '../core/PipelineData';
import { ITaskBalancerService } from '../../task-balancer';
import { TaskPriority } from '../../task-balancer/enums';
import { PipelineError } from '../enums';
import { appendFileSync } from 'fs';
import { join } from 'path';

const LOG_PATH = join(process.cwd(), 'progress.log');

function log(message: string): void {
  const timestamp = new Date().toISOString();
  appendFileSync(LOG_PATH, `[${timestamp}] ${message}\n`);
}

/**
 * Базовый класс для стадий, выполняющихся через TaskBalancer
 */
export abstract class WorkerStage<TIn, TOut> implements IPipelineStage<TIn, TOut> {
  constructor(
    protected readonly taskBalancer: ITaskBalancerService,
    public readonly name: string,
    public readonly weight: number = 1.0,
    protected readonly priority: TaskPriority = TaskPriority.NORMAL
  ) {}

  /**
   * Обработать данные через TaskBalancer
   */
  async *process(
    data: PipelineData<TIn>,
    signal: AbortSignal
  ): AsyncGenerator<PipelineData<TOut>> {
    if (signal.aborted) {
      throw new Error(PipelineError.STAGE_ABORTED);
    }

    const itemId = this.getItemId(data.payload);
    log(`[${this.name}] START: itemId=${itemId}`);

    try {
      const result = await this.taskBalancer.execute<TIn, TOut>({
        taskType: this.getTaskType(),
        data: data.payload,
        priority: this.priority,
        weight: this.weight
      });

      const resultId = this.getItemId(result);
      log(`[${this.name}] YIELD: resultId=${resultId}`);
      yield data.withPayload(result);
      log(`[${this.name}] END: itemId=${itemId}`);
    } catch (error) {
      log(`[${this.name}] ERROR: itemId=${itemId}, error=${error}`);
      if (signal.aborted) {
        throw new Error(PipelineError.STAGE_ABORTED);
      }
      throw error;
    }
  }

  private getItemId(payload: any): string {
    if (Array.isArray(payload)) {
      return `batch[${payload.length}]`;
    }
    return payload.fragmentId || payload.sessionId || payload.groupId || 'unknown';
  }

  /**
   * Получить тип задачи для TaskBalancer
   * Должен соответствовать имени файла в src/main/domains/tasks/
   */
  protected abstract getTaskType(): string;
}
