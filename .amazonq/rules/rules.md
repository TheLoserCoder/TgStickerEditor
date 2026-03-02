# Правила разработки проекта

## Принципы архитектуры
- **SOLID, DRY, KISS, Clean Architecture** - строго соблюдаем
- **Интерфейсы** - все пишется через интерфейсы
- **Dependency Inversion** - зависимости только от абстракций
- **Single Responsibility** - один класс/модуль = одна ответственность

## Структура проекта
- **Domain-Driven Structure** - группировка по доменам, а не по типам файлов
- Домены изолированы и независимы друг от друга
- Общий код выносится в shared/, переиспользуемый UI в ui/

### Структура main домена:
```
domain/
├── repositories/
│   ├── IRepository.ts      # интерфейс репозитория
│   └── Repository.ts       # реализация репозитория
├── services/
│   └── Service.ts          # бизнес-логика
├── entities/               # папка для Entity (если разрастается)
│   ├── Entity.ts           # доменная модель с валидацией
│   ├── IEntityFactory.ts   # интерфейс фабрики
│   ├── EntityFactory.ts    # реализация фабрики
│   ├── IEntityMapper.ts    # интерфейс маппера
│   ├── EntityMapper.ts     # реализация маппера
│   └── Validator.ts        # валидатор (опционально)
├── enums.ts                # ENUM для внутренней логики (опционально)
├── constants.ts            # константы (опционально)
└── index.ts                # регистрация в Container
```

### Структура shared домена:
```
domain/
├── interfaces/
│   └── IService.ts         # интерфейс публичного сервиса для IPC proxy
├── enums.ts                # ENUM для IPC (опционально)
├── types.ts                # DTO типы для IPC (обязательно)
└── constants.ts            # константы для IPC (опционально)
```

### Принципы:
- **Интерфейс рядом с реализацией** - IRepository в repositories/, не в отдельной папке interfaces/
- **Исключение: публичные IPC интерфейсы** - интерфейсы публичных сервисов (для IPC proxy) в shared/domains/*/interfaces/
- **Папки для множественных реализаций** - repositories/, services/, handlers/, transports/
- **Папка entities/ для разросшихся Entity** - если Entity + Factory + Mapper + Validator, выносим в entities/
- **Файлы в корне домена** - enums.ts, constants.ts, index.ts
- **Разделение main/shared** - main-only код (валидация, ключи хранилища) в main/enums.ts, IPC-related в shared/

## IPC и shared домены
- **shared/domains/*/interfaces/** - ТОЛЬКО интерфейсы публичных сервисов для IPC proxy
- **Критерий публичности** - если сервис регистрируется через `factory.createService()` или `registry.register()`, его интерфейс в shared
- **Renderer использует IPC proxy** - `ipcProxy.wrap<IService>(serviceName)` для типизации
- **Внутренние интерфейсы в main** - IRepository, внутренние IService остаются в main рядом с реализацией
- **DTO в shared/types.ts** - plain objects для передачи через IPC
- **ENUM разделение:**
  - main/enums.ts - внутренние enum (валидация, ключи хранилища, внутренняя логика)
  - shared/enums.ts - enum для IPC (типы, которые нужны renderer)

## Entity + Repository паттерн
- **Для бизнес-доменов** - используем Entity + Repository + Service
- **Entity (main)** - доменная модель с валидацией, только в main процессе
- **Entity организация:**
  - Простой Entity → в корне домена (Entity.ts, Validator.ts)
  - Разросшийся Entity → в папке entities/ (Entity, Factory, Mapper, Validator, интерфейсы)
- **Repository (main)** - изоляция работы с хранилищем, только в main
- **Service (main)** - бизнес-логика, работает через Repository
- **DTO (shared)** - plain objects для IPC границы
- **Интерфейсы (shared)** - только для IPC, не для Entity

## Dependency Injection
- **Container.resolve с интерфейсами** - всегда типизируем через интерфейсы
- **Примеры:**
  ```typescript
  container.resolve<IStoreService>(STORE_SERVICE_TOKEN)
  container.resolve<IBotEntityFactory>(BOT_ENTITY_FACTORY_TOKEN)
  container.resolve<ISettingsEntityMapper>(SETTINGS_ENTITY_MAPPER_TOKEN)
  ```
- **Правило:** Никогда не используем `container.resolve()` без generic типа

## Константы и хардкод
- **Запрет хардкода** - все значения выносим в константы
- **Запрет строковых литералов** - используем ENUM вместо строк (кроме исключительных случаев)
- **Разделение по файлам:**
  - ENUM всегда в `enums.ts`
  - Примитивные константы (string, number) в `constants.ts`
  - Никаких ENUM в constants.ts!
- Никаких магических чисел, строк или ключей в коде
- ENUM для типов действий, каналов, ключей и других строковых значений
- **Инкапсуляция дефолтов:** Дефолтные значения скрыты в Factory/Entity, сервисы не знают о константах

## Конфигурация
- **Конфигурация в отдельной папке** - `src/main/config/`, `src/renderer/config/`
- **Разделение по файлам:**
  - `environment.ts` - переменные окружения (NODE_ENV, isDev, isProd)
  - `*.config.ts` - конфигурация компонентов (wrappers, routes, etc)
  - `index.ts` - экспорты всех конфигов
- **Декларативность** - конфигурация через объекты/массивы, не через if'ы

## Кодовая база
- **Простота** - ведем простую, понятную кодовую базу
- **Документация** - обязательно ведем `codebase.md` с описанием структуры
- **Учет ошибок** - ведем `errors-log.md` с описанием проблем и решений
- Каждый файл/класс имеет краткий комментарий о зоне ответственности

## Фабрики и создание сервисов
- **Декларативная конфигурация** - wrapper'ы настраиваются через конфигурацию, не через if'ы
- **Реестр wrapper'ов** - все доступные wrapper'ы в `wrapperRegistry.ts`
- **Конфигурация по окружениям** - разные наборы wrapper'ов для dev/prod/test
- **MainServiceFactory** - главная фабрика для создания сервисов:
  - `createService(instance, serviceName)` - с IPC wrapper'ом (публичные сервисы)
  - `createInternal(instance)` - без IPC (внутренние сервисы)
- **Композиция фабрик:**
  - `ServiceFactory` (shared) - базовая фабрика с wrapper'ами
  - `createMainFactory()` - создаёт ServiceFactory с настроенными wrapper'ами
  - `IPCWrapperFactory` - обёртывает сервисы для IPC
  - `MainServiceFactory` - композиция базовой + IPC

## React компоненты
- **Radix UI** - используем radix-ui для компонентов
- **Radix Icons** - используем radix-icons для иконок
- **Глупые компоненты** - React компоненты должны быть простыми, без сложной логики
- **Запрет голых тегов** - не используем div, span и т.д. без необходимости
- **Композиция** - разделяем на Container (логика) и UI (отрисовка)
- **Контроллеры** - бизнес-логика в контроллерах, не в thunks
- **Redux** - только для состояния, синхронные actions

## Критическое мышление
- **Оспаривание решений** - ИИ должен критически оценивать задачи
- Если решение неоптимально - указать на это и предложить альтернативу
- Спросить подтверждение перед реализацией сомнительного решения

## Коммуникация
- **Язык** - всегда русский
- **Краткость** - лаконичные ответы без лишних комментариев
- **Актуализация** - автоматически обновлять документацию при изменениях
