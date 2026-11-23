import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readGallerySources } from './gallery-sources.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { assets, data } = await readGallerySources(root);
const source = await fs.readFile(path.join(root, 'worker-source.mjs'), 'utf8');
const marker = 'const EMBEDDED_ASSETS = {};';
assert.equal(source.split(marker).length, 2, 'Worker needs one asset insertion point');
await fs.mkdir(path.join(root, 'worker'), { recursive: true });
await fs.writeFile(
  path.join(root, 'worker/index.js'),
  source.replace(marker, () => `const EMBEDDED_ASSETS = ${JSON.stringify(assets)};`),
);
console.log(
  JSON.stringify({
    assets: Object.keys(assets).length,
    lessons: data.lessons.length,
    snapshot: data.generatedAt,
    scope: 'Evidence index only; no new editorial decision.',
  }),
);
