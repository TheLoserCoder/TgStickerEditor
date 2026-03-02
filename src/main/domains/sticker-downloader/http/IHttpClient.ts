export interface IHttpClient {
  get(url: string): Promise<string>;
  getBuffer(url: string): Promise<Buffer>;
}
