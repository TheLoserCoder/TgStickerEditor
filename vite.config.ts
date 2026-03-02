import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  base: './',
  build: {
    outDir: 'dist-renderer',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-redux'],
          'radix-ui': [
            '@radix-ui/themes',
            '@radix-ui/react-icons',
            '@radix-ui/react-context-menu'
          ],
          'dnd-kit': [
            '@dnd-kit/core',
            '@dnd-kit/sortable',
            '@dnd-kit/modifiers',
            '@dnd-kit/utilities'
          ],
          'router': ['react-router-dom']
        }
      }
    }
  },
  server: {
    port: 5173,
  },
});
