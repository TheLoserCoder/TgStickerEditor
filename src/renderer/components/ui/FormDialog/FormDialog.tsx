import React from 'react';
import { Dialog as RadixDialog, Flex } from '@radix-ui/themes';
import { Button } from '../Button';
import { FormDialogProps } from './types';
import { SUBMIT_BUTTON, CANCEL_BUTTON } from './constants';
import { ButtonVariant } from '../enums';

export const FormDialog: React.FC<FormDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSubmit,
  submitText = SUBMIT_BUTTON,
  cancelText = CANCEL_BUTTON,
  canClose = true
}) => {
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !canClose) return;
    onOpenChange(newOpen);
  };

  return (
    <RadixDialog.Root open={open} onOpenChange={handleOpenChange}>
      <RadixDialog.Content>
        <RadixDialog.Title>{title}</RadixDialog.Title>
        {description && <RadixDialog.Description>{description}</RadixDialog.Description>}
        
        <form onSubmit={onSubmit}>
          <Flex direction="column" gap="3" mt="4">
            {children}
          </Flex>

          <Flex gap="3" mt="4" justify="end">
            {canClose && (
              <Button
                type="button"
                variant={ButtonVariant.SOFT}
                onClick={() => onOpenChange(false)}
              >
                {cancelText}
              </Button>
            )}
            <Button type="submit" variant={ButtonVariant.SOLID}>
              {submitText}
            </Button>
          </Flex>
        </form>
      </RadixDialog.Content>
    </RadixDialog.Root>
  );
};
