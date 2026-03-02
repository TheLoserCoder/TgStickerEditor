/**
 * Container - контейнер зависимостей для main процесса
 * Управляет регистрацией и разрешением сервисов
 * Поддерживает async фабрики и защиту от циклических зависимостей
 */

import { IContainer } from '@/shared/domains/core';
import { ContainerError } from '@/shared/domains/core';

export class Container implements IContainer {
  private static instance: Container;
  private services = new Map<string, any>();
  private factories = new Map<string, () => any | Promise<any>>();
  private creating = new Map<string, Promise<any>>();

  private constructor() {}

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  register(token: string, factory: () => any | Promise<any>): void {
    this.factories.set(token, factory);
  }

  async resolve<T>(token: string): Promise<T> {
    // Если уже создан - возвращаем
    if (this.services.has(token)) {
      return this.services.get(token);
    }

    // Если уже создаётся - ждём завершения
    if (this.creating.has(token)) {
      return this.creating.get(token)!;
    }

    const factory = this.factories.get(token);
    if (!factory) {
      throw new Error(`${ContainerError.SERVICE_NOT_REGISTERED}: ${token}`);
    }

    // Создаём промис и сохраняем его
    const creationPromise = (async () => {
      try {
        const instance = await factory();
        this.services.set(token, instance);
        this.creating.delete(token);
        return instance;
      } catch (error) {
        this.creating.delete(token);
        console.error(`[Container] Failed to create service "${token}":`, error);
        throw new Error(`${ContainerError.SERVICE_CREATION_FAILED}: ${token}`, { cause: error });
      }
    })();

    this.creating.set(token, creationPromise);
    return creationPromise;
  }

  has(token: string): boolean {
    return this.factories.has(token) || this.services.has(token);
  }

  async initializeAll(): Promise<void> {
    const tokens = Array.from(this.factories.keys());
    await Promise.allSettled(tokens.map(token => this.resolve(token)));
  }
}

export const container = Container.getInstance();
