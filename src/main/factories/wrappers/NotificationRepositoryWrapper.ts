/**
 * NotificationRepositoryWrapper - обертка для репозиториев с автоматическими уведомлениями
 */

import { IDataChangeNotifier } from '@/shared/domains/core/interfaces/IDataChangeNotifier';

const READONLY_METHODS = ['get', 'find', 'has', 'read', 'getAll'];

export class NotificationRepositoryWrapper {
  static wrap<T extends object>(
    repository: T,
    notifier: IDataChangeNotifier,
    domainKey: string
  ): T {
    return new Proxy(repository, {
      get(target: any, prop: string) {
        const original = target[prop];

        if (typeof original !== 'function') {
          return original;
        }

        return async function (...args: any[]) {
          const result = await original.apply(target, args);

          const isMutating = !READONLY_METHODS.some(prefix => prop.startsWith(prefix));

          if (isMutating && typeof target.transform === 'function') {
            const transformed = target.transform(result);
            if (transformed !== null) {
              notifier.notifyChange(`${target.domain}:${prop}`, transformed);
            }
          }

          return result;
        };
      }
    });
  }
}
