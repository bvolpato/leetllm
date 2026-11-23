import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { stringify } from 'yaml';
import { discoverLessons } from '../catalog.mjs';

test('catalog discovers new lessons and binds their IDs to output filenames', async () => {
  const root = await mkdtemp(join(tmpdir(), 'leetllm-catalog-'));
  const source = join(root, 'videos');
  try {
    await mkdir(join(source, 'lessons'), { recursive: true });
    await mkdir(join(root, 'web/src/content/example'), { recursive: true });
    await writeFile(join(root, 'web/src/content/example/content.md'), 'Source article.');
    await assert.rejects(discoverLessons(source, root), /No lesson markup found/);
    const lesson = (id) => ({
      version: 1,
      id,
      title: `Lesson ${id}`,
      source: 'example/content.md',
      scenes: [
        {
          id: 'intro',
          title: 'Introduction',
          visual: 'A computed vector rotates.',
          beats: [{ say: 'Watch this vector rotate.' }],
        },
      ],
    });
    await writeFile(join(source, 'lessons/zeta.lesson.yaml'), stringify(lesson('zeta')));
    await writeFile(join(source, 'lessons/alpha.lesson.yaml'), stringify(lesson('alpha')));
    assert.deepEqual(
      (await discoverLessons(source, root)).map((entry) => entry.id),
      ['alpha', 'zeta'],
    );
    await writeFile(join(source, 'lessons/draft.lesson.yaml'), 'scenes: [unfinished');
    assert.deepEqual(
      (await discoverLessons(source, root, { lessonId: 'zeta' })).map((entry) => entry.id),
      ['zeta'],
    );
    await assert.rejects(
      discoverLessons(source, root, { lessonId: 'missing' }),
      /Lesson not found: missing/,
    );
    await assert.rejects(discoverLessons(source, root, { lessonId: 'draft' }), {
      name: 'YAMLParseError',
    });
    await assert.rejects(discoverLessons(source, root), { name: 'YAMLParseError' });
    await rm(join(source, 'lessons/draft.lesson.yaml'));
    await writeFile(join(source, 'lessons/alpha.lesson.yaml'), stringify(lesson('collision')));
    await assert.rejects(discoverLessons(source, root), /does not match filename/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('a selected Stage lesson needs neither unrelated YAML nor a Canvas directory', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'leetllm-stage-catalog-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const source = join(root, 'videos');
  await mkdir(join(source, 'stage-lessons'), { recursive: true });
  await mkdir(join(root, 'web/src/content/example'), { recursive: true });
  await writeFile(join(root, 'web/src/content/example/content.md'), 'Source article.');
  const lesson = {
    version: 1,
    id: 'selected',
    title: 'Selected film',
    source: 'example/content.md',
    scenes: [
      {
        id: 'intro',
        title: 'Introduction',
        visual: 'A computed vector rotates.',
        beats: [{ say: 'Watch this vector rotate.' }],
      },
    ],
  };
  await writeFile(join(source, 'stage-lessons/selected.lesson.yaml'), stringify(lesson));
  await writeFile(join(source, 'stage-lessons/unrelated.lesson.yaml'), 'scenes: [unfinished');
  assert.deepEqual(await discoverLessons(source, root, { withStage: true, lessonId: 'selected' }), [
    {
      id: 'selected',
      title: 'Selected film',
      source: 'example/content.md',
      mode: 'stage',
      lessonFile: 'videos/stage-lessons/selected.lesson.yaml',
      moduleFile: 'videos/stage-lessons/selected.film.mjs',
    },
  ]);
  lesson.id = 'renamed';
  await writeFile(join(source, 'stage-lessons/selected.lesson.yaml'), stringify(lesson));
  await assert.rejects(
    discoverLessons(source, root, { withStage: true, lessonId: 'selected' }),
    /does not match filename/,
  );
});
