# Структура иконок для сборки

## Текущая структура:
```
build/
├── icon_linux.png    # Иконка для Linux (используется)
└── icon_windows.ico  # Иконка для Windows (используется)
```

## Конфигурация electron-builder:
- **Linux**: `build/icon_linux.png` (должна быть PNG, рекомендуется 512x512 или 1024x1024)
- **Windows**: `build/icon_windows.ico` (должна быть ICO с несколькими размерами: 16x16, 32x32, 48x48, 256x256)

## Иконки уже настроены в electron-builder.json:
```json
{
  "linux": {
    "icon": "build/icon_linux.png"
  },
  "win": {
    "icon": "build/icon_windows.ico"
  }
}
```

Файлы иконок уже находятся в правильном месте и будут использованы при сборке.
