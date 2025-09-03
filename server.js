const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;
const PUBLIC_DIR = path.join(__dirname, 'public');

function sendFile(res, filePath, contentType) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.html': return 'text/html; charset=utf-8';
    case '.css': return 'text/css; charset=utf-8';
    case '.js': return 'application/javascript; charset=utf-8';
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.gif': return 'image/gif';
    case '.svg': return 'image/svg+xml';
    case '.ico': return 'image/x-icon';
    case '.txt': return 'text/plain; charset=utf-8';
    default: return 'application/octet-stream';
  }
}

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  let filePath = path.join(PUBLIC_DIR, urlPath === '/' ? '/index.html' : urlPath);

  // Prevent path traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stat) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    if (stat.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
    sendFile(res, filePath, getContentType(filePath));
  });
});

server.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`Serving from ${PUBLIC_DIR}`);
  console.log(`Game running at ${url}`);

  // Try to open the browser automatically
  const platform = process.platform;
  let opener;
  if (platform === 'darwin') opener = 'open';
  else if (platform === 'win32') opener = 'start';
  else opener = 'xdg-open';

  try {
    const child = spawn(opener, [url], { stdio: 'ignore', shell: true, detached: true });
    child.unref();
  } catch (e) {
    console.log('Please open your browser to', url);
  }
});

