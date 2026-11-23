import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';

const { collectInspectionRun } = await import(
  process.env.INSPECTION_RUN_SOURCE ?? '../private-gallery/inspection-run.mjs'
);
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');

async function fixture(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'inspection-overlay-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const output = path.join(directory, 'output');
  await fs.mkdir(output);
  const save = async (file, value) => fs.writeFile(file, JSON.stringify(value, null, 2) + '\n');
  const bind = async (file) => {
    const bytes = await fs.readFile(file);
    return { path: file, sha256: hash(bytes), bytes: bytes.length };
  };
  const read = async (file, { preserveRaw = false } = {}) => {
    const bytes = await fs.readFile(file);
    return {
      value: JSON.parse(bytes),
      binding: await bind(file),
      rawBytes: preserveRaw ? bytes : undefined,
    };
  };
  const lessons = Array.from({ length: 199 }, (_, index) => ({
    id: index === 0 ? 'tokenization' : `topic-${index}`,
    mode: index === 0 ? 'stage' : 'canvas',
    sourceManifest: {
      fingerprint: 'exact-source',
      lessonFile: `lesson-${index}.yaml`,
      moduleFile: `module-${index}.mjs`,
      closure: { files: [] },
    },
  }));
  const plan = {
    version: 1,
    kind: 'leetllm.inspection-collection',
    createdAt: '2026-11-08',
    runtime: { version: '0.8.1' },
    sourceFreeze: {},
    lessons,
  };
  const progress = {
    version: 1,
    kind: 'leetllm.inspection-progress',
    lessons: lessons.map((entry, index) => ({
      id: entry.id,
      status: index === 0 ? 'failed' : 'pending',
      directionReview: 'unrevisited',
      error: index === 0 ? 'Preserved pre-PID empty-cache failure' : undefined,
      attempts: index === 0 ? [{ outcome: 'failed before render' }] : [],
    })),
  };
  await save(path.join(directory, 'inspection.json'), plan);
  await save(path.join(directory, 'progress.json'), progress);
  await save(path.join(directory, 'parent.json'), progress);
  for (const name of [
    'tokenization.mp4',
    '01-intro.png',
    'tokenization.vtt',
    'tokenization.srt',
    'tokenization.chapters.txt',
    'diagnostics.json',
  ])
    await fs.writeFile(path.join(output, name), `Synthetic integrity fixture: ${name}`);
  const movie = await bind(path.join(output, 'tokenization.mp4'));
  const artifactSha256 = {};
  for (const name of [
    '01-intro.png',
    'tokenization.vtt',
    'tokenization.srt',
    'tokenization.chapters.txt',
    'diagnostics.json',
  ])
    artifactSha256[name] = (await bind(path.join(output, name))).sha256;
  await save(path.join(output, 'verification.json'), {
    id: 'tokenization',
    sha256: movie.sha256,
    fingerprint: 'exact-source',
    fullDecode: 'passed',
    artifactSha256,
  });
  const film = {
    version: 1,
    id: 'tokenization',
    sourceFingerprint: 'exact-source',
    videoSha256: movie.sha256,
    errors: 0,
  };
  await save(path.join(output, 'film-check.json'), film);
  const overlay = {
    version: 1,
    kind: 'leetllm.inspection-progress',
    inspectionPlan: await bind(path.join(directory, 'inspection.json')),
    parentProgress: await bind(path.join(directory, 'parent.json')),
    supplementalSelection: ['tokenization'],
    lessons: [
      {
        id: 'tokenization',
        status: 'complete',
        directionReview: 'unrevisited',
        attempts: [{ finishedAt: '2026-11-08T12:00:00Z' }],
        delivery: {
          movie,
          receipt: await bind(path.join(output, 'verification.json')),
          sourceFingerprint: 'exact-source',
          fullDecode: 'passed',
        },
      },
    ],
  };
  const overlayPath = path.join(directory, 'overlay.json');
  await save(overlayPath, overlay);
  const run = (paths = [overlayPath]) =>
    collectInspectionRun({
      directory,
      read,
      bind,
      progressSnapshotPath: path.join(directory, 'snapshot', 'central.json'),
      progressOverlayPaths: paths,
    });
  return { directory, output, overlayPath, overlay, film, save, run, bind };
}

test('verified completion overlays the failed central row without altering its bytes or manual status', async (t) => {
  const f = await fixture(t),
    before = await f.bind(path.join(f.directory, 'progress.json'));
  const result = await f.run(),
    row = result.jobs[0];
  assert.equal(row.state, 'complete');
  assert.equal(row.directionReview, 'unrevisited');
  assert.equal(row.media.video.sha256, f.overlay.lessons[0].delivery.movie.sha256);
  assert.equal(row.overlayChecks.artifactHashes, 5);
  assert.equal(row.progressObservations[0].status, 'failed');
  assert.match(row.progressObservations[0].error, /pre-PID/);
  assert.equal(result.record.progressOverlays[0].completedSelection[0], 'tokenization');
  assert.equal(result.observedOverlays.length, 1);
  assert.deepEqual(await f.bind(path.join(f.directory, 'progress.json')), before);
  assert(!('recommendation' in row));
});

test('a foreign inspection plan is rejected before any completion is adopted', async (t) => {
  const f = await fixture(t);
  f.overlay.inspectionPlan.sha256 = 'f'.repeat(64);
  await f.save(f.overlayPath, f.overlay);
  await assert.rejects(f.run(), /Foreign overlay inspection plan/);
});

test('a foreign per-ID source fingerprint cannot borrow a valid movie', async (t) => {
  const f = await fixture(t);
  f.overlay.lessons[0].delivery.sourceFingerprint = 'foreign-source';
  await f.save(f.overlayPath, f.overlay);
  await assert.rejects(f.run(), /foreign-source/);
});

test('a missing non-player artifact fails the full completion check', async (t) => {
  const f = await fixture(t);
  await fs.unlink(path.join(f.output, 'diagnostics.json'));
  await assert.rejects(f.run(), { code: 'ENOENT' });
});

test('a missing or mismatched post-receipt Stage film check cannot be ignored', async (t) => {
  const f = await fixture(t);
  await fs.unlink(path.join(f.output, 'film-check.json'));
  await assert.rejects(f.run(), { code: 'ENOENT' });
  await f.save(path.join(f.output, 'film-check.json'), { ...f.film, videoSha256: 'foreign-movie' });
  await assert.rejects(f.run(), /foreign-movie/);
  await f.save(path.join(f.output, 'film-check.json'), { ...f.film, errors: 1 });
  await assert.rejects(f.run(), /film check has errors/);
});

test('partial side-ledger states do not replace failures; repeated explicit ledgers retain completion', async (t) => {
  const f = await fixture(t),
    partial = path.join(f.directory, 'partial.json');
  await f.save(partial, {
    ...f.overlay,
    lessons: [
      { id: 'tokenization', status: 'rendering', directionReview: 'unrevisited', attempts: [] },
    ],
  });
  assert.equal((await f.run([partial])).jobs[0].state, 'failed');
  const both = await f.run([f.overlayPath, partial]);
  assert.equal(both.jobs[0].state, 'complete');
  assert.equal(both.record.progressOverlays.length, 2);
});

test('the preserved parent hash and Stage-only selection are enforced', async (t) => {
  const f = await fixture(t);
  f.overlay.parentProgress.sha256 = '0'.repeat(64);
  await f.save(f.overlayPath, f.overlay);
  await assert.rejects(f.run(), /parent progress changed/);
  f.overlay.parentProgress = await f.bind(path.join(f.directory, 'parent.json'));
  f.overlay.supplementalSelection = ['topic-1'];
  f.overlay.lessons[0].id = 'topic-1';
  await f.save(f.overlayPath, f.overlay);
  await assert.rejects(f.run(), /not a selected Stage lesson/);
});
