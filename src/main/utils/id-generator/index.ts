import { container } from '../../domains/core/Container';
import { ID_GENERATOR_TOKEN } from './constants';
import { NanoIdGenerator } from './NanoIdGenerator';

container.register(ID_GENERATOR_TOKEN, async () => {
  return new NanoIdGenerator();
});

export { ID_GENERATOR_TOKEN };
