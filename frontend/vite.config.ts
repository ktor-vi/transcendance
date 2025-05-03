import { defineConfig } from 'vite';

export default defineConfig({
  root: './',
  server: {
    proxy: {
      '/api': 'http://backend:3000',
    },
    host: true,
    port: 5173,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
});
