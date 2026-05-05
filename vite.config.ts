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
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://124.123.3.225:9000',
        changeOrigin: true,
        secure: false,
      },
      '/board-api': {
        target: 'http://124.123.3.225:9000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/board-api/, '/api'),
      },
      '/umpire-api': {
        target: 'http://124.123.3.225:9000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/umpire-api/, '/api'),
      },
      '/scoring-api': {
        target: 'http://124.123.3.225:9000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/scoring-api/, '/api'),
      },
      '/hubs': {
        target: 'http://124.123.3.225:9000',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
});
