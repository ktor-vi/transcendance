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
		https: {
			key: fs.readFileSync('./certs/localhost.key'),
			cert: fs.readFileSync('./certs/localhost.crt'),
		},
		port: 5173,
		host: true,
		hmr: {
			host: `${process.env.VITE_HOSTNAME}`,
			protocol: "wss",
			port: 5173
		},
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
			"/chat": {
				target: `wss://${process.env.HOSTNAME}:3000`,
					ws: true,
			},
		}
	},
	historyApiFallback: true,
	/*https: false,
	  hmr: {
	  host: `${process.env.VITE_HOSTNAME}`,
	  protocol: "ws", // protocole http sinon "wss"
	  port: 5173
	  },
	  j'arrivais pas autrement pour le moment sans enlever le https
	  https: {
	  key: fs.readFileSync("/app/certs/localhost.key"),
	  cert: fs.readFileSync("/app/certs/localhost.crt"),
	  },
	  host: true,
	  port: 5173,*/
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
