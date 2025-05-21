import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: './',
  server: {
     proxy: {
    '/api': {
      target: 'http://backend:3000',
      changeOrigin: true,
    },
    '/login': {
      target: 'http://backend:3000',
      changeOrigin: true
    },
    '/logout': {
      target: 'http://backend:3000',
      changeOrigin: true
    },
    '/me': {
      target: 'http://backend:3000',
      changeOrigin: true
    }
  },
    host: true,
    port: 5173,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        dashboard: resolve(__dirname, 'dashboard.html')
      }
    }
  }
});
