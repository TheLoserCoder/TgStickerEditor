import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useConfirm } from '@/renderer/utils/confirmation';
import { StickerPackType } from '@/shared/domains/sticker-pack/enums';
import { useStickerPackFacade } from '@/renderer/hooks/useStickerPackFacade';
import { StickerPackManifest } from '@/shared/domains/sticker-pack/types';
import { DELETE_CONFIRMATION_TITLE, DELETE_CONFIRMATION_DESCRIPTION, DELETE_CONFIRM_TEXT, DELETE_CANCEL_TEXT } from '../constants';

interface PackCardData {
  id: string;
  name: string;
  type: StickerPackType;
  fragmentsCount: number;
  fragments: StickerPackManifest['fragments'];
}

export const useStickerPacks = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [packs, setPacks] = useState<PackCardData[]>([]);
  const confirm = useConfirm();
  const facade = useStickerPackFacade();

  const loadPacks = async () => {
    const manifests = await facade.getAllPacks();
    const packsData = manifests.map((manifest: StickerPackManifest) => ({
      id: manifest.id,
      name: manifest.name,
      type: manifest.type,
      fragmentsCount: manifest.fragments.length,
      fragments: manifest.fragments.slice(0, 4),
    }));
    setPacks(packsData);
  };

  useEffect(() => {
    loadPacks();
  }, []);

  useEffect(() => {
    if (location.state?.action === 'create') {
      setIsCreateDialogOpen(true);
    }
  }, [location]);

  const handleBack = () => {
    navigate('/');
  };

  const handleCreatePack = async (name: string, type: StickerPackType) => {
    const pack = await facade.createPack(name, type);
    setIsCreateDialogOpen(false);
    navigate(`/pack/${pack.id}`);
  };

  const handlePackClick = (id: string) => {
    navigate(`/pack/${id}`);
  };

  const handleDeletePack = async (id: string, name: string) => {
    const confirmed = await confirm({
      title: DELETE_CONFIRMATION_TITLE,
      description: DELETE_CONFIRMATION_DESCRIPTION(name),
      confirmText: DELETE_CONFIRM_TEXT,
      cancelText: DELETE_CANCEL_TEXT
    });

    if (confirmed) {
      await facade.deletePack(id);
      await loadPacks();
    }
  };

  const handleOpenFolder = async (id: string) => {
    await facade.openPackFolder(id);
  };

  return {
    packs,
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    handleBack,
    handleCreatePack,
    handlePackClick,
    handleDeletePack,
    handleOpenFolder,
  };
};
