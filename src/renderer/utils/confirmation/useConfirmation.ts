import { useState, useCallback } from 'react';
import { ConfirmationOptions, ConfirmationState } from './types';

export const useConfirmation = () => {
  const [state, setState] = useState<ConfirmationState>({
    isOpen: false,
    options: null,
    resolve: null
  });

  const confirm = useCallback((options: ConfirmationOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        isOpen: true,
        options,
        resolve
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (state.resolve) {
      state.resolve(true);
    }
    setState({ isOpen: false, options: null, resolve: null });
  }, [state.resolve]);

  const handleCancel = useCallback(() => {
    if (state.resolve) {
      state.resolve(false);
    }
    setState({ isOpen: false, options: null, resolve: null });
  }, [state.resolve]);

  return {
    confirm,
    isOpen: state.isOpen,
    options: state.options,
    handleConfirm,
    handleCancel
  };
};
