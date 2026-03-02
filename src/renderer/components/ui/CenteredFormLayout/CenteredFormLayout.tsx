import React from 'react';
import { CenteredFormLayoutProps } from './types';
import styles from './CenteredFormLayout.module.css';

export const CenteredFormLayout: React.FC<CenteredFormLayoutProps> = ({ children }) => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
};
