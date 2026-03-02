/**
 * Базовые интерфейсы репозиториев с унифицированными методами
 */

export interface IRepository<E> {
  create(entity: E): Promise<E>;
  update(entity: E): Promise<E>;
  delete(id: string): Promise<{ id: string }>;
  get(id: string): Promise<E | null>;
  getAll(): Promise<E[]>;
}

export interface ISingletonRepository<E> {
  update(entity: E): Promise<E>;
  get(): Promise<E | null>;
}
