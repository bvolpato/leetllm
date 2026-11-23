import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { stringify } from 'yaml';
import { readLesson } from '../lib/lesson.mjs';

test('markup rejects ambiguous scene identities, unsafe sources, and invalid speech pauses', async () => {
  const root = await mkdtemp(join(tmpdir(), 'leetllm-markup-'));
  try {
    const content = join(root, 'web/src/content/example');
    await mkdir(content, { recursive: true });
    await writeFile(join(content, 'content.md'), 'A source article.');
    const file = join(root, 'example.lesson.yaml');
    const scene = {
      id: 'one',
      title: 'A scene',
      visual: 'A moving point',
      beats: [{ say: 'A useful spoken explanation.', hold: 0.5 }],
    };
    const base = {
      version: 1,
      id: 'example',
      title: 'An explanation',
      source: 'example/content.md',
      scenes: [scene],
    };
    const parse = async (data) => {
      await writeFile(file, stringify(data));
      return readLesson(file, root);
    };
    assert.equal((await parse(base)).id, 'example');
    await assert.rejects(parse({ ...base, scenes: [scene, scene] }), /duplicate scene id/);
    await assert.rejects(parse({ ...base, source: '../../../outside.md' }), /inside content/);
    await assert.rejects(
      parse({ ...base, scenes: [{ ...scene, beats: [{ say: 'Speech', hold: -1 }] }] }),
      /hold must be/,
    );
    await assert.rejects(
      parse({ ...base, scenes: [{ ...scene, beats: [] }] }),
      /beats must be nonempty/,
    );
    await assert.rejects(parse({ ...base, version: 2 }), /version must be 1/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
