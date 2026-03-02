import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Flex, Box, Text } from '@radix-ui/themes';
import { PageLayout } from '@/renderer/components/ui';
import { FlexDirection } from '@/renderer/components/ui/radixEnums';
import { useImageEditorSettings } from './useImageEditorSettings';
import { useImageThumbnails } from './hooks/useImageThumbnails';
import { useFileUpload } from './hooks/useFileUpload';
import { useZoomWheel } from './hooks/useZoomWheel';
import { useImageSaver } from './hooks/useImageSaver';
import { useStickerPackFacade } from '@/renderer/hooks/useStickerPackFacade';
import { useEditorPresetService } from '@/renderer/hooks/useEditorPresetService';
import { EditorPreset } from '@/shared/domains/editor-preset/types';
import { Canvas } from './components/Canvas';
import { ImageGallery } from './components/ImageGallery';
import { Sidebar } from './components/Sidebar';
import { ProcessingDialog } from './components/ProcessingDialog';
import { ImportFromNetworkDialog } from './components/ImportFromNetworkDialog';
import { EDIT_PACK_LABELS, EDIT_PACK_ROUTES } from './constants';
import { StickerPackType } from '@/shared/domains/sticker-pack/enums';
import { RescaleQuality as SharedRescaleQuality } from '@/shared/domains/image-processing/enums';
import { RescaleQuality } from '@/renderer/config/imageEditor.config';
import styles from './EditPack.module.css';

export const EditPack: React.FC = () => {
  const { packId } = useParams<{ packId: string }>();
  const navigate = useNavigate();
  const [packType, setPackType] = useState<StickerPackType>(StickerPackType.STICKER);
  const [presets, setPresets] = useState<EditorPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('none');
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const facade = useStickerPackFacade();
  const presetService = useEditorPresetService();
  
  const {
    state,
    effectiveSettings,
    selectedImage,
    updateSettings,
    addImages,
    removeImage,
    selectImage,
    getSettingsForImage,
    applyPreset,
  } = useImageEditorSettings();

  const thumbnails = useImageThumbnails(state.images);
  const { handleLocalUpload } = useFileUpload(addImages);
  const { saveImages, isSaving, progress, currentStage } = useImageSaver(packId || '', packType, getSettingsForImage);
  
  useZoomWheel(effectiveSettings.zoom, (zoom) => updateSettings({ zoom }));

  useEffect(() => {
    const loadPresets = async () => {
      const allPresets = await presetService.getAll();
      setPresets(allPresets);
    };
    loadPresets();
  }, [presetService]);

  useEffect(() => {
    if (!packId) {
      navigate(EDIT_PACK_ROUTES.STICKER_PACKS);
      return;
    }

    const loadPackType = async () => {
      const pack = await facade.getPack(packId);
      if (pack) {
        setPackType(pack.type);
      }
    };

    loadPackType();
  }, [packId, navigate, facade]);

  if (!packId) {
    return null;
  }

  const handlePresetChange = async (presetId: string) => {
    setSelectedPresetId(presetId);
    if (presetId && presetId !== 'none') {
      const preset = presets.find(p => p.id === presetId);
      if (preset) {
        await applyPreset(preset.settings);
      }
    }
  };

  const handleAddFromNetwork = () => {
    setImportDialogOpen(true);
  };

  const handleSave = async () => {
    if (state.images.length === 0) return;
    await saveImages(state.images);
  };

  const currentImageSrc = selectedImage
    ? thumbnails[selectedImage.id]
    : state.images.length > 0
    ? thumbnails[state.images[0].id]
    : '';

  const sidebar = (
    <Sidebar
      settings={effectiveSettings}
      onSettingsChange={updateSettings}
      onAddLocalFiles={handleLocalUpload}
      onAddFromNetwork={handleAddFromNetwork}
      onSave={handleSave}
      isSaving={isSaving}
      progress={progress}
      presets={presets}
      selectedPresetId={selectedPresetId}
      onPresetChange={handlePresetChange}
    />
  );

  return (
    <PageLayout sidebar={sidebar} onBack={() => navigate(`/pack/${packId}`)}>
      <Flex direction={FlexDirection.COLUMN} className={styles.container}>
        <Box className={styles.canvasArea}>
          {currentImageSrc ? (
            <Canvas
              imageSrc={currentImageSrc}
              columns={effectiveSettings.columns}
              rows={effectiveSettings.rows}
              zoom={effectiveSettings.zoom}
            />
          ) : (
            <div className={styles.emptyState}>
              <Text size="3" color="gray">{EDIT_PACK_LABELS.EMPTY_STATE}</Text>
            </div>
          )}
        </Box>

        {state.images.length > 0 && (
          <ImageGallery
            images={state.images}
            selectedImageId={state.selectedImageId}
            onSelectImage={selectImage}
            onRemoveImage={removeImage}
          />
        )}
      </Flex>

      <ProcessingDialog open={isSaving} progress={progress} currentStage={currentStage} />
      
      <ImportFromNetworkDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImagesLoaded={addImages}
      />
    </PageLayout>
  );
};
