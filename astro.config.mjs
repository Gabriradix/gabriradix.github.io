// @ts-check
import { existsSync } from "node:fs";
import { join } from "node:path";
import { defineConfig } from "astro/config";

/**
 * @returns {any}
 */
function progettiIndexRewrite() {
  return {
    name: "progetti-index-rewrite",
    /**
     * @param {import('vite').ViteDevServer} server
     */
    configureServer(server) {
      server.middlewares.use((/** @type {import('http').IncomingMessage} */ req, /** @type {import('http').ServerResponse} */ _res, /** @type {Function} */ next) => {
        if (!req.url) {
          next();
          return;
        }

        const url = new URL(req.url, "http://localhost");

        if (!url.pathname.startsWith("/progetti/") || !url.pathname.endsWith("/")) {
          next();
          return;
        }

        const indexPath = join(process.cwd(), "public", url.pathname, "index.html");

        if (existsSync(indexPath)) {
          req.url = `${url.pathname}index.html${url.search}`;
        }

        next();
      });
    },
  };
}

export default defineConfig({
  vite: {
    plugins: [progettiIndexRewrite()],
  },
});
