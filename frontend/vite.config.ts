import { defineConfig } from "vite";
import { resolve } from "path";
import fs from "fs";

// Fonction pour forwarder les cookies dans les proxys
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
			key: fs.readFileSync("./certs/localhost.key"), // ⚠️ adapte si tes certs sont ailleurs
			cert: fs.readFileSync("./certs/localhost.crt"),
		},
		port: 5173,
		host: true,
		hmr: {
			host: process.env.VITE_HOSTNAME || "localhost", // ✅ évite le /undefined
			protocol: "wss",
			// pas besoin de forcer le port, Vite utilise celui de server.port
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
			// Proxy WebSocket pour /chat
			"/chat": {
				target: `https://${process.env.HOSTNAME}:3000`,
				changeOrigin: true,
				secure: false,
				ws: true,
				configure: (proxy) => {
					proxy.on("error", (err) => {
						console.log("WebSocket proxy error:", err);
					});
					proxy.on("proxyReqWs", (proxyReq, req) => {
						console.log("WebSocket proxy request:", proxyReq.path);
						if (req.headers.cookie) {
							proxyReq.setHeader("cookie", req.headers.cookie);
						}
					});
					proxy.on("open", () => {
						console.log("WebSocket proxy connection opened");
					});
					proxy.on("close", () => {
						console.log("WebSocket proxy connection closed");
					});
				},
			},
		},
		fs: {
		strict: false, // permet d’accéder aux fichiers en dehors de root si nécessaire
		},
		historyApiFallback: {
			disableDotRule: true, // important si tes routes ont des points
			rewrites: [
				{ from: /^\/.*$/, to: '/index.html' } // toutes les routes non trouvées renvoient index.html
			],
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
		force: true,
		exclude: [],
	},
});
