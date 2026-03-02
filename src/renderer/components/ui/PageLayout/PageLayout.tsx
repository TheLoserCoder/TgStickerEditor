import React from 'react';
import { ArrowLeftIcon } from '@radix-ui/react-icons';
import { IconButton } from '../IconButton';
import { PageLayoutProps } from './types';
import { BACK_BUTTON_LABEL } from './constants';
import { ButtonVariant } from '../enums';
import styles from './PageLayout.module.css';

export const PageLayout: React.FC<PageLayoutProps> = ({ children, sidebar, onBack }) => {
  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <IconButton
          icon={<ArrowLeftIcon />}
          label={BACK_BUTTON_LABEL}
          onClick={onBack}
          variant={ButtonVariant.GHOST}
          className={styles.backButton}
        />
        {sidebar}
      </div>
      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
};
