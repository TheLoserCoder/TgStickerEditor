import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Flex, Button, Text, Heading, Progress } from '@radix-ui/themes';
import { ImageIcon, RocketIcon, Link2Icon, ResetIcon } from '@radix-ui/react-icons';
import { PageLayout, TelegramDialog } from '@/renderer/components/ui';
import { FlexDirection } from '@/renderer/components/ui/radixEnums';
import { useBotService } from '@/renderer/hooks/useBotService';
import { Bot } from '@/shared/domains/bot/types';
import { PACK_VIEW_LABELS, PACK_VIEW_ROUTES, PACK_VIEW_UI, UploadStage } from './constants';
import { GridView } from './components/GridView';
import { usePackGrid } from './hooks/usePackGrid';
import { usePackData } from './hooks/usePackData';
import { useUploadProgress } from './hooks/useUploadProgress';
import { useTelegramUpload } from './hooks/useTelegramUpload';
import styles from './PackView.module.css';

export const PackView: React.FC = () => {
  const { packId } = useParams<{ packId: string }>();
  const navigate = useNavigate();
  const botService = useBotService();
  
  const { pack, loadPack, refreshPack } = usePackData(packId);
  const { uploadProgress, deleteProgress, uploadStage, setUploadStage, resetProgress } = useUploadProgress();
  
  const [bots, setBots] = useState<Bot[]>([]);
  const [telegramDialogOpen, setTelegramDialogOpen] = useState(false);
  const [clearSelectionCallback, setClearSelectionCallback] = useState<(() => void) | null>(null);
  
  const { uploading, handleUpdate, handleUpload } = useTelegramUpload({
    pack,
    packId,
    bots,
    onSuccess: refreshPack,
    setUploadStage,
    resetProgress,
  });
  
  const handleClearSelectionReady = useCallback((callback: () => void) => {
    setClearSelectionCallback(() => callback);
  }, []);
  const { 
    grid, 
    fragmentPaths, 
    loading, 
    handleMoveGroup,
    handleMoveSingleFragment,
    handleSwapFragments,
    handleCreateGroup,
    handleRemoveFromGroup,
    handleDeleteFragments,
    handleDeleteGroup,
    handleDeleteGroupWithFragments,
    handleDeleteGroupKeepFragments,
    handleNormalizeGrid
  } = usePackGrid(packId || '');

  useEffect(() => {
    const loadBots = async () => {
      const allBots = await botService.getAll();
      setBots(allBots);
    };
    loadBots();
  }, [botService]);

  useEffect(() => {
    if (!packId) {
      navigate(PACK_VIEW_ROUTES.STICKER_PACKS);
      return;
    }

    loadPack().then(foundPack => {
      if (!foundPack) {
        navigate(PACK_VIEW_ROUTES.STICKER_PACKS);
      }
    });
  }, [packId, navigate, loadPack]);

  const handleAddImages = () => {
    navigate(`${PACK_VIEW_ROUTES.EDIT_PACK}/${packId}`);
  };

  const handleTelegramUpload = () => {
    if (pack?.telegramPack) {
      if (bots.length === 0) {
        return;
      }
      handleUpdate();
    } else {
      setTelegramDialogOpen(true);
    }
  };

  const handleTelegramSubmit = async (data: { name: string; slug: string; botId: string }) => {
    setTelegramDialogOpen(false);
    await handleUpload(data);
  };

  const handleCopyLink = async () => {
    if (pack?.telegramPack?.url) {
      await navigator.clipboard.writeText(pack.telegramPack.url);
    }
  };

  const sidebar = (
    <Flex direction={FlexDirection.COLUMN} gap={PACK_VIEW_UI.FLEX_GAP_MEDIUM}>
      <Button size={PACK_VIEW_UI.BUTTON_SIZE} onClick={handleAddImages}>
        <ImageIcon />
        {PACK_VIEW_LABELS.ADD_IMAGES}
      </Button>
      {pack && pack.fragments.length > 0 && grid && (
        <Button size={PACK_VIEW_UI.BUTTON_SIZE} onClick={handleNormalizeGrid}>
          <ResetIcon />
          {PACK_VIEW_LABELS.NORMALIZE_GRID}
        </Button>
      )}
      {pack && pack.fragments.length > 0 && grid && (
        <>
          <Button 
            size={PACK_VIEW_UI.BUTTON_SIZE} 
            onClick={handleTelegramUpload} 
            disabled={uploading || (pack.telegramPack && bots.length === 0)}
          >
            <RocketIcon />
            {uploading ? PACK_VIEW_LABELS.UPLOADING : (pack.telegramPack ? PACK_VIEW_LABELS.UPDATE_TELEGRAM : PACK_VIEW_LABELS.UPLOAD_TO_TELEGRAM)}
          </Button>
          {uploading && (uploadStage === UploadStage.UPLOADING ? uploadProgress.total > 0 : deleteProgress.total > 0) && (
            <Flex direction={FlexDirection.COLUMN} gap={PACK_VIEW_UI.FLEX_GAP_SMALL}>
              {uploadStage === UploadStage.DELETING && (
                <>
                  <Text size={PACK_VIEW_UI.TEXT_SIZE_SMALL}>{PACK_VIEW_LABELS.DELETING}: {deleteProgress.current} / {deleteProgress.total}</Text>
                  <Progress value={deleteProgress.current} max={deleteProgress.total} />
                </>
              )}
              {uploadStage === UploadStage.UPLOADING && (
                <>
                  <Text size={PACK_VIEW_UI.TEXT_SIZE_SMALL}>{PACK_VIEW_LABELS.UPLOADING_PROGRESS}: {uploadProgress.current} / {uploadProgress.total}</Text>
                  <Progress value={uploadProgress.current} max={uploadProgress.total} />
                </>
              )}
            </Flex>
          )}
          {pack.telegramPack?.url && !uploading && (
            <Button size={PACK_VIEW_UI.BUTTON_SIZE} variant={PACK_VIEW_UI.BUTTON_VARIANT_SOFT} onClick={handleCopyLink}>
              <Link2Icon />
              {PACK_VIEW_LABELS.COPY_LINK}
            </Button>
          )}
        </>
      )}
    </Flex>
  );

  if (!pack) return null;

  return (
    <PageLayout sidebar={sidebar} onBack={() => navigate(PACK_VIEW_ROUTES.STICKER_PACKS)}>
      <Flex direction={FlexDirection.COLUMN} className={styles.container}>
        <Heading size={PACK_VIEW_UI.HEADING_SIZE}>{pack.name}</Heading>
        
        {pack.fragments.length === 0 ? (
          <div className={styles.emptyState}>
            <Text size={PACK_VIEW_UI.TEXT_SIZE_MEDIUM} color={PACK_VIEW_UI.TEXT_COLOR_GRAY}>{PACK_VIEW_LABELS.EMPTY_STATE}</Text>
          </div>
        ) : loading ? (
          <div className={styles.emptyState}>
            <Text size={PACK_VIEW_UI.TEXT_SIZE_MEDIUM} color={PACK_VIEW_UI.TEXT_COLOR_GRAY}>{PACK_VIEW_LABELS.LOADING}</Text>
          </div>
        ) : grid ? (
          <GridView
            layout={grid}
            fragmentPaths={fragmentPaths}
            onMoveGroup={(groupId, targetRow, targetCol) => handleMoveGroup(groupId, targetRow, targetCol, clearSelectionCallback || undefined)}
            onMoveSingleFragment={(fragmentId, targetRow, targetCol) => handleMoveSingleFragment(fragmentId, targetRow, targetCol, clearSelectionCallback || undefined)}
            onSwapFragments={(fragmentId1, fragmentId2) => handleSwapFragments(fragmentId1, fragmentId2, clearSelectionCallback || undefined)}
            onCreateGroup={(cellIds) => handleCreateGroup(cellIds, clearSelectionCallback || undefined)}
            onRemoveFromGroup={(cellIds) => handleRemoveFromGroup(cellIds, clearSelectionCallback || undefined)}
            onDeleteFragments={(fragmentIds) => handleDeleteFragments(fragmentIds, clearSelectionCallback || undefined)}
            onDeleteGroup={(groupId) => handleDeleteGroup(groupId, clearSelectionCallback || undefined)}
            onDeleteGroupWithFragments={(groupId) => handleDeleteGroupWithFragments(groupId, clearSelectionCallback || undefined)}
            onDeleteGroupKeepFragments={(groupId) => handleDeleteGroupKeepFragments(groupId, clearSelectionCallback || undefined)}
            onClearSelectionReady={handleClearSelectionReady}
          />
        ) : null}
      </Flex>

      <TelegramDialog
        open={telegramDialogOpen}
        onOpenChange={setTelegramDialogOpen}
        onSubmit={handleTelegramSubmit}
        defaultName={pack?.name}
        bots={bots}
        isUpdate={!!pack?.telegramPack}
      />
    </PageLayout>
  );
};
