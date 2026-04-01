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
        target: 'http://10.10.20.24:9002',
        changeOrigin: true,
        secure: false,
      },
      '/board-api': {
        target: 'http://10.10.20.24:9003',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/board-api/, '/api'),
      },
      '/umpire-api': {
        target: 'http://10.10.20.24:9004',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/umpire-api/, '/api'),
      },
      '/hubs': {
        target: 'http://10.10.20.24:9002',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
});
