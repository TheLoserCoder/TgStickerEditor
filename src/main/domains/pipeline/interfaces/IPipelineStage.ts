import { PipelineData } from '../core/PipelineData';

/**
 * Интерфейс стадии pipeline
 * Обрабатывает данные типа TIn и возвращает данные типа TOut
 */
export interface IPipelineStage<TIn, TOut> {
  /**
   * Имя стадии
   */
  readonly name: string;

  /**
   * Вес стадии для расчета прогресса
   */
  readonly weight: number;

  /**
   * Обработать данные
   * Возвращает AsyncGenerator для потоковой передачи результатов
   */
  process(
    data: PipelineData<TIn>,
    signal: AbortSignal
  ): AsyncGenerator<PipelineData<TOut>>;
}
