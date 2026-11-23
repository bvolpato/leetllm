#!/usr/bin/env node
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, join, relative } from 'node:path';
const root = resolve(new URL('../..', import.meta.url).pathname);
const args = process.argv.slice(2);
const option = (key, fallback) => args.includes(key) ? args[args.indexOf(key) + 1] : fallback;
const input = resolve(root, option('--input', 'build/video-complete-curriculum'));
const materials = resolve(root, option('--materials', 'build/video-youtube-curation-20261021/materials'));
const output = resolve(root, option('--output', 'build/video-youtube-curation-20261021/assets'));
const sha256 = value => createHash('sha256').update(value).digest('hex');
await mkdir(output, { recursive: true });
const receipts = JSON.parse(await readFile(join(input, 'manifest.json'), 'utf8'));
const manifest = { version: 1, lessons: [] };
for (const receipt of receipts) {
  const material = JSON.parse(await readFile(join(materials, receipt.id, 'material.json'), 'utf8'));
  const native = material.native[Math.floor(material.native.length / 2)];
  const frame = await readFile(resolve(root, native.path));
  if (sha256(frame) !== native.sha256) throw new Error(`Poster source changed: ${receipt.id}`);
  const canvas = createCanvas(960, 540), ctx = canvas.getContext('2d');
  ctx.drawImage(await loadImage(frame), 0, 0, 960, 540);
  const poster = join(output, `${receipt.id}.jpg`);
  await writeFile(poster, await canvas.encode('jpeg', 88));
  const row = { id: receipt.id, movieSha256: receipt.sha256 };
  for (const [kind, file, type] of [
    ['video', `${receipt.id}.mp4`, 'video/mp4'], ['poster', `${receipt.id}.jpg`, 'image/jpeg'],
    ['vtt', `${receipt.id}.vtt`, 'text/vtt; charset=utf-8'], ['srt', `${receipt.id}.srt`, 'application/x-subrip; charset=utf-8'],
    ['chapters', `${receipt.id}.chapters.txt`, 'text/plain; charset=utf-8'],
  ]) {
    const source = kind === 'poster' ? poster : join(input, receipt.id, file), bytes = await readFile(source), digest = sha256(bytes);
    if (kind === 'video' && digest !== receipt.sha256) throw new Error(`Movie changed: ${receipt.id}`);
    row[kind] = { path: `media/${receipt.id}/${digest}/${file}`, sha256: digest, bytes: bytes.length, contentType: type, source: relative(root, source) };
  }
  row.poster.sourceFrame = native;
  manifest.lessons.push(row);
}
await writeFile(join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify({ lessons: manifest.lessons.length, files: manifest.lessons.length * 5, bytes: manifest.lessons.reduce((sum, row) => sum + ['video', 'poster', 'vtt', 'srt', 'chapters'].reduce((n, key) => n + row[key].bytes, 0), 0), manifest: join(output, 'manifest.json') }));
