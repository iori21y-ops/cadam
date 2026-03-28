#!/usr/bin/env node
// CADAM 대시보드 서버 — 정적 파일 + n8n API 프록시
const http = require('http');
const fs = require('fs');
const path = require('path');
const PORT = 3000;
const N8N_HOST = 'localhost';
const N8N_PORT = 5678;
const STATIC_DIR = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
  // n8n API 프록시: /api/n8n/* → localhost:5678/api/v1/*
  if (req.url.startsWith('/api/n8n/')) {
    const targetPath = '/api/v1/' + req.url.slice('/api/n8n/'.length);
    const opts = {
      hostname: N8N_HOST, port: N8N_PORT,
      path: targetPath, method: req.method,
      headers: { ...req.headers, host: `${N8N_HOST}:${N8N_PORT}` },
    };
    delete opts.headers.origin;
    delete opts.headers.referer;
    const proxy = http.request(opts, (pRes) => {
      res.writeHead(pRes.statusCode, {
        ...pRes.headers,
        'access-control-allow-origin': '*',
        'access-control-allow-headers': '*',
        'access-control-allow-methods': 'GET, PUT, POST, PATCH, DELETE, OPTIONS',
      });
      pRes.pipe(res);
    });
    proxy.on('error', (e) => {
      res.writeHead(502, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: 'n8n proxy error: ' + e.message }));
    });
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'access-control-allow-origin': '*',
        'access-control-allow-headers': '*',
        'access-control-allow-methods': 'GET, PUT, POST, PATCH, DELETE, OPTIONS',
      });
      res.end();
      return;
    }
    req.pipe(proxy);
    return;
  }
  // 정적 파일 서빙
  let filePath = path.join(STATIC_DIR, req.url === '/' ? 'cadam-dashboard.html' : req.url);
  const ext = path.extname(filePath);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'content-type': 'text/plain' });
      res.end('Not Found');
      return;
    }
    res.writeHead(200, { 'content-type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`CADAM 대시보드 서버 시작: http://localhost:${PORT}`);
  console.log(`n8n 프록시: /api/n8n/* → localhost:${N8N_PORT}/api/v1/*`);
});
