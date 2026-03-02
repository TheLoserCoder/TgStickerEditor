import React from 'react';
import { Dialog } from '../Dialog';
import { Button } from '../Button';
import { ConfirmDialogProps } from './types';
import { CONFIRM_DIALOG_TITLE, CONFIRM_BUTTON, CANCEL_BUTTON } from './constants';
import { ButtonVariant } from '../enums';

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  title = CONFIRM_DIALOG_TITLE,
  description,
  onConfirm,
  confirmText = CONFIRM_BUTTON,
  cancelText = CANCEL_BUTTON,
  variant = 'default'
}) => {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      footer={
        <>
          <Button variant={ButtonVariant.SOFT} onClick={() => onOpenChange(false)}>
            {cancelText}
          </Button>
          <Button
            variant={ButtonVariant.SOLID}
            color={variant === 'danger' ? 'red' : undefined}
            onClick={handleConfirm}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      {/* Пустой children, описание в description */}
    </Dialog>
  );
};
