import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
  validateMotionCheck,
  compareMotionRegion,
  evaluateMotionFrames,
  validateMotionTimeline,
  validateMotionReceipt,
} from '../lib/motion-audit.mjs';
import { extractMotionFrame, inspectEncodedMotionCheck } from '../audit-motion.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';

const execute = promisify(execFile);
const blank = (width = 64, height = 48) => ({
  width,
  height,
  data: Buffer.alloc(width * height * 3),
});
function block(frame, x, y, width, height, color = [200, 80, 30]) {
  for (let row = y; row < y + height; row++)
    for (let column = x; column < x + width; column++) {
      const offset = (row * frame.width + column) * 3;
      color.forEach((value, channel) => (frame.data[offset + channel] = value));
    }
  return frame;
}

test('regions use complete integer native rectangles and valid fractional thresholds', () => {
  assert.deepEqual(validateMotionCheck({ region: [1700, 980, 220, 100] }), {
    region: [1700, 980, 220, 100],
    minimumChangedFraction: 0.002,
  });
  for (const region of [
    [-1, 0, 10, 10],
    [0, 0, 0, 10],
    [0, 0, 10, -1],
    [1910, 0, 11, 10],
    [0, 1070, 10, 11],
    [0, 0, 1.5, 10],
    [0, 0, 10],
    [0, , 10, 10],
    [0, 0, Infinity, 10],
  ]) {
    assert.throws(() => validateMotionCheck({ region }), /motion_check.region/);
  }
  for (const minimumChangedFraction of [0, -1, 1.01, NaN, Infinity, '.002', null]) {
    assert.throws(
      () => validateMotionCheck({ region: [0, 0, 100, 100], minimumChangedFraction }),
      /minimumChangedFraction/,
    );
  }
  assert.throws(
    () => validateMotionCheck({ region: [0, 0, 100, 100], minimumChangedFracton: 0.002 }),
    /motion_check must/,
  );
  assert.throws(() => validateMotionCheck(null), /motion_check must/);
});

test('an unchanged teaching region fails all three sampled pairs', () => {
  const frames = [blank(), blank(), blank()];
  const result = evaluateMotionFrames(frames, { region: [10, 10, 30, 20] });
  assert.equal(result.passed, false);
  assert.deepEqual(
    result.pairs.map((pair) => pair.changedPixels),
    [0, 0, 0],
  );
});

test('localized moving content passes even when it returns to its first position', () => {
  const first = block(blank(), 12, 12, 8, 8),
    middle = block(blank(), 30, 12, 8, 8);
  const result = evaluateMotionFrames([first, middle, first], {
    region: [10, 10, 35, 20],
    minimumChangedFraction: 0.1,
  });
  assert.equal(result.passed, true);
  assert.equal(result.pairs[0].changedPixels, 128);
  assert.equal(result.pairs[2].passed, false);
});

test('movement outside the declared crop never earns motion coverage', () => {
  const first = block(blank(), 40, 30, 8, 8),
    next = block(blank(), 52, 30, 8, 8);
  const result = evaluateMotionFrames([first, next, first], { region: [0, 0, 30, 20] });
  assert.equal(result.passed, false);
  assert(result.pairs.every((pair) => pair.changedPixels === 0));
});

test('channel delta and minimum changed pixels both apply inclusively', () => {
  const first = blank(),
    noise = block(blank(), 0, 0, 8, 4, [11, 0, 0]);
  assert.equal(compareMotionRegion(first, noise, { region: [0, 0, 64, 48] }).changedPixels, 0);
  const threshold = block(blank(), 0, 0, 8, 4, [0, 12, 0]);
  const equality = compareMotionRegion(first, threshold, {
    region: [0, 0, 64, 48],
    minimumChangedFraction: 32 / (64 * 48),
  });
  assert.equal(equality.changedPixels, 32);
  assert.equal(equality.passed, true);
  assert.equal(
    compareMotionRegion(first, threshold, { region: [0, 0, 64, 48], minimumChangedFraction: 0.02 })
      .passed,
    false,
  );
  const single = block(blank(), 0, 0, 1, 1);
  assert.equal(
    compareMotionRegion(first, single, { region: [0, 0, 1, 1], minimumChangedFraction: 1 }).passed,
    false,
  );
});

test('incomplete RGB buffers and mismatched frames cannot produce passing evidence', () => {
  assert.throws(
    () => compareMotionRegion(blank(), blank(32, 48), { region: [0, 0, 10, 10] }),
    /dimensions differ/,
  );
  assert.throws(
    () =>
      compareMotionRegion(
        blank(),
        { width: 64, height: 48, data: Buffer.alloc(2) },
        { region: [0, 0, 10, 10] },
      ),
    /complete RGB24/,
  );
  assert.throws(
    () => evaluateMotionFrames([blank(), blank()], { region: [0, 0, 10, 10] }),
    /exactly three/,
  );
});

function fixture() {
  const check = { region: [200, 300, 600, 300], minimumChangedFraction: 0.002 };
  const lesson = {
    id: 'fixture',
    source: 'foundations/fixture/content.md',
    scenes: [
      {
        id: 'trace',
        beats: [
          { say: 'Follow the actual update.', hold: 0.5, motion_check: check },
          { say: 'Read the completed outcome.', hold: 0.5 },
        ],
      },
    ],
  };
  const timeline = {
    id: 'fixture',
    width: 1920,
    height: 1080,
    fps: 10,
    duration: 10,
    intro: { start: 0, fps: 10, frames: 40, duration: 4 },
    scenes: [
      {
        id: 'trace',
        fps: 10,
        start: 4,
        frames: 60,
        duration: 6,
        beats: [
          { ...lesson.scenes[0].beats[0], start: 0.4, end: 2.4, duration: 2, until: 2.9 },
          { ...lesson.scenes[0].beats[1], start: 2.9, end: 5, duration: 2.1, until: 5.5 },
        ],
      },
    ],
  };
  const movieSha256 = 'a'.repeat(64),
    timelineSha256 = 'b'.repeat(64);
  const receipt = {
    id: 'fixture',
    source: lesson.source,
    fullDecode: 'passed',
    width: 1920,
    height: 1080,
    fps: '10/1',
    duration: 10,
    scenes: 1,
    frameAudit: { passed: true, frames: 100 },
    fingerprint: 'c'.repeat(64),
    sha256: movieSha256,
    artifactSha256: { 'fixture.mp4': movieSha256, 'timeline.json': timelineSha256 },
  };
  return { lesson, timeline, receipt, hashes: { movieSha256, timelineSha256, frames: 100 } };
}

test('measured motion timelines bind semantic cues to their exact provider word span', () => {
  const { lesson, timeline } = fixture(),
    scene = lesson.scenes[0],
    timing = timeline.scenes[0];
  scene.beats[0].visual_cues = [{ id: 'update', phrase: 'actual update', targets: ['weight'] }];
  timing.sounds = [
    {
      beatIndex: 0,
      words: ['Follow', 'the', 'actual', 'update.'].map((text, index) => ({
        text,
        start: index * 0.4,
        end: (index + 1) * 0.4,
      })),
    },
  ];
  timing.visualCues = resolveSceneCues(scene, timing);
  timing.cueTiming = 'provider-words';
  assert.doesNotThrow(() => validateMotionTimeline(lesson, timeline));
  timing.visualCues[0].start += 0.1;
  assert.throws(() => validateMotionTimeline(lesson, timeline), /narration cue bindings differ/);
  timing.visualCues = resolveSceneCues(scene, timing);
  scene.beats[0].visual_cues[0].targets = ['different-object'];
  assert.throws(() => validateMotionTimeline(lesson, timeline), /narration cue bindings differ/);
});

test('sample times include the scene offset and measured beat interval', () => {
  const { lesson, timeline } = fixture();
  const model = validateMotionTimeline(lesson, timeline);
  assert.equal(model.narratedBeats, 2);
  assert.equal(model.checks.length, 1);
  assert.deepEqual(
    model.checks[0].samples.map((sample) => sample.progress),
    [0.12, 0.5, 0.88],
  );
  assert.deepEqual(
    model.checks[0].samples.map((sample) => sample.frame),
    [47, 57, 66],
  );
});

test('zero declarations remain zero coverage rather than fabricated checks', () => {
  const { lesson, timeline } = fixture();
  delete lesson.scenes[0].beats[0].motion_check;
  delete timeline.scenes[0].beats[0].motion_check;
  const result = validateMotionTimeline(lesson, timeline);
  assert.equal(result.narratedBeats, 2);
  assert.deepEqual(result.checks, []);
});

test('changed narration, declaration, scene offset and invalid timing reject stale timelines', () => {
  for (const change of [
    (f) => (f.timeline.scenes[0].beats[0].say = 'A different narration.'),
    (f) => (f.timeline.scenes[0].beats[0].motion_check = { region: [0, 0, 100, 100] }),
    (f) => (f.timeline.scenes[0].start = 5),
    (f) => (f.timeline.scenes[0].fps = 30),
    (f) => (f.timeline.scenes[0].beats[1].until = 6.5),
    (f) => (f.timeline.scenes[0].beats[1].start = 2),
    (f) => (f.timeline.duration = 11),
  ]) {
    const f = fixture();
    change(f);
    assert.throws(
      () => validateMotionTimeline(f.lesson, f.timeline),
      /stale or invalid measured timeline/,
    );
  }
});

test('movie and timeline hashes, decode receipt and frame counts must match together', () => {
  const valid = fixture();
  assert.doesNotThrow(() =>
    validateMotionReceipt(valid.lesson, valid.timeline, valid.receipt, valid.hashes),
  );
  for (const change of [
    (f) => (f.hashes.movieSha256 = 'd'.repeat(64)),
    (f) => (f.receipt.artifactSha256['timeline.json'] = 'd'.repeat(64)),
    (f) => (f.receipt.fullDecode = 'pending'),
    (f) => (f.receipt.frameAudit.frames = 99),
    (f) => (f.receipt.fps = '30/1'),
    (f) => (f.receipt.duration = 9),
    (f) => (f.receipt = null),
  ]) {
    const f = fixture();
    change(f);
    assert.throws(
      () => validateMotionReceipt(f.lesson, f.timeline, f.receipt, f.hashes),
      /verification receipt/,
    );
  }
});

test('fractional video frames and bounded AAC tails preserve valid media receipts', () => {
  const f = fixture();
  f.timeline.fps = 30;
  f.timeline.duration = 100 / 30;
  f.receipt.fps = '30/1';
  f.receipt.duration = 3.333333;
  assert.doesNotThrow(() => validateMotionReceipt(f.lesson, f.timeline, f.receipt, f.hashes));
  f.receipt.duration = 3.4;
  assert.doesNotThrow(() => validateMotionReceipt(f.lesson, f.timeline, f.receipt, f.hashes));
  f.receipt.duration = 3.5;
  assert.throws(
    () => validateMotionReceipt(f.lesson, f.timeline, f.receipt, f.hashes),
    /verification receipt/,
  );
});

test('ffmpeg extraction compares actual encoded native pixels inside the region', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'leetllm-motion-test-'));
  try {
    const movie = join(directory, 'moving.mp4');
    await execute('ffmpeg', [
      '-v',
      'error',
      '-f',
      'lavfi',
      '-i',
      'color=c=black:s=1920x1080:r=10:d=1',
      '-vf',
      "drawbox=x=300:y=400:w=80:h=80:color=white:t=fill:enable='gte(t,0.4)'",
      '-c:v',
      'libx264',
      '-preset',
      'ultrafast',
      '-pix_fmt',
      'yuv420p',
      '-threads',
      '1',
      movie,
    ]);
    const frames = await Promise.all(
      [0.1, 0.5, 0.8].map((time) => extractMotionFrame(movie, time)),
    );
    assert.equal(evaluateMotionFrames(frames, { region: [280, 380, 120, 120] }).passed, true);
    assert.equal(evaluateMotionFrames(frames, { region: [600, 380, 120, 120] }).passed, false);
    const check = {
      scene: 'update',
      sceneIndex: 0,
      beat: 1,
      region: [280, 380, 120, 120],
      minimumChangedFraction: 0.002,
      samples: [0.1, 0.5, 0.8].map((time) => ({ time, frame: time * 10 })),
    };
    assert.equal((await inspectEncodedMotionCheck(movie, check)).passed, true);
    assert.equal(
      (await inspectEncodedMotionCheck(movie, { ...check, region: [600, 380, 120, 120] })).passed,
      false,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
