/**
 * Интерфейс для оборачивания сервисов (прокси-паттерн)
 * Используется для добавления cross-cutting concerns (логирование, обработка ошибок)
 */

export interface IServiceWrapper {
  wrap<T extends object>(target: T): T;
}
