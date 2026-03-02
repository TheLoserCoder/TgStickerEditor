/**
 * Wrapper для правильного импорта electron в CJS окружении
 */

const electron = require('electron');

export const app = electron.app;
export const BrowserWindow = electron.BrowserWindow;
export const ipcMain = electron.ipcMain;
