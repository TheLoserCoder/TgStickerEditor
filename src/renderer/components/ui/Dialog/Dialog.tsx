import React from 'react';
import { Dialog as RadixDialog, Flex } from '@radix-ui/themes';
import { DialogProps } from './types';

export const Dialog: React.FC<DialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer
}) => {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Content>
        <RadixDialog.Title>{title}</RadixDialog.Title>
        {description && <RadixDialog.Description>{description}</RadixDialog.Description>}
        
        <Flex direction="column" gap="3" mt="4">
          {children}
        </Flex>

        {footer && (
          <Flex gap="3" mt="4" justify="end">
            {footer}
          </Flex>
        )}
      </RadixDialog.Content>
    </RadixDialog.Root>
  );
};
