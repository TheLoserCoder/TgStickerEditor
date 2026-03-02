# Структура проекта

## Обзор
Electron приложение для редактирования стикеров Telegram

## Принципы разделения кода

### Shared
- Wrappers (LoggerWrapper, ErrorWrapper)
- Интерфейсы (ILoggerService, IErrorService, IStore, IStateManager, IStoreService)
- Типы и ENUM
- Всё, что используется и в main, и в renderer

### Main
- Сервисы (LoggerService, ErrorService, StoreService)
- Handlers (обработчики логики)
- Транспорты для main (FileTransport, ConsoleTransport, LocalTransport)
- Адаптеры (ElectronStoreAdapter)
- Константы специфичные для main

### Renderer
- Транспорты для renderer (IPCTransport, EventEmitterTransport, ServiceTransport)
- Адаптеры (ReduxStateManager, StoreSyncAdapter)
- UI компоненты

## Структура папок

### `/src`
Основной исходный код приложения

### `/src/main`
Главный процесс Electron (сервер)

### `/src/renderer`
Процесс рендеринга (React приложение, клиент)

### `/src/shared`
Общий код для main и renderer процессов

## Модули и классы

### Домен: Core
**Расположение:** `src/shared/domains/core/`, `src/main/domains/core/`

**Назначение:** Базовые абстракции и утилиты для всех доменов

**Компоненты:**
- `IServiceWrapper` (shared) - интерфейс для wrapper'ов
- `IContainer` (shared) - интерфейс контейнера зависимостей
- `ServiceFactory` (shared) - фабрика для создания сервисов с wrapper'ами
- `Container` (main) - контейнер зависимостей, singleton
- `ContainerError` (shared) - ENUM ошибок контейнера

**Фабрики:**
- `src/main/factories/mainFactory.ts` - `getMainFactory()` singleton, получает сервисы из контейнера
- `src/renderer/factories/createRendererFactory.ts` - создает фабрику с IPC транспортами

**Container:**
- Регистрация: каждый домен регистрируется в своем `index.ts`
- Токены: каждый домен определяет токен в `constants.ts`
- Импорт: `src/main/domains/index.ts` импортирует все домены
- Особенности: async фабрики, lazy init, защита от циклов

### Домен: IPC
**Расположение:** `src/shared/domains/ipc/`, `src/main/domains/ipc/`, `src/renderer/domains/ipc/`

**Назначение:** Межпроцессная коммуникация

**Компоненты:**
- `IIPCBridge` (shared) - интерфейс IPC (invoke, send, on, off)
- `IPCBridge` (main, renderer) - реализации для процессов
- `ServiceRegistry` (main) - реестр сервисов, обрабатывает IPC вызовы
- `ServiceProxy` (renderer) - прокси для вызова сервисов через IPC
- `initializeIPCBridge(window)` (main) - регистрация IPCBridge с BrowserWindow

### Домен: Logger
**Расположение:** `src/shared/domains/logger/`, `src/main/domains/logger/`, `src/renderer/domains/logger/`

**Назначение:** Централизованное логирование с батчингом

**Компоненты:**
- `LoggerWrapper` - автоматическое логирование вызовов методов
- `LoggerService` (main) - сервис с батчингом (100мс / 50 логов)
- `FileTransport` (main) - запись в файл
- `ConsoleTransport` (main) - вывод в консоль
- `LocalTransport` (main) - прямой вызов LoggerService
- `IPCTransport` (renderer) - отправка через IPC

**Архитектура:**
```
Main: LoggerWrapper → LocalTransport → LoggerService → [File, Console]
Renderer: LoggerWrapper → IPCTransport → IPC → LoggerService
```

### Домен: Store
**Расположение:** `src/shared/domains/store/`, `src/main/domains/store/`, `src/renderer/domains/store/`

**Назначение:** Управление постоянным хранилищем, паттерн "Main as Backend"

**Компоненты:**
- `IStore`, `IStoreService`, `IStateManager` (shared) - интерфейсы
- `ElectronStoreAdapter` (main) - адаптер для electron-store
- `StoreService` (main) - сервис хранилища, отправляет IPC события
- `ReduxStateManager` (renderer) - адаптер для Redux
- `StoreSyncAdapter` (renderer) - синхронизация electron-store → Redux

**Поток данных:**
```
Main (источник истины): Services → StoreService → electron-store
                                    ↓ IPC
Renderer (кеш): StoreSyncAdapter → ReduxStateManager → Redux → Components
```

**Разделение данных:**
- Persistent (electron-store): боты, стикерпаки, настройки
- Ephemeral (только Redux): UI состояния, формы, загрузки

### Домен: Settings
**Расположение:** `src/shared/domains/settings/`, `src/main/domains/settings/`

**Назначение:** Управление настройками приложения

**Компоненты shared (для IPC):**
- `ISettingsService` (shared/interfaces) - интерфейс для IPC proxy типизации
- `AppSettings` (shared/types) - тип DTO для IPC
- `Theme` (shared/types) - union type 'light' | 'dark' | 'system'

**Компоненты main:**
- `SettingsKey` (main/enums) - ENUM ключей настроек
- `SettingsStoreKey` (main/enums) - ENUM ключа хранилища
- `DEFAULT_SETTINGS` (main/constants) - дефолтные значения
- `ISettingsRepository` (main) - интерфейс репозитория
- `SettingsEntity` (main) - сущность с валидацией
- `SettingsRepository` (main) - реализация репозитория через StoreService
- `ISettingsService` (main) - интерфейс сервиса
- `SettingsService` (main) - реализация бизнес-логики

**Архитектура:**
```
SettingsService → SettingsRepository → StoreService
       ↓
SettingsEntity (валидация темы)
       ↓
AppSettings DTO (для IPC)
```

**Валидация:**
- Проверка валидности темы через Object.values(Theme)
- Merge с дефолтами при загрузке из хранилища

**Использование:**
```typescript
const theme = await settingsService.get('theme');
await settingsService.set('theme', Theme.DARK); // Валидация
const all = await settingsService.getAll();
await settingsService.reset();
```

### Домен: Bot
**Расположение:** `src/shared/domains/bot/`, `src/main/domains/bot/`

**Назначение:** Управление ботами Telegram

**Компоненты shared (для IPC):**
- `IBotService` (shared/interfaces) - интерфейс для IPC proxy типизации
- `Bot` (shared/types) - тип DTO для IPC { id, token, userId }

**Компоненты main:**
- `BotKey` (main/enums) - ENUM ключей полей
- `BotValidationError` (main/enums) - ENUM ошибок валидации
- `BotStoreKey` (main/enums) - ENUM ключа хранилища
- `IBotRepository` (main) - интерфейс репозитория
- `BotEntity` (main) - сущность с валидацией
- `BotValidator` (main) - валидатор полей бота
- `BotRepository` (main) - реализация репозитория через StoreService
- `IBotService` (main) - интерфейс сервиса
- `BotService` (main) - реализация бизнес-логики

**Архитектура:**
```
BotService → BotRepository → StoreService
     ↓
BotEntity (валидация через BotValidator)
     ↓
Bot DTO (для IPC)
```

**Валидация:**
- Все поля обязательны (id, token, userId)
- Валидация при создании через BotEntity.create()
- Загрузка из хранилища через BotEntity.fromStorage() (без валидации)

**Хранение:**
- Структура: `bots: { [id]: { id, token, userId } }`
- Генерация ID через IIdGenerator
- Ключ хранилища: BOT_STORE_KEY

**Использование:**
```typescript
const bot = await botService.create('token', 'userId'); // Валидация
const all = await botService.getAll();
await botService.update(bot.id, { token: 'new' }); // Валидация
await botService.delete(bot.id);
```

### Утилита: IdGenerator
**Расположение:** `src/shared/utils/id-generator/`, `src/main/utils/id-generator/`

**Назначение:** Генерация уникальных идентификаторов

**Компоненты:**
- `IIdGenerator` (shared) - интерфейс с методом generate()
- `NanoIdGenerator` (main) - реализация через nanoid
- Регистрация в Container с токеном ID_GENERATOR_TOKEN

**Использование:**
```typescript
const id = idGenerator.generate(); // nanoid
```

### Домен: FileSystem
**Расположение:** `src/main/domains/filesystem/`

**Назначение:** Абстракция для работы с файловой системой

**Компоненты:**
- `IFileSystemService` (main) - интерфейс для работы с FS
- `FileSystemService` (main) - реализация через Node.js fs.promises
- Методы: writeFile, readFile, mkdir, readdir, rm, exists

**Использование:**
```typescript
await fileSystem.mkdir(path, { recursive: true });
await fileSystem.writeFile(path, data);
const content = await fileSystem.readFile(path);
const exists = await fileSystem.exists(path);
```

### Домен: StickerDownloader
**Расположение:** `src/shared/domains/sticker-downloader/`, `src/main/domains/sticker-downloader/`

**Назначение:** Загрузка стикеров из внешних источников (Line Store)

**Компоненты shared (для IPC):**
- `IStickerDownloaderService` (shared/interfaces) - интерфейс для IPC proxy типизации
- `DownloadResultDTO` (shared/types) - результат загрузки { success, filePaths?, error? }
- `DownloadProgressInfo` (shared/types) - прогресс { progress, message }
- `StickerProvider` (shared/enums) - провайдеры (LINE)
- `StickerDownloaderIPCChannel` (shared/enums) - IPC каналы (PROGRESS)

**Компоненты main:**
- **Parsers:**
  - `IParser` - интерфейс парсера (canHandle, parse)
  - `LineParser` - парсер Line Store через cheerio
  - `ParserFactory` - фабрика парсеров (выбор по URL)
- **Downloaders:**
  - `IDownloader` - интерфейс загрузчика
  - `HttpDownloader` - загрузка через HTTP с прогрессом
- **HTTP:**
  - `IHttpClient` - интерфейс HTTP клиента
  - `AxiosHttpClient` - реализация через axios
- **Services:**
  - `StickerDownloaderService` - координатор (парсинг + загрузка + IPC прогресс)
- **Enums:**
  - `DownloadError` - ошибки загрузки

**Архитектура:**
```
Renderer: useStickerDownloader
    ↓
IPC → StickerDownloaderService
    ↓
ParserFactory.getParser(url) → LineParser
    ↓
LineParser.parse(url) → ParsedSticker[]
    ↓
HttpDownloader.download(stickers, { onProgress })
    ↓
TempFileService.createTempDir() → filePaths
    ↓
IPC Progress Events → Renderer
```

**Парсинг Line Store:**
- Использует cheerio для парсинга HTML
- Извлекает `data-preview` атрибуты из `li.mdCMN09Li`
- Приоритет: animationUrl → staticUrl → fallbackStaticUrl
- Возвращает массив `ParsedSticker` с URL и флагом анимации

**Загрузка:**
- Создает временную директорию через `TempFileService`
- Скачивает файлы параллельно через `HttpDownloader`
- Отправляет прогресс через IPC события
- При ошибке очищает временные файлы

**IPC прогресс:**
- `StickerDownloaderIPCChannel.PROGRESS` - канал для событий
- Этапы: парсинг (0-10%), загрузка (10-100%)
- Сообщения: "Парсинг страницы...", "Найдено N стикеров", "Скачано X из Y"

**Использование в renderer:**
```typescript
const { downloadStickers, isDownloading, progress, message } = useStickerDownloader();

const result = await downloadStickers('https://store.line.me/stickershop/...');
if (result.success) {
  // result.filePaths - массив путей к скачанным файлам
}
```

**Интеграция с UI:**
- `ImportFromNetworkDialog` - диалог импорта с полем URL
- Отображение прогресса через `Progress` компонент
- Чтение файлов через `TempFileService.readTempFileAsBlob()`
- Конвертация в `ImageEditorImage` для редактора

**Расширяемость:**
- Легко добавить новые парсеры (Telegram, Discord, etc.)
- Просто реализовать `IParser` и зарегистрировать в `ParserFactory`
- Единая архитектура для всех провайдеров

### Домен: Pipeline
**Расположение:** `src/main/domains/pipeline/`

**Назначение:** Управление цепочками обработки данных с типобезопасностью и потоковой передачей

**Компоненты:**
- **Core:**
  - `PipelineData<T>` - обертка над данными с контекстом
  - `TaskContext` - контекст задачи (sessionId, metadata)
  - `PipelineOrchestrator<TInput, TOutput>` - оркестратор с типобезопасным fluent API
- **Interfaces:**
  - `IPipelineStage<TIn, TOut>` - интерфейс стадии обработки
- **Stages:**
  - `WorkerStage<TIn, TOut>` - базовый класс для интеграции с TaskBalancer
- **Types:**
  - `ITaskContext` - интерфейс контекста
  - `ProgressInfo` - информация о прогрессе
  - `StageMetadata` - метаданные стадии

**Архитектура:**
```
PipelineOrchestrator.create<Input>()
  .addStage(stage1)  // IPipelineStage<Input, Intermediate>
  .addStage(stage2)  // IPipelineStage<Intermediate, Output>
  .execute(data, sessionId, signal)
        ↓
  AsyncGenerator - потоковая обработка
        ↓
  stage1.process() → yield result → stage2.process()
        ↓
  Results: Output[]
```

**Ключевые особенности:**
- **Типобезопасность:** Generic chain проверяет совместимость типов между стадиями на этапе компиляции
- **AsyncGenerator:** Потоковая передача результатов без буферизации
- **Контекст:** Метаданные сохраняются через всю цепочку
- **AbortSignal:** Нативный механизм отмены
- **Интеграция с TaskBalancer:** WorkerStage делегирует выполнение в пул воркеров
- **Прогресс:** Система весов для расчета прогресса выполнения

**Использование:**
```typescript
const balancer = container.resolve<ITaskBalancerService>(TASK_BALANCER_SERVICE_TOKEN);
const abortController = new AbortController();

// Создание типобезопасного pipeline
const pipeline = PipelineOrchestrator
  .create<{ number: number }>()
  .addStage(new FactorialStage(balancer))  // { number } → { result, duration }
  .addStage(new FormatStage())             // { result, duration } → string
  .onProgress((info) => {
    console.log(`${info.currentStage}: ${info.progress}%`);
  });

// Выполнение
const results = await pipeline.execute(
  { number: 10 },
  'session-123',
  abortController.signal
);
```

**Создание стадии:**
```typescript
// Стадия через TaskBalancer
class MyStage extends WorkerStage<InputType, OutputType> {
  constructor(taskBalancer: ITaskBalancerService) {
    super(taskBalancer, 'my-stage', 1.0, TaskPriority.NORMAL);
  }
  
  protected getTaskType(): string {
    return 'my-task'; // имя файла в tasks/
  }
}

// Кастомная стадия
class CustomStage implements IPipelineStage<TIn, TOut> {
  readonly name = 'custom';
  readonly weight = 0.5;
  
  async *process(data: PipelineData<TIn>, signal: AbortSignal) {
    // обработка
    yield data.withPayload(result);
  }
}
```

**Преимущества:**
- ✅ Типобезопасность предотвращает ошибки несовместимости типов
- ✅ Streaming обработка - результаты передаются сразу
- ✅ Контекст решает проблему передачи метаданных
- ✅ Чистая архитектура - DI, абстракции
- ✅ Интеграция с TaskBalancer для параллельной обработки

### Домен: MediaProcessing
**Расположение:** `src/main/domains/media-processing/`

**Назначение:** Адаптеры для работы с медиа-файлами (FFmpeg, Sharp)

**Компоненты:**
- **Interfaces:**
  - `IFFmpegAdapter` — интерфейс для FFmpeg операций (видео/анимация)
  - `ISharpAdapter` — интерфейс для Sharp операций (изображения)
- **Adapters:**
  - `FFmpegAdapter` — реализация через fluent-ffmpeg + ffmpeg-static
  - `SharpAdapter` — реализация через sharp
- **Types:**
  - `VideoMetadata` — метаданные видео (width, height, duration, fps, codec)
  - `ImageMetadata` — метаданные изображения (width, height, format, hasAlpha, isAnimated)
  - `MediaAsset` — базовый тип медиа-ресурса
  - `GridSettings` — настройки сетки для нарезки фрагментов
- **Enums:**
  - `MediaFormat` — форматы файлов (GIF, WEBP, WEBM, MP4, PNG, JPEG)
  - `MediaProcessingError` — ошибки обработки медиа

**DI зависимости:**
- `FFMPEG_PATH` — путь к ffmpeg бинарнику (ffmpeg-static)
- `FFPROBE_PATH` — путь к ffprobe бинарнику
- `sharp` — библиотека sharp (внедряется как зависимость)

**Архитектура:**
```
FFmpegAdapter → fluent-ffmpeg → ffmpeg-static бинарник
    ↓
IFFmpegAdapter (интерфейс для DI)

SharpAdapter → sharp library
    ↓
ISharpAdapter (интерфейс для DI)
```

**Использование:**
```typescript
// Получение адаптеров через DI
const ffmpeg = container.resolve<IFFmpegAdapter>(
  MEDIA_PROCESSING_TOKENS.FFMPEG_ADAPTER
);
const metadata = await ffmpeg.getMetadata('/path/to/video.mp4');

const sharpAdapter = container.resolve<ISharpAdapter>(
  MEDIA_PROCESSING_TOKENS.SHARP_ADAPTER
);
const resized = await sharpAdapter.resize(input, output, { width: 512 });
```

**Методы FFmpegAdapter:**
- `getMetadata(inputPath)` — получить метаданные видео через ffprobe
- `convert(inputPath, outputPath, options)` — конвертация формата
- `adjustDuration(inputPath, outputPath, targetDuration)` — изменение скорости
- `resize(inputPath, outputPath, width, height)` — изменение размера
- `extractFragment(inputPath, outputPath, options)` — crop региона

**Методы SharpAdapter:**
- `getMetadata(inputPath)` — получить метаданные изображения
- `resize(inputPath, outputPath, options)` — изменение размера
- `convert(inputPath, outputPath, options)` — конвертация формата
- `extract(inputPath, outputPath, options)` — извлечение региона
- `trim(inputPath, outputPath, threshold)` — обрезка пустых областей
- `tile(inputPath, outputDir, columns, rows)` — нарезка на фрагменты

### Домен: TaskBalancer
**Расположение:** `src/main/domains/task-balancer/`

**Назначение:** Балансировка и выполнение задач через пул Worker Threads

**Компоненты:**
- **Core:**
  - `WorkerPool` - управление пулом воркеров (создание, idle timeout, graceful shutdown)
  - `TaskQueue` - очередь с приоритетами и весами (CRITICAL → HIGH → NORMAL → LOW)
  - `ResourceCalculator` - вычисление доступных потоков (cpus - reserved)
- **Services:**
  - `ITaskBalancerService` - интерфейс сервиса
  - `TaskBalancerService` - координатор выполнения задач
- **Workers:**
  - `universal.worker.ts` - универсальный воркер с динамическим импортом задач
- **Types:**
  - `TaskInput` - входные данные (taskType, data, priority, weight)
  - `TaskResult` - результат выполнения
  - `QueuedTask` - задача в очереди
  - `BalancerStats` - статистика балансировщика
- **Enums:**
  - `TaskPriority` - LOW=0, NORMAL=1, HIGH=2, CRITICAL=3
  - `TaskStatus` - PENDING, RUNNING, COMPLETED, FAILED

**Архитектура:**
```
Client
  ↓
TaskBalancerService.execute(input)
  ↓
ResourceCalculator.canAcceptTask() ?
  ↓ YES                    ↓ NO
WorkerPool.execute()    TaskQueue.enqueue()
  ↓                         ↓
Worker Thread          Ждет освобождения
  ↓                         ↓
Result              processQueue() → WorkerPool
```

**Особенности:**
- **Динамическое управление ресурсами:** количество потоков = `os.cpus().length - RESERVED_THREADS`
- **Система весов:** задачи имеют вес 0.1-1.0, балансировщик не запускает новые если `currentLoad + taskWeight > maxThreads`
- **Приоритизация:** легкие задачи с высоким приоритетом "проскакивают" вперед тяжелых
- **Универсальный воркер:** динамический импорт `import(\`../../tasks/\${taskType}.task.js\`)`
- **Idle timeout:** неиспользуемые воркеры автоматически завершаются через 30 секунд
- **Graceful shutdown:** корректное завершение всех воркеров

**Конфигурация:**
```typescript
const config: BalancerConfig = {
  workerPath: path.resolve(__dirname, './workers/universal.worker.js'),
  maxThreads: 4,           // опционально, по умолчанию cpus - 1
  idleTimeout: 30000,      // опционально, по умолчанию 30 сек
  reservedThreads: 1       // опционально, по умолчанию 1
};
```

**Использование:**
```typescript
const balancer = container.resolve<ITaskBalancerService>(TASK_BALANCER_SERVICE_TOKEN);

// Выполнить задачу
const result = await balancer.execute({
  taskType: 'factorial',
  data: { number: 10 },
  priority: TaskPriority.HIGH,
  weight: 0.5
});

// Статистика
const stats = balancer.getStats();
// { activeWorkers, maxWorkers, queueSize, currentLoad, maxLoad }

// Shutdown
await balancer.shutdown();
```

**Создание задачи:**
```typescript
// src/main/domains/tasks/my-task.task.ts
export async function execute(data: MyInput): Promise<MyOutput> {
  // логика задачи
  return result;
}
```

**Регистрация:**
- Токен: `TASK_BALANCER_SERVICE_TOKEN`
- Автоматическая регистрация через `src/main/domains/index.ts`

### Домен: StickerPack
**Расположение:** `src/shared/domains/sticker-pack/`, `src/main/domains/sticker-pack/`

**Назначение:** Управление стикерпаками

**Компоненты shared (для IPC):**
- `IStickerPackFacade` (shared/interfaces) - интерфейс фасада для IPC proxy типизации
- `StickerPackType` (shared/enums) - ENUM типов (EMOJI, STICKER)
- `Fragment` (shared/types) - тип фрагмента { id, fileName, groupId }
- `GridCell` (shared/types) - тип ячейки сетки { fragmentId, row, col }
- `StickerPackManifest` (shared/types) - полный манифест пака

**Компоненты main:**
- `ManifestValidationError` (main) - ENUM ошибок валидации
- `StickerPackError` (main) - ENUM ошибок домена
- `StickerPackKey` (main) - ENUM ключей полей
- `StickerPackStoreKey` (main) - ENUM ключей хранилища
- `StickerPackFileName` (main) - ENUM имён файлов
- `StickerPackFolderName` (main) - ENUM имён папок
- `StickerPackServiceToken` (main) - ENUM токенов сервисов
- `StickerPackValidator` (main) - валидация названия, лимита фрагментов (200), консистентности сетки
- **Repositories:**
  - `IPackInfrastructureRepository` + `PackInfrastructureRepository` - управление папкой пака + индексом
  - `IManifestRepository` + `ManifestRepository` - работа с manifest.json
- **Services:**
  - `IManifestService` + `ManifestService` - бизнес-логика манифеста
  - `IStickerPackService` + `StickerPackService` - координатор (фасад)

**Архитектура (разделение ответственности):**
```
StickerPackService (координатор)
    ↓
    ├─ PackInfrastructureRepository (папка + индекс)
    │       ↓
    │   [StoreService, FileSystemService]
    │
    └─ ManifestService (бизнес-логика манифеста)
            ↓
        ManifestRepository (manifest.json)
            ↓
        [PackInfrastructureRepository, FileSystemService]
```

**Разделение ответственности:**
- **PackInfrastructureRepository** - создаёт/удаляет папку пака, управляет индексом в electron-store
- **ManifestRepository** - сохраняет/читает manifest.json
- **ManifestService** - бизнес-логика: создание манифеста, валидация, частичное обновление
- **StickerPackService** - координирует создание пака (инфраструктура + манифест)

**Структура хранения:**
```
electron-store:
{
  "stickerPacks": {
    "abc123": { id, name, folderName }
  }
}

userData/sticker-packs/
└── MyPack_abc123/
    ├── manifest.json (полный манифест)
    └── fragments/ (для будущего)
```

**Валидация:**
- Название обязательно (не пустое)
- Максимум 200 фрагментов в паке
- Все fragmentId в grid должны существовать в fragments

**Использование:**
```typescript
// Создание пака
const pack = await stickerPackService.create('MyPack', StickerPackType.STICKER);

// Обновление манифеста
await manifestService.updateManifest(pack.id, { 
  fragments: [...pack.fragments, newFragment] 
});

// Удаление пака
await stickerPackService.delete(pack.id);
```

**Расширяемость:**
В будущем легко добавить:
- `FragmentRepository` + `FragmentStorageService` - работа с файлами фрагментов
- `GridLayoutService` - алгоритмы размещения сетки
- Каждый Repository работает со своим типом данных, каждый Service инкапсулирует свою логику

## Правила для shared

**В shared размещаем ТОЛЬКО:**
1. **DTO типы** (types.ts) - для передачи через IPC между процессами
2. **ENUM для IPC** (enums.ts) - используются renderer'ом (типы данных, не внутренняя логика)
3. **Интерфейсы публичных сервисов** (interfaces/) - для IPC proxy типизации в renderer
   - IBotService, ISettingsService, IStickerPackFacade
   - Критерий: если сервис регистрируется через `factory.createService()` или `registry.register()`
4. **Интерфейсы границ процессов:**
   - IIPCBridge - граница IPC коммуникации
   - ILogTransport, IErrorTransport - транспорты между процессами
   - IStore, IStateManager - абстракции хранилищ
5. **Общие утилиты:**
   - ServiceFactory - фабрика с wrapper'ами
   - Wrappers (LoggerWrapper, ErrorWrapper)

**НЕ размещаем в shared:**
- ❌ Внутренние ENUM (валидация, ключи хранилища, токены) → main/enums.ts
- ❌ Константы (DEFAULT_SETTINGS, SERVICE_TOKEN) → main/constants.ts
- ❌ Интерфейсы внутренних сервисов (IStickerPackService, IManifestService) → main рядом с реализацией
- ❌ Интерфейсы репозиториев (IBotRepository, ISettingsRepository) → main рядом с реализацией
- ❌ Entity, Validator → только в main
- ❌ Реализации сервисов → только в main/renderer
- ❌ Файловая система (IFileSystemService) → только в main

**Использование IPC proxy в renderer:**
```typescript
import { IBotService } from '@/shared/domains/bot/interfaces/IBotService';
import { IStickerPackFacade } from '@/shared/domains/sticker-pack/interfaces/IStickerPackFacade';

const botService = ipcProxy.wrap<IBotService>(ServiceName.BOT_SERVICE);
const stickerPacks = ipcProxy.wrap<IStickerPackFacade>(ServiceName.STICKER_PACK_FACADE);
```

## История изменений

### 2024-02-26 (Создание домена StickerPack)
- **Создан домен FileSystem для абстракции работы с FS**
- Интерфейс IFileSystemService с методами: writeFile, readFile, mkdir, readdir, rm, exists
- Реализация FileSystemService через Node.js fs.promises
- Регистрация в Container с токеном FILESYSTEM_SERVICE_TOKEN
- **Создан домен StickerPack для управления стикерпаками**
- Shared: типы (Fragment, GridCell, StickerPackManifest), ENUM (StickerPackType, ошибки)
- Main: StickerPackValidator, Repository, Service
- Гибридное хранение: electron-store (индекс) + файлы (полный манифест)
- Структура: userData/sticker-packs/{name}_{id}/manifest.json
- Валидация: название обязательно, максимум 200 фрагментов, консистентность сетки
- Зависимости: StoreService (индекс), FileSystemService (файлы), IdGenerator (ID)
- **Уточнены правила для shared:**
- Интерфейсы сервисов (IBotService, ISettingsService) перемещены из shared в main
- В shared только DTO, ENUM и интерфейсы границ процессов (IPC, транспорты)
- Документированы правила что размещать в shared, а что в main

### 2024-02-26 (Рефакторинг фабрик)
- **Устранение Service Locator антипаттерна**
- Убрано глобальное состояние из `mainFactory.ts`
- `createMainFactory()` теперь принимает зависимости явно (loggerService, errorService)
- **Создана иерархия фабрик:**
  - `ServiceFactory` (shared) - базовая фабрика с wrapper'ами
  - `createMainFactory()` - создаёт ServiceFactory с logger и error wrapper'ами
  - `IPCWrapperFactory` (ipc) - фабрика для IPC wrapper'ов
  - `MainServiceFactory` (main) - композиция базовой + IPC
- **MainServiceFactory методы:**
  - `createService(instance, serviceName)` - с IPC wrapper'ом (для публичных сервисов)
  - `createInternal(instance)` - без IPC (для внутренних сервисов)
- **Регистрация в контейнере:**
  - `MAIN_FACTORY_TOKEN` - базовая ServiceFactory
  - `IPC_WRAPPER_FACTORY_TOKEN` - IPCWrapperFactory
  - `MAIN_SERVICE_FACTORY_TOKEN` - MainServiceFactory (композиция)
- **Упрощена регистрация сервисов:**
  - Один вызов: `factory.createService(service, TOKEN)`
  - Явные зависимости через `container.resolve()`
  - bot, settings → `createService()` (IPC)
  - store → `createInternal()` (без IPC)

### 2024-02-26 (Реструктуризация)
- **Приведение к структурному единству main доменов**
- Интерфейсы теперь рядом с реализацией в соответствующих папках
- Структура main домена:
  - `repositories/` - IRepository.ts + Repository.ts
  - `services/` - IService.ts + Service.ts
  - `Entity.ts`, `Validator.ts` в корне домена
  - `constants.ts`, `index.ts` в корне домена
- Реструктурирован домен `bot`:
  - `repositories/IBotRepository.ts` + `repositories/BotRepository.ts`
  - `services/IBotService.ts` + `services/BotService.ts`
  - `BotEntity.ts`, `BotValidator.ts` в корне
- Реструктурирован домен `settings`:
  - `repositories/ISettingsRepository.ts` + `repositories/SettingsRepository.ts`
  - `services/ISettingsService.ts` + `services/SettingsService.ts`
  - `SettingsEntity.ts` в корне
- **Очистка shared/domains/bot и shared/domains/settings**
- Удалены интерфейсы сервисов из shared (перенесены в main):
  - `bot/interfaces/IBotService.ts` → `main/domains/bot/services/IBotService.ts`
  - `settings/interfaces/ISettingsService.ts` → `main/domains/settings/services/ISettingsService.ts`
- Оставлены только DTO и ENUM:
  - `types.ts` (Bot, AppSettings DTO)
  - `enums.ts` (ключи, ошибки, константы)

### 2024-02-26
- Рефакторинг домена `bot` с применением Clean Architecture
- Создан `BotEntity` с валидацией через `BotValidator`
- Создан `BotRepository` для изоляции работы с хранилищем
- Создан `BotValidator` для валидации полей (id, token, userId)
- Добавлен `BotValidationError` enum для ошибок валидации
- Добавлен `IBotRepository` интерфейс
- Обновлен `BotService` для работы через Repository
- Архитектура: BotService → BotRepository → StoreService
- Валидация: все поля обязательны, проверка при создании/обновлении
- Без хардкода: все строки в enum (BotValidationError) и константах (BOT_STORE_KEY)
- Рефакторинг домена `settings` с применением Clean Architecture
- Создан `SettingsEntity` с валидацией темы
- Создан `SettingsRepository` для изоляции работы с хранилищем
- Добавлен `ISettingsRepository` интерфейс
- Обновлен `SettingsService` для работы через Repository
- Архитектура: SettingsService → SettingsRepository → StoreService
- Добавлены правила Entity + Repository паттерна в rules.md
- Entity, Validator, Repository - только в main процессе
- DTO и интерфейсы для IPC - в shared

### 2024-02-25
- Создан домен `settings` для управления настройками приложения
- Реализован SettingsService с generic методами и merge дефолтов
- Добавлена настройка theme (LIGHT, DARK, SYSTEM)
- Создан домен `bot` для управления ботами Telegram
- Реализован BotService с CRUD операциями
- Создана утилита IdGenerator с интерфейсом IIdGenerator
- Реализован NanoIdGenerator на основе nanoid
- Все утилиты и сервисы следуют принципу Dependency Inversion
- Исправлено использование container (экземпляр) вместо Container (класс)
- Упрощен ServiceFactory.create - используется явный new

### 2024-02-24
- Переход на децентрализованные токены сервисов
- Удален `ServiceToken` enum из `shared/domains/core`
- Каждый домен теперь определяет свой токен в `constants.ts`
- Создан `getMainFactory()` - singleton фабрика для main процесса
- Регистрация сервисов перенесена в `index.ts` каждого домена
- Создан `src/main/domains/index.ts` для централизованного импорта
- StoreService теперь автоматически оборачивается через mainFactory
- LoggerService и ErrorService регистрируются без wrapper'ов (используются в фабрике)
- Добавлена функция `initializeIPCBridge(window)` для регистрации с BrowserWindow

### 2024-02-23
- Созданы фабрики для упрощения создания ServiceFactory
- Добавлен `createMainFactory` в `src/main/factories/`
- Добавлен `createRendererFactory` в `src/renderer/factories/`
- Режим разработки: всегда подмешиваются LoggerWrapper и ErrorWrapper
- Фабрики инкапсулируют создание транспортов и wrapper'ов

### 2024-02-22
- Создан домен `Container` для управления зависимостями
- Добавлен `IContainer` (shared) - интерфейс контейнера зависимостей
- Реализован `Container` (main) - Singleton контейнер с поддержкой async фабрик
- Добавлен `ServiceToken` - ENUM токенов для регистрации сервисов
- Добавлен `ContainerError` - ENUM ошибок контейнера
- Реализована защита от циклических зависимостей
- Реализован паттерн авторегистрации сервисов через импорты
- Создан `main/index.ts` - точка входа с импортами для авторегистрации
- Lazy initialization - сервисы создаются при первом обращении

### 2024-12-XX
- Создан домен `store` для управления постоянным хранилищем
- Реализован паттерн "Main as Backend" - electron-store как источник истины
- Добавлен `StoreSyncAdapter` для автоматической синхронизации с Redux
- Создан `ElectronStoreAdapter` для работы с electron-store
- Добавлен `StoreService` с отправкой IPC событий при изменениях
- Создан `ReduxStateManager` - адаптер для Redux
- Разделение данных: persistent (electron-store) и ephemeral (только Redux)
- Создан домен `ipc` для межпроцессной коммуникации
- Реализован `ServiceRegistry` для регистрации сервисов в main
- Реализован `ServiceProxy` для вызова сервисов из renderer
- Создан `LoggerService` с батчингом (debounce + batch size)
- Добавлены транспорты: `ConsoleTransport`, `LocalTransport`
- Обновлен `IPCTransport` для использования `ServiceProxy`
- Обновлен `FileTransport` - убрано дублирование в консоль
- Применён паттерн Strategy для транспортов логирования
- Убраны префиксы из названий файлов (единый стиль)

### 2024-02-21
- Инициализация проекта
- Создание базовой структуры документации

### 2024-02-26 (Декларативная конфигурация фабрик)
- **Создана система декларативной конфигурации wrapper'ов**
- **Структура:**
  - `config/environment.ts` - конфигурация окружения (NODE_ENV, isDev, isProd)
  - `config/wrappers.config.ts` - конфигурация wrapper'ов для разных окружений
  - `factories/wrapperRegistry.ts` - реестр доступных wrapper'ов
- **WrapperRegistry:**
  - `WrapperType` enum - типы wrapper'ов (LOGGER, ERROR)
  - `WRAPPER_REGISTRY` - маппинг типа на фабрику создания wrapper'а
  - Каждый wrapper создаётся через фабричную функцию
- **Конфигурация по окружениям:**
  - `development`: [LOGGER, ERROR] - все wrapper'ы
  - `production`: [ERROR] - только обработка ошибок
  - `test`: [] - без wrapper'ов
- **Преимущества:**
  - Нет if'ов - всё через цикл и маппинг
  - Декларативно - конфигурация отдельно от логики
  - Легко расширять - добавил в реестр, добавил в конфиг
  - Порядок wrapper'ов определяется массивом
- **Использование:**
  ```typescript
  const enabledWrappers = getWrapperConfig(ENV.NODE_ENV);
  return createMainFactory(services, enabledWrappers);
  ```


### 2024-02-26 (Реорганизация доменов Bot, Settings, StickerPack)
- **Разделение main-only и IPC кода**
- **Домен Bot:**
  - Создан `main/domains/bot/enums.ts` (BotKey, BotValidationError, BotStoreKey)
  - Удален `shared/domains/bot/enums.ts`
  - Оставлен `shared/domains/bot/interfaces/IBotService.ts` для IPC proxy
  - Оставлен `shared/domains/bot/types.ts` (Bot DTO)
- **Домен Settings:**
  - Создан `main/domains/settings/enums.ts` (SettingsKey, SettingsStoreKey)
  - Обновлен `main/domains/settings/constants.ts` (+ DEFAULT_SETTINGS)
  - Обновлен `shared/domains/settings/types.ts` (Theme как union type вместо enum)
  - Удалены `shared/domains/settings/enums.ts` и `constants.ts`
  - Оставлен `shared/domains/settings/interfaces/ISettingsService.ts` для IPC proxy
- **Домен StickerPack:**
  - Создан `shared/domains/sticker-pack/interfaces/IStickerPackFacade.ts`
  - Перенесен интерфейс фасада из main в shared для IPC proxy
  - Удален `main/domains/sticker-pack/facade/IStickerPackFacade.ts`
- **Принцип разделения:**
  - shared/interfaces/ - ТОЛЬКО интерфейсы публичных сервисов для IPC proxy типизации
  - shared/types.ts - DTO для передачи через IPC
  - shared/enums.ts - ENUM которые нужны renderer (типы данных, не внутренняя логика)
  - main/enums.ts - внутренние ENUM (валидация, ключи хранилища, внутренняя логика)
  - main/constants.ts - константы (DEFAULT_SETTINGS, SERVICE_TOKEN)
- **Критерий публичности сервиса:**
  - Если регистрируется через `factory.createService()` или `registry.register()` → интерфейс в shared
  - Внутренние сервисы (IStickerPackService, IManifestService, IFragmentService) → интерфейс в main
- **Обновлены правила и документация:**
  - Добавлена секция "IPC и shared домены" в rules.md
  - Обновлена секция "Правила для shared" в codebase.md
  - Документирован паттерн использования IPC proxy в renderer

### 2024-02-26 (Архитектура синхронизации данных)
- **Создан механизм централизованной синхронизации данных с renderer**
- **Проблема:** Циклическая зависимость StoreService → IPCBridge → BrowserWindow
- **Решение:** Observer Pattern + разделение ответственности
- **Компоненты:**
  - `IDataChangeNotifier` (shared/core) - интерфейс для уведомлений об изменениях
  - `DataChangeNotifier` (main/store) - EventEmitter для генерации событий
  - `StoreSyncService` (main/store) - слушает события и отправляет в renderer через IPC
  - `DataChangeEvent` (main/store/enums) - ENUM событий (CHANGE, CLEAR)
  - `DataDomainKey` (shared/store/enums) - ENUM доменов (BOTS, SETTINGS, STICKER_PACKS)
  - `StickerPackDataKey` (shared/store/enums) - ENUM типов данных пака (MANIFEST, FRAGMENTS)
- **Архитектура:**
  ```
  Service → Repository → StoreService
                              ↓
                        notifier.notifyChange(domain, data)
                              ↓
                        DataChangeNotifier (EventEmitter)
                              ↓
                        StoreSyncService (слушает события)
                              ↓
                        IPCBridge.send('data:update', ...)
                              ↓
                        Renderer
  ```
- **Порядок инициализации:**
  1. Регистрация доменов (import './domains')
  2. createWindow()
  3. initializeIPCBridge(window)
  4. Создание StoreSyncService (связывает notifier с IPC)
  5. Resolve других сервисов
- **Преимущества:**
  - ✅ Единая точка синхронизации для electron-store И файлов
  - ✅ Сервисы не зависят от IPC
  - ✅ Автоматическая синхронизация любых изменений
  - ✅ Гибкость - можно уведомлять о чем угодно
  - ✅ Детализация - `bots`, `stickerPack:123:manifest`
- **Использование в сервисах:**
  ```typescript
  // StoreService - автоматически уведомляет при set/delete
  storeService.set('bots', data); // → notifier.notifyChange('bots', data)
  
  // ManifestService - явно уведомляет после работы с файлами
  await manifestRepo.save(path, manifest);
  notifier.notifyChange(`stickerPack:${id}:manifest`, manifest);
  ```
- **Константы и ENUM:**
  - Все события в DataChangeEvent enum
  - Все домены в DataDomainKey enum
  - IPC канал в IPCChannel.DATA_UPDATE
  - Без хардкода строк


### 2024-02-26 (Организация Entity в отдельные папки)
- **Вынесены Entity в папки entities/ для доменов bot, settings, sticker-pack**
- **Структура entities/:**
  - Entity.ts - доменная модель
  - IEntityFactory.ts, EntityFactory.ts - фабрика создания
  - IEntityMapper.ts, EntityMapper.ts - маппер Entity ↔ DTO
  - Validator.ts - валидатор (опционально)
- **Обновлены импорты:**
  - Repositories импортируют из `../entities/`
  - Services импортируют из `../entities/`
  - index.ts импортирует из `./entities/`
- **Типизация Container.resolve:**
  - Все resolve теперь используют интерфейсы
  - `container.resolve<IEntityFactory>(TOKEN)`
  - `container.resolve<IEntityMapper>(TOKEN)`
  - `container.resolve<IRepository>(TOKEN)`
- **Правило:** Entity выносим в entities/ если разрастается (Factory + Mapper + Validator)


### 2024-02-26 (Устранение утечки абстракций и хардкода)
- **Исправлено использование констант в сервисах**
- **SettingsService:**
  - Убрано использование `DEFAULT_SETTINGS` напрямую
  - Все дефолтные значения через `entityFactory.default()`
  - Метод `set()` правильно обновляет entity через DTO
- **SettingsEntity:**
  - Убран импорт `DEFAULT_SETTINGS`
  - Дефолтное значение инкапсулировано: `DefaultTheme.SYSTEM`
  - Массив валидных тем вынесен в константу класса `VALID_THEMES`
- **Устранен хардкод строк в ошибках:**
  - settings: `SettingsValidationError`, `DefaultTheme`
  - bot: `BotServiceError.NOT_FOUND`
  - sticker-pack: `StickerPackValidationError`, `FragmentValidationError`, `FragmentServiceError`
- **Принцип:** Сервисы не знают о константах, вся логика дефолтов в Factory/Entity
- **Результат:** Единая точка истины, соблюдение Clean Architecture и DRY

### 2024-02-26 (Добавление поля name в Bot и UI для управления ботами)
- **Расширен домен Bot:**
  - Добавлено поле `name` в `Bot` DTO (shared/types.ts)
  - Добавлена валидация `name` в `BotValidator`
  - Обновлены `BotEntity`, `BotEntityFactory`, `BotEntityMapper` с полем `name`
  - Обновлен `IBotService.create()` - теперь принимает `name, token, userId`
  - Обновлен `BotService` для работы с `name`
- **Создан UI для управления ботами:**
  - `AddBotDialog` - диалог добавления бота (name, token, userId)
  - `EditBotDialog` - диалог редактирования бота
  - Интеграция в Settings с кнопками редактирования и удаления
  - Удаление с подтверждением через `useConfirmation`
  - Токен скрыт в списке ботов, показывается только name и userId
- **Создан переиспользуемый компонент DeleteButton:**
  - `DeleteButton` в `components/ui/DeleteButton/`
  - Красная кнопка с иконкой корзины
  - Использует `color="red"` для красного цвета
- **Исправлена логика hasNoBots:**
  - `App.tsx` использует `hasNoBots` из `useAppInitialization`
  - Диалог добавления бота автоматически открывается при первом запуске
  - `canClose={!hasNoBots}` - диалог нельзя закрыть при отсутствии ботов

### 2024-02-26 (Создание домена Pipeline)
- **Создан домен Pipeline для управления цепочками обработки данных**
- **Структура домена:**
  - `core/PipelineData.ts` - обертка над данными с контекстом
  - `core/TaskContext.ts` - контекст задачи (sessionId, metadata)
  - `core/PipelineOrchestrator.ts` - оркестратор с типобезопасным fluent API
  - `interfaces/IPipelineStage.ts` - интерфейс стадии обработки
  - `stages/WorkerStage.ts` - базовый класс для интеграции с TaskBalancer
- **Ключевые особенности:**
  - **Типобезопасность:** Generic chain `PipelineOrchestrator<TInput, TOutput>` проверяет совместимость типов на этапе компиляции
  - **AsyncGenerator:** Потоковая передача результатов без буферизации
  - **PipelineData + TaskContext:** Метаданные сохраняются через всю цепочку
  - **AbortSignal:** Нативный механизм отмены интегрирован во все стадии
  - **Интеграция с TaskBalancer:** WorkerStage делегирует выполнение в пул воркеров через DI
  - **Система весов:** Каждая стадия имеет weight для расчета прогресса
  - **Fluent API:** `.addStage()` с автоматической проверкой типов
- **Преимущества подхода:**
  - Типобезопасность предотвращает ошибки несовместимости типов
  - Streaming обработка - результаты передаются сразу, не накапливаются
  - Контекст решает проблему передачи метаданных
  - Чистая архитектура - DI, абстракции, разделение ответственности
- **Пример использования:** `example.ts` с демонстрацией типобезопасности и отмены

### 2024-02-26 (Создание домена TaskBalancer)
- **Создан домен TaskBalancer для балансировки задач через Worker Threads**
- **Собственная реализация пула воркеров** (без внешних библиотек типа Piscina)
- **Структура домена:**
  - `core/WorkerPool.ts` - управление пулом воркеров (создание, idle timeout, graceful shutdown)
  - `core/TaskQueue.ts` - очередь с приоритетами и весами
  - `core/ResourceCalculator.ts` - вычисление доступных потоков
  - `services/TaskBalancerService.ts` - координатор выполнения задач
  - `workers/universal.worker.ts` - универсальный воркер с динамическим импортом
- **Ключевые особенности:**
  - Динамическое управление ресурсами: `maxThreads = os.cpus().length - RESERVED_THREADS`
  - Система весов: задачи имеют вес 0.1-1.0, балансировщик проверяет `currentLoad + taskWeight <= maxThreads`
  - Приоритизация: CRITICAL → HIGH → NORMAL → LOW, легкие задачи вперед при равном приоритете
  - Универсальный воркер: динамический импорт `import(\`../../tasks/\${taskType}.task.js\`)`
  - Idle timeout: неиспользуемые воркеры завершаются через 30 секунд
  - Graceful shutdown: корректное завершение всех воркеров
- **Конфигурация:**
  - `RESERVED_THREADS = 1` - резерв для системы и UI
  - `IDLE_TIMEOUT = 30000` - таймаут простоя воркера
  - `MIN_WEIGHT = 0.1`, `MAX_WEIGHT = 1.0` - диапазон весов
- **Регистрация:**
  - Токен: `TASK_BALANCER_SERVICE_TOKEN`
  - Автоматическая регистрация через `src/main/domains/index.ts`
- **Пример задачи:** `src/main/domains/tasks/factorial.task.ts` для тестирования
- **Преимущества подхода:**
  - Полный контроль над очередью и приоритетами
  - Нет проблем со сборкой (нативный Node.js API)
  - Простая интеграция с архитектурой проекта
  - Меньше зависимостей

### 2024-02-26 (Создание UI для стикерпаков)
- **Создан диалог создания стикерпака:**
  - `CreateStickerPackDialog` в `StickerPacks/components/CreateStickerPackDialog/`
  - Поля: название (TextField) и тип (Select: Эмодзи/Стикеры)
  - Использует `StickerPackType` enum из домена
- **Создана страница библиотеки стикерпаков:**
  - `StickerPacks` страница с адаптивной сеткой карточек
  - `StickerPackCard` - квадратная карточка с:
    - Превью (заглушка с иконкой ImageIcon)
    - Название стикерпака
    - Тип (Эмодзи/Стикеры)
    - Количество фрагментов
    - Кнопки действий (открыть папку, удалить) при hover
  - Адаптивная сетка: `grid-template-columns: repeat(auto-fill, minmax(200px, 1fr))`
  - Кнопки действий появляются при наведении с плавной анимацией
- **Интеграция с навигацией:**
  - Добавлен роут `/sticker-packs` в `App.tsx`
  - Кнопка "Создать стикерпак" на главной странице автоматически открывает диалог
  - Используется `location.state.action` для передачи действия
  - Кнопка "Мои стикерпаки" ведет на страницу без открытия диалога
- **Функционал карточек:**
  - Клик по карточке - открытие стикерпака (заглушка)
  - Кнопка открытия папки - `OpenInNewWindowIcon`, использует `shell.openPath()`
  - Кнопка удаления - красная с `TrashIcon`, с подтверждением через `useConfirm`
  - `stopPropagation` предотвращает клик по карточке при нажатии на кнопки
  - Обе кнопки `size="1"` для одинакового размера
- **Интеграция с фасадом:**
  - Создан хук `useStickerPackFacade` для типизированного IPC доступа
  - `useStickerPacks` использует фасад для CRUD операций
  - Создание: `facade.createPack(name, type)`
  - Загрузка: `facade.getAllPacks()` с маппингом в `PackCardData`
  - Удаление: `facade.deletePack(id)` с подтверждением
  - Открытие папки: `facade.openPackFolder(id)`
- **Устранен хардкод:**
  - Добавлен `NotificationGroup` enum в `main/domains/sticker-pack/enums.ts`
  - Все строковые токены уведомлений заменены на enum
  - Константы диалога удаления вынесены в `constants.ts`
- **Исправления:**
  - `BaseRepository.isEntity()` проверяет наличие метода `toDTO`
  - `StickerPackEntityMapper.fromDTO()` использует `fromStorage()`
  - `useConfirm` вместо `useConfirmation` для доступа к контексту

### 2024-02-27 (Создание домена Grid)
- **Создан домен Grid для управления умной сеткой стикерпаков**
- **Структура домена:**
  - `entities/` - GridEntity, IGridEntityMapper, GridEntityMapper
  - `services/` - IGridService, GridService
  - `utils/` - ISmartGridCalculator, SmartGridCalculator
  - `enums.ts` - GridValidationError
  - `constants.ts` - GRID_COLUMNS, токены
- **Компоненты shared (для IPC):**
  - `GridCell` (shared/types) - ячейка сетки { id, fragmentId, groupId, row, col }
  - `FragmentGroup` (shared/types) - группа фрагментов { id, fragmentIds }
  - `GridLayout` (shared/types) - полная раскладка { columns, rows, cells, groups }
- **Компоненты main:**
  - `GridEntity` - сущность с валидацией (проверка columns по типу пака, границ ячеек)
  - `GridEntityMapper` - маппер Entity ↔ DTO
  - `GridService` - бизнес-логика, обертка над SmartGridCalculator
  - `SmartGridCalculator` - алгоритм умной сетки
- **Архитектура:**
  ```
  StickerPackFacade
      ↓
  GridService (бизнес-логика)
      ↓
  SmartGridCalculator (алгоритм)
      ↓
  GridEntity (валидация)
      ↓
  ManifestService.updateWithGrid(gridEntity)
      ↓
  GridEntityMapper.toDTO()
      ↓
  ManifestRepository.update()
  ```
- **SmartGridCalculator возможности:**
  - `calculateInitialLayout()` - создание начальной сетки с группировкой по groupId
  - `addFragments()` - добавление новых фрагментов с пересчетом
  - `moveGroup()` - перемещение группы с приоритетом и обтеканием
  - `moveFragment()` - перемещение фрагмента (swap)
  - `clearCell()` - очистка ячейки (fragmentId = null, без пересчета)
  - `removeGroup()` - удаление группы с полным пересчетом
- **Алгоритм умной сетки:**
  - Группировка фрагментов по `groupId`
  - Умное размещение с заполнением пустот
  - Приоритетное размещение при перемещении
  - Обтекание других групп
  - Автоматическое определение ширины сетки (5 для STICKER, 8 для EMOJI)
- **Интеграция с ManifestService:**
  - Добавлен метод `updateWithGrid(folderPath, gridEntity)`
  - ManifestService принимает GridEntity
  - Использует GridEntityMapper для преобразования в DTO
  - Обновляет manifest.gridLayout
- **Интеграция с StickerPackFacade:**
  - Добавлены методы: `initializeGrid`, `getGrid`, `addFragmentsToGrid`, `moveGroupInGrid`, `moveFragmentInGrid`, `clearCellInGrid`, `removeGroupFromGrid`
  - Фасад использует GridService (не Calculator напрямую)
  - Получает GridEntity от GridService
  - Передает GridEntity в ManifestService.updateWithGrid()
- **DI регистрация:**
  - GridEntityMapper → Container
  - SmartGridCalculator → Container (зависит от IIdGenerator)
  - GridService → Container (зависит от SmartGridCalculator)
  - ManifestService → получает GridEntityMapper
  - StickerPackFacade → получает GridService
- **Хранение:**
  - `gridLayout` добавлен в `StickerPackManifest`
  - Сохраняется в `manifest.json` через ManifestService
- **Валидация:**
  - Проверка соответствия columns типу пака (5 или 8)
  - Проверка границ ячеек (col < columns)
- **Особенности реализации:**
  - Удаление фрагмента → просто `fragmentId: null` в ячейке (без пересчета)
  - Удаление группы → полный пересчет сетки
  - Перемещение группы → приоритетное размещение с обтеканием
  - Чистая архитектура: GridService → GridEntity → GridMapper → ManifestService

### 2024-02-27 (Создание редактора изображений)
- **Создана страница EditPack для редактирования изображений**
- **Структура:**
  - `EditPack.tsx` - главная страница с PageLayout
  - `useImageEditorSettings.ts` - хук управления настройками (глобальные + индивидуальные)
  - `components/Canvas.tsx` - отображение изображения с квадратной сеткой
  - `components/ImageGallery.tsx` - галерея с кнопкой "Все" и удалением
  - `components/Sidebar.tsx` - панель настроек
  - `components/Counter.tsx` - переиспользуемый счетчик с input
  - `hooks/useCanvasDimensions.ts` - расчет размеров canvas
  - `hooks/useImageThumbnails.ts` - конвертация Blob → thumbnails
  - `hooks/useFileUpload.ts` - загрузка локальных файлов
  - `hooks/useZoomWheel.ts` - управление масштабом Ctrl+колесико
- **Конфигурация настроек:**
  - `config/imageEditor.config.ts` - настройки, опции, дефолты
  - Enum `RescaleQuality` (NONE, SHARP, SMOOTH)
  - Порядок: сетка → обрезка → рескейл → анимация → кнопки
- **Ключевые особенности:**
  - **Глобальные и индивидуальные настройки:** изменение глобальных сбрасывает индивидуальные с подтверждением
  - **Zoom исключен из настроек:** всегда глобальный, не участвует в проверке индивидуальных
  - **Квадратная сетка:** размер ячейки одинаковый, изображение вписывается в сетку
  - **Шахматный паттерн прозрачности:** только на canvas, не на всей области
  - **Управление масштабом:** кнопки + Ctrl+колесико мыши
  - **Загрузка изображений:** локальные файлы через input[type="file"]
- **Навигация:**
  - Создание пака → `/pack/:packId` (PackView)
  - Клик по паку → `/pack/:packId` (PackView)
  - Кнопка "Добавить изображения" → `/edit-pack/:packId` (EditPack)
- **Страница PackView:**
  - Просмотр пака с кнопкой "Добавить изображения"
  - Переход в редактор по кнопке
- **UI улучшения:**
  - Sidebar увеличен до 290px (было 240px)
  - Кнопки на всю ширину
  - Counter с input без нативных стрелочек
  - Цвет текста `var(--gray-11)` для лучшей читаемости
- **Архитектура:**
  - Максимально глупые компоненты
  - Вся логика в хуках
  - Все значения в константах и enum
  - Использует PageLayout как все страницы

### 2024-02-27 (Реализация IPC прогресса обработки изображений)
- **Проблема:** Callback функции не могут передаваться через IPC (ошибка "An object could not be cloned")
- **Решение:** IPC события вместо callback'ов
- **Архитектура:**
  ```
  Main: PipelineOrchestrator.onProgress()
      ↓
  ImageProcessingService (получает IIPCBridge через DI)
      ↓
  ipcBridge.send(ImageProcessingIPCChannel.PROGRESS, info)
      ↓
  Renderer: window.electron.ipc.on(ImageProcessingIPCChannel.PROGRESS)
      ↓
  useImageProcessing → useImageSaver → setProgress(info.progress)
  ```
- **Изменения:**
  - Убран параметр `onProgress` из `IImageProcessingService.processImages()`
  - `ImageProcessingService` получает `IIPCBridge` через DI
  - `PipelineOrchestrator.onProgress()` отправляет события через IPC
  - `useImageProcessing` подписывается на IPC события и передает в callback
  - `useImageSaver` обновляет UI через `setProgress(info.progress)`
- **Константы:**
  - Добавлен `ImageProcessingIPCChannel.PROGRESS` enum в `shared/domains/image-processing/enums.ts`
  - Убран хардкод `'image-processing:progress'`
- **Преимущества:**
  - ✅ Функции не передаются через IPC
  - ✅ Прогресс обновляется в реальном времени
  - ✅ Чистая архитектура - IPC изолирован в сервисе
  - ✅ Без хардкода - все в enum

### 2024-02-27 (Реализация кастомного протокола для загрузки изображений)
- **Проблема:** Браузер блокирует загрузку локальных файлов через `file://` протокол
- **Решение:** Кастомный протокол `sticker-packs://` для безопасного доступа к файлам
- **Архитектура:**
  ```
  Renderer: <img src="sticker-packs://PackName_PackId/fragments/file.webp" />
      ↓
  Electron Protocol Handler
      ↓
  ProtocolService.registerHandlers()
      ↓
  net.fetch(pathToFileURL(filePath))
  ```
- **Компоненты:**
  - `ProtocolService` (main/protocol) - регистрация схемы и обработчика
  - `ProtocolScheme.STICKER_PACKS` - enum для схемы
  - `ProtocolError` - enum ошибок протокола
- **Регистрация:**
  - `registerSchemes()` - до `app.whenReady()` с привилегиями (secure, bypassCSP, stream)
  - `registerHandlers()` - после инициализации logger
- **Обработчик:**
  - Case-insensitive поиск папок
  - Формат URL: `sticker-packs://{PackName}_{PackId}/fragments/{fileName}`
  - Возвращает файл через `net.fetch(pathToFileURL())`
- **Интеграция:**
  - `usePackGrid` формирует URL с кастомным протоколом
  - `GridView` использует URL для отображения фрагментов
- **Преимущества:**
  - ✅ Безопасный доступ к локальным файлам
  - ✅ Обход ограничений браузера
  - ✅ Поддержка streaming
  - ✅ Без хардкода - все в enum

### 2024-02-27 (Оптимизация rescale с центрированием)
- **Проблема:** Фрагменты не центрированы в ячейках, нет отступов
- **Анализ старой версии:**
  - Центрирование происходило ДО нарезки в rescale handler
  - Добавлялся border (2px прозрачности)
  - Изображение центрировалось в canvas через padding
  - Затем масштабировалось до финального размера (двойное масштабирование!)
- **Новый оптимизированный подход:**
  1. **Расчет размеров canvas** - `cellSize * columns x cellSize * rows`
  2. **Расчет размера изображения** - пропорционально с учетом border
  3. **Масштабирование контента** - resize до рассчитанного размера + применение качества (lanczos3/nearest)
  4. **Добавление border** - 2px прозрачности через extend
  5. **Центрирование** - padding до размера canvas через extend
  6. **Сохранение** - отцентрированный canvas в файл
  7. **Нарезка** (отдельный процесс) - fragment.task.ts режет готовый canvas
- **Преимущества:**
  - ✅ **Одно масштабирование** - улучшение качества применяется только к контенту
  - ✅ **Padding не обрабатывается** - прозрачность просто добавляется
  - ✅ **Оптимальная производительность** - нет лишних операций с пустыми пикселями
  - ✅ **Лучшее качество** - нет двойного масштабирования и деградации
- **Реализация:**
  - Добавлен метод `extend()` в `SharpAdapter` для добавления отступов
  - Полностью переписан `rescale.task.ts` с новой последовательностью
  - Константа `BORDER_SIZE = 2` для прозрачных границ
- **Результат:** Фрагменты корректно центрированы в ячейках с отступами

### 2024-02-27 (Исправление проблемы перезаписи временных файлов)
- **Проблема:** При параллельной обработке изображений один файл заменял другие
- **Корневая причина:** Одинаковые имена временных файлов
  - `rescale_step1.${extension}` - все изображения использовали одно имя
  - `_trim.${extension}` - суффикс без уникального ID
  - `_static.webp`, `_anim.gif` - фиксированные суффиксы
- **Решение:** Добавление уникального ID к каждому временному файлу
- **Реализация:**
  - Используется существующая утилита `nanoid()` для генерации ID
  - Все задачи обновлены:
    - `rescale.task.ts`: `${uniqueId}_rescale_step1.${extension}`
    - `trim.task.ts`: `${uniqueId}_trim.${extension}`
    - `detect-convert.task.ts`: `${uniqueId}_static.webp`, `${uniqueId}_anim.gif`
  - Каждая задача генерирует свой `uniqueId = nanoid()` в начале выполнения
- **Преимущества:**
  - ✅ **Нет конфликтов** - каждый файл уникален
  - ✅ **Параллельная обработка** - изображения не перезаписывают друг друга
  - ✅ **Использование существующей утилиты** - nanoid уже в проекте
  - ✅ **Консистентность** - все задачи используют одинаковый подход
- **Результат:** Корректная параллельная обработка множественных изображений через TaskBalancer

### 2024-02-27 (Реализация GridView с DnD для отображения стикерпаков)
- **Создан UI для отображения и управления сеткой фрагментов**
- **Компоненты:**
  - `GridView` (renderer/pages/PackView/components/GridView) - основной компонент с DndContext
  - `GridCell` - ячейка с useDroppable
  - `DraggableFragment` - фрагмент с useDraggable
  - `usePackGrid` - хук для работы с сеткой (загрузка, перемещение, swap)
- **Утилиты:**
  - `ColorUtil` (renderer/utils/color) - генерация уникальных цветов для групп
  - `GROUP_COLOR_PALETTE` - палитра из 20 цветов
  - Кеширование цветов по groupId
- **Функционал:**
  - **Отображение сетки** - фрагменты с уникальными цветами групп
  - **Перемещение группы** - drag фрагмента перемещает всю группу с учетом offset
  - **Swap фрагментов** - внутри группы фрагменты меняются местами
  - **Валидация границ** - группа не выходит за пределы сетки
- **DnD логика:**
  - Если target в той же группе и есть fragmentId → swap фрагментов
  - Если target в другой группе или пустая ячейка → перемещение группы
  - Вычисление offset фрагмента относительно начала группы
  - Корректировка позиции группы с учетом границ сетки
- **Интеграция:**
  - `usePackGrid` использует `StickerPackFacade` для операций с grid
  - `moveGroupInGrid(packId, groupId, row, col)` - перемещение группы
  - `moveFragmentInGrid(packId, fragmentId, row, col)` - swap фрагментов
  - Загрузка путей через кастомный протокол `sticker-packs://`
- **Константы:**
  - `GridViewConstants` - CELL_SIZE, CELL_GAP, DRAG_OPACITY, DRAG_DISTANCE
  - `GridViewLabels` - лейблы (не используются пока)
  - Все значения в enum, без хардкода
- **Зависимости:**
  - Установлены `@dnd-kit/core` и `@dnd-kit/utilities`
- **Результат:** Полнофункциональная сетка с drag & drop, цветовой индикацией групп и корректной обработкой перемещений


### 2024-02-27 (Исправления и улучшения)
- **Исправлен DnD в GridView:**
  - Удален `pointer-events: none` из `.gridFragment` в CSS
  - Это блокировало события мыши для drag-and-drop
  - Теперь DnD работает корректно
- **Улучшен алгоритм перемещения групп в SmartGridCalculator:**
  - Реализован алгоритм обтекания вместо оптимизации/упаковки
  - Группы без коллизий остаются на своих местах
  - При коллизии группа ищет ближайшее свободное место (радиальный поиск)
  - Приоритет: сначала сбоку/сверху, только потом вниз
  - Сортировка кандидатов: `verticalDown` (0 приоритетнее), затем `distance`
  - Результат: минимальное смещение групп, естественное обтекание
- **Исправлена работа индивидуальных настроек в EditPack:**
  - Добавлен метод `getSettingsForImage(imageId)` в `useImageEditorSettings`
  - `useImageSaver` теперь принимает `getSettingsForImage` как параметр
  - Каждое изображение обрабатывается со своими настройками (общие + индивидуальные)
  - Маппинг `RescaleQuality` перенесен в `useImageSaver`
  - Общие настройки применяются только к изображениям без индивидуальных
- **Проверен пайплайн обработки изображений:**
  - Подтверждено: все стадии используют `input.settings` для каждого изображения
  - `trim.task.ts` - проверяет `input.settings.enableTrim`
  - `rescale.task.ts` - использует `fragmentColumns`, `fragmentRows`, `rescaleQuality`
  - `fragment.task.ts` - использует `fragmentColumns`, `fragmentRows`
  - Пайплайн полностью поддерживает индивидуальные настройки

### 2024-02-27 (Система выделения и контекстное меню для GridView)
- **Создана система выделения фрагментов:**
  - `useGridSelection` - управление выделением с поддержкой Shift (прямоугольное выделение) и Ctrl (toggle)
  - Прямоугольное выделение: от первого клика до текущего (не построчное)
  - Клик без модификаторов - выделение одного фрагмента
  - Escape - сброс выделения
  - Методы: `selectAll()`, `selectGroup()`, `clearSelection()`
- **Создано контекстное меню:**
  - `GridContextMenu` - Radix UI контекстное меню с подменю
  - `useGridContextMenu` - расчет состояния меню (effectiveFragmentIds, effectiveCellIds)
  - `gridContextConstants` - enum действий, лейблы, тексты подтверждений
  - Стилизация через CSS модуль с theme переменными
- **Функционал контекстного меню:**
  - **Выделение:** Выделить всё, Снять выделение, Выделить группу
  - **Группировка:** Создать группу (из выделенных)
  - **Удаление:** 
    - Удалить фрагменты (только реальные fragmentIds)
    - Убрать из группы
    - Удалить группу (3 варианта: с фрагментами, оставить фрагменты, только группу)
- **Интеграция с backend:**
  - `SmartGridCalculator` - методы `createGroupFromFragments()`, `removeFragmentsFromGroup()`, `deleteFragments()`
  - `GridService` - обертки над calculator + `moveSingleFragment()`
  - `FragmentService` - `removeFragmentsBatch()`, `updateFragmentGroupBatch()`
  - `StickerPackFacade` - методы для всех операций, фильтрация cellIds (только реальные fragmentIds)
- **Автоматический сброс выделения:**
  - После всех операций (перемещение, создание группы, удаление) выделение автоматически сбрасывается
  - `PackView` управляет `clearSelectionCallback` и передает в `usePackGrid`
  - `GridView` передает `clearSelection` родителю через `onClearSelectionReady`
- **Визуальная индикация:**
  - Выделенные ячейки - синяя рамка `var(--accent-9)`
  - Группы - цветная рамка из палитры
  - Приоритет: выделение > группа
- **Константы и типизация:**
  - Все действия в `GridContextAction` enum
  - Все лейблы в `GRID_CONTEXT_LABELS`
  - Все подтверждения в `GRID_CONTEXT_CONFIRMATIONS`
  - Без хардкода строк

### 2024-02-27 (Поддержка пустых ячеек в сетке)
- **Изменена структура GridCell:**
  - `fragmentId` теперь всегда `string` (вместо `string | null`)
  - Добавлено поле `isEmpty: boolean`
  - Пустые ячейки имеют уникальный сгенерированный `fragmentId` и `isEmpty=true`
- **Пустые ячейки в группах:**
  - Пустые ячейки можно выделять и добавлять в группы
  - Пустые ячейки в группах (`groupId !== 'default'`) перемещаются вместе с группой
  - Пустые ячейки вне групп (`groupId='default'`) статичны и не участвуют в движении
- **Логика движения:**
  - `moveGroup()` и `moveSingleFragment()` фильтруют пустые ячейки с `groupId='default'` из collision detection
  - `updateGroupsFromCells()` создает группы для всех `groupId !== 'default'`, но добавляет в `fragmentIds` только непустые
- **Визуализация:**
  - Группы с только пустыми ячейками появляются в `groups` массиве с пустым `fragmentIds`
  - Frontend создает временные group объекты для визуализации, если группа не найдена в массиве
  - Пустые ячейки в группах отображаются с цветной рамкой группы
- **DnD для пустых ячеек:**
  - `DraggableFragmentProps.fragmentPath` теперь `string | null`
  - `DraggableFragment` рендерит пустой `<div>` с DnD функциональностью если `fragmentPath === null`
  - `GridCell` рендерит `DraggableFragment` для пустых ячеек в группах (`groupId !== 'default'`)
- **Добавление новых фрагментов:**
  - `placeGroupsSequentially()` блокирует только сгруппированные ячейки (`groupId !== 'default'`)
  - Пустые ячейки с `groupId='default'` доступны для заполнения новыми фрагментами
  - Алгоритм размещения может использовать пустые незагруппированные ячейки
- **Результат:** Гибкая система управления пустыми ячейками - можно группировать, перемещать в группах, но не мешают добавлению новых фрагментов

### 2024-02-28 (Создание домена StickerDownloader)
- **Создан домен StickerDownloader для загрузки стикеров из внешних источников**
- **Структура домена:**
  - `parsers/` - IParser, LineParser, ParserFactory
  - `downloaders/` - IDownloader, HttpDownloader
  - `http/` - IHttpClient, AxiosHttpClient
  - `services/` - IStickerDownloaderService, StickerDownloaderService
  - `enums.ts` - DownloadError
  - `constants.ts` - токены сервисов
- **Компоненты shared (для IPC):**
  - `IStickerDownloaderService` - интерфейс для IPC proxy
  - `DownloadResultDTO` - результат загрузки
  - `DownloadProgressInfo` - прогресс загрузки
  - `StickerProvider` - enum провайдеров (LINE)
  - `StickerDownloaderIPCChannel` - IPC каналы (PROGRESS)
- **Архитектура:**
  - Strategy Pattern для парсеров (легко добавить новые провайдеры)
  - Factory Pattern для выбора парсера по URL
  - Dependency Injection для всех компонентов
  - IPC события для прогресса (не callback через IPC)
- **LineParser:**
  - Парсинг HTML через cheerio
  - Извлечение `data-preview` атрибутов
  - Приоритет: animationUrl → staticUrl → fallbackStaticUrl
- **HttpDownloader:**
  - Параллельная загрузка файлов
  - Callback прогресса для каждого файла
  - Сохранение во временную директорию
- **StickerDownloaderService:**
  - Координация парсинга и загрузки
  - Отправка IPC событий прогресса
  - Очистка временных файлов при ошибке
  - Интеграция с TempFileService
- **UI компоненты:**
  - `ImportFromNetworkDialog` - диалог импорта с URL полем
  - `useStickerDownloader` - хук для работы с сервисом
  - Отображение прогресса через Radix UI Progress
  - Чтение файлов через TempFileService.readTempFileAsBlob()
- **Интеграция с редактором:**
  - Скачанные файлы конвертируются в ImageEditorImage
  - Автоматическое получение размеров через Image API
  - Передача в редактор через onImagesLoaded callback
- **Зависимости:**
  - Установлены `axios` и `cheerio`
  - Интеграция с TempFileService для временных файлов
  - Использование IIPCBridge для прогресса
- **Расширяемость:**
  - Легко добавить парсеры для Telegram, Discord, etc.
  - Просто реализовать IParser и зарегистрировать в ParserFactory
  - Единая архитектура для всех провайдеров

### 2024-02-28 (Исправление загрузки стикерпаков в Telegram)
- **Проблема:** Неправильное формирование массива стикеров для загрузки
  - Использовался `pack.fragments` напрямую без учета сетки
  - Фрагменты загружались не в порядке отображения в сетке
  - Для эмодзи картинки одной группы шли последовательно вместо построчно
- **Решение:**
  - Создана утилита `gridToFlatArray()` в `shared/domains/grid/utils.ts`
  - Сортирует ячейки по `row`, затем по `col`
  - Возвращает плоский массив в порядке сетки
- **Обновление типов:**
  - `GridCell` - добавлено поле `fileId?: string` для Telegram file ID
  - `UploadStickerData` - добавлено поле `cellId?: string` для маппинга
  - `UploadResult` - изменено `uploadedFragments` → `uploadedCells` с cellId ключами
- **Обновление TelegramUploaderService:**
  - Используется `cellId` вместо индекса массива
  - Пустые ячейки (`filePath === ''`) загружаются как пустые изображения
  - Возвращается Map с `cellId` → `{ fileId, status, cellId }`
- **Обновление PackView:**
  - Формирование массива через `gridToFlatArray(grid)`
  - Пустые ячейки передаются с `filePath: ''`
  - После загрузки обновляется `gridLayout.cells` с `fileId`
  - Обновляется `fragments` с `uploadStatus` для реальных фрагментов
- **Результат:**
  - ✅ Правильный порядок загрузки по сетке
  - ✅ Поддержка пустых ячеек
  - ✅ Обновление манифеста с fileId
  - ✅ Возможность отслеживания загруженных ячеек
