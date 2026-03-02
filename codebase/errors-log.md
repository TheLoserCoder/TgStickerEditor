# Журнал ошибок и решений

## Формат записи
```
### [Дата] - Краткое описание проблемы
**Проблема:** Детальное описание ошибки
**Причина:** Что вызвало ошибку
**Решение:** Как была решена проблема
**Теги:** #категория #технология
```

---

## Ошибки

_Журнал будет заполняться по мере возникновения проблем_

### 2024-02-28 - APNG изображения теряют анимацию после конвертации

**Проблема:** 
APNG (Animated PNG) изображения после обработки в пайплайне становятся статичными, теряя всю анимацию.

**Причина:**
1. Sharp не поддерживает чтение APNG как анимированного формата
2. При вызове `sharpAdapter.convert(apng, gif, { animated: true })` Sharp читает только первый кадр
3. `metadata.pages` для APNG возвращает `undefined` или `1`
4. В старой версии APNG конвертировался через FFmpeg, что сохраняло анимацию

**Решение:**
1. Добавлена специальная обработка APNG в `detect-convert.task.ts`:
   - После детекции анимации проверяется `isApng = await animationDetector.detectApng()`
   - Если это APNG, конвертация происходит через FFmpeg: `ffmpegAdapter.convert(apng, gif, { format: 'gif' })`
   - Результат - анимированный GIF файл, который обрабатывается по стандартному пайплайну
2. Обновлен FFmpegAdapter для использования кодека `libwebp_anim` вместо `libwebp` для анимированных WebP
3. Добавлена передача путей к бинарникам FFmpeg в worker threads через `ffmpegStatic`
4. Добавлена обработка анимированных WebP в `convert-webp.task.ts` для предотвращения ошибки "same file for input and output"

**Код изменений:**
```typescript
// detect-convert.task.ts
if (isAnimated) {
  const isApng = await animationDetector.detectApng(input.filePath);
  
  if (isApng) {
    // APNG → GIF через FFmpeg
    const tempGif = path.join(tempDir, `${uniqueId}_apng.gif`);
    await ffmpegAdapter.convert(input.filePath, tempGif, {
      format: 'gif',
      loop: 0
    });
    // Продолжаем с GIF по стандартному пайплайну
  }
  
  // Для GIF/WebP используем Sharp
}
```

**Теги:** #apng #animation #sharp #ffmpeg #image-processing


### 2024-02-28 - Финальное решение проблемы APNG прозрачности

**Решение:**
Изменен пайплайн обработки - все анимации конвертируются в WebP, сжатие делается при финальной конвертации в WebM.

**Новый пайплайн:**
1. **detect-convert**: Все анимации → WebP (APNG через FFmpeg `libwebp_anim`, остальные через Sharp)
2. **trim**: WebP → WebP (Sharp)
3. **rescale**: WebP → WebP (Sharp, центрирование с прозрачностью)
4. **fragment**: WebP → GIF фрагменты (Sharp нарезает WebP и сохраняет как GIF)
5. **convert-webp**: GIF → WebM с:
   - Сжатие длительности до **строго 2.99 сек** (через `-t 2.99` + `setpts` фильтр)
   - Сжатие размера до **256 КБ** (цикл CRF 32-45 с шагом 3)
   - Прозрачность (`format=yuva420p`, `-pix_fmt yuva420p`)

**Ключевые изменения:**
- `detect-convert.task.ts`: Убрано сжатие длительности, все анимации → WebP
- `convert-webp.task.ts`: Добавлено сжатие длительности + размера при GIF → WebM

**Гарантии:**
- ✅ Прозрачность сохраняется на всех этапах (WebP → GIF → WebM)
- ✅ Длительность строго 2.99 сек (параметр `-t`)
- ✅ Размер ≤ 256 КБ (цикл CRF)
- ✅ Анимация сохраняется (Sharp корректно обрабатывает WebP)

**Теги:** #apng #webp #webm #transparency #compression #telegram
