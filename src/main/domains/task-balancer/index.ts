import * as path from 'path';
import { container } from '../core/Container';
import { TaskBalancerService } from './services/TaskBalancerService';
import { ITaskBalancerService } from './services/ITaskBalancerService';
import { TASK_BALANCER_SERVICE_TOKEN } from './constants';
import { BalancerConfig } from './types';
import { getDistMainPath } from '@/main/config/paths';

/**
 * Получить путь к worker файлу с учётом packaged режима
 */
function getWorkerPath(): string {
  return path.join(getDistMainPath(), 'workers', 'universal.worker.js');
}

/**
 * Регистрация TaskBalancer домена в Container
 */
const workerPath = getWorkerPath();

const config: BalancerConfig = {
  workerPath
};

container.register<ITaskBalancerService>(
  TASK_BALANCER_SERVICE_TOKEN,
  () => new TaskBalancerService(config)
);

export { ITaskBalancerService } from './services/ITaskBalancerService';
export { TaskBalancerService } from './services/TaskBalancerService';
export { TASK_BALANCER_SERVICE_TOKEN } from './constants';
export * from './types';
export * from './enums';
