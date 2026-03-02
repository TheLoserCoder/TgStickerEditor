import React from 'react';
import { TrashIcon } from '@radix-ui/react-icons';
import { Button } from '../Button';
import { ButtonVariant } from '../enums';
import { DeleteButtonProps } from './types';

export const DeleteButton: React.FC<DeleteButtonProps> = ({ onClick, children }) => {
  return (
    <Button variant={ButtonVariant.GHOST} onClick={onClick} color="red">
      {children || <TrashIcon />}
    </Button>
  );
};
