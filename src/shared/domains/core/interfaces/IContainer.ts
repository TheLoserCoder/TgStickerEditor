/**
 * Интерфейс контейнера зависимостей
 * Управляет регистрацией и разрешением сервисов
 */

export interface IContainer {
  register(token: string, factory: () => any | Promise<any>): void;
  resolve<T>(token: string): Promise<T>;
  has(token: string): boolean;
}
