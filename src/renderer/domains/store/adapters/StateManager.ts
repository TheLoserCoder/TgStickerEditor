/**
 * StateManager - адаптер для Redux
 * Оборачивает Redux store в интерфейс IStateManager
 */

import { Store } from 'redux';
import { IStateManager } from '@/shared/domains/store/interfaces/IStateManager';
import { ActionType } from '../enums';

export class StateManager implements IStateManager {
  constructor(private store: Store) {}

  getState<T>(key: string): T | undefined {
    const state = this.store.getState();
    return this.getNestedValue(state, key);
  }

  setState<T>(key: string, value: T): void {
    this.store.dispatch({
      type: ActionType.STATE_UPDATE,
      payload: { key, value }
    });
  }

  subscribe<T>(key: string, callback: (value: T) => void): () => void {
    let previousValue = this.getState<T>(key);

    const unsubscribe = this.store.subscribe(() => {
      const currentValue = this.getState<T>(key);
      if (currentValue !== previousValue) {
        previousValue = currentValue;
        callback(currentValue);
      }
    });

    return unsubscribe;
  }

  getAll(): Record<string, any> {
    return this.store.getState();
  }

  initialize(state: Record<string, any>): void {
    this.store.dispatch({
      type: ActionType.STATE_INITIALIZE,
      payload: state
    });
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((acc, part) => acc?.[part], obj);
  }
}
