import React from 'react';
import { Text } from '@radix-ui/themes';
import { Dialog } from '../Dialog';
import { Button } from '../Button';
import { ErrorDialogProps } from './types';
import { ERROR_DIALOG_TITLE, ERROR_DIALOG_CLOSE_BUTTON } from './constants';
import { ButtonVariant } from '../enums';

export const ErrorDialog: React.FC<ErrorDialogProps> = ({ open, onOpenChange, error }) => {
  const errorMessage = error instanceof Error ? error.message : error;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={ERROR_DIALOG_TITLE}
      footer={
        <Button variant={ButtonVariant.SOLID} onClick={() => onOpenChange(false)}>
          {ERROR_DIALOG_CLOSE_BUTTON}
        </Button>
      }
    >
      <Text color="red">{errorMessage}</Text>
    </Dialog>
  );
};
