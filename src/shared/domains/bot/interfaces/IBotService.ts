import { Bot } from '../types';

export interface IBotService {
  create(name: string, token: string, userId: string): Promise<Bot>;
  getById(id: string): Promise<Bot | null>;
  getAll(): Promise<Bot[]>;
  update(id: string, data: Partial<Omit<Bot, 'id'>>): Promise<Bot>;
  delete(id: string): Promise<void>;
}
