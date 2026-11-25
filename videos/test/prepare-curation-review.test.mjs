import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createCanvas } from '@napi-rs/canvas';
import { readLesson, makeSceneTimeline } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { LAYOUT_AUDIT_RULES } from '../lib/frame-audit.mjs';
import { validateMotionTimeline } from '../lib/motion-audit.mjs';
import { currentSourceFingerprint } from '../lib/source-fingerprint.mjs';
import { generateAssignments, parseArguments } from '../prepare-curation-review.mjs';
import { textInkSampleFrames } from '../audit-text-ink.mjs';

const videosDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = path.resolve(videosDirectory, '..');
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const hashFile = async (file) => hash(await fs.readFile(file));
const writeJson = async (file, value) => {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
};
const hashToolSet = async (files) =>
  hash(
    Buffer.concat(
      await Promise.all(files.map((file) => fs.readFile(path.join(videosDirectory, file)))),
    ),
  );
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADUlEQVR4nGP4z8AAAAMBAQDJ/pLvAAAAAElFTkSuQmCC',
  'base64',
);
const nativePng = createCanvas(1920, 1080).toBuffer('image/png');

async function createCurrentBoundFixture(inputRoot, id = 'hypothesis-testing') {
  const lesson = await readLesson(
    path.join(videosDirectory, 'lessons', `${id}.lesson.yaml`),
    repositoryRoot,
  );
  const fps = 30;
  const intro = { id: 'leetllm-intro', start: 0, duration: 4, frames: fps * 4, fps };
  let cursor = intro.duration;
  const scenes = lesson.scenes.map((scene) => {
    const durations = scene.beats.map((beat) =>
      Math.max(2.5, (beat.say.match(/\S+/gu)?.length ?? 1) * 0.035 + 0.3),
    );
    const timing = makeSceneTimeline(scene, durations, fps);
    timing.start = cursor;
    timing.sounds = scene.beats.map((beat, beatIndex) => ({
      beatIndex,
      words: (beat.say.match(/\S+/gu) ?? []).map((text, wordIndex) => ({
        text,
        start: wordIndex * 0.025,
        end: wordIndex * 0.025 + 0.02,
      })),
    }));
    if (scene.beats.some((beat) => beat.visual_cues?.length)) {
      timing.visualCues = resolveSceneCues(scene, timing, timing.sounds);
      timing.cueTiming = 'provider-words';
    }
    cursor += timing.duration;
    return timing;
  });
  const timeline = {
    id,
    provider: 'test-fixture',
    voice: 'test',
    rate: '+0%',
    fps,
    width: 1920,
    height: 1080,
    intro,
    scenes,
    captions: [],
    duration: cursor,
  };
  const measured = validateMotionTimeline(lesson, timeline);
  const totalFrames = measured.frames;
  const inputLesson = path.join(inputRoot, id);
  await fs.mkdir(inputLesson, { recursive: true });
  const movieBytes = Buffer.from(`test movie fixture for ${id}`);
  await fs.writeFile(path.join(inputLesson, `${id}.mp4`), movieBytes);
  const timelineBytes = Buffer.from(`${JSON.stringify(timeline, null, 2)}\n`);
  await fs.writeFile(path.join(inputLesson, 'timeline.json'), timelineBytes);
  const frameScenes = [
    { scene: intro.id, frames: intro.frames },
    ...scenes.map((scene) => ({ scene: scene.id, frames: scene.frames })),
  ].map((entry) => ({
    ...entry,
    fps,
    ruleCoverage: [...LAYOUT_AUDIT_RULES],
    issueFrames: 0,
    issues: [],
    passed: true,
  }));
  const frameAudit = {
    passed: true,
    frames: totalFrames,
    expectedFrames: totalFrames,
    issueFrames: 0,
    ruleCoverage: [...LAYOUT_AUDIT_RULES],
    scenes: frameScenes,
  };
  await writeJson(path.join(inputLesson, 'frame-audit.json'), frameAudit);
  const ttsAdapter = {
    path: 'videos/tts.py',
    sha256: await hashFile(path.join(repositoryRoot, 'videos/tts.py')),
  };
  const receipt = {
    id,
    source: lesson.source,
    sourceSha256: await hashFile(path.join(repositoryRoot, 'web/src/content', lesson.source)),
    fingerprint: '',
    sha256: hash(movieBytes),
    fullDecode: 'passed',
    width: 1920,
    height: 1080,
    fps,
    duration: timeline.duration,
    scenes: lesson.scenes.length,
    labelAudit: 'registered-geometry-every-frame',
    frameAudit: { passed: true, frames: totalFrames },
    ttsAdapter,
    artifactSha256: {
      [`${id}.mp4`]: hash(movieBytes),
      'timeline.json': hash(timelineBytes),
      'frame-audit.json': await hashFile(path.join(inputLesson, 'frame-audit.json')),
    },
  };
  receipt.fingerprint = await currentSourceFingerprint(repositoryRoot, id, receipt);
  await writeJson(path.join(inputLesson, 'verification.json'), receipt);
  const receiptSha256 = await hashFile(path.join(inputLesson, 'verification.json'));
  const movieSha256 = receipt.sha256,
    timelineSha256 = receipt.artifactSha256['timeline.json'];
  const authorSourceSha256 = hash(
    Buffer.concat([
      await fs.readFile(path.join(videosDirectory, 'lessons', `${id}.lesson.yaml`)),
      await fs.readFile(path.join(videosDirectory, 'animations', `${id}.mjs`)),
    ]),
  );
  const occlusion = {
    id,
    mode: 'all-frames',
    passed: true,
    frames: totalFrames,
    expectedFrames: totalFrames,
    issueFrames: 0,
    issues: [],
    videoSha256: movieSha256,
    sourceFingerprint: receipt.fingerprint,
    toolSha256: await hashToolSet(['audit-occlusion.mjs', 'lib/aggregate-occlusion.mjs']),
  };
  await writeJson(path.join(inputLesson, 'aggregate-occlusion.json'), occlusion);
  const textScenes = [intro, ...scenes].map((timing) => {
    const sampleFrames = textInkSampleFrames(timing, fps);
    return {
      scene: timing.id,
      totalFrames: timing.frames,
      checkedFrames: sampleFrames.length,
      issueFrames: 0,
      checkedLabels: 1,
      skippedLabels: 0,
      sampleFrames,
    };
  });
  const textInk = {
    version: 1,
    id,
    mode: 'sampled-final',
    timingSource: 'measured-final',
    passed: true,
    issueFrames: 0,
    width: timeline.width,
    height: timeline.height,
    fps,
    checkedLabels: textScenes.length,
    skippedLabels: 0,
    checkedFrames: textScenes.reduce((sum, scene) => sum + scene.checkedFrames, 0),
    totalFrames,
    issues: [],
    videoSha256: movieSha256,
    sourceFingerprint: receipt.fingerprint,
    authorSourceSha256,
    timelineSha256,
    receiptSha256,
    toolSha256: await hashToolSet(['audit-text-ink.mjs', 'lib/text-ink-audit.mjs']),
    scenes: textScenes,
  };
  await writeJson(path.join(inputLesson, 'text-ink-audit.json'), textInk);
  const motion = {
    id,
    mode: 'declared-regions-encoded',
    passed: true,
    issues: [],
    movieSha256,
    videoSha256: movieSha256,
    timelineSha256,
    receiptSha256,
    lessonSha256: await hashFile(path.join(videosDirectory, 'lessons', `${id}.lesson.yaml`)),
    sourceFingerprint: receipt.fingerprint,
    toolSha256: await hashToolSet(['audit-motion.mjs', 'lib/motion-audit.mjs']),
    width: timeline.width,
    height: timeline.height,
    fps,
    timingSource: 'measured-final',
    coverage: {
      narratedBeats: measured.narratedBeats,
      declaredChecks: measured.checks.length,
      checkedBeats: measured.checks.length,
      fraction: measured.checks.length / measured.narratedBeats,
      status: 'declared-subset',
    },
    checks: measured.checks.map((check) => ({
      ...check,
      passed: true,
      pairs: [{ passed: true }, { passed: true }, { passed: true }],
    })),
  };
  await writeJson(path.join(inputLesson, 'motion-audit.json'), motion);
  const encodedDirectory = path.join(inputLesson, 'encoded-review');
  const encodedArtifacts = {};
  const registerPng = async (relative) => {
    const file = path.join(encodedDirectory, relative);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, relative.startsWith('frames/') ? nativePng : png);
    encodedArtifacts[relative] = await hashFile(file);
    return file;
  };
  const sceneSheets = [];
  for (const scene of [intro.id, ...scenes.map((scene) => scene.id)]) {
    const image = `scenes/${scene}.png`;
    await registerPng(image);
    sceneSheets.push({ scene, image });
  }
  const frameScene = (frame) => {
    if (frame < intro.frames) return intro.id;
    return scenes.find((scene) => {
      const first = Math.round(scene.start * fps);
      return frame >= first && frame < first + scene.frames;
    })?.id;
  };
  const selectedFrames = [30, Math.floor(totalFrames / 2), totalFrames - 31];
  const samples = [];
  for (const [index, frame] of [...new Set(selectedFrames)].entries()) {
    const image = `frames/sample-${String(index).padStart(4, '0')}.png`;
    await registerPng(image);
    samples.push({
      frame,
      time: frame / fps,
      targets: [{ scene: frameScene(frame), phase: 'middle' }],
      image,
    });
  }
  const decodedFrameAudit = {
    passed: true,
    decodePassed: true,
    frames: totalFrames,
    expectedFrames: totalFrames,
    width: 320,
    height: 180,
  };
  await writeJson(path.join(encodedDirectory, 'decoded-frame-audit.json'), decodedFrameAudit);
  encodedArtifacts['decoded-frame-audit.json'] = await hashFile(
    path.join(encodedDirectory, 'decoded-frame-audit.json'),
  );
  const encoded = {
    videoSha256: movieSha256,
    inspectorSha256: await hashFile(path.join(videosDirectory, 'inspect.mjs')),
    decodedFrameAudit,
    samples,
    sceneSheets,
    artifactSha256: encodedArtifacts,
  };
  await writeJson(path.join(encodedDirectory, 'verification.json'), encoded);
}

test('assignments preserve canonical order, symlink input aliases, and rotated shard ownership', async (t) => {
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'curation-review-'));
  t.after(() => fs.rm(temporary, { recursive: true, force: true }));
  const physicalInput = path.join(temporary, 'renders');
  const inputAlias = path.join(temporary, 'workspace', 'build-renders');
  const output = path.join(temporary, 'assignments');
  await fs.mkdir(path.dirname(inputAlias), { recursive: true });
  await fs.mkdir(physicalInput, { recursive: true });
  await fs.symlink(physicalInput, inputAlias, 'dir');
  await createCurrentBoundFixture(physicalInput);
  await createCurrentBoundFixture(physicalInput, 'probability');

  const options = parseArguments([
    '--input',
    inputAlias,
    '--output',
    output,
    '--lesson',
    'hypothesis-testing',
    'probability',
    '--shards',
    '6',
    '--rotate',
    '7',
  ]);
  const result = await generateAssignments(options, { cwd: repositoryRoot });
  assert.equal(result.status, 'ready');
  assert.equal(result.ready, 2);
  const assignment = JSON.parse(await fs.readFile(path.join(output, 'assignment.json'), 'utf8'));
  assert.equal(assignment.rotation, 1);
  assert.deepEqual(
    assignment.lessons.map((lesson) => lesson.id),
    ['probability', 'hypothesis-testing'],
  );
  const row = assignment.lessons.find((lesson) => lesson.id === 'hypothesis-testing');
  assert.equal(row.id, 'hypothesis-testing');
  assert.equal(row.index, 6);
  assert.equal(row.sourceDirectory, path.resolve(inputAlias, 'hypothesis-testing'));
  assert.equal(row.imageInventory.sceneSheets.length, row.scenes.length + 1);
  assert.equal(row.imageInventory.nativeFrames.length, 3);
  assert.equal(row.movieSha256.length, 64);
  assert.equal(row.sourceContext.render.receipt.sha256.length, 64);
  assert.equal(Object.hasOwn(row, 'overallScore'), false);
  assert.equal(Object.hasOwn(row, 'reviewedScenes'), false);
  const expectedShard = (row.index + 1) % 6;
  const assigned = JSON.parse(
    await fs.readFile(path.join(output, `assignment-${expectedShard}.json`), 'utf8'),
  );
  assert.deepEqual(
    assigned.lessons.map((lesson) => lesson.id),
    ['hypothesis-testing'],
  );
  const probabilityShard = (assignment.lessons[0].index + 1) % 6;
  const probabilityAssigned = JSON.parse(
    await fs.readFile(path.join(output, `assignment-${probabilityShard}.json`), 'utf8'),
  );
  assert.deepEqual(
    probabilityAssigned.lessons.map((lesson) => lesson.id),
    ['probability'],
  );
  for (let shard = 0; shard < 6; shard++) {
    if (shard === expectedShard || shard === probabilityShard) continue;
    const empty = JSON.parse(
      await fs.readFile(path.join(output, `assignment-${shard}.json`), 'utf8'),
    );
    assert.deepEqual(empty.lessons, []);
  }
});

test('stale selected movies fail closed by default and ready-only writes an explicit waiting assignment', async (t) => {
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'curation-review-stale-'));
  t.after(() => fs.rm(temporary, { recursive: true, force: true }));
  const input = path.join(temporary, 'renders'),
    output = path.join(temporary, 'blocked');
  await fs.mkdir(input, { recursive: true });
  await createCurrentBoundFixture(input);
  await fs.writeFile(path.join(input, 'hypothesis-testing', 'hypothesis-testing.mp4'), 'changed after receipts');
  const options = parseArguments(['--input', input, '--output', output, '--lesson', 'hypothesis-testing']);
  await assert.rejects(
    generateAssignments(options, { cwd: repositoryRoot }),
    /Refusing to write assignments.*hypothesis-testing/s,
  );
  await assert.rejects(fs.access(output));

  const partialOutput = path.join(temporary, 'partial');
  const partial = await generateAssignments(
    { ...options, output: partialOutput, readyOnly: true },
    { cwd: repositoryRoot },
  );
  assert.equal(partial.status, 'waiting');
  assert.equal(partial.ready, 0);
  const assignment = JSON.parse(
    await fs.readFile(path.join(partialOutput, 'assignment.json'), 'utf8'),
  );
  assert.equal(assignment.status, 'waiting');
  assert.deepEqual(assignment.readyIds, []);
  assert.deepEqual(assignment.pendingIds, ['hypothesis-testing']);
  assert.deepEqual(assignment.lessons, []);
});

test('assignments accept complete all-frame text-ink coverage and reject partial coverage', async (t) => {
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'curation-review-all-frames-'));
  t.after(() => fs.rm(temporary, { recursive: true, force: true }));
  const input = path.join(temporary, 'renders'),
    output = path.join(temporary, 'assignments');
  await createCurrentBoundFixture(input);
  const reportFile = path.join(input, 'hypothesis-testing/text-ink-audit.json');
  const report = JSON.parse(await fs.readFile(reportFile));
  report.mode = 'all-frames';
  for (const scene of report.scenes) {
    scene.sampleFrames = null;
    scene.checkedFrames = scene.totalFrames;
  }
  report.checkedFrames = report.totalFrames;
  await writeJson(reportFile, report);
  const options = parseArguments(['--input', input, '--output', output, '--lesson', 'hypothesis-testing']);
  assert.equal((await generateAssignments(options)).status, 'ready');
  report.scenes[0].checkedFrames--;
  report.checkedFrames--;
  await writeJson(reportFile, report);
  await assert.rejects(
    generateAssignments(options),
    /text-ink audit does not cover every timeline scene/,
  );
});

test('assignment evidence rejects registered thumbnails posing as native frames', async (t) => {
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'curation-review-thumbnail-'));
  t.after(() => fs.rm(temporary, { recursive: true, force: true }));
  const input = path.join(temporary, 'renders');
  await createCurrentBoundFixture(input);
  const encoded = path.join(input, 'hypothesis-testing/encoded-review'),
    reportFile = path.join(encoded, 'verification.json');
  const report = JSON.parse(await fs.readFile(reportFile)),
    image = report.samples[0].image;
  await fs.writeFile(path.join(encoded, image), png);
  report.artifactSha256[image] = hash(png);
  await writeJson(reportFile, report);
  const options = parseArguments([
    '--input',
    input,
    '--output',
    path.join(temporary, 'assignments'),
    '--lesson',
    'hypothesis-testing',
  ]);
  await assert.rejects(generateAssignments(options), /native frame is not 1920x1080/);
});

test('argument parsing rejects invalid shard counts and rotations', () => {
  const base = ['--input', 'in', '--output', 'out'];
  assert.throws(() => parseArguments([...base, '--shards']), /--shards requires a value/);
  assert.throws(() => parseArguments([...base, '--rotate']), /--rotate requires a value/);
  assert.throws(
    () => parseArguments([...base, '--shards', '0']),
    /--shards must be an integer from 1 to 16/,
  );
  assert.throws(
    () => parseArguments([...base, '--shards', '17']),
    /--shards must be an integer from 1 to 16/,
  );
  assert.throws(
    () => parseArguments([...base, '--shards', 'six']),
    /--shards must be a non-negative integer/,
  );
  assert.throws(
    () => parseArguments([...base, '--rotate', '-1']),
    /--rotate must be a non-negative integer/,
  );
});

test('argument parsing rejects duplicate IDs and generation rejects unknown selected IDs', async (t) => {
  assert.throws(
    () => parseArguments(['--input', 'in', '--output', 'out', '--lesson', 'hypothesis-testing', 'hypothesis-testing']),
    /Duplicate lesson ID hypothesis-testing/,
  );
  assert.throws(() => parseArguments(['--input', 'in']), /--output is required/);
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'curation-review-unknown-'));
  t.after(() => fs.rm(temporary, { recursive: true, force: true }));
  const options = parseArguments([
    '--input',
    path.join(temporary, 'renders'),
    '--output',
    path.join(temporary, 'out'),
    '--lesson',
    'unknown-lesson',
  ]);
  await assert.rejects(
    generateAssignments(options, { cwd: repositoryRoot }),
    /Unknown lesson ID: unknown-lesson/,
  );
  await assert.rejects(fs.access(path.join(temporary, 'out')));
});
