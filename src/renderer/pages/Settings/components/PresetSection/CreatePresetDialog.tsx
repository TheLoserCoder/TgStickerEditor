import React, { useState, useEffect } from 'react';
import { Dialog, Flex, TextField, Button, Text, Select } from '@radix-ui/themes';
import { FlexDirection, FlexGap } from '@/renderer/components/ui/radixEnums';
import { ProcessingSettings } from '@/shared/domains/image-processing/types';
import { RescaleQuality as SharedRescaleQuality } from '@/shared/domains/image-processing/enums';
import { EditorPreset } from '@/shared/domains/editor-preset/types';
import { RESCALE_QUALITY_OPTIONS, BOOLEAN_OPTIONS } from '@/renderer/config/imageEditor.config';
import { Counter } from '@/renderer/pages/EditPack/components/Counter';
import { PRESET_DIALOG_LABELS } from './constants';
import styles from './CreatePresetDialog.module.css';

interface PresetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (id: string | null, name: string, settings: ProcessingSettings) => void;
  preset?: EditorPreset | null;
}

const mapRescaleQuality = (value: string): SharedRescaleQuality => {
  switch (value) {
    case 'sharp':
      return SharedRescaleQuality.LANCZOS3;
    case 'smooth':
      return SharedRescaleQuality.NEAREST;
    default:
      return SharedRescaleQuality.NONE;
  }
};

const mapRescaleQualityReverse = (value: SharedRescaleQuality): string => {
  switch (value) {
    case SharedRescaleQuality.LANCZOS3:
      return 'sharp';
    case SharedRescaleQuality.NEAREST:
      return 'smooth';
    default:
      return 'none';
  }
};

export const PresetDialog: React.FC<PresetDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  preset,
}) => {
  const [name, setName] = useState('');
  const [columns, setColumns] = useState(1);
  const [rows, setRows] = useState(1);
  const [crop, setCrop] = useState(true);
  const [rescaleQuality, setRescaleQuality] = useState('none');
  const [animation, setAnimation] = useState(true);
  const [border, setBorder] = useState(0);

  useEffect(() => {
    if (preset) {
      setName(preset.name);
      setColumns(preset.settings.fragmentColumns);
      setRows(preset.settings.fragmentRows);
      setCrop(preset.settings.enableTrim);
      setRescaleQuality(mapRescaleQualityReverse(preset.settings.rescaleQuality));
      setAnimation(preset.settings.enableAnimation);
      setBorder(preset.settings.borderSize || 0);
    } else {
      setName('');
      setColumns(1);
      setRows(1);
      setCrop(true);
      setRescaleQuality('none');
      setAnimation(true);
      setBorder(0);
    }
  }, [preset, open]);

  const handleSubmit = () => {
    if (name.trim()) {
      const settings: ProcessingSettings = {
        enableAnimation: animation,
        enableTrim: crop,
        rescaleQuality: mapRescaleQuality(rescaleQuality),
        fragmentColumns: columns,
        fragmentRows: rows,
        borderSize: border,
      };
      onSubmit(preset?.id || null, name.trim(), settings);
      onOpenChange(false);
    }
  };

  const isEdit = !!preset;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="450px">
        <Dialog.Title>{isEdit ? PRESET_DIALOG_LABELS.EDIT_TITLE : PRESET_DIALOG_LABELS.CREATE_TITLE}</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          <Text size="2" color="gray">
            {isEdit ? PRESET_DIALOG_LABELS.EDIT_DESCRIPTION : PRESET_DIALOG_LABELS.CREATE_DESCRIPTION}
          </Text>
        </Dialog.Description>
        <Flex direction={FlexDirection.COLUMN} gap={FlexGap.MEDIUM}>
          <label>
            <Flex direction={FlexDirection.COLUMN} gap={FlexGap.XSMALL}>
              <Text size="2" weight="medium">{PRESET_DIALOG_LABELS.NAME_LABEL}</Text>
              <TextField.Root
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={PRESET_DIALOG_LABELS.NAME_PLACEHOLDER}
              />
            </Flex>
          </label>

          <Counter
            label={PRESET_DIALOG_LABELS.COLUMNS}
            value={columns}
            min={1}
            max={10}
            onChange={setColumns}
          />

          <Counter
            label={PRESET_DIALOG_LABELS.ROWS}
            value={rows}
            min={1}
            max={10}
            onChange={setRows}
          />

          <Counter
            label={PRESET_DIALOG_LABELS.BORDER}
            value={border}
            min={0}
            max={20}
            onChange={setBorder}
          />

          <Flex direction={FlexDirection.COLUMN} gap={FlexGap.XSMALL}>
            <Text size="2" weight="medium">{PRESET_DIALOG_LABELS.CROP}</Text>
            <Select.Root value={crop ? 'true' : 'false'} onValueChange={(v) => setCrop(v === 'true')}>
              <Select.Trigger className={styles.select} />
              <Select.Content>
                {BOOLEAN_OPTIONS.map((opt) => (
                  <Select.Item key={opt.value} value={opt.value}>
                    {opt.label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </Flex>

          <Flex direction={FlexDirection.COLUMN} gap={FlexGap.XSMALL}>
            <Text size="2" weight="medium">{PRESET_DIALOG_LABELS.RESCALE_QUALITY}</Text>
            <Select.Root value={rescaleQuality} onValueChange={setRescaleQuality}>
              <Select.Trigger className={styles.select} />
              <Select.Content>
                {RESCALE_QUALITY_OPTIONS.map((opt) => (
                  <Select.Item key={opt.value} value={opt.value}>
                    {opt.label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </Flex>

          <Flex direction={FlexDirection.COLUMN} gap={FlexGap.XSMALL}>
            <Text size="2" weight="medium">{PRESET_DIALOG_LABELS.ANIMATION}</Text>
            <Select.Root value={animation ? 'true' : 'false'} onValueChange={(v) => setAnimation(v === 'true')}>
              <Select.Trigger className={styles.select} />
              <Select.Content>
                {BOOLEAN_OPTIONS.map((opt) => (
                  <Select.Item key={opt.value} value={opt.value}>
                    {opt.label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </Flex>
          <Flex gap={FlexGap.SMALL} justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                {PRESET_DIALOG_LABELS.CANCEL}
              </Button>
            </Dialog.Close>
            <Button onClick={handleSubmit} disabled={!name.trim()}>
              {isEdit ? PRESET_DIALOG_LABELS.SAVE : PRESET_DIALOG_LABELS.CREATE}
            </Button>
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
};
