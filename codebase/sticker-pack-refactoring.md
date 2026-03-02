# Рефакторинг sticker-pack домена

## Дата: 2024
## Статус: Завершено

---

## Обзор изменений

Проведен масштабный рефакторинг домена `sticker-pack` с целью достижения максимальной чистоты архитектуры, модульности и соответствия принципам SOLID, DRY, KISS и Clean Architecture.

---

## 1. Создание Entity + Repository паттерна

### ManifestEntity
**Файл:** `src/main/domains/sticker-pack/manifest/ManifestEntity.ts`

**Ответственность:**
- Инкапсуляция бизнес-логики манифеста
- Валидация через `ManifestValidator`
- Автоматическое обновление `updatedAt`
- Управление фрагментами и сеткой

**Методы:**
- `create()` - создание нового манифеста с валидацией
- `fromDTO()` - восстановление из DTO с валидацией
- `toDTO()` - сериализация с защитой массивов (копирование)
- `update()` - обновление полей через централизованную валидацию
- `addFragment()` - добавление фрагмента с валидацией лимита
- `removeFragment()` - удаление фрагмента + очистка grid
- `updateFragmentGroup()` - обновление группы фрагмента

**Особенности:**
- Валидация при создании и загрузке из файла
- Защита от внешних изменений (toDTO возвращает копии массивов)
- Целостность данных (removeFragment чистит grid)

### FragmentEntity
**Файл:** `src/main/domains/sticker-pack/fragment/FragmentEntity.ts`

**Ответственность:**
- Валидация данных фрагмента
- Иммутабельное обновление группы

**Методы:**
- `create()` - создание с валидацией fileName
- `fromDTO()` - восстановление из DTO
- `toDTO()` - сериализация
- `updateGroup()` - создание нового экземпляра с обновленной группой

### StickerPackEntity
**Файл:** `src/main/domains/sticker-pack/infrastructure/StickerPackEntity.ts`

**Ответственность:**
- Метаданные пака для инфраструктуры
- Формирование имени папки
- Санитизация title для файловой системы

**Методы:**
- `create()` - создание с валидацией и санитизацией
- `fromStorage()` - восстановление из хранилища
- `toDTO()` - сериализация
- `folderName` (геттер) - формирование `${title}_${id}`

**Особенности:**
- Санитизация: удаление недопустимых символов, замена пробелов
- Ограничение длины: максимум 50 символов
- Разделение: `title` (для папки) != `name` (бизнес-имя в манифесте)

---

## 2. Централизованная валидация

### ManifestValidator
**Файл:** `src/main/domains/sticker-pack/manifest/ManifestValidator.ts`

**Методы:**
- `validateName()` - проверка имени манифеста
- `validateFragmentsCount()` - проверка лимита фрагментов (200)
- `validateGridConsistency()` - проверка ссылок в сетке
- `validateUpdate()` - централизованная валидация обновлений

**Преимущества:**
- Вся валидация в одном месте
- Переиспользуемые правила
- Легко расширять

---

## 3. Разделение на поддомены

### Структура до:
```
sticker-pack/
├── services/
├── repositories/
├── ManifestEntity.ts
├── FragmentEntity.ts
└── ...
```

### Структура после:
```
sticker-pack/
├── manifest/              # Поддомен манифеста
│   ├── ManifestEntity.ts
│   ├── ManifestValidator.ts
│   ├── IManifestService.ts
│   ├── ManifestService.ts
│   ├── IManifestRepository.ts
│   └── ManifestRepository.ts
├── fragment/              # Поддомен фрагментов
│   ├── FragmentEntity.ts
│   ├── IFragmentService.ts
│   ├── FragmentService.ts
│   ├── IFragmentFileRepository.ts
│   └── FragmentFileRepository.ts
├── infrastructure/        # Инфраструктура пака
│   ├── repositories/
│   │   ├── IPackIndexRepository.ts
│   │   ├── PackIndexRepository.ts
│   │   ├── IPackStorageRepository.ts
│   │   └── PackStorageRepository.ts
│   ├── StickerPackEntity.ts
│   ├── IStickerPackService.ts
│   └── StickerPackService.ts
├── facade/                # Фасад
│   ├── IStickerPackFacade.ts
│   └── StickerPackFacade.ts
├── constants.ts
└── index.ts
```

**Преимущества:**
- Модульность - каждый поддомен изолирован
- Навигация - легко найти нужный файл
- Масштабируемость - легко добавить новые поддомены
- Чистая архитектура - четкое разделение ответственности

---

## 4. Упрощение репозиториев

### Принцип: "Глупые" репозитории

**До:**
- Репозитории знали о `PackInfrastructureRepository`
- Репозитории создавали Entity
- Метод `findAll()` в репозитории

**После:**
- Репозитории работают только с путями и DTO
- Никакой бизнес-логики
- Только персистенция

### ManifestRepository
```typescript
// Принимает путь явно, работает с DTO
save(folderPath: string, manifest: StickerPackManifest): Promise<void>
read(folderPath: string): Promise<StickerPackManifest | null>
```

### FragmentFileRepository
```typescript
// Работает с путями, не знает о packId
copyFile(folderPath: string, sourceFilePath: string, fileName: string): Promise<void>
deleteFile(folderPath: string, fileName: string): Promise<void>
getFilePath(folderPath: string, fileName: string): Promise<string | null>
```

### PackIndexRepository
```typescript
// Работает с индексом в Electron store
save(packDTO: StickerPackInfrastructureDTO): Promise<void>
delete(packId: string): Promise<void>
findById(packId: string): Promise<StickerPackInfrastructureDTO | null>
findAll(): Promise<StickerPackInfrastructureDTO[]>
```

### PackStorageRepository
```typescript
// Работает с файловой системой
createFolder(folderName: string): Promise<void>
deleteFolder(folderName: string): Promise<void>
getFolderPath(folderName: string): string
```

---

## 5. Создание Facade Pattern

### StickerPackFacade
**Файл:** `src/main/domains/sticker-pack/facade/StickerPackFacade.ts`

**Ответственность:**
- Единая точка входа для UI
- Координация всех сервисов
- Получение путей от `PackInfrastructureRepository`
- Передача путей в сервисы

**Методы:**
- `createPack()` - создание пака (инфраструктура + манифест)
- `getPack()` - получение манифеста
- `getAllPacks()` - список всех паков
- `deletePack()` - удаление пака
- `updatePackManifest()` - обновление манифеста
- `addFragment()` - добавление фрагмента
- `removeFragment()` - удаление фрагмента
- `updateFragmentGroup()` - обновление группы
- `getFragmentPath()` - получение пути к файлу

**Пример оркестрации:**
```typescript
async createPack(name: string, type: StickerPackType): Promise<StickerPackManifest> {
  const packId = this.idGenerator.generate();
  
  // 1. Создаем инфраструктуру
  const packPath = await this.packService.createPackInfrastructure(packId, name);
  
  // 2. Создаем манифест
  return await this.manifestService.create(packPath, packId, name, type);
}
```

---

## 6. Упрощение сервисов

### Принцип: Single Responsibility

**StickerPackService** - координация инфраструктуры:
```typescript
createPackInfrastructure(packId: string, title: string): Promise<string>
deletePackInfrastructure(packId: string): Promise<void>
getPackPath(packId: string): Promise<string | null>
getAllPackIds(): Promise<string[]>
```

**ManifestService** - только манифест:
```typescript
create(folderPath: string, packId: string, name: string, type: StickerPackType)
read(folderPath: string)
update(folderPath: string, updates: ManifestUpdateData)
addFragmentToManifest(folderPath: string, fragment: Fragment)
removeFragmentFromManifest(folderPath: string, fragmentId: string)
updateFragmentGroupInManifest(folderPath: string, fragmentId: string, groupId: string | null)
getFragmentFileName(folderPath: string, fragmentId: string)
```

**FragmentService** - только фрагменты:
```typescript
addFragment(folderPath: string, sourceFilePath: string, fileName: string, groupId?: string)
removeFragment(folderPath: string, fragmentId: string)
updateFragmentGroup(folderPath: string, fragmentId: string, groupId: string | null)
getFragmentPath(folderPath: string, fragmentId: string)
```

---

## 7. DTO сериализация

### Принцип: toDTO() / fromDTO()

Все Entity имеют методы сериализации:

```typescript
// ManifestEntity
toDTO(): StickerPackManifest {
  return {
    id: this.id,
    name: this.name,
    type: this.type,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    fragments: [...this.fragments],  // Копия!
    grid: [...this.grid]              // Копия!
  };
}

static fromDTO(dto: StickerPackManifest): ManifestEntity {
  const entity = new ManifestEntity(...);
  // Валидация после загрузки
  ManifestValidator.validateName(entity.name);
  ManifestValidator.validateFragmentsCount(entity.fragments.length);
  ManifestValidator.validateGridConsistency(entity.fragments, entity.grid);
  return entity;
}
```

---

## 8. Вынос типов и ошибок

### ManifestUpdateData
**Файл:** `src/shared/domains/sticker-pack/types.ts`

```typescript
export type ManifestUpdateData = {
  name?: string;
  fragments?: Fragment[];
  grid?: GridCell[];
};

export type StickerPackInfrastructureDTO = {
  id: string;
  title: string;
  folderName: string;
};
```

### Enums для ошибок
**Файл:** `src/shared/domains/sticker-pack/enums.ts`

```typescript
export enum ManifestValidationError {
  NAME_EMPTY = 'Название стикерпака не может быть пустым',
  MAX_FRAGMENTS_EXCEEDED = 'Стикерпак не может содержать больше 200 фрагментов',
  FRAGMENT_NOT_FOUND = 'Фрагмент не найден',
  INVALID_GRID_FRAGMENT = 'Сетка содержит несуществующие фрагменты',
  MANIFEST_NOT_FOUND = 'Манифест не найден',
}

export enum StickerPackError {
  PACK_NOT_FOUND = 'Стикерпак не найден',
}
```

**Нет хардкода** - все ошибки в enum!

---

## 9. Изоляция Electron зависимостей

### config/paths.ts
**Файл:** `src/main/config/paths.ts`

```typescript
import { app } from 'electron';
import * as path from 'path';
import { StickerPackFolderName } from '../../../shared/domains/sticker-pack/enums';

export const getStickerPackBasePath = (): string => {
  return path.join(app.getPath('userData'), StickerPackFolderName.BASE);
};
```

**Преимущества:**
- Electron `app` используется только в конфигурации
- Упрощает тестирование
- Легко заменить путь для тестов

---

## 10. Обновление Container регистрации

### Принципы:
- Репозитории не зависят друг от друга
- Сервисы зависят только от репозиториев
- Только Facade знает о всех сервисах

```typescript
// Репозитории
container.register(PACK_INDEX_REPO, async () => {
  const storeService = await container.resolve<IStoreService>(STORE_SERVICE_TOKEN);
  return new PackIndexRepository(storeService);
});

container.register(PACK_STORAGE_REPO, async () => {
  const fileSystem = await container.resolve<IFileSystemService>(FileSystemServiceToken.SERVICE);
  return new PackStorageRepository(fileSystem, getStickerPackBasePath());
});

container.register(MANIFEST_REPO, async () => {
  const fileSystem = await container.resolve<IFileSystemService>(FileSystemServiceToken.SERVICE);
  return new ManifestRepository(fileSystem);
});

// Сервисы
container.register(StickerPackServiceToken.SERVICE, async () => {
  const [indexRepo, storageRepo] = await Promise.all([
    container.resolve(PACK_INDEX_REPO),
    container.resolve(PACK_STORAGE_REPO),
  ]);
  
  return new StickerPackService(indexRepo, storageRepo);
});

container.register(StickerPackServiceToken.MANIFEST, async () => {
  const manifestRepo = await container.resolve(MANIFEST_REPO);
  return new ManifestService(manifestRepo);
});

// Facade
container.register(StickerPackServiceToken.FACADE, async () => {
  const [packService, manifestService, fragmentService, idGenerator] = await Promise.all([
    container.resolve(StickerPackServiceToken.SERVICE),
    container.resolve(StickerPackServiceToken.MANIFEST),
    container.resolve(StickerPackServiceToken.FRAGMENT),
    container.resolve<IIdGenerator>(ID_GENERATOR_TOKEN),
  ]);
  
  return new StickerPackFacade(packService, manifestService, fragmentService, idGenerator);
});
```

---

## Итоговая архитектура

### Слои:

```
UI/IPC
  ↓
StickerPackFacade (Оркестрация)
  ↓
├─→ StickerPackService (Координация инфраструктуры)
│     ↓
│   ├─→ PackIndexRepository (Electron store)
│   └─→ PackStorageRepository (Файловая система)
│
├─→ ManifestService (Бизнес-логика)
│     ↓
│   ManifestEntity → ManifestRepository
│
└─→ FragmentService (Бизнес-логика)
      ↓
    FragmentEntity → FragmentFileRepository
```

### Зоны ответственности:

**Entity:**
- Бизнес-логика
- Валидация
- Инкапсуляция

**Service:**
- Оркестрация Entity + Repository
- Координация операций
- Применение бизнес-правил

**Repository:**
- Персистенция (файлы, store)
- Работа с DTO
- Никакой бизнес-логики

**Facade:**
- Единая точка входа
- Координация сервисов
- Получение путей

---

## Соблюдение принципов

✅ **SOLID:**
- Single Responsibility - каждый класс делает одно дело
- Open/Closed - легко расширять через новые сервисы
- Liskov Substitution - интерфейсы везде
- Interface Segregation - узкие интерфейсы
- Dependency Inversion - зависимости от абстракций

✅ **DRY:**
- Валидация в одном месте (ManifestValidator)
- DTO сериализация через toDTO/fromDTO
- Нет дублирования логики

✅ **KISS:**
- Простые, понятные классы
- Минимум зависимостей
- Четкое разделение

✅ **Clean Architecture:**
- Domain не зависит от Infrastructure
- Entity + Repository паттерн
- Facade для оркестрации
- Чистые границы между слоями

---

## Результаты

1. **Модульность** - легко добавлять новые функции
2. **Тестируемость** - каждый компонент тестируется изолированно
3. **Читаемость** - понятная структура и зоны ответственности
4. **Масштабируемость** - готово к росту
5. **Поддерживаемость** - легко найти и изменить код

---

## Следующие шаги

1. Добавить unit-тесты для Entity
2. Добавить integration-тесты для сервисов
3. Документировать IPC интерфейсы
4. Добавить логирование
5. Добавить обработку ошибок на уровне Facade
