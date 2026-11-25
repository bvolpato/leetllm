import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assertFreezeMatches,
  freezeFiles,
  hashFileStream,
  inspectReportIsComplete,
  runBoundedQueue,
  runReviewQueue,
  runWithTruncatedSpeechRecovery,
  runtimeSnapshot,
  validateCollection,
  validateOutputPath,
} from '../lib/batch.mjs';
import {
  validateMotionTimeline,
  MOTION_SAMPLE_PROGRESS,
  MOTION_CHANNEL_DELTA,
  MOTION_MINIMUM_PIXELS,
  MOTION_SCOPE,
} from '../lib/motion-audit.mjs';
import { makeSceneTimeline, readLesson } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import {
  inspectionEvidence,
  orderReceipts,
  packageCollection,
  parseBatchArgs,
  promoteReceipt,
  reusable,
  runFinalizedRenderStage,
  runInspectionStage,
} from '../batch.mjs';
import { textInkSampleFrames } from '../audit-text-ink.mjs';

const collection = (lessons) => ({ version: 1, id: 'sample', title: 'Sample', lessons });
const lesson = (id, extra = {}) => ({
  id,
  group: 'foundations',
  title: `Lesson ${id}`,
  source: `foundations/${id}/content.md`,
  ...extra,
});

test('collection entries have unique known IDs and safe source paths', () => {
  const valid = validateCollection(collection([lesson('alpha'), lesson('beta')]), {
    knownIds: new Set(['alpha', 'beta']),
  });
  assert.deepEqual(
    valid.lessons.map((item) => item.id),
    ['alpha', 'beta'],
  );
  assert.throws(
    () =>
      validateCollection(collection([lesson('alpha'), lesson('alpha')]), {
        knownIds: new Set(['alpha']),
      }),
    /duplicate lesson id alpha/,
  );
  assert.throws(
    () => validateCollection(collection([lesson('missing')]), { knownIds: new Set(['alpha']) }),
    /unknown lesson id missing/,
  );
  assert.throws(
    () => validateCollection(collection([lesson('alpha', { source: '../private.md' })])),
    /repository-relative path/,
  );
});

test('bounded queue preserves result order and stops scheduling after a worker fails', async () => {
  const started = [],
    order = [];
  let releaseFailure, releasePeer, bothStarted;
  const fail = new Promise((resolve) => {
    releaseFailure = resolve;
  });
  const peer = new Promise((resolve) => {
    releasePeer = resolve;
  });
  const ready = new Promise((resolve) => {
    bothStarted = resolve;
  });
  const result = runBoundedQueue([0, 1, 2, 3], 2, async (item) => {
    started.push(item);
    if (started.length === 2) bothStarted();
    if (item === 0) {
      await fail;
      throw new Error('worker failed');
    }
    if (item === 1) {
      await peer;
      order.push(item);
      return 'one';
    }
    order.push(item);
    return `value-${item}`;
  });
  await ready;
  releaseFailure();
  await new Promise((resolve) => setImmediate(resolve));
  releasePeer();
  await assert.rejects(result, /worker failed/);
  assert.deepEqual(started, [0, 1]);
  assert.deepEqual(order, [1]);
});

test('review queue continues independent lessons after an isolated failure and reports the failure', async () => {
  const started = [],
    checked = [];
  await assert.rejects(
    runReviewQueue(
      ['broken', 'good', 'also-good'],
      1,
      async (id) => {
        started.push(id);
        if (id === 'broken') throw new Error('frame collision');
      },
      { keepGoing: true, assertSources: async () => checked.push('unchanged') },
    ),
    (error) => {
      assert(error instanceof AggregateError);
      assert.equal(error.errors[0].message, 'frame collision');
      return true;
    },
  );
  assert.deepEqual(started, ['broken', 'good', 'also-good']);
  assert.deepEqual(checked, ['unchanged']);
});

test('review queue stops when the source freeze changed instead of continuing with stale sources', async () => {
  const started = [];
  await assert.rejects(
    runReviewQueue(
      [0, 1, 2],
      1,
      async (id) => {
        started.push(id);
        throw new Error('lesson failure');
      },
      {
        keepGoing: true,
        assertSources: async () => {
          throw new Error('Source freeze changed');
        },
      },
    ),
    /Source freeze changed/,
  );
  assert.deepEqual(started, [0]);
});

test('review queue bounds repeated failures and preserves cancellation', async () => {
  const started = [];
  await assert.rejects(
    runReviewQueue(
      [0, 1, 2, 3],
      1,
      async (id) => {
        started.push(id);
        throw new Error('lesson failure');
      },
      { keepGoing: true, maxFailures: 2, assertSources: async () => {} },
    ),
    /limit of 2/,
  );
  assert.deepEqual(started, [0, 1]);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    runReviewQueue(
      [0, 1],
      1,
      async () => {
        throw new Error('cancelled');
      },
      {
        keepGoing: true,
        signal: controller.signal,
        assertSources: async () => assert.fail('cancelled source check'),
      },
    ),
    /cancelled/,
  );
});

test('truncated speech cache recovery retries once and keeps a distinct log for each attempt', async () => {
  const attempts = [],
    frozen = [],
    retries = [];
  const cacheError = `Error: Word timing exceeds audio: /repo/build/.audio-cache/${'a'.repeat(64)}.json\n`;
  await runWithTruncatedSpeechRecovery({
    run: async ({ attempt, logFile }) => {
      attempts.push({ attempt, logFile });
      if (attempt === 1) throw new Error('render exited 1');
    },
    readLog: async () => cacheError,
    logFileForAttempt: (attempt) => `audio${attempt === 1 ? '' : `.attempt-${attempt}`}.log`,
    assertFrozen: async () => frozen.push(true),
    onRetry: (event) => retries.push(event),
  });
  assert.deepEqual(attempts, [
    { attempt: 1, logFile: 'audio.log' },
    { attempt: 2, logFile: 'audio.attempt-2.log' },
  ]);
  assert.equal(frozen.length, 1);
  assert.deepEqual(
    retries.map((event) => event.nextAttempt),
    [2],
  );
});

test('truncated speech cache recovery stops after three total attempts', async () => {
  let attempts = 0,
    frozen = 0;
  const cacheError = `Error: Word timing exceeds audio: /repo/build/.audio-cache/${'b'.repeat(64)}.json\n`;
  await assert.rejects(
    runWithTruncatedSpeechRecovery({
      run: async () => {
        attempts++;
        throw new Error(`attempt ${attempts} failed`);
      },
      readLog: async () => cacheError,
      logFileForAttempt: (attempt) => `audio.attempt-${attempt}.log`,
      assertFrozen: async () => {
        frozen++;
      },
    }),
    /attempt 3 failed/,
  );
  assert.equal(attempts, 3);
  assert.equal(frozen, 2);
});

test('truncated speech cache recovery does not retry unrelated stage errors', async () => {
  let attempts = 0,
    reads = 0,
    frozen = 0;
  await assert.rejects(
    runWithTruncatedSpeechRecovery({
      run: async () => {
        attempts++;
        throw new Error('render exited 1');
      },
      readLog: async () => {
        reads++;
        return 'Error: Edge TTS authentication failed';
      },
      logFileForAttempt: () => 'audio.log',
      assertFrozen: async () => {
        frozen++;
      },
    }),
    /render exited 1/,
  );
  assert.equal(attempts, 1);
  assert.equal(reads, 1);
  assert.equal(frozen, 0);
});

test('truncated speech cache recovery returns cancellation immediately', async () => {
  const controller = new AbortController();
  let attempts = 0,
    reads = 0,
    frozen = 0;
  await assert.rejects(
    runWithTruncatedSpeechRecovery({
      run: async () => {
        attempts++;
        controller.abort();
        throw new Error('audio interrupted');
      },
      readLog: async () => {
        reads++;
        return `Error: Word timing exceeds audio: /repo/.audio-cache/${'c'.repeat(64)}.json`;
      },
      logFileForAttempt: () => 'audio.log',
      assertFrozen: async () => {
        frozen++;
      },
      signal: controller.signal,
    }),
    /audio interrupted/,
  );
  assert.equal(attempts, 1);
  assert.equal(reads, 0);
  assert.equal(frozen, 0);
});

test('source freeze detects both modified files and newly added inputs', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'leetllm-batch-freeze-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, 'source'));
  await writeFile(join(root, 'source/lesson.mjs'), 'first');
  const frozen = await freezeFiles(root, ['source/lesson.mjs'], { node: 'test-runtime' });
  await assert.doesNotReject(
    assertFreezeMatches(root, frozen, ['source/lesson.mjs'], { node: 'test-runtime' }),
  );
  await writeFile(join(root, 'source/lesson.mjs'), 'changed');
  await assert.rejects(
    assertFreezeMatches(root, frozen, ['source/lesson.mjs'], { node: 'test-runtime' }),
    /Source freeze changed: source\/lesson\.mjs/,
  );
  await writeFile(join(root, 'source/lesson.mjs'), 'first');
  await writeFile(join(root, 'source/shared.mjs'), 'new runtime helper');
  await assert.rejects(
    assertFreezeMatches(root, frozen, ['source/lesson.mjs', 'source/shared.mjs'], {
      node: 'test-runtime',
    }),
    /Source freeze changed: source\/shared\.mjs/,
  );
});

test('batch CLI parses explicit limits and rejects conflicting modes', () => {
  assert.deepEqual(
    parseBatchArgs(['--collection=sample', '--jobs', '3', '--threads=2', '--no-package']),
    {
      jobs: 3,
      threads: 2,
      resume: false,
      prepareOnly: false,
      validateOnly: false,
      noPackage: true,
      keepGoing: false,
      help: false,
      collection: 'sample',
    },
  );
  assert.throws(
    () => parseBatchArgs(['--collection', 'sample', '--prepare-only', '--validate-only']),
    /cannot be combined/,
  );
  assert.throws(
    () => parseBatchArgs(['--collection', 'sample', '--jobs', '0']),
    /integer from 1 to 16/,
  );
});

test('combined receipts follow collection order and reject missing or duplicate results', () => {
  assert.deepEqual(
    orderReceipts(['alpha', 'beta'], [{ id: 'beta' }, { id: 'alpha' }]).map((item) => item.id),
    ['alpha', 'beta'],
  );
  assert.throws(
    () => orderReceipts(['alpha'], [{ id: 'alpha' }, { id: 'alpha' }]),
    /Duplicate or missing receipt ID/,
  );
  assert.throws(
    () => orderReceipts(['alpha', 'beta'], [{ id: 'alpha' }]),
    /Missing verified receipt: beta/,
  );
});

test('prepare-only receipts promote to rendering while retaining only verified narration evidence', () => {
  const selected = collection([lesson('alpha'), lesson('beta')]);
  const freeze = { sha256: 'same-source-freeze', files: [], runtime: {} };
  const audio = { status: 'complete', evidence: { timeline: 'timeline-sha' } };
  const previous = {
    version: 1,
    collection: { id: selected.id },
    mode: 'prepare-only',
    status: 'complete',
    completedAt: '2026-10-19T00:00:00.000Z',
    sourceFreeze: freeze,
    lessons: [
      { id: 'alpha', phases: { audio } },
      { id: 'beta', phases: { audio: { status: 'failed' } } },
    ],
    phases: {},
  };
  const promoted = promoteReceipt(
    previous,
    selected,
    { prepareOnly: false, validateOnly: false },
    freeze,
  );
  assert.equal(promoted.mode, 'render');
  assert.deepEqual(promoted.promotedFrom, {
    mode: 'prepare-only',
    status: 'complete',
    completedAt: previous.completedAt,
  });
  assert.deepEqual(promoted.lessons[0].phases.audio, audio);
  assert.equal(promoted.lessons[1].phases.audio.status, 'pending');
  for (const name of ['render', 'occlusion', 'inspection'])
    assert.equal(promoted.lessons[0].phases[name].status, 'pending');
  assert.equal(promoted.phases.intro.status, 'pending');
  assert.equal(promoted.phases.package.status, 'pending');
  assert.throws(
    () =>
      promoteReceipt(
        previous,
        selected,
        { prepareOnly: false, validateOnly: false },
        { sha256: 'changed' },
      ),
    /Source freeze differs/,
  );

  const validated = {
    ...previous,
    mode: 'validate-only',
    lessons: selected.lessons.map((item) => ({
      id: item.id,
      phases: { renderValidate: { status: 'complete' } },
    })),
  };
  const prepared = promoteReceipt(
    validated,
    selected,
    { prepareOnly: true, validateOnly: false },
    freeze,
  );
  assert.equal(prepared.mode, 'prepare-only');
  assert.ok(prepared.lessons.every((item) => item.phases.audio.status === 'pending'));
  prepared.lessons[0].phases.audio = audio;
  const rendered = promoteReceipt(
    prepared,
    selected,
    { prepareOnly: false, validateOnly: false },
    freeze,
  );
  assert.deepEqual(rendered.lessons[0].phases.audio, audio);
  assert.equal(rendered.lessons[1].phases.audio.status, 'pending');
  assert.ok(
    rendered.lessons.every((item) =>
      ['render', 'occlusion', 'inspection'].every((name) => item.phases[name].status === 'pending'),
    ),
  );
});

test('output paths stay in build/ or outside the repository', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'leetllm-batch-output-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const paths = {
    repositoryRoot: root,
    videosRoot: join(root, 'videos'),
    contentRoot: join(root, 'web/src/content'),
  };
  assert.equal(
    validateOutputPath(join(root, 'build/visual-curriculum'), paths),
    join(root, 'build/visual-curriculum'),
  );
  assert.equal(
    validateOutputPath(join(dirname(root), `leetllm-external-${process.pid}`), paths),
    join(dirname(root), `leetllm-external-${process.pid}`),
  );
  for (const candidate of [
    root,
    paths.videosRoot,
    paths.contentRoot,
    join(root, 'docs'),
    dirname(root),
  ]) {
    assert.throws(() => validateOutputPath(candidate, paths), /Output/);
  }
});

test('streaming file hashes cover large outputs and inspection receipts use the decoder schema', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'leetllm-batch-hash-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const bytes = Buffer.alloc(8 * 1024 * 1024, 0xa7),
    path = join(root, 'video.zip');
  await writeFile(path, bytes);
  const expected = createHash('sha256').update(bytes).digest('hex');
  assert.equal(await hashFileStream(path), expected);

  const receipt = { sha256: 'video-hash', frameAudit: { frames: 120 } };
  const report = {
    videoSha256: 'video-hash',
    decodedFrameAudit: {
      passed: true,
      decodePassed: true,
      frames: 120,
      expectedFrames: 120,
      unexplainedBlankRuns: [],
    },
  };
  assert.equal(inspectReportIsComplete(report, receipt), true);
  assert.equal(
    inspectReportIsComplete(
      { ...report, decodedFrameAudit: { ...report.decodedFrameAudit, decodePassed: false } },
      receipt,
    ),
    false,
  );
  assert.equal(
    inspectReportIsComplete(
      { ...report, decodedFrameAudit: { ...report.decodedFrameAudit, frames: 119 } },
      receipt,
    ),
    false,
  );
});

test('runtime snapshot uses supported version flags for media tools', () => {
  const calls = [];
  const runtime = runtimeSnapshot({
    spawnSyncImpl: (command, args) => {
      calls.push([command, args[0]]);
      return { status: 0, stdout: `${command} test version\n`, stderr: '' };
    },
  });
  assert.deepEqual(calls, [
    ['ffmpeg', '-version'],
    ['ffprobe', '-version'],
    ['uv', '--version'],
  ]);
  assert.equal(runtime.ffmpeg, 'ffmpeg test version');
  assert.equal(runtime.ffprobe, 'ffprobe test version');
});

async function inspectionFixture(t) {
  const output = await mkdtemp(join(tmpdir(), 'leetllm-batch-inspection-'));
  t.after(() => rm(output, { recursive: true, force: true }));
  const id = 'ab-testing',
    repositoryRoot = fileURLToPath(new URL('../../', import.meta.url));
  const lessonFile = join(repositoryRoot, 'videos/lessons', `${id}.lesson.yaml`);
  const lesson = await readLesson(lessonFile, repositoryRoot);
  const folder = join(output, id),
    encoded = join(folder, 'encoded-review');
  await mkdir(encoded, { recursive: true });
  const hash = (value) => createHash('sha256').update(value).digest('hex');
  const fps = 30,
    intro = { id: 'brand', start: 0, fps, frames: 30, duration: 1 };
  let cursor = intro.duration;
  const scenes = lesson.scenes.map((scene) => {
    const timing = {
      ...makeSceneTimeline(
        scene,
        scene.beats.map(() => 1),
        fps,
      ),
      start: cursor,
    };
    timing.sounds = scene.beats.map((beat, beatIndex) => {
      const words = beat.say.split(/\s+/);
      return {
        beatIndex,
        words: words.map((text, index) => ({
          text,
          start: index / words.length,
          end: (index + 1) / words.length,
        })),
      };
    });
    timing.visualCues = resolveSceneCues(scene, timing);
    timing.cueTiming = 'provider-words';
    cursor += timing.duration;
    return timing;
  });
  const totalFrames = intro.frames + scenes.reduce((sum, scene) => sum + scene.frames, 0);
  const timeline = { id, width: 1920, height: 1080, fps, duration: cursor, intro, scenes };
  const timelineBytes = JSON.stringify(timeline),
    movie = Buffer.from('verified movie fixture');
  const videoHash = hash(movie);
  const receipt = {
    id,
    source: lesson.source,
    fullDecode: 'passed',
    width: 1920,
    height: 1080,
    fps: '30/1',
    duration: timeline.duration,
    scenes: scenes.length,
    sha256: videoHash,
    fingerprint: 'a'.repeat(64),
    frameAudit: { passed: true, frames: totalFrames },
    artifactSha256: { 'timeline.json': hash(timelineBytes), [`${id}.mp4`]: videoHash },
  };
  const receiptBytes = JSON.stringify(receipt);
  const toolSha256 = hash(
    Buffer.concat(
      await Promise.all(
        ['../audit-text-ink.mjs', '../lib/text-ink-audit.mjs'].map((file) =>
          readFile(new URL(file, import.meta.url)),
        ),
      ),
    ),
  );
  const inkScenes = [timeline.intro, ...timeline.scenes].map((timing) => {
    const sampleFrames = textInkSampleFrames(timing, timeline.fps);
    return {
      scene: timing.id,
      totalFrames: timing.frames,
      checkedFrames: sampleFrames.length,
      checkedLabels: sampleFrames.length * 10,
      skippedLabels: 0,
      issueFrames: 0,
      sampleFrames,
    };
  });
  const ink = {
    version: 1,
    id,
    mode: 'sampled-final',
    timingSource: 'measured-final',
    width: 1920,
    height: 1080,
    fps: 30,
    passed: true,
    issueFrames: 0,
    issues: [],
    scenes: inkScenes,
    checkedFrames: inkScenes.reduce((n, scene) => n + scene.checkedFrames, 0),
    totalFrames,
    checkedLabels: inkScenes.reduce((n, scene) => n + scene.checkedLabels, 0),
    skippedLabels: 0,
    videoSha256: receipt.sha256,
    sourceFingerprint: receipt.fingerprint,
    toolSha256,
    timelineSha256: hash(timelineBytes),
    receiptSha256: hash(receiptBytes),
  };
  const writeInk = async (value) =>
    writeFile(join(folder, 'text-ink-audit.json'), JSON.stringify(value));
  const model = validateMotionTimeline(lesson, timeline);
  const motionTool = hash(
    Buffer.concat(
      await Promise.all(
        ['../audit-motion.mjs', '../lib/motion-audit.mjs'].map((file) =>
          readFile(new URL(file, import.meta.url)),
        ),
      ),
    ),
  );
  const motion = {
    version: 1,
    id,
    mode: 'declared-regions-encoded',
    rule: 'declared-region-pixel-change',
    scope: MOTION_SCOPE,
    movieSha256: videoHash,
    videoSha256: videoHash,
    timelineSha256: hash(timelineBytes),
    receiptSha256: hash(receiptBytes),
    lessonSha256: hash(await readFile(lessonFile)),
    sourceFingerprint: receipt.fingerprint,
    toolSha256: motionTool,
    timingSource: 'measured-final',
    width: 1920,
    height: 1080,
    fps,
    thresholds: {
      minimumChannelDelta: MOTION_CHANNEL_DELTA,
      minimumChangedPixels: MOTION_MINIMUM_PIXELS,
    },
    sampleProgress: MOTION_SAMPLE_PROGRESS,
    coverage: {
      narratedBeats: model.narratedBeats,
      declaredChecks: model.checks.length,
      checkedBeats: model.checks.length,
      fraction: model.checks.length / model.narratedBeats,
      status: model.checks.length ? 'declared-subset' : 'none',
      note: 'test fixture',
    },
    checks: model.checks.map((check) => ({
      ...check,
      passed: true,
      pairs: [
        [0, 1],
        [1, 2],
        [0, 2],
      ].map(([from, to]) => {
        const area = check.region[2] * check.region[3];
        const changedPixels = Math.max(
          MOTION_MINIMUM_PIXELS,
          Math.ceil(area * check.minimumChangedFraction),
        );
        return {
          from,
          to,
          changedPixels,
          regionPixels: area,
          changedFraction: changedPixels / area,
          passed: true,
        };
      }),
    })),
    issues: [],
    passed: true,
  };
  const writeMotion = async (value) =>
    writeFile(join(folder, 'motion-audit.json'), JSON.stringify(value));
  await Promise.all([
    writeFile(join(folder, `${id}.mp4`), movie),
    writeFile(join(folder, 'timeline.json'), timelineBytes),
    writeFile(join(folder, 'verification.json'), receiptBytes),
    writeFile(join(encoded, 'contact.png'), 'encoded review fixture'),
    writeFile(
      join(encoded, 'verification.json'),
      JSON.stringify({
        videoSha256: receipt.sha256,
        artifactSha256: { 'contact.png': hash('encoded review fixture') },
        decodedFrameAudit: {
          passed: true,
          decodePassed: true,
          frames: totalFrames,
          expectedFrames: totalFrames,
          unexplainedBlankRuns: [],
        },
      }),
    ),
    writeInk(ink),
    writeMotion(motion),
  ]);
  return { output, folder, ink, writeInk, motion, writeMotion, id };
}

test('inspection runs the final text-ink gate after decoding and propagates invisible-label failures', async () => {
  const calls = [],
    context = { output: '/delivery', signal: new AbortController().signal };
  let complete = false;
  await assert.rejects(async () => {
    await runInspectionStage(context, 'alpha', async (_context, id, phase, command, args) => {
      calls.push({ id, phase, command, args });
      if (args[0] === 'videos/audit-text-ink.mjs')
        throw new Error('text ink FAIL: invisible label');
    });
    complete = true;
  }, /text ink FAIL: invisible label/);
  assert.equal(complete, false);
  assert.deepEqual(
    calls.map((call) => call.args),
    [
      ['videos/inspect.mjs', '--lesson', 'alpha', '--input', '/delivery'],
      ['videos/audit-text-ink.mjs', '--lesson', 'alpha', '--input', '/delivery', '--actual'],
    ],
  );
});

test('inspection runs encoded motion checks after text visibility succeeds', async () => {
  const calls = [],
    context = { output: '/delivery', signal: new AbortController().signal };
  await runInspectionStage(context, 'alpha', async (_context, id, phase, command, args) =>
    calls.push({ id, phase, command, args }),
  );
  assert.deepEqual(
    calls.map((call) => call.args),
    [
      ['videos/inspect.mjs', '--lesson', 'alpha', '--input', '/delivery'],
      ['videos/audit-text-ink.mjs', '--lesson', 'alpha', '--input', '/delivery', '--actual'],
      ['videos/audit-motion.mjs', '--lesson', 'alpha', '--input', '/delivery'],
    ],
  );
});

test('render finalizes captions before refreshing render evidence and leaves preview audio evidence alone', async () => {
  const id = 'alpha',
    calls = [];
  const audio = {
    status: 'complete',
    evidence: { timeline: 'raw-timeline', captions: 'preview-cues' },
  };
  const receipt = {
    lessons: [
      {
        id,
        phases: {
          audio: structuredClone(audio),
          render: { status: 'running' },
        },
      },
    ],
  };
  const context = {
    output: '/delivery',
    options: { threads: 3 },
    signal: new AbortController().signal,
    receipt,
    persist: async () => {
      calls.push('unexpected-persist');
    },
  };

  const evidence = await runFinalizedRenderStage(context, id, {
    run: async (_context, actualId, name, command, args) => {
      assert.equal(actualId, id);
      assert.equal(name, 'render');
      assert.equal(command, process.execPath);
      assert.deepEqual(args, [
        'videos/render.mjs',
        '--lesson',
        id,
        '--output',
        '/delivery',
        '--no-manifest',
        '--threads',
        '3',
      ]);
      calls.push('render');
    },
    finalizeCaptions: async ({ input, id: lessonId }) => {
      assert.equal(input, '/delivery');
      assert.equal(lessonId, id);
      assert.deepEqual(receipt.lessons[0].phases.audio, audio);
      calls.push('finalize-captions');
      return { cues: 2 };
    },
    assertSources: async () => calls.push('source-freeze'),
    captureRender: async () => {
      assert.deepEqual(receipt.lessons[0].phases.audio, audio);
      assert.equal(receipt.lessons[0].phases.render.status, 'running');
      assert.equal(receipt.lessons[0].phases.render.evidence, undefined);
      calls.push('capture-render');
      return { receiptSha256: 'final-receipt', timelineSha256: 'paragraph-timeline' };
    },
  });

  assert.deepEqual(evidence, {
    receiptSha256: 'final-receipt',
    timelineSha256: 'paragraph-timeline',
  });
  assert.deepEqual(calls, ['render', 'finalize-captions', 'source-freeze', 'capture-render']);
  assert.deepEqual(receipt.lessons[0].phases.audio, audio);
});

test('failed caption finalization preserves audio evidence and skips render evidence capture', async () => {
  const audio = {
    status: 'complete',
    evidence: { timeline: 'preview-timeline', captions: 'preview-cues' },
  };
  const id = 'alpha',
    receipt = {
      lessons: [
        {
          id,
          phases: {
            audio: structuredClone(audio),
            render: { status: 'running' },
          },
        },
      ],
    };
  const context = {
    output: '/delivery',
    options: { threads: 2 },
    signal: new AbortController().signal,
    receipt,
    persist: async () => {},
  };
  let renderEvidenceCalls = 0;
  await assert.rejects(
    runFinalizedRenderStage(context, id, {
      run: async () => {},
      finalizeCaptions: async () => {
        throw new Error('caption grouping failed');
      },
      assertSources: async () => {},
      captureRender: async () => {
        renderEvidenceCalls++;
        return { receiptSha256: 'stale' };
      },
    }),
    /caption grouping failed/,
  );
  assert.deepEqual(receipt.lessons[0].phases.audio, audio);
  assert.equal(renderEvidenceCalls, 0);
});

test('inspection evidence rejects failed, stale, or incomplete text-ink audits', async (t) => {
  const { output, ink, writeInk, motion, writeMotion, id } = await inspectionFixture(t);
  const valid = await inspectionEvidence(output, id);
  assert.equal(valid.motion.declaredChecks, motion.checks.length);
  assert.equal(valid.motion.checkedBeats, motion.checks.length);
  assert.equal(valid.textInk.video, ink.videoSha256);
  assert.equal(valid.textInk.frames, ink.checkedFrames);
  assert.equal(valid.textInk.totalFrames, ink.totalFrames);
  for (const field of [
    'videoSha256',
    'sourceFingerprint',
    'toolSha256',
    'timelineSha256',
    'receiptSha256',
  ]) {
    await writeInk({ ...ink, [field]: 'stale' });
    assert.equal(await inspectionEvidence(output, id), null, field);
  }
  for (const bad of [
    { ...ink, passed: false },
    { ...ink, issueFrames: 1 },
    { ...ink, issues: [{ text: 'invisible' }] },
    { ...ink, mode: 'sampled-author' },
    { ...ink, timingSource: 'measured-preview' },
    { ...ink, checkedFrames: ink.checkedFrames - 1 },
    { ...ink, totalFrames: ink.totalFrames - 1 },
    { ...ink, scenes: ink.scenes.slice(1) },
    {
      ...ink,
      scenes: ink.scenes.map((scene, index) =>
        index ? { ...scene, sampleFrames: scene.sampleFrames.slice(1) } : scene,
      ),
    },
    {
      ...ink,
      checkedLabels: 0,
      scenes: ink.scenes.map((scene) => ({ ...scene, checkedLabels: 0 })),
    },
  ]) {
    await writeInk(bad);
    assert.equal(await inspectionEvidence(output, id), null);
  }
  const allFrames = {
    ...ink,
    mode: 'all-frames',
    checkedFrames: ink.totalFrames,
    scenes: ink.scenes.map((scene) => ({
      ...scene,
      checkedFrames: scene.totalFrames,
      sampleFrames: null,
    })),
  };
  await writeInk(allFrames);
  assert.equal((await inspectionEvidence(output, id)).textInk.frames, ink.totalFrames);
  await writeInk({
    ...allFrames,
    scenes: allFrames.scenes.map((scene, index) =>
      index ? { ...scene, checkedFrames: scene.checkedFrames - 1 } : scene,
    ),
  });
  assert.equal(await inspectionEvidence(output, id), null);
  await writeInk(ink);
  const unexpectedMotionCheck = {
    scene: 'unexpected',
    sceneIndex: 0,
    beat: 0,
    region: [0, 0, 1, 1],
    minimumChangedFraction: 0.5,
    passed: true,
    pairs: [],
  };
  for (const bad of [
    { ...motion, passed: false },
    { ...motion, videoSha256: 'stale' },
    { ...motion, coverage: { ...motion.coverage, checkedBeats: motion.checks.length + 1 } },
    { ...motion, checks: [...motion.checks, unexpectedMotionCheck] },
    {
      ...motion,
      checks: motion.checks.length
        ? motion.checks.map((check, index) => (index ? check : { ...check, passed: false }))
        : [{ ...unexpectedMotionCheck, passed: false }],
    },
  ]) {
    await writeMotion(bad);
    assert.equal(await inspectionEvidence(output, id), null);
  }
  await rm(join(output, id, 'motion-audit.json'));
  assert.equal(await inspectionEvidence(output, id), null, 'missing motion report');
});

test('completed inspections rerun when text-ink or motion evidence is absent or changed', async (t) => {
  const { output, folder, ink, writeInk, motion, writeMotion, id } = await inspectionFixture(t);
  const evidence = await inspectionEvidence(output, id);
  const saved = (evidence) => ({
    lessons: [{ id, phases: { inspection: { status: 'complete', evidence } } }],
  });
  assert.equal(await reusable(saved(evidence), id, 'inspection', output), true);
  const { textInk, motion: _motion, ...oldEvidence } = evidence;
  for (const [name, record, mutate] of [
    ['legacy', saved(oldEvidence), async () => {}],
    ['missing text ink', saved(evidence), async () => rm(join(folder, 'text-ink-audit.json'))],
    ['changed text ink', saved(evidence), async () => writeInk({ ...ink, elapsedSeconds: 2 })],
    ['missing motion report', saved(evidence), async () => rm(join(folder, 'motion-audit.json'))],
    [
      'changed motion report',
      saved(evidence),
      async () => writeMotion({ ...motion, elapsedSeconds: 2 }),
    ],
  ]) {
    await writeInk(ink);
    await writeMotion(motion);
    await mutate();
    assert.equal(await reusable(record, id, 'inspection', output), false, name);
    assert.equal(record.lessons[0].phases.inspection.status, 'pending', name);
    assert.equal(record.lessons[0].phases.inspection.evidence, undefined, name);
  }
});

test('package cache binds the current ordered delivery, inspection, and source freeze', async (t) => {
  const baseline = {
    version: 1,
    complete: true,
    collectionId: 'sample',
    lessonIds: ['alpha', 'beta'],
    sourceFreezeSha256: 'freeze-v1',
    manifestSha256: 'manifest-v1',
    lessons: [
      {
        id: 'alpha',
        render: { video: 'movie-a', receipt: 'receipt-a' },
        occlusion: { report: 'occlusion-a' },
        inspection: { verification: 'inspect-a', motion: { report: 'motion-a' } },
      },
      {
        id: 'beta',
        render: { video: 'movie-b', receipt: 'receipt-b' },
        occlusion: { report: 'occlusion-b' },
        inspection: { verification: 'inspect-b', motion: { report: 'motion-b' } },
      },
    ],
  };
  const runCase = async (savedInputs, currentInputs, shouldRun) => {
    const output = await mkdtemp(join(tmpdir(), 'leetllm-package-cache-'));
    t.after(() => rm(output, { recursive: true, force: true }));
    const archive = join(output, 'leetllm-sample.zip'),
      oldBytes = Buffer.from('existing verified archive');
    await writeFile(archive, oldBytes);
    const savedEvidence = {
      archive: createHash('sha256').update(oldBytes).digest('hex'),
      bytes: oldBytes.length,
    };
    if (savedInputs !== undefined) savedEvidence.inputs = savedInputs;
    const receipt = { phases: { package: { status: 'complete', evidence: savedEvidence } } };
    const context = {
      receipt,
      persist: async () => {},
      output,
      lessons: [{ id: 'alpha' }, { id: 'beta' }],
      collection: { id: 'sample' },
      options: { noPackage: false },
      signal: new AbortController().signal,
    };
    let calls = 0;
    await packageCollection(context, {
      getInputs: async () => structuredClone(currentInputs),
      run: async (_context, id, name, command, args) => {
        calls++;
        assert.equal(id, null);
        assert.equal(name, 'package');
        assert.equal(command, 'uv');
        assert.ok(args.includes('--require-motion'));
        await writeFile(archive, Buffer.from(`rebuilt archive ${calls}`));
      },
    });
    assert.equal(calls, Number(shouldRun));
    if (shouldRun) {
      assert.equal(receipt.phases.package.status, 'complete');
      assert.deepEqual(receipt.phases.package.evidence.inputs, currentInputs);
    } else {
      assert.deepEqual(receipt.phases.package.evidence, savedEvidence);
    }
  };

  await runCase(baseline, baseline, false);
  const changedMovie = structuredClone(baseline);
  changedMovie.lessons[0].render.video = 'new-movie-a';
  await runCase(baseline, changedMovie, true);
  const changedMotion = structuredClone(baseline);
  changedMotion.lessons[1].inspection.motion.report = 'new-motion-b';
  await runCase(baseline, changedMotion, true);
  await runCase(undefined, baseline, true);
  const changedFreeze = structuredClone(baseline);
  changedFreeze.sourceFreezeSha256 = 'freeze-v2';
  await runCase(baseline, changedFreeze, true);
});
