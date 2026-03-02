# Инструкция по выпуску релиза

## Одной командой:

```bash
# 1. Обновите версию в package.json (например, 1.0.1)
npm version patch  # или minor, или major

# 2. Запушьте тег
git push --follow-tags
```

## Что происходит автоматически:
1. GitHub Actions запускает сборку для Linux и Windows
2. Создаются артефакты: AppImage, deb, nsis.exe, portable.exe
3. Создается GitHub Release с версией из тега
4. Артефакты автоматически прикрепляются к релизу

## Типы версий:
- `npm version patch` - 1.0.0 → 1.0.1 (исправления)
- `npm version minor` - 1.0.0 → 1.1.0 (новые функции)
- `npm version major` - 1.0.0 → 2.0.0 (breaking changes)
