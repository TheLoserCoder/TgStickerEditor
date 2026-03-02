import { nanoid } from 'nanoid';
import { IIdGenerator } from '../../../shared/utils/id-generator/interfaces/IIdGenerator';

export class NanoIdGenerator implements IIdGenerator {
  generate(): string {
    return nanoid();
  }
}
