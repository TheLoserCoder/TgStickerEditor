export interface IIPCBridge {
  invoke<T = any>(channel: string, ...args: any[]): Promise<T>;
  send(channel: string, ...args: any[]): void;
  on(channel: string, listener: (...args: any[]) => void): void;
  off(channel: string, listener: (...args: any[]) => void): void;
}
