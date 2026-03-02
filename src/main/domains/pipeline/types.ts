/**
 * Контекст задачи, сохраняющийся через всю цепочку
 */
export interface ITaskContext {
  /**
   * Уникальный ID сессии/задачи
   */
  sessionId: string;

  /**
   * Дополнительные метаданные (расширяемо)
   */
  metadata?: Record<string, unknown>;
}

/**
 * Информация о прогрессе выполнения pipeline
 */
export interface ProgressInfo {
  /**
   * Текущая стадия
   */
  currentStage: string;

  /**
   * Баллы за завершение
   */
  points: number;
}

/**
 * Метаданные стадии
 */
export interface StageMetadata {
  /**
   * Имя стадии
   */
  name: string;

  /**
   * Вес стадии для расчета прогресса
   */
  weight: number;
}
