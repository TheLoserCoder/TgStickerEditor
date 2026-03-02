export interface ErrorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  error: string | Error;
}
