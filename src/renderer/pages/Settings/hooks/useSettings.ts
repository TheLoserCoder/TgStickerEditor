import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStateValue } from '@/renderer/domains/store/hooks';
import { useTheme } from '@/renderer/hooks/useTheme';
import { useBotService } from '@/renderer/hooks/useBotService';
import { useConfirm } from '@/renderer/utils/confirmation';
import { SECTIONS } from '../constants';
import { BOTS_SLICE_NAME } from '@/renderer/domains/store/slices/constants';
import { Bot } from '@/shared/domains/bot/types';

type Section = typeof SECTIONS[keyof typeof SECTIONS];

export const useSettings = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<Section>(SECTIONS.GENERAL);
  const [isAddBotDialogOpen, setIsAddBotDialogOpen] = useState(false);
  const [isEditBotDialogOpen, setIsEditBotDialogOpen] = useState(false);
  const [editingBot, setEditingBot] = useState<Bot | null>(null);
  
  const { theme, setTheme } = useTheme();
  const bots = useStateValue<Bot[]>(`${BOTS_SLICE_NAME}.bots`) || [];
  const botService = useBotService();
  const confirm = useConfirm();

  const handleBack = () => {
    navigate('/');
  };

  const handleAddBot = async (name: string, token: string, userId: string) => {
    try {
      await botService.create(name, token, userId);
      setIsAddBotDialogOpen(false);
    } catch (error) {
      console.error('Failed to add bot:', error);
    }
  };

  const handleEditBot = async (id: string, name: string, token: string, userId: string) => {
    try {
      await botService.update(id, { name, token, userId });
      setIsEditBotDialogOpen(false);
      setEditingBot(null);
    } catch (error) {
      console.error('Failed to edit bot:', error);
    }
  };

  const handleDeleteBot = async (bot: Bot) => {
    const confirmed = await confirm({
      title: 'Удалить бота?',
      description: `Вы уверены, что хотите удалить бота "${bot.name}"?`,
      confirmText: 'Удалить',
      cancelText: 'Отмена'
    });

    if (confirmed) {
      try {
        await botService.delete(bot.id);
      } catch (error) {
        console.error('Failed to delete bot:', error);
      }
    }
  };

  const openEditDialog = (bot: Bot) => {
    setEditingBot(bot);
    setIsEditBotDialogOpen(true);
  };

  return {
    activeSection,
    setActiveSection,
    theme,
    setTheme,
    bots,
    handleBack,
    isAddBotDialogOpen,
    setIsAddBotDialogOpen,
    handleAddBot,
    isEditBotDialogOpen,
    setIsEditBotDialogOpen,
    editingBot,
    handleEditBot,
    handleDeleteBot,
    openEditDialog
  };
};
