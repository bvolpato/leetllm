import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { drawFrame } from '../lib/scene.mjs';
import {
  narrationActionWords,
  suppressNarrationFocus,
  unionTargetRegions,
  compareTargetMotion,
  evaluateNarratedMotion,
  cueProbeTimes,
} from '../audit-narrated-motion.mjs';

const cue = {
  id: 'move',
  start: 1,
  end: 2,
  targets: ['subject'],
  color: 'cyan',
  active: true,
  strength: 1,
  progress: 0.5,
  reveal: 1,
  phase: 'during',
};
function render({
  progress = 0,
  strength = 0,
  neutral = true,
  moving = false,
  number = false,
  outside = false,
} = {}) {
  const canvas = createCanvas(1920, 1080),
    ctx = canvas.getContext('2d');
  const raw = {
    t: 3,
    duration: 10,
    beat: 0,
    beatP: 0.5,
    opacity: 1,
    cueTiming: 'provider-words',
    cues: { move: { ...cue, progress, strength } },
  };
  const state = neutral ? suppressNarrationFocus(raw) : raw;
  const audit = drawFrame(
    ctx,
    {},
    { title: 'Target motion diagnostic' },
    state,
    (ctx, scene, state, api) => {
      api.focus.target('subject', () => {
        if (number)
          api.text(
            ctx,
            String(Math.round(api.focus.progress('move') * 100)),
            400,
            500,
            64,
            api.C.ink,
          );
        else
          api.rect(
            ctx,
            400 + (moving ? api.focus.progress('move') * 300 : 0),
            400,
            100,
            100,
            api.C.cyan,
          );
      });
      api.rect(ctx, 1200 + (outside ? progress * 300 : 0), 400, 100, 100, api.C.pink);
    },
  );
  const rgba = ctx.getImageData(0, 0, 1920, 1080).data,
    data = new Uint8Array(1920 * 1080 * 3);
  for (let pixel = 0; pixel < 1920 * 1080; pixel++)
    for (let channel = 0; channel < 3; channel++)
      data[pixel * 3 + channel] = rgba[pixel * 4 + channel];
  return { frame: { width: 1920, height: 1080, data }, targets: audit.targets };
}

test('changing focus decoration cannot satisfy underlying target change', () => {
  const decorated = [
    render({ neutral: false, strength: 0 }),
    render({ neutral: false, strength: 1 }),
  ];
  assert.equal(
    compareTargetMotion(decorated[0].frame, decorated[1].frame, [[0, 0, 1920, 1080]])
      .observedChange,
    true,
  );
  const samples = [render({ strength: 0 }), render({ strength: 1 })];
  const result = evaluateNarratedMotion(samples, ['subject']);
  assert.equal(result.reviewNeeded, true);
  assert.equal(result.targets[0].comparisons[0].changedPixels, 0);
});

test('focus suppression preserves authored cue progress, phase, active status and reveal', () => {
  const state = { opacity: 0.2, cues: { move: { ...cue, progress: 0.73, reveal: 0.41 } } };
  const neutral = suppressNarrationFocus(state);
  assert.deepEqual(neutral.cues.move, { ...state.cues.move, strength: 0 });
  assert.equal(neutral.opacity, 1);
  assert.equal(state.cues.move.strength, 1);
});

test('moving geometry and numeric updates driven by cue progress qualify', () => {
  for (const behavior of [{ moving: true }, { number: true }]) {
    const result = evaluateNarratedMotion(
      [render({ ...behavior, progress: 0 }), render({ ...behavior, progress: 1 })],
      ['subject'],
    );
    assert.equal(result.reviewNeeded, false);
    assert.equal(result.targets[0].observedChange, true);
    assert(result.targets[0].comparisons[0].changedPixels >= 32);
  }
});

test('movement outside the registered target does not count', () => {
  const result = evaluateNarratedMotion(
    [render({ outside: true, progress: 0 }), render({ outside: true, progress: 1 })],
    ['subject'],
  );
  assert.equal(result.reviewNeeded, true);
  assert.equal(result.targets[0].comparisons[0].changedPixels, 0);
});

test('exact union clips bounds and deduplicates overlaps without filling gaps', () => {
  const regions = unionTargetRegions(
    [
      { x: -2.5, y: -1, width: 7.5, height: 5 },
      { x: 2, y: 2, width: 5, height: 5 },
      { x: 9, y: 8, width: 20, height: 20 },
    ],
    12,
    12,
  );
  const pixels = regions.flatMap(([x, y, width, height]) =>
    Array.from(
      { length: width * height },
      (_, index) => `${x + (index % width)},${y + Math.floor(index / width)}`,
    ),
  );
  assert.equal(new Set(pixels).size, pixels.length);
  assert.equal(pixels.length, 5 * 4 + 5 * 5 - 3 * 2 + 3 * 4);
  assert(!pixels.includes('8,6'));
  assert(pixels.includes('11,11'));
  assert.throws(
    () => unionTargetRegions([{ x: NaN, y: 0, width: 1, height: 1 }], 12, 12),
    /Invalid registered target bounds/,
  );
});

test('missing and wholly clipped targets are reviewable without division by zero', () => {
  const samples = [render(), render()];
  samples.forEach((sample) =>
    sample.targets.push({ id: 'outside', x: -50, y: 0, width: 10, height: 10, alpha: 1 }),
  );
  const result = evaluateNarratedMotion(samples, ['absent', 'outside']);
  assert.equal(result.reviewNeeded, true);
  for (const target of result.targets) {
    assert.equal(target.status, 'no-visible-target-bounds');
    assert.deepEqual(target.regions, []);
    assert.equal(target.comparisons[0].changedFraction, 0);
  }
});

test('static context remains visible in measurements when another target moves', () => {
  const samples = [render({ moving: true, progress: 0 }), render({ moving: true, progress: 1 })];
  for (const sample of samples)
    sample.targets.push({ id: 'static', x: 1200, y: 400, width: 100, height: 100, alpha: 1 });
  const result = evaluateNarratedMotion(samples, ['subject', 'static']);
  assert.equal(result.reviewNeeded, false);
  assert.deepEqual(result.staticTargets, ['static']);
  assert.equal(result.targets[0].observedChange, true);
  assert.equal(result.targets[1].observedChange, false);
});

test('phrase probes straddle provider cue windows and stay in their beat', () => {
  const times = cueProbeTimes(
    { ...cue, beat: 0 },
    { fps: 30, duration: 5, beats: [{ start: 0.4, until: 4 }] },
  );
  assert(times[0] < cue.start);
  assert(times.at(-1) > cue.end);
  assert(times.includes(1.5));
  assert.equal(times.length, 7);
  assert(
    cueProbeTimes(
      { ...cue, beat: 0, start: 0.4, end: 4 },
      { fps: 30, duration: 5, beats: [{ start: 0.4, until: 4 }] },
    ).every((time) => time >= 0.4 && time <= 4),
  );
});

test('lexical selection exposes matched words without treating all descriptive cues as actions', () => {
  assert.deepEqual(narrationActionWords('frequency bars settle as the sample grows'), [
    'settle',
    'grows',
  ]);
  assert.deepEqual(narrationActionWords('the same average response time'), []);
  assert.deepEqual(narrationActionWords('observed fraction changes'), ['changes']);
});
