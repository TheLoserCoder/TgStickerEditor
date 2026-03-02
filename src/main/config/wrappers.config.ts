/**
 * Конфигурация wrapper'ов для разных окружений
 */

import { WrapperType } from '../factories/wrapperRegistry';

export const WRAPPER_CONFIGS: Record<string, WrapperType[]> = {
  development: [WrapperType.LOGGER, WrapperType.ERROR],
  production: [WrapperType.ERROR],
  test: []
};

export function getWrapperConfig(env: string): WrapperType[] {
  return WRAPPER_CONFIGS[env] || WRAPPER_CONFIGS.production;
}
