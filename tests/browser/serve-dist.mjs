// Serves the production build the way Workers Assets does, because some bugs only exist after minifying.
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../../dist/client/", import.meta.url));
const PORT = Number(process.argv[2]);

const TYPES = {
  ".css": "text/css",
  ".gif": "image/gif",
  ".html": "text/html",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".js": "text/javascript",
  ".json": "application/json",
  ".mjs": "text/javascript",
  ".mp4": "video/mp4",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain",
  ".wasm": "application/wasm",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".xml": "text/xml",
};

if (!fs.existsSync(path.join(ROOT, "404.html"))) {
  console.error(`No production build at ${ROOT}. Run: npm run build`);
  process.exit(1);
}

function resolveFile(urlPath) {
  const candidates = [urlPath, `${urlPath}.html`, path.join(urlPath, "index.html")];
  return candidates
    .map((candidate) => path.join(ROOT, candidate))
    .find((file) => file.startsWith(ROOT) && fs.existsSync(file) && fs.statSync(file).isFile());
}

const server = http.createServer((request, response) => {
  const file = resolveFile(decodeURIComponent(request.url.split("?")[0]));
  if (!file) {
    response.writeHead(404, { "content-type": "text/html" });
    response.end(fs.readFileSync(path.join(ROOT, "404.html")));
    return;
  }
  response.writeHead(200, { "content-type": TYPES[path.extname(file)] ?? "application/octet-stream" });
  fs.createReadStream(file).pipe(response);
});

server.listen(PORT, "127.0.0.1");
