import { useState, useEffect } from 'react';
import { useStateManager } from './useStateManager';

export const useStateValue = <T>(key: string): T | undefined => {
  const stateManager = useStateManager();
  const [value, setValue] = useState<T | undefined>(() => stateManager.getState<T>(key));

  useEffect(() => {
    const unsubscribe = stateManager.subscribe<T>(key, (newValue) => {
      setValue(newValue);
    });

    return unsubscribe;
  }, [stateManager, key]);

  return value;
};
