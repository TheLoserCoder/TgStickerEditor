import { ReactNode, FormEvent } from 'react';

export interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  onSubmit: (e: FormEvent) => void;
  submitText?: string;
  cancelText?: string;
  canClose?: boolean;
}
