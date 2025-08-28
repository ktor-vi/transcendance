import { defineConfig } from "vite";
import { resolve } from "path";
import fs from "fs";

function cookieForwarding(proxy) {
  proxy.on("proxyReq", (proxyReq, req) => {
    if (req.headers.cookie) {
      proxyReq.setHeader("cookie", req.headers.cookie);
    }
  });
  proxy.on("proxyRes", (proxyRes, req, res) => {
    if (proxyRes.headers["set-cookie"]) {
      res.setHeader("set-cookie", proxyRes.headers["set-cookie"]);
    }
  });
}

export default defineConfig({
  appType: "spa",
  root: "./",
  server: {
    https: {
      key: fs.readFileSync("./certs/localhost.key"),
      cert: fs.readFileSync("./certs/localhost.crt"),
    },
    port: 5173,
    host: true,
    hmr: {
      host: `${process.env.VITE_HOSTNAME}`,
      protocol: "wss",
      port: 5173,
    },
    proxy: {
      // Regular HTTP endpoints
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
      // WebSocket endpoint - CORRIGÉ
      "/chat": {
        target: `https://${process.env.HOSTNAME}:3000`,
        changeOrigin: true,
        secure: false,
        ws: true, // Active le proxying WebSocket
        configure: (proxy, options) => {
          proxy.on("error", (err, req, res) => {
            console.log("WebSocket proxy error:", err);
          });

          proxy.on("proxyReqWs", (proxyReq, req, socket, head) => {
            console.log("WebSocket proxy request:", proxyReq.path);
            // Forward les cookies pour l'authentification
            if (req.headers.cookie) {
              proxyReq.setHeader("cookie", req.headers.cookie);
            }
          });

          proxy.on("open", (proxySocket) => {
            console.log("WebSocket proxy connection opened");
          });

          proxy.on("close", (res, socket, head) => {
            console.log("WebSocket proxy connection closed");
          });
        },
      },
    },

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
	optimizeDeps: {
		force: true, // force Vite à re-bundler tous les modules
		exclude: [
		],
	},
});
