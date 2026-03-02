import React from 'react';
import { Button as RadixButton } from '@radix-ui/themes';
import { ButtonProps } from './types';
import { ComponentSize, ButtonVariant } from '../enums';

export const Button: React.FC<ButtonProps> = ({
  variant = ButtonVariant.SOLID,
  size = ComponentSize.MEDIUM,
  loading = false,
  children,
  ...props
}) => {
  return (
    <RadixButton
      variant={variant}
      size={size}
      loading={loading}
      {...props}
    >
      {children}
    </RadixButton>
  );
};
