import axios from 'axios';
import * as https from 'https';
import { IHttpClient } from './IHttpClient';

export class AxiosHttpClient implements IHttpClient {
  private agent: https.Agent;
  
  constructor() {
    this.agent = new https.Agent({ 
      rejectUnauthorized: false
    });
  }
  
  async get(url: string): Promise<string> {
    const response = await axios.get(url, { 
      httpsAgent: this.agent 
    });
    return response.data;
  }
  
  async getBuffer(url: string): Promise<Buffer> {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      httpsAgent: this.agent
    });
    return Buffer.from(response.data);
  }
}
