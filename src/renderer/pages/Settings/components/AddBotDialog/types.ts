export interface AddBotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string, token: string, userId: string) => void;
  canClose?: boolean;
}
