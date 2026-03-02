import React, { useState, useEffect } from 'react';
import { Dialog as RadixDialog, Flex, TextField, Select, Button } from '@radix-ui/themes';
import { RocketIcon, Cross2Icon } from '@radix-ui/react-icons';
import { TelegramDialogLabel, TelegramDialogPlaceholder } from './enums';
import { transliterate } from '../../../utils/transliterate';
import { Bot } from '@/shared/domains/bot/types';

type TelegramDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { name: string; slug: string; botId: string }) => void;
  defaultName?: string;
  bots: Bot[];
  isUpdate?: boolean;
};

export const TelegramDialog: React.FC<TelegramDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  defaultName,
  bots,
  isUpdate = false
}) => {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [botId, setBotId] = useState(bots[0]?.id || '');
  const [isSlugManual, setIsSlugManual] = useState(false);

  useEffect(() => {
    if (open && defaultName) {
      setName(defaultName);
    }
  }, [open, defaultName]);

  useEffect(() => {
    if (!isSlugManual && name) {
      const hash = Math.random().toString(36).substring(2, 8);
      const translitName = transliterate(name);
      setSlug(`${translitName}_${hash}`);
    }
  }, [name, isSlugManual]);

  const handleSubmit = () => {
    if (!name.trim() || !slug.trim() || !botId) return;
    onSubmit({ name: name.trim(), slug: slug.trim(), botId });
    setName('');
    setSlug('');
    setIsSlugManual(false);
  };

  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Content aria-describedby={undefined}>
        <Flex justify="between" align="center">
          <RadixDialog.Title>
            <Flex gap="2" align="center">
              <RocketIcon width="20" height="20" />
              {TelegramDialogLabel.TITLE}
            </Flex>
          </RadixDialog.Title>
          <RadixDialog.Close>
            <Button variant="ghost" size="1">
              <Cross2Icon width="18" height="18" />
            </Button>
          </RadixDialog.Close>
        </Flex>

        <Flex direction="column" gap="3" mt="4">
          <label>
            <Flex direction="column" gap="1">
              <span>{TelegramDialogLabel.PACK_NAME}</span>
              <TextField.Root
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={TelegramDialogPlaceholder.PACK_NAME}
              />
            </Flex>
          </label>

          <label>
            <Flex direction="column" gap="1">
              <span>{TelegramDialogLabel.PACK_SLUG}</span>
              <TextField.Root
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setIsSlugManual(true);
                }}
                placeholder={TelegramDialogPlaceholder.PACK_SLUG}
              />
            </Flex>
          </label>

          <label>
            <Flex direction="column" gap="1">
              <span>{TelegramDialogLabel.BOT}</span>
              <Select.Root value={botId} onValueChange={setBotId}>
                <Select.Trigger />
                <Select.Content>
                  {bots.map(bot => (
                    <Select.Item key={bot.id} value={bot.id}>
                      {bot.name}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </Flex>
          </label>
        </Flex>

        <Flex gap="3" mt="4" justify="end">
          <RadixDialog.Close>
            <Button variant="soft">
              {TelegramDialogLabel.CANCEL}
            </Button>
          </RadixDialog.Close>
          <Button onClick={handleSubmit}>
            <RocketIcon width="18" height="18" />
            {isUpdate ? TelegramDialogLabel.UPDATE : TelegramDialogLabel.UPLOAD}
          </Button>
        </Flex>
      </RadixDialog.Content>
    </RadixDialog.Root>
  );
};
