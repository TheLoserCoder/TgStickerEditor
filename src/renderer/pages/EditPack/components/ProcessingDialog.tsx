import React from 'react';
import { Dialog, Flex, Text, Progress } from '@radix-ui/themes';
import { FlexDirection } from '@/renderer/components/ui/radixEnums';
import styles from './ProcessingDialog.module.css';

interface ProcessingDialogProps {
  open: boolean;
  progress: number;
  currentStage?: string;
}

export const ProcessingDialog: React.FC<ProcessingDialogProps> = ({
  open,
  progress,
}) => {
  return (
    <Dialog.Root open={open}>
      <Dialog.Content style={{ maxWidth: 450 }}>
        <Dialog.Title>Обработка</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          <Text size="2" color="gray">
            Пожалуйста, подождите...
          </Text>
        </Dialog.Description>
        
        <Flex direction={FlexDirection.COLUMN} gap="4" className={styles.content}>
          <Progress value={progress} />
          
          <Text size="2" align="center" weight="bold">
            {Math.round(progress)}%
          </Text>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
};
