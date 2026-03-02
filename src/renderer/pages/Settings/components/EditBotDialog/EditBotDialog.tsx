import React, { useState, FormEvent, useEffect } from 'react';
import { TextField } from '@radix-ui/themes';
import { FormDialog } from '@/renderer/components/ui';
import { EditBotDialogProps } from './types';
import { DIALOG_TITLE, DIALOG_DESCRIPTION, FIELD_LABELS, FIELD_PLACEHOLDERS, SUBMIT_TEXT, CANCEL_TEXT } from './constants';

export const EditBotDialog: React.FC<EditBotDialogProps> = ({ open, onOpenChange, onSubmit, bot }) => {
  const [name, setName] = useState('');
  const [token, setToken] = useState('');
  const [userId, setUserId] = useState('');

  useEffect(() => {
    if (bot) {
      setName(bot.name);
      setToken(bot.token);
      setUserId(bot.userId);
    }
  }, [bot]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (bot && name.trim() && token.trim() && userId.trim()) {
      onSubmit(bot.id, name.trim(), token.trim(), userId.trim());
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

      <TextField.Root
        placeholder={FIELD_PLACEHOLDERS.TOKEN}
        value={token}
        onChange={(e) => setToken(e.target.value)}
        required
      >
        <TextField.Slot>{FIELD_LABELS.TOKEN}</TextField.Slot>
      </TextField.Root>

      <TextField.Root
        placeholder={FIELD_PLACEHOLDERS.USER_ID}
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
        required
      >
        <TextField.Slot>{FIELD_LABELS.USER_ID}</TextField.Slot>
      </TextField.Root>
    </FormDialog>
  );
};
