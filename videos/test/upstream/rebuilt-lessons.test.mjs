import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import { compileRebuild, lessonFolder, videos } from '../../tools/lib/stage-rebuild.mjs';
import { join } from 'node:path';

const entries = await readdir(join(videos, 'stage-lessons'), { withFileTypes: true });
const names = new Set(entries.map((entry) => entry.name));
const folders = entries
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

for (const id of folders) {
  const files = await readdir(lessonFolder(id));
  const hasFolderEntry = files.includes('index.mjs') || files.includes('lesson.yaml');
  const hasPromotedScript = names.has(`${id}.lesson.yaml`);
  // A registered film can keep helpers in a sibling folder. stage-lesson.test.mjs draws its scenes.
  if (!hasFolderEntry && (!hasPromotedScript || names.has(`${id}.film.mjs`))) continue;
  test(`${id}: all rebuilt scenes compile and draw on estimated timing`, async () => {
    assert(files.includes('index.mjs'), `${id}: missing rebuilt lesson index.mjs`);
    const { compiled, pending, windows } = await compileRebuild(id);
    assert.deepEqual(pending, [], `${id}: scenes are not rebuilt yet`);
    for (const window of windows) {
      assert(window.built, `${id}/${window.id}: scene was not built`);
      assert.match(compiled.svg((window.from + window.to) / 2), /<svg/);
    }
  });
}
