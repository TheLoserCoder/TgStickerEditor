/**
 * Количество потоков, резервируемых для системы и UI
 */
export const RESERVED_THREADS = 1;

/**
 * Таймаут простоя воркера перед завершением (мс)
 */
export const IDLE_TIMEOUT = 30000;

/**
 * Минимальный вес задачи
 */
export const MIN_WEIGHT = 0.1;

/**
 * Максимальный вес задачи
 */
export const MAX_WEIGHT = 1.0;

/**
 * Токен для регистрации TaskBalancerService в Container
 */
export const TASK_BALANCER_SERVICE_TOKEN = Symbol('TASK_BALANCER_SERVICE');
