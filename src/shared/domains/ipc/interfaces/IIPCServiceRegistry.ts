/**
 * Интерфейс реестра сервисов для IPC
 * Регистрирует сервисы в main процессе для доступа из renderer
 */

export interface IIPCServiceRegistry {
  register<T extends object>(serviceName: string, service: T): void;
  unregister(serviceName: string): void;
  get<T extends object>(serviceName: string): T | undefined;
  has(serviceName: string): boolean;
}
