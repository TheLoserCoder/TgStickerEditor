/**
 * Хук для управления настройками редактора изображений
 * Зона ответственности: Логика работы с глобальными и индивидуальными настройками
 */

import { useState, useCallback } from 'react';
import { ImageEditorSettings, DEFAULT_SETTINGS, CONFIRMATION_MESSAGES, RescaleQuality } from '@/renderer/config/imageEditor.config';
import { ProcessingSettings } from '@/shared/domains/image-processing/types';
import { RescaleQuality as SharedRescaleQuality } from '@/shared/domains/image-processing/enums';
import { useConfirm } from '@/renderer/utils/confirmation';

export interface ImageEditorImage {
  id: string;
  data: Blob | string;
  width: number;
  height: number;
}

interface SettingsStore {
  globalSettings: ImageEditorSettings;
  individualSettings: Record<string, Partial<ImageEditorSettings>>;
}

interface EditorState {
  images: ImageEditorImage[];
  settingsStore: SettingsStore;
  selectedImageId: string | null;
}

export const useImageEditorSettings = () => {
  const [state, setState] = useState<EditorState>({
    images: [],
    settingsStore: {
      globalSettings: { ...DEFAULT_SETTINGS },
      individualSettings: {},
    },
    selectedImageId: null,
  });

  const confirm = useConfirm();

  const hasIndividualSettings = Object.keys(state.settingsStore.individualSettings).length > 0;

  const getEffectiveSettings = useCallback((): ImageEditorSettings => {
    if (!state.selectedImageId) {
      return state.settingsStore.globalSettings;
    }

    const individualSettings = state.settingsStore.individualSettings[state.selectedImageId];
    return {
      ...state.settingsStore.globalSettings,
      ...individualSettings,
    };
  }, [state.selectedImageId, state.settingsStore]);

  const updateSettings = useCallback(async (settings: Partial<ImageEditorSettings>) => {
    const { zoom, ...settingsWithoutZoom } = settings;
    const hasNonZoomSettings = Object.keys(settingsWithoutZoom).length > 0;

    // Zoom всегда обновляется глобально
    if (zoom !== undefined) {
      setState(prev => ({
        ...prev,
        settingsStore: {
          ...prev.settingsStore,
          globalSettings: { ...prev.settingsStore.globalSettings, zoom },
        },
      }));
    }

    if (!hasNonZoomSettings) return;

    // Обновление общих настроек
    if (state.selectedImageId === null) {
      if (hasIndividualSettings) {
        const confirmed = await confirm(CONFIRMATION_MESSAGES.RESET_INDIVIDUAL_SETTINGS);
        if (!confirmed) return;
        
        setState(prev => ({
          ...prev,
          settingsStore: {
            globalSettings: { ...prev.settingsStore.globalSettings, ...settingsWithoutZoom },
            individualSettings: {},
          },
        }));
      } else {
        setState(prev => ({
          ...prev,
          settingsStore: {
            ...prev.settingsStore,
            globalSettings: { ...prev.settingsStore.globalSettings, ...settingsWithoutZoom },
          },
        }));
      }
    } else {
      // Обновление индивидуальных настроек
      setState(prev => ({
        ...prev,
        settingsStore: {
          ...prev.settingsStore,
          individualSettings: {
            ...prev.settingsStore.individualSettings,
            [state.selectedImageId!]: {
              ...prev.settingsStore.individualSettings[state.selectedImageId!],
              ...settingsWithoutZoom,
            },
          },
        },
      }));
    }
  }, [state.selectedImageId, hasIndividualSettings, confirm]);

  const addImages = useCallback((images: ImageEditorImage[]) => {
    setState(prev => ({
      ...prev,
      images: [...prev.images, ...images],
    }));
  }, []);

  const removeImage = useCallback((imageId: string) => {
    setState(prev => {
      const newImages = prev.images.filter(img => img.id !== imageId);
      const { [imageId]: _, ...remainingIndividualSettings } = prev.settingsStore.individualSettings;

      return {
        ...prev,
        images: newImages,
        selectedImageId: prev.selectedImageId === imageId ? null : prev.selectedImageId,
        settingsStore: {
          ...prev.settingsStore,
          individualSettings: remainingIndividualSettings,
        },
      };
    });
  }, []);

  const selectImage = useCallback((imageId: string | null) => {
    setState(prev => ({ ...prev, selectedImageId: imageId }));
  }, []);

  const getSettingsForImage = useCallback((imageId: string): ImageEditorSettings => {
    const individualSettings = state.settingsStore.individualSettings[imageId];
    return {
      ...state.settingsStore.globalSettings,
      ...individualSettings,
    };
  }, [state.settingsStore]);

  const applyPreset = useCallback(async (settings: ProcessingSettings) => {
    if (hasIndividualSettings) {
      const confirmed = await confirm(CONFIRMATION_MESSAGES.RESET_INDIVIDUAL_SETTINGS);
      if (!confirmed) return;
    }

    const mapRescaleQuality = (quality: SharedRescaleQuality): RescaleQuality => {
      switch (quality) {
        case SharedRescaleQuality.LANCZOS3:
          return RescaleQuality.SHARP;
        case SharedRescaleQuality.NEAREST:
          return RescaleQuality.SMOOTH;
        default:
          return RescaleQuality.NONE;
      }
    };

    setState(prev => ({
      ...prev,
      settingsStore: {
        globalSettings: {
          ...prev.settingsStore.globalSettings,
          columns: settings.fragmentColumns,
          rows: settings.fragmentRows,
          crop: settings.enableTrim,
          rescaleQuality: mapRescaleQuality(settings.rescaleQuality),
          animation: settings.enableAnimation,
        },
        individualSettings: {},
      },
    }));
  }, [hasIndividualSettings, confirm]);

  return {
    state,
    effectiveSettings: getEffectiveSettings(),
    selectedImage: state.images.find(img => img.id === state.selectedImageId),
    updateSettings,
    addImages,
    removeImage,
    selectImage,
    getSettingsForImage,
    applyPreset,
  };
};
