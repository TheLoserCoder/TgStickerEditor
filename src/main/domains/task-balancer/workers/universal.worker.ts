import { parentPort } from 'worker_threads';
import path from 'path';
import { pathToFileURL } from 'url';
import { WorkerMessage, WorkerResponse } from '../types';

/**
 * Универсальный воркер - точка входа для всех задач
 * Динамически импортирует обработчик задачи из собранных файлов
 */
if (!parentPort) {
  throw new Error('This file must be run as a Worker');
}

parentPort.on('message', async (message: WorkerMessage) => {
  try {
    const taskPath = path.join(__dirname, '..', 'tasks', `${message.taskType}.task.js`);
    const taskURL = pathToFileURL(taskPath).href;
    const taskModule = await import(taskURL);
    
    if (typeof taskModule.execute !== 'function') {
      throw new Error(`Task "${message.taskType}" does not export an execute function`);
    }

    const result = await taskModule.execute(message.data);

    const response: WorkerResponse = {
      id: message.id,
      success: true,
      result
    };
    parentPort!.postMessage(response);
  } catch (error) {
    const response: WorkerResponse = {
      id: message.id,
      success: false,
      error: error instanceof Error ? `${error.message}\n${error.stack}` : String(error)
    };
    parentPort!.postMessage(response);
  }
});
