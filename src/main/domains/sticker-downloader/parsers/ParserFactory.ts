import { IParser } from './IParser';

export interface IParserFactory {
  getParser(url: string): IParser | null;
}

export class ParserFactory implements IParserFactory {
  constructor(private parsers: IParser[]) {}
  
  getParser(url: string): IParser | null {
    return this.parsers.find(p => p.canHandle(url)) || null;
  }
}
