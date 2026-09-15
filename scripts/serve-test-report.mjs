import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';

const reportsRoot = resolve('reports');
const port = Number(process.env.REPORT_PORT || 4174);
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.gz': 'application/gzip',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url || '/', 'http://127.0.0.1');
    if (requestUrl.pathname === '/') {
      response.writeHead(302, { Location: '/vitest/' });
      response.end();
      return;
    }

    const relativePath = decodeURIComponent(requestUrl.pathname).replace(/^\/+/, '');
    let filePath = resolve(reportsRoot, relativePath);
    if (filePath !== reportsRoot && !filePath.startsWith(`${reportsRoot}${sep}`)) {
      response.writeHead(403);
      response.end('Forbidden');
      return;
    }

    const fileStats = await stat(filePath);
    if (fileStats.isDirectory()) filePath = resolve(filePath, 'index.html');

    const content = await readFile(filePath);
    response.writeHead(200, {
      'Content-Type': mimeTypes[extname(filePath)] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    response.end(content);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Report not found. Run npm run test:unit first.');
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`Test report: http://127.0.0.1:${port}/vitest/`);
  console.log(`Coverage report: http://127.0.0.1:${port}/coverage/`);
});
