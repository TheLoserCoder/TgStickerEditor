# Рефакторинг пайплайна обработки изображений

## Дата: 2024
## Цель: Оптимизация анимаций через FFmpeg с умным сжатием

---

## Изменения в типах (types.ts)

### Добавлено:
- `frameTimings?: number[]` - массив задержек кадров в мс
- `frameCount?: number` - количество кадров

### Удалено:
- `ConversionParams` - интерфейс
- `conversionParams?: ConversionParams` - из RescaledImage, ImageFragment
- `isAtlas?: boolean` - из ImageFragment

---

## Константы (constants.ts)

### Добавлено в image-processing/constants.ts:
```typescript
export const ANIMATION_MAX_DURATION = 2.99;  // макс длительность анимации
export const ANIMATION_MAX_FRAMES = 24;      // макс кадров
export const ANIMATION_TARGET_FPS = 24;      // целевой FPS
export const STATIC_TILE_LIMIT = 512 * 1024; // лимит для статики
export const VIDEO_TILE_LIMIT = 256 * 1024;  // лимит для видео
```

---

## detect-convert.task.ts - Полная переработка

### Логика:
1. **Статичные изображения** → Sharp → WebP (без изменений)

2. **Анимированные изображения** → FFmpeg обработка:
   - WebP → GIF (временный, т.к. FFmpeg не поддерживает WebP)
   - FFprobe для метаданных (duration, fps, frames)
   - **Проверка необходимости оптимизации:**
     - Если duration ≤ 2.99s И frames ≤ 24 → конвертация без оптимизации
     - Иначе → применение фильтров
   - **Оптимизация:**
     - `setpts=PTS/${speedFactor}` для ускорения (если duration > 2.99s)
     - `fps=24` для сжатия кадров (если frames > 24)
   - Извлечение frameTimings через FFprobe
   - Выход: WebP с метаданными

### Ключевые особенности:
- Умное ускорение: speedFactor = originalDuration / 2.99
- Умное сжатие кадров через fps filter
- Сохранение frameTimings для последующего использования

---

## precompress.task.ts - Сжатие по формуле

### Логика:
1. Проверка размера файла
2. Формула лимита: `limit * columns * rows`
   - limit = 256KB для видео, 512KB для статики
3. Если размер ≤ лимита → пропуск
4. Иначе → бинарный поиск quality (90 → 50, шаг -5)
5. Передача frameTimings дальше

### Ключевые особенности:
- Оптимизация только при необходимости
- Бинарный поиск для минимизации потерь качества

---

## fragment.task.ts - Передача метаданных

### Изменения:
- Добавлена передача `frameTimings` в ImageFragment
- Добавлена передача `ffmpegPath` и `ffprobePath`

---

## convert-webp.task.ts - Откат к старой версии

### Логика:
1. **Статичный WebP** → возврат как есть
2. **Анимированный WebP:**
   - Sharp: WebP → GIF (временный)
   - FFmpeg: GIF → WebM
   - **Бинарный поиск CRF** (32-45, шаг 3)
   - Кеширование оптимального CRF в `webmConversionCache`
   - Удаление временного GIF

### Ключевые особенности:
- Кеш CRF для группы (groupId) - все фрагменты одного изображения используют один CRF
- Гарантия размера ≤ 256KB через бинарный поиск
- Использование VIDEO_TILE_LIMIT константы

---

## FFmpegAdapter - Новые методы

### convertWithFilters():
- Конвертация с кастомными видео фильтрами
- Поддержка `-vf` параметра
- Ограничение длительности через `-t`

### getFrameTimings():
- Извлечение тайминг

ов кадров через ffprobe
- Возврат массива `{ duration: number }[]`
- Fallback на 0.04s (25fps) при отсутствии данных

---

## Пайплайн обработки (итоговый)

```
1. detect-convert.task.ts
   ↓ DetectedImage (WebP + frameTimings)
   
2. trim.task.ts (опционально)
   ↓ TrimmedImage (передача frameTimings)
   
3. rescale.task.ts
   ↓ RescaledImage (передача frameTimings)
   
4. precompress.task.ts
   ↓ RescaledImage (сжатый WebP если нужно)
   
5. fragment.task.ts
   ↓ ImageFragment[] (WebP куски + frameTimings)
   
6. convert-webp.task.ts
   ↓ ConvertedFragment[] (WebM с оптимальным CRF)
```

---

## Преимущества нового подхода

1. **Умная оптимизация** - применяется только когда нужно
2. **Сохранение качества** - бинарный поиск вместо фиксированных значений
3. **Кеширование** - переиспользование CRF для фрагментов одного изображения
4. **Точные тайминги** - сохранение frameTimings для корректного воспроизведения
5. **Гарантия размера** - все тайлы ≤ 256KB

---

## Важные замечания

- GIF используется как промежуточный формат (FFmpeg не поддерживает анимированный WebP)
- Кеш CRF хранится в памяти для текущей сессии обработки
- frameTimings извлекаются через FFprobe для точного воспроизведения
- Оптимизация пропускается если анимация уже соответствует требованиям
