import { StickerPackType } from '@/shared/domains/sticker-pack/enums';
import { Fragment } from '@/shared/domains/sticker-pack/types';

export interface StickerPackCardProps {
  id: string;
  name: string;
  type: StickerPackType;
  fragmentsCount: number;
  fragments: Fragment[];
  onClick?: () => void;
  onDelete?: () => void;
  onOpenFolder?: () => void;
}
