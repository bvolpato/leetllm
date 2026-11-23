#!/usr/bin/env node
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, join, relative, extname } from 'node:path';
import { uploadAsset, verifyRemoteAsset } from './upload-client.mjs';
const args = process.argv.slice(2);
const option = (key, fallback) => (args.includes(key) ? args[args.indexOf(key) + 1] : fallback);
const root = resolve(new URL('../..', import.meta.url).pathname);
const manifest = JSON.parse(
  await readFile(
    resolve(option('--manifest', 'build/video-youtube-curation-20261021/assets/manifest.json')),
    'utf8',
  ),
);
const gallery = resolve(option('--gallery', 'build/youtube-gallery'));
const receiptPath = resolve(
  option('--receipt', 'build/video-youtube-curation-20261021/upload-receipt.json'),
);
const verifyOnly = args.includes('--verify-only');
const assetsOnly = args.includes('--assets-only');
const concurrency = Number(option('--concurrency', '12'));
if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 12)
  throw new Error('Concurrency must be between 1 and 12.');
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const credentials = await new Promise((accept, reject) => {
  let input = '';
  if (process.stdin.isTTY) process.stdin.setRawMode(true);
  process.stdin.setEncoding('utf8');
  process.stderr.write(
    'Ready for private Site URL and service token JSON on stdin (input is hidden).\n',
  );
  const data = (chunk) => {
    input += chunk;
    if (!input.includes('\n')) return;
    process.stdin.off('data', data);
    process.stdin.pause();
    if (process.stdin.isTTY) process.stdin.setRawMode(false);
    try {
      accept(JSON.parse(input.trim()));
    } catch {
      reject(new Error('Invalid credential input'));
    }
  };
  process.stdin.on('data', data);
  process.stdin.resume();
});
const origin = new URL(credentials.url);
if (
  origin.protocol !== 'https:' ||
  !origin.hostname.endsWith('.chatgpt.site') ||
  origin.pathname !== '/' ||
  !credentials.serviceToken
)
  throw new Error('Use the exact private Site origin and its service token.');
const auth = { 'OAI-Sites-Authorization': `Bearer ${credentials.serviceToken}` };
const files = assetsOnly
  ? []
  : manifest.lessons.flatMap((row) =>
      ['video', 'poster', 'vtt', 'srt', 'chapters'].map((key) => ({
        ...row[key],
        key: row[key].path,
      })),
    );
const textExtensions = new Set(['.html', '.js', '.css', '.json', '.csv', '.svg']);
async function images(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (directory === gallery && entry.name === 'media') continue;
    const file = join(directory, entry.name);
    if (entry.isDirectory()) {
      await images(file);
      continue;
    }
    if (textExtensions.has(extname(file))) continue;
    const bytes = await readFile(file),
      key = `assets/${relative(gallery, file).split('\\').join('/')}`;
    files.push({
      key,
      path: key.slice('assets/'.length),
      source: file,
      sha256: hash(bytes),
      bytes: bytes.length,
      contentType: extname(file) === '.png' ? 'image/png' : 'application/octet-stream',
    });
  }
}
await images(gallery);
let cursor = 0,
  done = 0;
const results = [];
await Promise.all(
  Array.from({ length: concurrency }, async () => {
    while (cursor < files.length) {
      const file = files[cursor++],
        source = resolve(root, file.source);
      const uploaded = verifyOnly
        ? { mode: 'verify-only' }
        : await uploadAsset(file, source, origin, auth);
      results.push({ ...(await verifyRemoteAsset(file, source, origin, auth)), upload: uploaded });
      done++;
      if (done % 25 === 0 || done === files.length)
        console.log(JSON.stringify({ done, total: files.length }));
    }
  }),
);
await writeFile(
  receiptPath,
  JSON.stringify(
    {
      version: 1,
      site: origin.origin,
      verifiedAt: new Date().toISOString(),
      files: results.sort((a, b) => a.path.localeCompare(b.path)),
    },
    null,
    2,
  ) + '\n',
);
console.log(
  JSON.stringify({
    verified: results.length,
    movieRanges: results.filter((row) => row.rangeVerified).length,
    receipt: receiptPath,
  }),
);
