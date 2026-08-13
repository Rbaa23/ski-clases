const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  let urlPath;
  try {
    urlPath = decodeURIComponent(req.url.split('?')[0]);
  } catch (e) {
    res.writeHead(400); res.end('Bad request'); return;
  }
  if (urlPath === '/') urlPath = 'preview-fondos.html';
  const filePath = path.normalize(path.join(__dirname, urlPath));
  const rel = path.relative(__dirname, filePath);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }
  fs.readFile(filePath, (err, content) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(content);
  });
});

server.listen(8080, () => console.log('http://localhost:8080/preview-fondos.html'));
