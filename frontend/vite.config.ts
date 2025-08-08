import { defineConfig } from 'vite';
import { resolve } from 'path';
import fs from "fs";
// Fonction pour ajouter la configuration de forwarding de cookies
function cookieForwarding(proxy) {
  proxy.on('proxyReq', (proxyReq, req) => {
    if (req.headers.cookie) {
      proxyReq.setHeader('cookie', req.headers.cookie);
    }
  });
  proxy.on('proxyRes', (proxyRes, req, res) => {
    if (proxyRes.headers['set-cookie']) {
      res.setHeader('set-cookie', proxyRes.headers['set-cookie']);
    }
  });
}

export default defineConfig({
  root: "./",
  server: {
    proxy: {
      "/api": {
        target: `https://${process.env.HOSTNAME}:3000`,
        changeOrigin: true,
        secure: false,
        configure: cookieForwarding,
      },
      "/login": {
        target: `https://${process.env.HOSTNAME}:3000`,
        changeOrigin: true,
        secure: false,
        configure: cookieForwarding,
      },
      "/logout": {
        target: `https://${process.env.HOSTNAME}:3000`,
        changeOrigin: true,
        secure: false,
        configure: cookieForwarding,
      },
      "/me": {
        target: `https://${process.env.HOSTNAME}:3000`,
        changeOrigin: true,
        secure: false,
        configure: cookieForwarding,
      },
      "/uploads": {
        target: `https://${process.env.HOSTNAME}:3000`,
        changeOrigin: true,
        secure: false,
        configure: cookieForwarding,
      },
      "/ws": {
        target: `wss://${process.env.HOSTNAME}:3000`,
        ws: true
      }
    },
    historyApiFallback: true,
    hmr: {
      host: `${process.env.VITE_HOSTNAME}`, // doit correspondre à ce que tu utilises dans le navigateur
      protocol: "wss", // si tu utilises HTTPS
    },
    https: {
      key: fs.readFileSync("/app/certs/localhost.key"),
      cert: fs.readFileSync("/app/certs/localhost.crt"),
    },
    host: true,
    port: 5173,
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
      },
    },
  },
});
