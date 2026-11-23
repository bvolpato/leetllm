import test from 'node:test';
import assert from 'node:assert/strict';
import {
  arrowheadSampleFrames,
  validateArrowheadTimeline,
  arrowheadDiagnostics,
} from '../audit-arrowheads.mjs';
import { makeSceneTimeline } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { createCanvas } from '@napi-rs/canvas';
import { createClosedPathCapture } from '../lib/arrowhead-path-intersections.mjs';
import { drawFrame } from '../lib/scene.mjs';

function fixture() {
  const scene = {
    id: 'move',
    beats: [
      {
        say: 'Move it.',
        hold: 0.5,
        visual_cues: [{ id: 'shift', phrase: 'Move it', targets: ['point'] }],
      },
    ],
  };
  const timing = makeSceneTimeline(scene, [1], 30);
  timing.start = 4;
  timing.sounds = [
    {
      words: [
        { text: 'Move', start: 0.1, end: 0.3 },
        { text: 'it', start: 0.3, end: 0.7 },
      ],
    },
  ];
  timing.visualCues = resolveSceneCues(scene, timing);
  return {
    lesson: { id: 'sample', scenes: [scene] },
    timeline: { id: 'sample', fps: 30, scenes: [timing] },
  };
}

test('measured sampling includes actual cue interiors and holds on the declared frame grid', () => {
  const { lesson, timeline } = fixture(),
    timing = timeline.scenes[0];
  assert.doesNotThrow(() => validateArrowheadTimeline(lesson, timeline));
  const frames = arrowheadSampleFrames(timing, 30);
  for (const t of [
    timing.visualCues[0].start - 1 / 30,
    (timing.visualCues[0].start + timing.visualCues[0].end) / 2,
    timing.visualCues[0].end + 1 / 30,
  ])
    assert(frames.includes(Math.round(t * 30)));
  assert(
    frames.every(
      (frame, i) =>
        Number.isInteger(frame) &&
        frame >= 0 &&
        frame < timing.frames &&
        (!i || frame > frames[i - 1]),
    ),
  );
  assert.deepEqual(
    arrowheadSampleFrames(timing, 30, true),
    Array.from({ length: timing.frames }, (_, i) => i),
  );
});

test('stale speech and cue timing cannot be reported as a matching measured audit', () => {
  const { lesson, timeline } = fixture();
  timeline.scenes[0].visualCues[0].end += 0.1;
  assert.throws(() => validateArrowheadTimeline(lesson, timeline), /stale measured visual cues/);
  timeline.scenes[0].beats[0].say = 'A different sentence.';
  assert.throws(() => validateArrowheadTimeline(lesson, timeline), /stale or invalid beat timing/);
});

test('estimated timelines work without inventing provider cue timing', () => {
  const { lesson, timeline } = fixture();
  delete timeline.scenes[0].sounds;
  delete timeline.scenes[0].visualCues;
  assert.doesNotThrow(() => validateArrowheadTimeline(lesson, timeline, false));
  assert.throws(
    () => validateArrowheadTimeline(lesson, timeline),
    /measured matching narration is required/,
  );
  assert.equal(arrowheadSampleFrames(timeline.scenes[0], 30).length, 3);
});

test('closed-path mode adds its independent diagnostic while default circle semantics stay unchanged', () => {
  const capture = createClosedPathCapture(createCanvas(1920, 1080).getContext('2d'));
  try {
    const audit = drawFrame(
      capture.context,
      {},
      { title: 'Measured geometry' },
      { t: 1, duration: 2, opacity: 1 },
      (ctx, _scene, _state, api) => {
        api.path(
          ctx,
          [
            { x: 480, y: 380 },
            { x: 520, y: 380 },
            { x: 520, y: 420 },
            { x: 480, y: 420 },
          ],
          { closed: true, width: 4 },
        );
        api.arrow(ctx, 460, 400, 525, 400, '#fff', 7);
      },
    );
    assert.deepEqual(arrowheadDiagnostics(audit), { warnings: [] });
    const enabled = arrowheadDiagnostics(audit, { closedPaths: true, strokes: capture.strokes });
    assert.equal(enabled.warnings.length, 1);
    assert.equal(enabled.warnings[0].type, 'arrowhead-intersects-closed-path-stroke');
    assert.deepEqual(enabled.unsupported, []);
    const missing = arrowheadDiagnostics(audit, { closedPaths: true, strokes: [] });
    assert.deepEqual(missing.warnings, []);
    assert.equal(missing.unsupported.length, 1);
    assert.throws(
      () => arrowheadDiagnostics(audit, { closedPaths: true }),
      /captured native strokes/,
    );
  } finally {
    capture.dispose();
  }
});
