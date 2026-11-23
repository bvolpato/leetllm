#!/usr/bin/env node
import fs from 'node:fs/promises';
import { resolve, join, dirname, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const option = (key, fallback) => (args.includes(key) ? args[args.indexOf(key) + 1] : fallback);
const gallery = resolve(
  option('--gallery', 'build/video-inspection-milestone-20261108/attempt-04'),
);
const checkout = resolve(option('--checkout', 'build/video-youtube-curation-20261021/hosted-site'));
const archive = resolve(
  option('--archive', join(dirname(gallery), `site-package-before-${Date.now()}`)),
);
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const hosting = JSON.parse(await fs.readFile(join(checkout, '.openai/hosting.json'), 'utf8'));
if (!hosting.project_id) throw new Error('Use the existing owner-private Site checkout.');
const metadata = JSON.parse(await fs.readFile(join(checkout, 'package.json'), 'utf8'));
await fs.access(join(checkout, 'scripts/build.sh'));
if (metadata.type !== 'module') throw new Error('The Site checkout must use ESM.');
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.svg': 'image/svg+xml',
};
const files = [];
async function collect(directory) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    if (directory === gallery && entry.name === 'media') continue;
    const source = join(directory, entry.name);
    if (entry.isDirectory()) {
      await collect(source);
      continue;
    }
    const contentType = types[extname(entry.name)];
    if (!contentType) continue;
    const bytes = await fs.readFile(source);
    files.push({
      path: relative(gallery, source).split('\\').join('/'),
      sha256: hash(bytes),
      bytes: bytes.length,
      contentType,
      source,
    });
  }
}
await collect(gallery);
if (!files.some((file) => file.path === 'status-index.json'))
  throw new Error('Expected an inspection status index.');
const writes = new Map(files.map((file) => [`gallery/${file.path}`, file.source]));
writes.set('worker-source.mjs', join(here, 'worker.mjs'));
for (const name of ['build-gallery.mjs', 'gallery-sources.mjs', 'validate-artifact.mjs'])
  writes.set(`scripts/${name}`, join(here, 'site-scripts', name));
const targets = [
  ...writes.keys(),
  'gallery-source-manifest.json',
  '.openai/hosting.json',
  'package.json',
  'worker/index.js',
];
const before = [];
await fs.mkdir(archive, { recursive: true });
for (const name of targets) {
  const file = join(checkout, name);
  const info = await fs
    .lstat(file)
    .catch((error) => (error.code === 'ENOENT' ? null : Promise.reject(error)));
  if (!info) continue;
  if (!info.isFile()) throw new Error(`Refusing to overwrite a nonregular Site file: ${name}`);
  const bytes = await fs.readFile(file),
    copy = join(archive, name);
  await fs.mkdir(dirname(copy), { recursive: true });
  await fs.writeFile(copy, bytes, { flag: 'wx' });
  before.push({ path: name, sha256: hash(bytes), bytes: bytes.length });
}
await fs.writeFile(join(archive, 'before.json'), JSON.stringify(before, null, 2) + '\n', {
  flag: 'wx',
});
for (const [name, source] of writes) {
  await fs.mkdir(dirname(join(checkout, name)), { recursive: true });
  await fs.copyFile(source, join(checkout, name));
}
hosting.r2 = 'BUCKET';
hosting.d1 = null;
delete hosting.static;
await fs.writeFile(join(checkout, '.openai/hosting.json'), JSON.stringify(hosting, null, 2) + '\n');
metadata.scripts = {
  ...metadata.scripts,
  build: 'node scripts/build-gallery.mjs && bash scripts/build.sh',
  validate: 'node scripts/validate-artifact.mjs',
};
await fs.writeFile(join(checkout, 'package.json'), JSON.stringify(metadata, null, 2) + '\n');
const manifest = {
  schemaVersion: 1,
  kind: 'leetllm.inspection-gallery-source',
  files: files.map(({ source, ...file }) => file),
  scope:
    'Exact current source assets only. Unlisted legacy Site files remain preserved and are excluded from the new bundle.',
};
await fs.writeFile(
  join(checkout, 'gallery-source-manifest.json'),
  JSON.stringify(manifest, null, 2) + '\n',
);
const result = await promisify(execFile)(process.execPath, ['scripts/build-gallery.mjs'], {
  cwd: checkout,
});
console.log(result.stdout.trim());
console.log(
  JSON.stringify({
    checkout,
    archive,
    files: files.length,
    projectId: hosting.project_id,
    r2: hosting.r2,
    next: 'npm run build && npm run validate',
    uploaded: false,
  }),
);
