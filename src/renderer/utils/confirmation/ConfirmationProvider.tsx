import React, { createContext, useContext, ReactNode } from 'react';
import { ConfirmDialog } from '@/renderer/components/ui/ConfirmDialog';
import { useConfirmation } from './useConfirmation';
import { ConfirmationOptions } from './types';

interface ConfirmationContextValue {
  confirm: (options: ConfirmationOptions) => Promise<boolean>;
}

const ConfirmationContext = createContext<ConfirmationContextValue | null>(null);

export const useConfirm = () => {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error('useConfirm must be used within ConfirmationProvider');
  }
  return context.confirm;
};

interface ConfirmationProviderProps {
  children: ReactNode;
}

export const ConfirmationProvider: React.FC<ConfirmationProviderProps> = ({ children }) => {
  const { confirm, isOpen, options, handleConfirm, handleCancel } = useConfirmation();

  return (
    <ConfirmationContext.Provider value={{ confirm }}>
      {children}
      {options && (
        <ConfirmDialog
          open={isOpen}
          onOpenChange={(open) => !open && handleCancel()}
          title={options.title}
          description={options.description}
          confirmText={options.confirmText}
          cancelText={options.cancelText}
          variant={options.variant}
          onConfirm={handleConfirm}
        />
      )}
    </ConfirmationContext.Provider>
  );
};
