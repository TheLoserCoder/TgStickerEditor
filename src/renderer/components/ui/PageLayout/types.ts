import { ReactNode } from 'react';

export interface PageLayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
  onBack?: () => void;
}
