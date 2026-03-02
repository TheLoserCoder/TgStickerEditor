import React from 'react';
import { CheckIcon, ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { TelegramUploadStatus } from '@/shared/domains/telegram/enums';
import styles from './UploadStatusBadge.module.css';

type UploadStatusBadgeProps = {
  status: TelegramUploadStatus;
};

export const UploadStatusBadge: React.FC<UploadStatusBadgeProps> = ({ status }) => {
  if (status === TelegramUploadStatus.UPLOADED) {
    return (
      <div className={styles.badge} data-status="success">
        <CheckIcon width="14" height="14" />
      </div>
    );
  }

  if (status === TelegramUploadStatus.EMPTY_PLACEHOLDER) {
    return (
      <div className={styles.badge} data-status="warning">
        <ExclamationTriangleIcon width="14" height="14" />
      </div>
    );
  }

  return null;
};
