import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: './',
  server: {
    proxy: {
      '/api': {
        target: 'http://backend-dev:3000',
        changeOrigin: true,
      },
      '/login': {
        target: 'http://backend-dev:3000',
        changeOrigin: true
      },
      '/logout': {
        target: 'http://backend-dev:3000',
        changeOrigin: true
      },
    //   '/me': {
    //     target: 'http://backend-dev:3000',
    //     changeOrigin: true
    //   },
	   '/profile': {
        target: 'http://backend-dev:3000',
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
        main: resolve(__dirname, 'index.html')
      }
    }
  }
});
