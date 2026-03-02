import React from 'react';
import { Flex, Select, Button, Progress, Text } from '@radix-ui/themes';
import { ImageIcon, DownloadIcon, ZoomInIcon, ZoomOutIcon, ResetIcon } from '@radix-ui/react-icons';
import { ImageEditorSettings, RESCALE_QUALITY_OPTIONS, BOOLEAN_OPTIONS, ZOOM_STEP, MIN_ZOOM, MAX_ZOOM } from '@/renderer/config/imageEditor.config';
import { EditorPreset } from '@/shared/domains/editor-preset/types';
import { SIDEBAR_CONSTANTS, SIDEBAR_LABELS } from './sidebarConstants';
import { Counter } from './Counter';
import styles from './Sidebar.module.css';

interface SidebarProps {
  settings: ImageEditorSettings;
  onSettingsChange: (settings: Partial<ImageEditorSettings>) => void;
  onAddLocalFiles: () => void;
  onAddFromNetwork: () => void;
  onSave: () => void;
  isSaving?: boolean;
  progress?: number;
  presets?: EditorPreset[];
  selectedPresetId?: string;
  onPresetChange?: (presetId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  settings,
  onSettingsChange,
  onAddLocalFiles,
  onAddFromNetwork,
  onSave,
  isSaving = false,
  progress = 0,
  presets = [],
  selectedPresetId = 'none',
  onPresetChange,
}) => {
  const handleZoomIn = () => onSettingsChange({ zoom: Math.min(settings.zoom + ZOOM_STEP, MAX_ZOOM) });
  const handleZoomOut = () => onSettingsChange({ zoom: Math.max(settings.zoom - ZOOM_STEP, MIN_ZOOM) });
  const handleZoomReset = () => onSettingsChange({ zoom: 100 });
  const handleNormalize = () => onSettingsChange({ columns: 1, rows: 1 });
  const hasGrid = settings.columns > 1 || settings.rows > 1;

  return (
    <div className={styles.sidebar}>
      <Flex direction="column" gap="3">
        {presets.length > 0 && onPresetChange && (
          <Flex direction="column" gap="2">
            <label className={styles.label}>{SIDEBAR_LABELS.PRESET}</label>
            <Select.Root value={selectedPresetId} onValueChange={onPresetChange}>
              <Select.Trigger className={styles.select} />
              <Select.Content>
                <Select.Item value="none">{SIDEBAR_LABELS.NO_PRESET}</Select.Item>
                {presets.map((preset) => (
                  <Select.Item key={preset.id} value={preset.id}>
                    {preset.name}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </Flex>
        )}

        <Counter
          label={SIDEBAR_LABELS.COLUMNS}
          value={settings.columns}
          min={SIDEBAR_CONSTANTS.MIN_GRID_VALUE}
          max={SIDEBAR_CONSTANTS.MAX_GRID_VALUE}
          onChange={(value) => onSettingsChange({ columns: value })}
        />

        <Counter
          label={SIDEBAR_LABELS.ROWS}
          value={settings.rows}
          min={SIDEBAR_CONSTANTS.MIN_GRID_VALUE}
          max={SIDEBAR_CONSTANTS.MAX_GRID_VALUE}
          onChange={(value) => onSettingsChange({ rows: value })}
        />

        <Flex direction="column" gap="2">
          <label className={styles.label}>{SIDEBAR_LABELS.CROP}</label>
          <Select.Root
            value={settings.crop ? 'true' : 'false'}
            onValueChange={(value) => onSettingsChange({ crop: value === 'true' })}
          >
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

        <Flex direction="column" gap="2">
          <label className={styles.label}>{SIDEBAR_LABELS.RESCALE_QUALITY}</label>
          <Select.Root
            value={settings.rescaleQuality}
            onValueChange={(value) => onSettingsChange({ rescaleQuality: value as any })}
          >
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

        <Flex direction="column" gap="2">
          <label className={styles.label}>{SIDEBAR_LABELS.ANIMATION}</label>
          <Select.Root
            value={settings.animation ? 'true' : 'false'}
            onValueChange={(value) => onSettingsChange({ animation: value === 'true' })}
          >
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

        <Flex direction="column" gap="2">
          <label className={styles.label}>{SIDEBAR_LABELS.ZOOM}: {settings.zoom}%</label>
          <Flex gap="2">
            <Button
              variant={SIDEBAR_CONSTANTS.BUTTON_VARIANT_OUTLINE}
              size={SIDEBAR_CONSTANTS.BUTTON_SIZE}
              onClick={handleZoomOut}
              disabled={settings.zoom <= MIN_ZOOM}
            >
              <ZoomOutIcon />
            </Button>
            <Button variant={SIDEBAR_CONSTANTS.BUTTON_VARIANT_OUTLINE} size={SIDEBAR_CONSTANTS.BUTTON_SIZE} onClick={handleZoomReset} style={{ flex: 1 }}>
              {SIDEBAR_LABELS.ZOOM_RESET}
            </Button>
            <Button
              variant={SIDEBAR_CONSTANTS.BUTTON_VARIANT_OUTLINE}
              size={SIDEBAR_CONSTANTS.BUTTON_SIZE}
              onClick={handleZoomIn}
              disabled={settings.zoom >= MAX_ZOOM}
            >
              <ZoomInIcon />
            </Button>
          </Flex>
        </Flex>

        <Button variant={SIDEBAR_CONSTANTS.BUTTON_VARIANT_OUTLINE} size={SIDEBAR_CONSTANTS.BUTTON_SIZE} onClick={onAddLocalFiles} style={{ width: '100%' }}>
          <ImageIcon />
          {SIDEBAR_LABELS.ADD_LOCAL}
        </Button>

        <Button variant={SIDEBAR_CONSTANTS.BUTTON_VARIANT_OUTLINE} size={SIDEBAR_CONSTANTS.BUTTON_SIZE} onClick={onAddFromNetwork} style={{ width: '100%' }}>
          <DownloadIcon />
          {SIDEBAR_LABELS.ADD_NETWORK}
        </Button>

        {hasGrid && (
          <Button variant={SIDEBAR_CONSTANTS.BUTTON_VARIANT_OUTLINE} size={SIDEBAR_CONSTANTS.BUTTON_SIZE} onClick={handleNormalize} style={{ width: '100%' }}>
            <ResetIcon />
            {SIDEBAR_LABELS.NORMALIZE}
          </Button>
        )}

        <Button 
          variant={SIDEBAR_CONSTANTS.BUTTON_VARIANT_SOLID} 
          size={SIDEBAR_CONSTANTS.BUTTON_SIZE} 
          onClick={onSave} 
          disabled={isSaving}
          style={{ width: '100%' }}
        >
          {isSaving ? SIDEBAR_LABELS.SAVING : SIDEBAR_LABELS.SAVE}
        </Button>

        {isSaving && (
          <Flex direction="column" gap="2">
            <Progress value={progress} />
            <Text size="1" color="gray">{Math.round(progress)}%</Text>
          </Flex>
        )}
      </Flex>
    </div>
  );
};
