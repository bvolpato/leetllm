import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { createCanvas } from '@napi-rs/canvas';

const videosDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tool = path.join(videosDirectory, 'prepare-publication-review.mjs');
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const writeJson = async (file, value) => {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
};

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'publication-review-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const id = 'historical',
    directory = path.join(root, 'renders', id);
  const timeline = {
    id,
    scenes: [
      { id: 'first', beats: [{ say: 'The original first explanation.' }] },
      { id: 'second', beats: [{ say: 'The original second explanation.' }] },
    ],
  };
  const authored = {
    id,
    scenes: [
      {
        id: 'second',
        title: 'A revised second scene',
        beats: [{ say: 'A new second explanation.' }],
      },
      { id: 'first', title: 'A revised first scene', beats: [{ say: 'A new first explanation.' }] },
    ],
  };
  const timelineFile = path.join(directory, 'timeline.json');
  await writeJson(timelineFile, timeline);
  const movie = path.join(directory, `${id}.mp4`),
    movieBytes = Buffer.from('historical movie fixture');
  await fs.writeFile(movie, movieBytes);
  const receipt = {
    id,
    title: 'Historical lesson',
    source: 'fixture/content.md',
    sha256: hash(movieBytes),
    fingerprint: 'a'.repeat(64),
    artifactSha256: { 'timeline.json': hash(await fs.readFile(timelineFile)) },
  };
  await writeJson(path.join(directory, 'verification.json'), receipt);
  await writeJson(path.join(root, 'renders', 'manifest.json'), [receipt]);
  const review = {
    id,
    movieSha256: receipt.sha256,
    sourceFingerprint: receipt.fingerprint,
    total: 88,
  };
  await writeJson(path.join(root, 'videos/reviews/complete-curriculum.json'), {
    lessons: [review],
  });
  await writeJson(path.join(root, 'videos/collections/complete-curriculum.json'), {
    lessons: [{ id, group: 'Fixture' }],
  });
  const lesson = path.join(root, `videos/lessons/${id}.lesson.yaml`);
  await writeJson(lesson, authored);
  await fs.mkdir(path.join(root, 'videos/animations'), { recursive: true });
  await fs.writeFile(
    path.join(root, `videos/animations/${id}.mjs`),
    'export const currentVersion = 2;\n',
  );
  await fs.symlink(
    path.join(videosDirectory, 'node_modules'),
    path.join(root, 'videos/node_modules'),
    'dir',
  );
  const encoded = { videoSha256: receipt.sha256, samples: [], artifactSha256: {} };
  const png = createCanvas(16, 9).toBuffer('image/png');
  for (const [index, scene] of timeline.scenes.entries()) {
    for (const [offset, phase] of ['early', 'middle', 'late'].entries()) {
      const image = `frames/${scene.id}-${phase}.png`;
      const file = path.join(directory, 'encoded-review', image);
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, png);
      encoded.artifactSha256[image] = hash(png);
      encoded.samples.push({
        image,
        time: index * 10 + offset,
        frame: index * 300 + offset * 30,
        targets: [{ scene: scene.id, beat: 0, phase }],
      });
    }
  }
  await writeJson(path.join(directory, 'encoded-review/verification.json'), encoded);
  const run = () =>
    spawnSync(process.execPath, [tool, '--input', 'renders', '--output', 'packets'], {
      cwd: root,
      encoding: 'utf8',
      timeout: 10000,
    });
  return {
    root,
    id,
    directory,
    timeline,
    timelineFile,
    authored,
    lesson,
    movie,
    receipt,
    review,
    run,
  };
}

test('historical packets use encoded narration and scene order when current narration has changed', async (t) => {
  const f = await fixture(t),
    result = f.run();
  assert.equal(result.status, 0, result.stderr);
  const material = JSON.parse(
    await fs.readFile(path.join(f.root, 'packets/materials', f.id, 'material.json')),
  );
  assert.deepEqual(
    material.script.map(({ id, beats }) => ({ id, beats })),
    [
      { id: 'first', beats: ['The original first explanation.'] },
      { id: 'second', beats: ['The original second explanation.'] },
    ],
  );
  assert.equal(material.scriptSource.path, `renders/${f.id}/timeline.json`);
  assert.equal(material.scriptSource.sha256, hash(await fs.readFile(f.timelineFile)));
  assert.equal(material.currentAuthoredSource.narrationMatchesTimeline, false);
  assert.equal(material.currentAuthoredSource.lesson.sha256, hash(await fs.readFile(f.lesson)));
  assert.equal(material.qualityScore, f.review.total);
});

test('historical packets retain their script when current authored files are unavailable', async (t) => {
  const f = await fixture(t);
  await fs.rm(f.lesson);
  await fs.rm(path.join(f.root, `videos/animations/${f.id}.mjs`));
  const result = f.run();
  assert.equal(result.status, 0, result.stderr);
  const material = JSON.parse(
    await fs.readFile(path.join(f.root, 'packets/materials', f.id, 'material.json')),
  );
  assert.deepEqual(
    material.script.flatMap((scene) => scene.beats),
    f.timeline.scenes.flatMap((scene) => scene.beats.map((beat) => beat.say)),
  );
  assert.equal(material.currentAuthoredSource.lesson, null);
  assert.equal(material.currentAuthoredSource.animation, null);
  assert.equal(material.currentAuthoredSource.narrationMatchesTimeline, null);
});

test('historical packets reject mismatched review fingerprints and movie bytes', async (t) => {
  for (const [name, mutate] of [
    [
      'review source fingerprint',
      async (f) => {
        f.review.sourceFingerprint = 'b'.repeat(64);
        await writeJson(path.join(f.root, 'videos/reviews/complete-curriculum.json'), {
          lessons: [f.review],
        });
      },
    ],
    [
      'review movie hash',
      async (f) => {
        f.review.movieSha256 = 'b'.repeat(64);
        await writeJson(path.join(f.root, 'videos/reviews/complete-curriculum.json'), {
          lessons: [f.review],
        });
      },
    ],
    ['actual movie bytes', (f) => fs.writeFile(f.movie, 'replacement movie bytes')],
    [
      'encoded timeline narration',
      async (f) => {
        f.timeline.scenes[0].beats[0].say = 'A replacement explanation after encoding.';
        await writeJson(f.timelineFile, f.timeline);
      },
    ],
  ]) {
    await t.test(name, async (st) => {
      const f = await fixture(st);
      await mutate(f);
      const result = f.run();
      assert.notEqual(result.status, 0, `Accepted mismatched ${name}`);
      assert.match(result.stderr, /differs from receipt|Stale material/);
    });
  }
});
