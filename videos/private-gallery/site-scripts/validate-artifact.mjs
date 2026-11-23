import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { digest, readGallerySources } from './gallery-sources.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { assets, data } = await readGallerySources(root);
const bytes = await fs.readFile(path.join(root, 'dist/server/index.js'));
const module = await import(`data:text/javascript;base64,${bytes.toString('base64')}`);
assert.equal(typeof module.default?.fetch, 'function');
assert.deepEqual(
  JSON.parse(await fs.readFile(path.join(root, 'dist/.openai/hosting.json'))),
  JSON.parse(await fs.readFile(path.join(root, '.openai/hosting.json'))),
);
const env = { BUCKET: { head: async () => null } };
for (const [name, expected] of Object.entries(assets)) {
  const response = await module.default.fetch(new Request(`https://gallery.test/${name}`), env);
  assert.equal(response.status, 200, `Missing embedded asset: ${name}`);
  assert.equal(
    digest(Buffer.from(await response.arrayBuffer())),
    digest(expected.body),
    `Artifact differs: ${name}`,
  );
  assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
}
for (const entry of await fs.readdir(path.join(root, 'gallery'), { withFileTypes: true })) {
  if (!entry.isFile() || assets[entry.name]) continue;
  assert.equal(
    (await module.default.fetch(new Request(`https://gallery.test/${entry.name}`), env)).status,
    404,
    `Unlisted legacy file entered bundle: ${entry.name}`,
  );
}
console.log(
  JSON.stringify({
    status: 'PASS',
    lessons: data.lessons.length,
    exactEmbeddedAssets: Object.keys(assets).length,
    scope: 'Static artifact/source and private-header checks; not hosted auth or movie review.',
  }),
);
