/**
 * BaseRepository - базовый класс для репозиториев с трансформацией Entity → DTO
 */

export abstract class BaseRepository<E, D> {
  constructor(
    protected mapper: { toDTO(entity: E): D; fromDTO(dto: D): E },
    public readonly domain: string
  ) {}

  public transform(result: any): any {
    if (!result) return null;

    if (this.isEntity(result)) {
      return Array.isArray(result) 
        ? result.map(i => this.mapper.toDTO(i)) 
        : this.mapper.toDTO(result);
    }

    return result;
  }

  private isEntity(data: any): boolean {
    return typeof data === 'object' && data !== null && typeof data.toDTO === 'function';
  }
}
