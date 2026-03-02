import { ComponentProps, ReactNode } from 'react';
import { Button } from '@radix-ui/themes';

export interface IconButtonProps extends ComponentProps<typeof Button> {
  icon?: ReactNode;
  label?: string;
}
