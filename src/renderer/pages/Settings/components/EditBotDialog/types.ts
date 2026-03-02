import { Bot } from '@/shared/domains/bot/types';

export interface EditBotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (id: string, name: string, token: string, userId: string) => void;
  bot: Bot | null;
}
