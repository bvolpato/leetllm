#!/usr/bin/env node
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { parseRange } from './worker.mjs';

const args = process.argv.slice(2);
const option = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const directory = path.resolve(
  option('--directory', 'build/video-inspection-milestone-20261108/attempt-01'),
);
const port = Number(option('--port', '8589'));
const manifest = JSON.parse(await fs.readFile(path.join(directory, 'media-manifest.json'), 'utf8'));
const media = new Map(
  manifest.lessons.flatMap((row) =>
    ['video', 'poster', 'vtt', 'srt', 'chapters'].map((kind) => [row[kind].path, row[kind]]),
  ),
);
const generated = new Map([
  ['index.html', 'text/html; charset=utf-8'],
  ['inspection.css', 'text/css; charset=utf-8'],
  ['inspection.js', 'text/javascript; charset=utf-8'],
  ['status-index.json', 'application/json; charset=utf-8'],
  ['status-index.csv', 'text/csv; charset=utf-8'],
  ['media-manifest.json', 'application/json; charset=utf-8'],
]);
createServer(async (request, response) => {
  try {
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.writeHead(405);
      response.end();
      return;
    }
    const key =
      decodeURIComponent(new URL(request.url, 'http://localhost').pathname).replace(/^\/+/, '') ||
      'index.html';
    const asset = media.get(key);
    if (!asset && !generated.has(key)) {
      response.writeHead(404);
      response.end();
      return;
    }
    const file = path.join(directory, key);
    const stat = await fs.stat(file);
    const range = request.headers.range ? parseRange(request.headers.range, stat.size) : null;
    if (request.headers.range && !range) {
      response.writeHead(416, { 'Content-Range': `bytes */${stat.size}` });
      response.end();
      return;
    }
    const headers = {
      'Content-Type': asset?.contentType ?? generated.get(key),
      'Cache-Control': 'private, no-store',
      'Accept-Ranges': 'bytes',
      'Content-Length': range?.length ?? stat.size,
    };
    if (asset) headers['X-Content-SHA256'] = asset.sha256;
    if (range)
      headers['Content-Range'] =
        `bytes ${range.offset}-${range.offset + range.length - 1}/${stat.size}`;
    response.writeHead(range ? 206 : 200, headers);
    if (request.method === 'HEAD') response.end();
    else
      createReadStream(
        file,
        range ? { start: range.offset, end: range.offset + range.length - 1 } : undefined,
      ).pipe(response);
  } catch {
    if (!response.headersSent) response.writeHead(500);
    response.end();
  }
}).listen(port, '127.0.0.1', () =>
  console.log(`Local inspection preview: http://127.0.0.1:${port}`),
);
