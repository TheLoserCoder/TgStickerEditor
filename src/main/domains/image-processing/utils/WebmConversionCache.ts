/**
 * WebM Conversion Cache
 * Хранит успешные параметры конвертации для групп фрагментов
 */

interface ConversionParams {
  crf: number;
  fps?: number;
  timestamp: number;
}

class WebmConversionCache {
  private cache = new Map<string, ConversionParams>();
  private readonly TTL = 60 * 60 * 1000; // 1 час

  set(groupId: string, params: Omit<ConversionParams, 'timestamp'>): void {
    this.cache.set(groupId, {
      ...params,
      timestamp: Date.now()
    });
  }

  get(groupId: string): ConversionParams | undefined {
    const params = this.cache.get(groupId);
    if (!params) return undefined;

    // Проверка TTL
    if (Date.now() - params.timestamp > this.TTL) {
      this.cache.delete(groupId);
      return undefined;
    }

    return params;
  }

  clear(groupId: string): void {
    this.cache.delete(groupId);
  }

  clearAll(): void {
    this.cache.clear();
  }
}

export const webmConversionCache = new WebmConversionCache();
