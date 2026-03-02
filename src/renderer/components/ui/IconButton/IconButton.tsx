import React from 'react';
import { Button, Flex } from '@radix-ui/themes';
import { IconButtonProps } from './types';
import { ComponentSize, ButtonVariant } from '../enums';
import { FlexGap } from '../radixEnums';

export const IconButton: React.FC<IconButtonProps> = ({
  variant = ButtonVariant.OUTLINE,
  size = ComponentSize.MEDIUM,
  icon,
  label,
  children,
  ...props
}) => {
  return (
    <Button
      variant={variant}
      size={size}
      {...props}
    >
      <Flex align="center" gap={FlexGap.SMALL}>
        {icon}
        {label || children}
      </Flex>
    </Button>
  );
};
