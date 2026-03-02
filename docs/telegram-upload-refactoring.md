# Рефакторинг Telegram загрузки стикерпаков

## Изменения в архитектуре

### 1. Новая структура данных

**Добавлен тип `UploadedCell`:**
```typescript
type UploadedCell = {
  cellId: string;
  fileId: string;
  status: TelegramUploadStatus;
};
```

**Обновлен `TelegramPackInfo`:**
```typescript
type TelegramPackInfo = {
  status: TelegramUploadStatus;
  name: string | null;
  url: string | null;
  uploaded?: UploadedCell[];
};
```

**Удалено из `GridCell`:**
- `fileId?: string`

### 2. Создан TelegramPackFacade

**Расположение:** `main/domains/telegram/facade/TelegramPackFacade.ts`

**Ответственность:**
- Координация между StickerPackFacade, ManifestService
- Получение и преобразование сетки
- Управление загрузкой через Telegram API
- Сохранение результатов в манифест

**Методы:**
- `uploadPack(request)` - первичная загрузка
- `updatePack(request)` - обновление

### 3. Обновлен ManifestEntity

**Новые методы:**
- `updateUploadedCell(cellId, fileId, status)`
- `getUploadedCell(cellId)`
- `clearUploadedCells()`

### 4. Обновлен ManifestService

**Удалены:**
- `updateCellFileId()`
- `getCellFileId()`
- `clearCellFileId()`

**Добавлены:**
- `updateUploadedCell(folderPath, cellId, fileId, status)`
- `getUploadedCells(folderPath)`
- `clearUploadedCells(folderPath)`

### 5. TelegramUploaderService

Теперь алиас на `TelegramPackFacade`

## Логика работы

### uploadPack
1. Получить пак и сетку
2. Преобразовать в плоский массив (включая пустые ячейки)
3. Создать стикерпак с первой ячейкой
4. Загрузить остальные ячейки
5. Сохранить fileId в `manifest.telegramPack.uploaded`

### updatePack
1. Получить состояние из Telegram
2. Сравнить с локальными данными
3. Удалить лишние стикеры
4. Загрузить недостающие
5. Переупорядочить по сетке

## Обратная совместимость

- `uploaded` опциональное
- `fromDTO()` инициализирует пустой массив для старых манифестов
