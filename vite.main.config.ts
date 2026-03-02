import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';
import { builtinModules } from 'module';

// Автоматическое сканирование task файлов
const tasksDir = path.resolve(__dirname, 'src/main/domains/tasks');
const taskFiles = fs.existsSync(tasksDir)
  ? fs.readdirSync(tasksDir)
      .filter(file => file.endsWith('.task.ts'))
      .reduce((entries, file) => {
        const name = file.replace('.ts', '');
        entries[`tasks/${name}`] = path.resolve(tasksDir, file);
        return entries;
      }, {} as Record<string, string>)
  : {};

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist-main',
    minify: false,
    lib: {
      entry: {
        index: path.resolve(__dirname, 'src/main/index.ts'),
        'workers/universal.worker': path.resolve(__dirname, 'src/main/domains/task-balancer/workers/universal.worker.ts'),
        ...taskFiles,
      },
      formats: ['cjs'],
      fileName: (format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      external: ['electron', 'path', 'fs', 'os', 'sharp', 'fluent-ffmpeg', '@ffmpeg-installer/ffmpeg', 'worker_threads', 'electron-store', 'child_process', 'util', 'nanoid', 'grammy', '@ffprobe-installer/ffprobe', 'ffmpeg-static', 'ffprobe-static', ...builtinModules, ...builtinModules.map(m => `node:${m}`)],
    },
    emptyOutDir: false,
    target: 'node18',
  },
});
