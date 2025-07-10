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
			'/uploads' : {
				target: 'http://backend-dev:3000',
				changeOrigin: true,
			}
		},
		historyApiFallback: true,
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
