import React, { useState, useEffect } from 'react';
import { Flex, Text, Button } from '@radix-ui/themes';
import { MixIcon, Pencil1Icon } from '@radix-ui/react-icons';
import { IconButton, DeleteButton } from '@/renderer/components/ui';
import { ButtonVariant, ComponentSize } from '@/renderer/components/ui/enums';
import { FlexDirection, FlexGap } from '@/renderer/components/ui/radixEnums';
import { useEditorPresetService } from '@/renderer/hooks/useEditorPresetService';
import { useConfirm } from '@/renderer/utils/confirmation';
import { EditorPreset } from '@/shared/domains/editor-preset/types';
import { ProcessingSettings } from '@/shared/domains/image-processing/types';
import { PresetDialog } from './CreatePresetDialog';
import { PRESET_LABELS } from './constants';
import styles from '../../Settings.module.css';

export const PresetSection: React.FC = () => {
  const presetService = useEditorPresetService();
  const confirm = useConfirm();
  const [presets, setPresets] = useState<EditorPreset[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<EditorPreset | null>(null);

  const loadPresets = async () => {
    const allPresets = await presetService.getAll();
    setPresets(allPresets);
  };

  useEffect(() => {
    loadPresets();
  }, []);

  const handleSubmit = async (id: string | null, name: string, settings: ProcessingSettings) => {
    if (id) {
      await presetService.update(id, { name, settings });
    } else {
      await presetService.create(name, settings);
    }
    await loadPresets();
    setEditingPreset(null);
  };

  const handleDeletePreset = async (preset: EditorPreset) => {
    const confirmed = await confirm({
      title: PRESET_LABELS.DELETE_CONFIRMATION_TITLE,
      description: PRESET_LABELS.DELETE_CONFIRMATION_DESCRIPTION(preset.name),
      confirmText: PRESET_LABELS.DELETE_CONFIRM_TEXT,
      cancelText: PRESET_LABELS.DELETE_CANCEL_TEXT,
    });

    if (confirmed) {
      await presetService.delete(preset.id);
      await loadPresets();
    }
  };

  const openEditDialog = (preset: EditorPreset) => {
    setEditingPreset(preset);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingPreset(null);
    setIsDialogOpen(true);
  };

  return (
    <>
      <Flex direction={FlexDirection.COLUMN} gap={FlexGap.SMALL}>
        <IconButton
          icon={<MixIcon />}
          label={PRESET_LABELS.ADD_PRESET}
          variant={ButtonVariant.SOFT}
          onClick={openCreateDialog}
        />
        {presets.length === 0 ? (
          <div className={styles.emptyState}>
            <Text size={ComponentSize.LARGE}>{PRESET_LABELS.NO_PRESETS}</Text>
          </div>
        ) : (
          presets.map((preset) => (
            <div key={preset.id} className={styles.botCard}>
              <div className={styles.botInfo}>
                <Text weight="bold">{preset.name}</Text>
              </div>
              <div className={styles.botActions}>
                <Button variant={ButtonVariant.GHOST} onClick={() => openEditDialog(preset)}>
                  <Pencil1Icon />
                </Button>
                <DeleteButton onClick={() => handleDeletePreset(preset)} />
              </div>
            </div>
          ))
        )}
      </Flex>

      <PresetDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleSubmit}
        preset={editingPreset}
      />
    </>
  );
};
