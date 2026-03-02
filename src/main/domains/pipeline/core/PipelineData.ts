import { TaskContext } from './TaskContext';

/**
 * Обертка над данными с контекстом
 * Передается через всю цепочку стадий
 */
export class PipelineData<T> {
  constructor(
    public readonly payload: T,
    public readonly context: TaskContext
  ) {}

  /**
   * Создать новый PipelineData с другим payload
   */
  withPayload<TNext>(payload: TNext): PipelineData<TNext> {
    return new PipelineData(payload, this.context);
  }

  /**
   * Создать новый PipelineData с обновленным контекстом
   */
  withContext(context: TaskContext): PipelineData<T> {
    return new PipelineData(this.payload, context);
  }

  /**
   * Создать новый PipelineData с дополнительными метаданными
   */
  withMetadata(metadata: Record<string, unknown>): PipelineData<T> {
    return new PipelineData(this.payload, this.context.withMetadata(metadata));
  }
}
