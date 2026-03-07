/**
 * Интерфейс для Sharp адаптера
 * Зона ответственности: Абстракция для операций с изображениями через Sharp
 */

/**
 * Метаданные изображения
 */
export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  hasAlpha: boolean;
  isAnimated: boolean;
  pages?: number; // Количество кадров для анимации
}

/**
 * Опции для добавления отступов
 */
export interface ExtendOptions {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  background?: { r: number; g: number; b: number; alpha: number };
}

/**
 * Опции для изменения размера
 */
export interface SharpResizeOptions {
  width?: number;
  height?: number;
  fit?: 'contain' | 'cover' | 'fill' | 'inside' | 'outside';
  kernel?: 'nearest' | 'lanczos3';
}

/**
 * Опции для конвертации формата
 */
export interface SharpConvertOptions {
  format: 'png' | 'jpeg' | 'webp' | 'avif' | 'gif';
  quality?: number;
  lossless?: boolean;
  effort?: number; // 0-6 для webp/avif (CPU vs Size)
  animated?: boolean; // Сохранить анимацию
}

/**
 * Опции для извлечения региона
 */
export interface ExtractOptions {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Результат trim операции
 */
export interface TrimResult {
  trimOffsetLeft: number;
  trimOffsetTop: number;
  width: number;
  height: number;
}

/**
 * Интерфейс Sharp адаптера
 */
export interface ISharpAdapter {
  /**
   * Получить метаданные изображения
   */
  getMetadata(inputPath: string): Promise<ImageMetadata>;

  /**
   * Изменить размер изображения
   */
  resize(
    inputPath: string,
    outputPath: string,
    options: SharpResizeOptions
  ): Promise<void>;

  /**
   * Конвертировать изображение в другой формат
   */
  convert(
    inputPath: string,
    outputPath: string,
    options: SharpConvertOptions
  ): Promise<void>;

  /**
   * Извлечь регион из изображения
   */
  extract(
    inputPath: string,
    outputPath: string,
    options: ExtractOptions
  ): Promise<void>;

  /**
   * Обрезать пустые области (trim)
   */
  trim(
    inputPath: string,
    outputPath: string,
    threshold?: number
  ): Promise<TrimResult>;

  /**
   * Добавить отступы к изображению
   */
  extend(
    inputPath: string,
    outputPath: string,
    options: ExtendOptions
  ): Promise<void>;

  /**
   * Нарезать изображение на фрагменты (tile grid)
   */
  tile(
    inputPath: string,
    outputDir: string,
    columns: number,
    rows: number
  ): Promise<string[]>; // Возвращает пути к файлам

  /**
   * Добавить прозрачный пиксель для принудительной альфы в VP9
   */
  addTransparentPixel(
    inputPath: string,
    outputPath: string
  ): Promise<void>;
}
