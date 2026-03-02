import React, { useState, FormEvent } from 'react';
import { TextField, Select, Flex } from '@radix-ui/themes';
import { FormDialog } from '@/renderer/components/ui';
import { StickerPackType } from '@/shared/domains/sticker-pack/enums';
import { FlexDirection } from '@/renderer/components/ui/radixEnums';
import { CreateStickerPackDialogProps } from './types';
import { DIALOG_TITLE, DIALOG_DESCRIPTION, FIELD_LABELS, FIELD_PLACEHOLDERS, TYPE_LABELS, SUBMIT_TEXT, CANCEL_TEXT } from './constants';

export const CreateStickerPackDialog: React.FC<CreateStickerPackDialogProps> = ({ open, onOpenChange, onSubmit }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<StickerPackType>(StickerPackType.STICKER);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim(), type);
      setName('');
      setType(StickerPackType.STICKER);
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={DIALOG_TITLE}
      description={DIALOG_DESCRIPTION}
      onSubmit={handleSubmit}
      submitText={SUBMIT_TEXT}
      cancelText={CANCEL_TEXT}
    >
      <TextField.Root
        placeholder={FIELD_PLACEHOLDERS.NAME}
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      >
        <TextField.Slot>{FIELD_LABELS.NAME}</TextField.Slot>
      </TextField.Root>

      <Flex direction={FlexDirection.COLUMN} gap="2">
        <label>{FIELD_LABELS.TYPE}</label>
        <Select.Root value={type} onValueChange={(value) => setType(value as StickerPackType)}>
          <Select.Trigger />
          <Select.Content>
            <Select.Item value={StickerPackType.STICKER}>{TYPE_LABELS.STICKER}</Select.Item>
            <Select.Item value={StickerPackType.EMOJI}>{TYPE_LABELS.EMOJI}</Select.Item>
          </Select.Content>
        </Select.Root>
      </Flex>
    </FormDialog>
  );
};
