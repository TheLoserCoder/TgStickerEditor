import * as path from 'path';
import { container } from '../core/Container';
import { TaskBalancerService } from './services/TaskBalancerService';
import { ITaskBalancerService } from './services/ITaskBalancerService';
import { TASK_BALANCER_SERVICE_TOKEN } from './constants';
import { BalancerConfig } from './types';

/**
 * Регистрация TaskBalancer домена в Container
 */
const workerPath = path.resolve(__dirname, './workers/universal.worker.js');

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
