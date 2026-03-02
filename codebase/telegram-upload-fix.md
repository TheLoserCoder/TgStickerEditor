# Исправление загрузки стикерпаков в Telegram

## Проблемы

### 1. Неправильное формирование массива стикеров
- **Было:** Использовался `pack.fragments` напрямую - просто список фрагментов без учета сетки
- **Проблема:** Фрагменты загружались не в том порядке, как они расположены в сетке
- **Для эмодзи:** Картинки одной группы шли последовательно, а должны идти по ячейкам сетки

### 2. Не обновлялся манифест после загрузки
- **Было:** Обновлялись только `fragments` с `uploadStatus`
- **Проблема:** Не сохранялся `fileId` для каждой ячейки сетки, невозможно отследить что загружено

### 3. Прогресс не отображался в реальном времени
- **Было:** IPC события отправлялись, но UI не обновлялся до завершения
- **Проблема:** Пользователь не видел прогресс загрузки

## Решение

### 1. Утилита gridToFlatArray
**Файл:** `src/shared/domains/grid/utils.ts`

```typescript
export function gridToFlatArray(grid: GridLayout): FlatGridCell[]
```

- Сортирует ячейки по `row`, затем по `col`
- Возвращает плоский массив в порядке отображения в сетке
- Для эмодзи 2x2: верхние фрагменты обеих картинок, затем пустые, затем нижние

### 2. Обновление типов

**GridCell** (`src/shared/domains/grid/types.ts`):
```typescript
export interface GridCell {
  // ...
  fileId?: string; // Telegram file ID после загрузки
}
```

**UploadStickerData** (`src/shared/domains/telegram/types.ts`):
```typescript
export type UploadStickerData = {
  filePath: string;
  emoji: string;
  cellId?: string; // ID ячейки для маппинга результата
}
```

**UploadResult** (`src/shared/domains/telegram/types.ts`):
```typescript
export type UploadResult = {
  success: boolean;
  packUrl?: string;
  uploadedCells?: Map<string, { fileId: string; status: TelegramUploadStatus; cellId: string }>;
  // Было: uploadedFragments с индексом
}
```

### 3. Обновление TelegramUploaderService

**Изменения:**
- Используется `cellId` вместо индекса массива
- Пустые ячейки (`filePath === ''`) загружаются как пустые изображения
- Возвращается `uploadedCells` Map с `cellId` → `{ fileId, status, cellId }`

**Обработка пустых ячеек:**
```typescript
const buffer = sticker.filePath 
  ? await this.fileSystem.readFile(sticker.filePath)
  : await this.emptyImageGenerator.generate(512);
```

### 4. Обновление PackView

**Формирование массива стикеров:**
```typescript
const flatCells = gridToFlatArray(grid);
const stickers = flatCells.map(cell => ({
  filePath: cell.isEmpty 
    ? '' 
    : `${stickerPackPath}/fragments/${pack.fragments.find(f => f.id === cell.fragmentId)?.fileName}`,
  emoji: TELEGRAM_DEFAULT_EMOJI,
  cellId: cell.cellId,
}));
```

**Обновление манифеста после загрузки:**
```typescript
// 1. Обновляем cells с fileId
const updatedCells = grid.cells.map(cell => {
  const uploadInfo = result.uploadedCells?.get(cell.id);
  if (uploadInfo) {
    return { ...cell, fileId: uploadInfo.fileId };
  }
  return cell;
});

// 2. Обновляем fragments с uploadStatus
const updatedFragments = pack.fragments.map(f => {
  const cell = updatedCells.find(c => c.fragmentId === f.id);
  if (cell?.fileId) {
    return {
      ...f,
      uploadStatus: {
        status: TelegramUploadStatus.UPLOADED,
        fileId: cell.fileId,
      }
    };
  }
  return f;
});

// 3. Сохраняем обновленный манифест
await facade.updatePackManifest(packId, {
  fragments: updatedFragments,
  gridLayout: { ...grid, cells: updatedCells },
  telegramPack: { status, name, url }
});
```

## Результат

✅ **Правильный порядок загрузки:** Стикеры загружаются в том порядке, как они расположены в сетке (по строкам, затем по столбцам)

✅ **Поддержка пустых ячеек:** Пустые ячейки загружаются как пустые изображения, сохраняя структуру сетки

✅ **Обновление манифеста:** После загрузки сохраняется `fileId` для каждой ячейки и `uploadStatus` для каждого фрагмента

✅ **Прогресс в реальном времени:** IPC события обновляют UI во время загрузки

✅ **Возможность повторной загрузки:** По `fileId` можно определить какие ячейки уже загружены

## Пример для эмодзи 2x2

**Сетка (2 картинки 2x2):**
```
[A1] [B1] [ ] [ ]
[A2] [B2] [ ] [ ]
```

**Массив для загрузки:**
```typescript
[
  { cellId: 'cell-0-0', filePath: 'A1.webp' },  // row=0, col=0
  { cellId: 'cell-0-1', filePath: 'B1.webp' },  // row=0, col=1
  { cellId: 'cell-0-2', filePath: '' },         // row=0, col=2 (пустая)
  { cellId: 'cell-0-3', filePath: '' },         // row=0, col=3 (пустая)
  { cellId: 'cell-1-0', filePath: 'A2.webp' },  // row=1, col=0
  { cellId: 'cell-1-1', filePath: 'B2.webp' },  // row=1, col=1
  { cellId: 'cell-1-2', filePath: '' },         // row=1, col=2 (пустая)
  { cellId: 'cell-1-3', filePath: '' },         // row=1, col=3 (пустая)
]
```

**Результат в Telegram:** Картинки восстанавливаются в правильном порядке
