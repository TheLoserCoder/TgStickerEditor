import { StickerPackType } from '@/shared/domains/sticker-pack/enums';

export interface CreateStickerPackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string, type: StickerPackType) => void;
}
