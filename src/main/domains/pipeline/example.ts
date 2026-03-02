/**
 * Пример использования Pipeline
 */

import { container } from '../core/Container';
import { PipelineOrchestrator } from './core/PipelineOrchestrator';
import { ITaskBalancerService, TASK_BALANCER_SERVICE_TOKEN } from '../task-balancer';
import { FactorialStage } from './stages/FactorialStage';

/**
 * Пример 1: Простой pipeline с одной стадией
 */
async function example1() {
  const balancer = container.resolve<ITaskBalancerService>(TASK_BALANCER_SERVICE_TOKEN);
  const abortController = new AbortController();

  // Создание pipeline с типобезопасностью
  const pipeline = PipelineOrchestrator
    .create<{ number: number }>()
    .addStage(new FactorialStage(balancer))
    .onProgress((info) => {
      console.log(`Progress: ${info.progress.toFixed(2)}% - Stage: ${info.currentStage}`);
    });

  // Выполнение
  const results = await pipeline.execute(
    { number: 10 },
    'session-123',
    abortController.signal
  );

  console.log('Results:', results);
}

/**
 * Пример 2: Pipeline с несколькими стадиями (типобезопасность)
 */
async function example2() {
  const balancer = container.resolve<ITaskBalancerService>(TASK_BALANCER_SERVICE_TOKEN);
  const abortController = new AbortController();

  // Типобезопасная цепочка:
  // { number: number } → { result: number, duration: number } → ...
  const pipeline = PipelineOrchestrator
    .create<{ number: number }>()
    .addStage(new FactorialStage(balancer))
    // .addStage(nextStage) // TIn должен быть { result: number, duration: number }
    .onProgress((info) => {
      console.log(`${info.currentStage}: ${info.progress.toFixed(2)}%`);
    });

  const results = await pipeline.execute(
    { number: 5 },
    'session-456',
    abortController.signal
  );

  console.log('Results:', results);
}

/**
 * Пример 3: Отмена pipeline
 */
async function example3() {
  const balancer = container.resolve<ITaskBalancerService>(TASK_BALANCER_SERVICE_TOKEN);
  const abortController = new AbortController();

  const pipeline = PipelineOrchestrator
    .create<{ number: number }>()
    .addStage(new FactorialStage(balancer));

  // Отмена через 100ms
  setTimeout(() => abortController.abort(), 100);

  try {
    await pipeline.execute(
      { number: 1000 },
      'session-789',
      abortController.signal
    );
  } catch (error) {
    console.error('Pipeline aborted:', error);
  }
}
