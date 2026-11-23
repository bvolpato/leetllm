import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import {
  speechKey,
  unionSourceFiles,
  sharedInspectionSources,
  verifyFiles,
  newInspectionProgress,
  inspectionAdmission,
  inspectionRenderArgs,
  seedInspectionAudio,
  verifyInspectionDelivery,
  INSPECTION_LIMITS,
  inspectionReserveDecision,
  inspectionSceneCacheKey,
  assertInspectionWriterStopped,
  validateInspectionSceneCache,
  prioritizeInspectionLessons,
  isOwnedEmptyStageCache,
  recoverInspectionInterrupted,
  runInspection,
} from '../lib/inspection-render.mjs';
import { fileRecord, sha256 } from '../lib/cohort-files.mjs';

const GiB = 1024 ** 3;
const resources = { busyCpu: 2, otherFilmCpu: 2, filmRss: GiB, availableMemory: 40 * GiB };

test('a new controller refuses a missing measured budget before opening any run', async () => {
  await assert.rejects(
    runInspection('/nonexistent-unopened-run', { planSha256: 'unknown' }),
    /storage-budget is required/,
  );
});

test('supplemental recovery archives and updates its own ledger without overwriting the central writer', async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'inspection-side-recovery-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const central = JSON.stringify({ untouched: 'active central controller' });
  await fs.writeFile(path.join(directory, 'progress.json'), central);
  const progress = {
    lessons: [
      { id: 'toy', status: 'interrupted', attempts: [{ phase: 'audio', pid: 2147483647 }] },
    ],
  };
  await fs.writeFile(path.join(directory, 'progress-stage-test.json'), JSON.stringify(progress));
  const report = await recoverInspectionInterrupted({
    directory,
    plan: { lessons: [{ id: 'toy', output: path.join(directory, 'outputs/toy') }] },
    progress,
    planSha256: 'same-plan',
    progressFile: 'progress-stage-test.json',
  });
  assert.equal(await fs.readFile(path.join(directory, 'progress.json'), 'utf8'), central);
  assert.equal(
    JSON.parse(await fs.readFile(path.join(directory, 'progress-stage-test.json'), 'utf8'))
      .lessons[0].status,
    'pending',
  );
  assert.equal(report.previousProgress.path, path.join(directory, 'progress-stage-test.json'));
});

test('successful Stage audio preparation may leave exactly its empty cache directory for full render', async (t) => {
  const output = await fs.mkdtemp(path.join(os.tmpdir(), 'inspection-stage-audio-'));
  t.after(() => fs.rm(output, { recursive: true, force: true }));
  await fs.mkdir(path.join(output, '.scene-cache/toy'), { recursive: true });
  const timelinePath = path.join(output, 'timeline.json');
  await fs.writeFile(timelinePath, JSON.stringify({ id: 'toy', scenes: [] }));
  const entry = { id: 'toy', mode: 'stage', output, sourceManifest: { fingerprint: 'source' } };
  const state = {
    audio: { sourceFingerprint: 'source', timeline: await fileRecord(timelinePath) },
    attempts: [{ phase: 'audio', process: { code: 0, directChildReaped: true } }],
  };
  assert.equal(await isOwnedEmptyStageCache(entry, state), true);
  assert.equal(await isOwnedEmptyStageCache(entry, { ...state, attempts: [] }), false);
  assert.equal(await isOwnedEmptyStageCache({ ...entry, mode: 'canvas' }, state), false);
  assert.equal(
    await isOwnedEmptyStageCache({ ...entry, sourceManifest: { fingerprint: 'foreign' } }, state),
    false,
  );
  await fs.writeFile(path.join(output, '.scene-cache/toy/foreign.mp4'), 'not-owned');
  assert.equal(await isOwnedEmptyStageCache(entry, state), false);
  await fs.rm(path.join(output, '.scene-cache/toy/foreign.mp4'));
  await fs.writeFile(timelinePath, 'changed');
  await assert.rejects(isOwnedEmptyStageCache(entry, state), /timeline changed/);
});

test('40 GiB pauses admission without aborting healthy external workers; 16 GiB is emergency', () => {
  assert.deepEqual(inspectionReserveDecision(41 * GiB), { canAdmit: true, reason: null });
  assert.equal(inspectionReserveDecision(39 * GiB).canAdmit, false);
  assert.equal(inspectionReserveDecision(16 * GiB).canAdmit, false);
  assert.throws(() => inspectionReserveDecision(15 * GiB), /emergency reserve/);
});

test('recovery refuses an extant or reused PID before touching its lock', async () => {
  await assert.rejects(
    assertInspectionWriterStopped(process.pid),
    /still present or has been reused/,
  );
  await assertInspectionWriterStopped(2147483647);
});

test('recovered clips precede repair priorities while the full collection remains queued', () => {
  const lessons = ['bulk', 'kv-cache', 'partial', 'mixed'].map((id) => ({ id }));
  assert.deepEqual(
    prioritizeInspectionLessons(lessons, ['kv-cache', 'mixed'], ['partial']).map((row) => row.id),
    ['partial', 'kv-cache', 'mixed', 'bulk'],
  );
  assert.throws(() => prioritizeInspectionLessons(lessons, ['foreign']), /unique members/);
  assert.throws(() => prioritizeInspectionLessons(lessons, ['mixed', 'mixed']), /unique members/);
});

test('cache protocol matches a real frozen renderer marker from this inspection run', () => {
  const entry = {
    width: 1920,
    fps: 30,
    mode: 'canvas',
    sourceManifest: {
      fingerprint: 'daab67860adad5f596e8e71781e45e2f1aefc12988c579ad71247ade6701ecfa',
    },
  };
  const timing = {
    frames: 927,
    duration: 30.9,
    sounds: [
      {
        key: '48a150301fe09e5898b6e636cdada14c05f28c840fc1b31538e30847de191d5c',
        audioHash: '3eecaf619dcc29284cc6de9cd3fe852d9fef1bd035e0db523883007c1f278772',
        boundariesHash: '5fd2f7f80b10167af908cfe13c500180962795fa8a8c5c968a9ceefa9082a184',
      },
      {
        key: 'ebdd3de996f20c1ed104ad62a4ff56e30433bf9714cf293c72e7981db2b1e0c8',
        audioHash: '02b9bc0db80ace74b35d2b45424fced3970298e8e91ec04ec4f15a99157ee54b',
        boundariesHash: 'd27f614a334497a6ef790c9b54ff58d2c00e0bd93b44b295b287d7471c5e680f',
      },
    ],
  };
  assert.equal(
    inspectionSceneCacheKey(entry, timing),
    'dda624458eeb0d79b56d3311524edcddf119023ca2c89b80c3b41a7bafca861f',
  );
  assert.notEqual(
    inspectionSceneCacheKey({ ...entry, fps: 60 }, timing),
    inspectionSceneCacheKey(entry, timing),
  );
});

test('same-run cache recovery checks actual media and refuses stale keys, missing origin and links', async (t) => {
  const cache = await fs.mkdtemp(path.join(os.tmpdir(), 'inspection-cache-'));
  t.after(() => fs.rm(cache, { recursive: true, force: true }));
  await fs.mkdir(path.join(cache, 'toy'));
  const entry = {
    id: 'toy',
    mode: 'canvas',
    width: 160,
    fps: 30,
    sourceManifest: { fingerprint: 'current-source' },
  };
  const timing = { id: 'intro', frames: 6, duration: 0.2, sounds: [] },
    timeline = { scenes: [timing] };
  const movie = path.join(cache, 'toy/01-intro.mp4');
  await promisify(execFile)('ffmpeg', [
    '-v',
    'error',
    '-f',
    'lavfi',
    '-i',
    'color=c=blue:s=160x90:r=30:d=0.2',
    '-c:v',
    'libx264',
    '-threads',
    '1',
    '-pix_fmt',
    'yuv420p',
    movie,
  ]);
  await fs.writeFile(path.join(cache, 'toy/01-intro.wav'), 'retained-current-run-wave');
  const marker = {
    key: inspectionSceneCacheKey(entry, timing),
    frames: 6,
    duration: 0.2,
    audit: { passed: true, frames: 6 },
  };
  await fs.writeFile(path.join(cache, 'toy/01-intro.render.json'), JSON.stringify(marker));
  const args = { entry, timeline, cache, log: '[toy] rendering 1/1: Intro' };
  assert.equal((await validateInspectionSceneCache(args)).completedScenes.length, 1);
  const flac = path.join(cache, 'toy/01-intro.flac');
  await fs.writeFile(flac, 'retained-current-run-flac');
  await fs.writeFile(
    path.join(cache, 'toy/01-intro.render.json'),
    JSON.stringify({ ...marker, audioFormat: 'flac' }),
  );
  assert.equal(
    (await validateInspectionSceneCache(args)).completedScenes[0].audio.sha256,
    sha256('retained-current-run-flac'),
  );
  await assert.rejects(
    validateInspectionSceneCache({ ...args, log: '' }),
    /raster origin is absent/,
  );
  await assert.rejects(
    validateInspectionSceneCache({
      ...args,
      entry: { ...entry, sourceManifest: { fingerprint: 'old-source' } },
    }),
    /Stale or foreign/,
  );
  await fs.symlink(fileURLToPath(import.meta.url), path.join(cache, 'foreign'));
  await assert.rejects(validateInspectionSceneCache(args), /escapes|Foreign/);
});

test('shared snapshot carries the complete controller imports and its cold CLI loads', async (t) => {
  const root = fileURLToPath(new URL('../../', import.meta.url));
  const copy = await fs.mkdtemp(path.join(os.tmpdir(), 'inspection-cli-'));
  t.after(() => fs.rm(copy, { recursive: true, force: true }));
  for (const record of await sharedInspectionSources(root, [])) {
    const target = path.join(copy, record.path);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.copyFile(path.join(root, record.path), target);
  }
  await fs.symlink(path.join(root, 'videos/node_modules'), path.join(copy, 'videos/node_modules'));
  const result = await promisify(execFile)(process.execPath, [
    path.join(copy, 'videos/tools/render-inspection.mjs'),
    '--help',
  ]);
  assert.match(result.stdout, /prepare --destination/);
});

test('shared closure deduplicates equal bytes but refuses a different epoch or escaping alias', () => {
  const record = {
    path: 'videos/model.mjs',
    resolvedPath: 'videos/model.mjs',
    sha256: 'a'.repeat(64),
    bytes: 5,
  };
  const wrap = (file) => ({ closure: { files: [file] } });
  assert.equal(unionSourceFiles([wrap(record), wrap(record)]).length, 1);
  assert.throws(
    () => unionSourceFiles([wrap(record), wrap({ ...record, sha256: 'b'.repeat(64) })]),
    /Conflicting shared source/,
  );
  assert.throws(
    () => unionSourceFiles([wrap({ ...record, resolvedPath: '../outside.mjs' })]),
    /Unsafe source path/,
  );
});

test('only exact narration, voice, rate and adapter can retain a speech key', () => {
  const beat = { say: 'The next lesson traces a training run.' };
  const lesson = { voice: 'Andrew', rate: '+0%' };
  const key = speechKey(beat, lesson, 'adapter');
  assert.equal(speechKey({ ...beat, hold: 1.5 }, lesson, 'adapter'), key);
  for (const changed of [
    speechKey({ say: 'A changed ending.' }, lesson, 'adapter'),
    speechKey(beat, { ...lesson, voice: 'Brian' }, 'adapter'),
    speechKey(beat, { ...lesson, rate: '+5%' }, 'adapter'),
    speechKey(beat, lesson, 'new-adapter'),
  ])
    assert.notEqual(changed, key);
});

test('admission calibrates two Canvas films, counts old film CPU, and retains Stage and RAM caps', () => {
  const canvas = { mode: 'canvas' },
    stage = { mode: 'stage' };
  assert.equal(inspectionAdmission(canvas, [canvas, canvas], resources, []), false);
  assert.equal(
    inspectionAdmission(canvas, [canvas, canvas], resources, [
      { mode: 'canvas', cpuCores: 1.5 },
      { mode: 'canvas', cpuCores: 1.5 },
    ]),
    true,
  );
  assert.equal(inspectionAdmission(stage, [stage], resources, []), false);
  assert.equal(inspectionAdmission(canvas, [], { ...resources, busyCpu: 23 }, []), false);
  assert.equal(inspectionAdmission(canvas, [], { ...resources, otherFilmCpu: 23 }, []), false);
  assert.equal(inspectionAdmission(canvas, [], { ...resources, filmRss: 31 * GiB }, []), false);
  assert.equal(
    inspectionAdmission(canvas, [], { ...resources, availableMemory: 9 * GiB }, []),
    false,
  );
  assert.equal(INSPECTION_LIMITS.canvas, 10);
});

test('inspection completion never manufactures a direction or source review', () => {
  const progress = newInspectionProgress({ lessons: [{ id: 'vectors' }] });
  assert.deepEqual(progress.lessons[0], {
    id: 'vectors',
    status: 'pending',
    directionReview: 'unrevisited',
    attempts: [],
  });
  const entry = {
    id: 'attention',
    mode: 'stage',
    output: '/external/attention',
    fps: 60,
    width: 1920,
    ttsScript: 'adapter.py',
  };
  const render = inspectionRenderArgs(entry);
  assert.ok(render.includes('--stage'));
  assert.ok(render.includes('--retained-audio-only'));
  assert.ok(!render.includes('--preview'));
  assert.ok(!render.includes('--audio-only'));
  const audio = inspectionRenderArgs(entry, { audioOnly: true });
  assert.ok(audio.includes('--audio-only'));
  assert.ok(!audio.includes('--retained-audio-only'));
});

test('frozen files reject both changed bytes and a symlink escaping the snapshot', async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'inspection-frozen-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.writeFile(path.join(root, 'model.mjs'), 'first');
  const record = { ...(await fileRecord(path.join(root, 'model.mjs'))), path: 'model.mjs' };
  await verifyFiles(root, [record]);
  await fs.writeFile(path.join(root, 'model.mjs'), 'other');
  await assert.rejects(verifyFiles(root, [record]), /Frozen file changed/);
  await fs.symlink('/etc/hostname', path.join(root, 'escape'));
  await assert.rejects(
    verifyFiles(root, [{ ...record, path: 'escape' }]),
    /Source escapes frozen root/,
  );
});

test('audio seeding verifies retained timeline hashes and leaves a changed final SAY missing', async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'inspection-audio-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const cache = path.join(root, 'cache');
  await fs.mkdir(cache);
  const lesson = {
    version: 1,
    id: 'toy',
    title: 'Toy',
    source: 'toy/content.md',
    scenes: [
      {
        id: 'close',
        title: 'Close',
        visual: 'Trace',
        beats: [{ say: 'An unchanged explanation.' }, { say: 'A newly reviewed ending.' }],
      },
    ],
  };
  await fs.mkdir(path.join(root, 'web/src/content/toy'), { recursive: true });
  await fs.writeFile(path.join(root, 'web/src/content/toy/content.md'), 'Article');
  await fs.writeFile(path.join(root, 'lesson.yaml'), JSON.stringify(lesson));
  await fs.writeFile(path.join(root, 'adapter.py'), 'adapter');
  const key = speechKey(lesson.scenes[0].beats[0], lesson, sha256('adapter'));
  const audio = path.join(root, 'old.mp3'),
    words = path.join(root, 'old.json');
  await fs.writeFile(audio, 'retained-provider-bytes');
  await fs.writeFile(words, JSON.stringify({ words: [{ text: 'An', start: 0, end: 0.2 }] }));
  const timeline = path.join(root, 'timeline.json');
  await fs.writeFile(
    timeline,
    JSON.stringify({
      scenes: [
        {
          sounds: [
            {
              key,
              audio,
              boundaries: words,
              audioHash: sha256(await fs.readFile(audio)),
              boundariesHash: sha256(await fs.readFile(words)),
            },
          ],
        },
      ],
    }),
  );
  const result = await seedInspectionAudio({
    repository: root,
    lessons: [{ lessonFile: 'lesson.yaml', ttsScript: 'adapter.py' }],
    timelines: [timeline],
    cache,
  });
  assert.equal(result.retained, 1);
  assert.equal(result.missing.length, 1);
  assert.equal(
    await fs.readFile(path.join(cache, `${key}.mp3`), 'utf8'),
    'retained-provider-bytes',
  );
  const badCache = path.join(root, 'bad-cache');
  await fs.mkdir(badCache);
  await fs.writeFile(audio, 'corrupt');
  const rejected = await seedInspectionAudio({
    repository: root,
    lessons: [{ lessonFile: 'lesson.yaml', ttsScript: 'adapter.py' }],
    timelines: [timeline],
    cache: badCache,
  });
  assert.equal(rejected.retained, 0);
  assert.match(rejected.rejected[0].error, /hash mismatch/);
});

test('technical delivery verifies exact source, decoder result and every artifact', async (t) => {
  const output = await fs.mkdtemp(path.join(os.tmpdir(), 'inspection-delivery-'));
  t.after(() => fs.rm(output, { recursive: true, force: true }));
  const folder = path.join(output, 'toy');
  await fs.mkdir(folder);
  const artifacts = {};
  for (const name of ['toy.mp4', 'timeline.json', 'toy.srt', 'toy.vtt', 'toy.chapters.txt']) {
    await fs.writeFile(path.join(folder, name), name);
    artifacts[name] = sha256(name);
  }
  const receipt = {
    id: 'toy',
    fingerprint: 'source',
    fullDecode: 'passed',
    width: 1920,
    fps: '30/1',
    frameAudit: { passed: true },
    sha256: artifacts['toy.mp4'],
    artifactSha256: artifacts,
  };
  await fs.writeFile(path.join(folder, 'verification.json'), JSON.stringify(receipt));
  const entry = {
    id: 'toy',
    output,
    width: 1920,
    fps: 30,
    sourceManifest: { fingerprint: 'source' },
  };
  assert.equal((await verifyInspectionDelivery(entry)).movie.sha256, receipt.sha256);
  await assert.rejects(
    verifyInspectionDelivery({ ...entry, sourceManifest: { fingerprint: 'other' } }),
    /mismatched delivery/,
  );
  await fs.writeFile(path.join(folder, 'toy.srt'), 'changed');
  await assert.rejects(verifyInspectionDelivery(entry), /artifact changed/);
});
