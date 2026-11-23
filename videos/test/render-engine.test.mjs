import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, mkdir, writeFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { renderEngineBytes, renderEngineProvenance } from '../lib/render-engine.mjs';

test('runtime provenance covers imported chunks and assets with stable repeated reads', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'leetllm-engine-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, 'dist'));
  await mkdir(join(root, 'assets/fonts'), { recursive: true });
  await mkdir(join(root, 'assets/emoji'), { recursive: true });
  const entry = join(root, 'dist/index.js');
  await writeFile(
    join(root, 'package.json'),
    JSON.stringify({ name: 'vizmatic', version: '0.4.0' }),
  );
  await writeFile(entry, 'import { value } from "./chunk.js"; export { value };');
  await writeFile(join(root, 'dist/chunk.js'), 'export const value = 1;');
  await writeFile(join(root, 'assets/fonts/font.ttf'), 'font bytes');
  await writeFile(join(root, 'assets/emoji/1f600.svg'), '<svg/>');
  await writeFile(join(root, 'assets/emoji.json.br'), 'emoji bundle');
  await writeFile(join(root, 'pnpm-lock.yaml'), 'lockfileVersion: 9');
  const before = renderEngineProvenance({ entry }),
    bytesBefore = renderEngineBytes({ entry });
  assert.deepEqual(renderEngineProvenance({ entry }), before);
  assert.deepEqual(renderEngineBytes({ entry }), bytesBefore);

  // The entry stays byte-for-byte identical: the imported runtime chunk is the changed engine input.
  await writeFile(join(root, 'dist/chunk.js'), 'export const value = 2;');
  const changedChunk = renderEngineProvenance({ entry });
  assert.equal(before.version, changedChunk.version);
  assert.equal(before.entrySha256, changedChunk.entrySha256);
  assert.equal(before.packageSha256, changedChunk.packageSha256);
  assert.notEqual(before.runtimeSha256, changedChunk.runtimeSha256);
  assert.notDeepEqual(bytesBefore, renderEngineBytes({ entry }));
  assert.deepEqual(renderEngineProvenance({ entry }), changedChunk);

  await writeFile(join(root, 'assets/emoji/1f600.svg'), '<svg><circle/></svg>');
  assert.notEqual(changedChunk.runtimeSha256, renderEngineProvenance({ entry }).runtimeSha256);
  await writeFile(join(root, 'pnpm-lock.yaml'), 'lockfileVersion: 10');
  assert.notEqual(
    changedChunk.dependencyLockSha256,
    renderEngineProvenance({ entry }).dependencyLockSha256,
  );
});

test('runtime provenance rejects symlinks that escape the package runtime tree', async (t) => {
  const parent = await mkdtemp(join(tmpdir(), 'leetllm-engine-link-'));
  t.after(() => rm(parent, { recursive: true, force: true }));
  const root = join(parent, 'package');
  await mkdir(join(root, 'dist'), { recursive: true });
  const entry = join(root, 'dist/index.js');
  await writeFile(
    join(root, 'package.json'),
    JSON.stringify({ name: 'vizmatic', version: '0.4.0' }),
  );
  await writeFile(entry, 'export const value = 1;');
  await writeFile(join(parent, 'outside.js'), 'export const outside = true;');
  await symlink(join(parent, 'outside.js'), join(root, 'dist/outside.js'));
  assert.throws(() => renderEngineProvenance({ entry }), /escapes its package boundary/);

  await rm(join(root, 'dist/outside.js'));
  await mkdir(join(root, 'assets'), { recursive: true });
  await symlink(join(parent, 'outside.js'), join(root, 'assets/emoji.json.br'));
  assert.throws(() => renderEngineProvenance({ entry }), /escapes its package boundary/);
});

test('the minimal fake-package fixture remains valid without optional runtime assets', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'leetllm-engine-minimal-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, 'dist'));
  const entry = join(root, 'dist/index.js');
  await writeFile(
    join(root, 'package.json'),
    JSON.stringify({ name: 'vizmatic', version: '0.4.0' }),
  );
  await writeFile(entry, 'export const value = 1;');
  const result = renderEngineProvenance({ entry });
  assert.equal(result.runtimeFileCount, 1);
  assert.deepEqual(result.runtimeRoots, [
    'dist/**',
    'assets/fonts/**',
    'assets/emoji/**',
    'assets/emoji.json.br',
  ]);
});
