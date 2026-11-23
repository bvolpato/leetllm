import test from 'node:test';
import assert from 'node:assert/strict';
import { loadMeasuredTimeline } from './helpers/measured-narration.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { draw, sphereMidpoints } from '../animations/model-merging.mjs';
import { frameState, readLesson } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

async function measuredFrames() {
  const lesson = await readLesson(
    path.join(root, 'videos/lessons/model-merging.lesson.yaml'),
    root,
  );
  const scene = lesson.scenes.find((item) => item.id === 'slerp');
  const timeline = await loadMeasuredTimeline('model-merging');
  const measured = timeline.scenes.find((item) => item.id === 'slerp');
  const timing = {
    ...measured,
    visualCues: resolveSceneCues(scene, measured),
    cueTiming: 'provider-words',
  };
  const cue = timing.visualCues.find((item) => item.id === 'slerp-b1-1');
  const arcCue = timing.visualCues.find((item) => item.id === 'slerp-b2-1');
  const midpointCue = timing.visualCues.find((item) => item.id === 'slerp-b2-2');
  const sound = measured.sounds.find((item) => item.beatIndex === 0);
  const eight = sound.words.find((word) => word.text.toLowerCase() === 'eight');
  assert(cue);
  assert(eight);
  assert(arcCue);
  assert(midpointCue);
  const sceneIndex = lesson.scenes.indexOf(scene);
  const at = (time) => frameState(timing, time, sceneIndex, lesson.scenes.length);
  return {
    lesson,
    scene,
    cueState: at((cue.start + cue.end) / 2),
    normState: at(measured.beats[0].start + eight.start + (eight.end - eight.start) / 2),
    arcBeforeState: at(arcCue.start - 0.08),
    arcStates: [0, 0.25, 0.5, 0.75, 1].map((progress) =>
      at(arcCue.start + (arcCue.end - arcCue.start) * progress),
    ),
    arcEndState: at(arcCue.end),
    sphericalMidpointStates: [0, 0.5, 1].map((progress) =>
      at(midpointCue.start + (midpointCue.end - midpointCue.start) * progress),
    ),
  };
}

function paintAt(scene, state) {
  const curves = [],
    labels = [],
    scatters = [],
    fades = [],
    targets = [];
  const api = {
    C: { blue: 'blue', cyan: 'cyan', green: 'green', pink: 'pink', muted: 'muted', ink: 'ink' },
    components: {
      fade: (opacity, paint) => {
        fades.push(opacity);
        if (opacity > 0) paint();
      },
    },
    teaching: {
      axes: () => ({}),
      curve: (value) => {
        curves.push(value);
        return value;
      },
      scatter: (value) => {
        scatters.push(value);
      },
    },
    clamp: (value, min, max) => Math.max(min, Math.min(max, value)),
    phase: (value, start, end) => Math.max(0, Math.min(1, (value - start) / (end - start))),
    text: (_ctx, value) => {
      labels.push(String(value));
    },
    math: (_ctx, value) => {
      labels.push(String(value));
    },
    focus: {
      target: (id, paint) => {
        const starts = {
          curves: curves.length,
          labels: labels.length,
          scatters: scatters.length,
          fades: fades.length,
        };
        const result = paint();
        targets.push({
          id,
          curves: curves.slice(starts.curves),
          labels: labels.slice(starts.labels),
          scatters: scatters.slice(starts.scatters),
          fades: fades.slice(starts.fades),
        });
        return result;
      },
      progress: (id, fallback = 0) => state.cues?.[id]?.progress ?? fallback,
    },
  };
  draw({}, scene, state, api);
  return { curves, labels, scatters, fades, targets };
}

function pointAlongCurve(curve) {
  const position = curve.progress * (curve.points.length - 1);
  const index = Math.min(curve.points.length - 2, Math.floor(position));
  const fraction = position - index;
  const start = curve.points[index],
    end = curve.points[index + 1];
  return { x: start.x + (end.x - start.x) * fraction, y: start.y + (end.y - start.y) * fraction };
}

function hasSphericalMidpoint(frame) {
  const point = sphereMidpoints().spherical;
  return frame.scatters.some((scatter) =>
    scatter.points.some(
      (candidate) =>
        Math.abs(candidate.x - point[0]) < 1e-9 && Math.abs(candidate.y - point[1]) < 1e-9,
    ),
  );
}

test('the measured straight-through cue reveals the chord before the midpoint norm clause', async () => {
  const { scene, cueState, normState } = await measuredFrames();
  assert.equal(cueState.beat, 0);
  const atCue = paintAt(scene, cueState);
  assert.equal(atCue.curves.length, 2);
  assert.equal(atCue.curves[0].progress, cueState.cues['slerp-b1-1'].progress);
  assert.deepEqual(atCue.curves[0].points, [
    { x: 1, y: 0 },
    { x: sphereMidpoints().linear[0], y: sphereMidpoints().linear[1] },
    { x: 0.5, y: Math.sqrt(3) / 2 },
  ]);
  assert(!atCue.labels.some((label) => label.startsWith('Fixed linear midpoint')));

  const atNorm = paintAt(scene, normState);
  assert(atNorm.curves[0].progress > 0.99);
  assert(
    atNorm.labels.some(
      (label) => label.startsWith('Fixed linear midpoint') && label.includes('norm 0.87'),
    ),
  );
});

test('the measured arc cue reveals curved geometry at constant angular rate before its unit-norm midpoint', async () => {
  const { scene, arcBeforeState, arcStates, arcEndState, sphericalMidpointStates } =
    await measuredFrames();
  const before = paintAt(scene, arcBeforeState),
    arcBefore = before.curves[1];
  assert.equal(arcBefore.progress, 0);
  assert.deepEqual(pointAlongCurve(arcBefore), { x: 1, y: 0 });
  assert(!hasSphericalMidpoint(before));

  for (const state of arcStates) {
    const frame = paintAt(scene, state),
      arc = frame.curves[1];
    const progress = state.cues['slerp-b2-1'].progress;
    assert.equal(arc.progress, progress);
    const tip = pointAlongCurve(arc);
    const angle = Math.atan2(tip.y, tip.x);
    assert(
      Math.abs(angle - (progress * Math.PI) / 3) < 0.001,
      `visible arc angle ${angle} follows fraction ${progress} of the 60-degree sweep`,
    );
    if (Math.abs(progress - 0.5) < 1e-9) {
      const chordY = Math.sqrt(3) * (1 - tip.x);
      assert(
        tip.y - chordY > 0.25,
        'the measured midpoint visibly bends away from the linear chord',
      );
      assert(
        !hasSphericalMidpoint(frame),
        'the unit-norm marker waits until its spoken midpoint clause',
      );
    }
  }

  const atCueEnd = paintAt(scene, arcEndState),
    fullArc = atCueEnd.curves[1],
    endpoint = pointAlongCurve(fullArc);
  assert.equal(fullArc.progress, 1);
  assert(Math.abs(endpoint.x - 0.5) < 1e-9);
  assert(Math.abs(endpoint.y - Math.sqrt(3) / 2) < 1e-9);
  assert(!hasSphericalMidpoint(atCueEnd));

  const [beforeMidpointCueState, midpointCueState, endMidpointCueState] = sphericalMidpointStates;
  const beforeMidpointCue = paintAt(scene, beforeMidpointCueState);
  assert.equal(beforeMidpointCueState.cues['slerp-b2-2'].progress, 0);
  assert(!hasSphericalMidpoint(beforeMidpointCue));
  const hiddenTarget = beforeMidpointCue.targets.find(
    (target) => target.id === 'spherical-midpoint',
  );
  assert(hiddenTarget);
  assert.equal(hiddenTarget.labels.length, 0);
  assert.equal(hiddenTarget.scatters.length, 0);

  const duringMidpointCue = paintAt(scene, midpointCueState);
  assert(Math.abs(midpointCueState.cues['slerp-b2-2'].progress - 0.5) < 1e-9);
  assert(hasSphericalMidpoint(duringMidpointCue));
  const visibleTarget = duringMidpointCue.targets.find(
    (target) => target.id === 'spherical-midpoint',
  );
  assert(visibleTarget);
  assert(
    visibleTarget.labels.some(
      (label) => label.startsWith('Fixed spherical midpoint') && label.includes('norm 1.00'),
    ),
  );
  assert.equal(visibleTarget.fades.length, 1);
  assert(
    Math.abs(visibleTarget.fades[0] - midpointCueState.cues['slerp-b2-2'].progress) < 1e-9,
    'the midpoint reveal follows provider cue progress, independent of absolute audio timing',
  );
  assert(
    visibleTarget.scatters.some((scatter) =>
      scatter.points.some(
        (point) =>
          Math.abs(point.x - sphereMidpoints().spherical[0]) < 1e-9 &&
          Math.abs(point.y - sphereMidpoints().spherical[1]) < 1e-9,
      ),
    ),
  );

  const afterMidpointCue = paintAt(scene, endMidpointCueState);
  assert.equal(endMidpointCueState.cues['slerp-b2-2'].progress, 1);
  assert(hasSphericalMidpoint(afterMidpointCue));
  const completedTarget = afterMidpointCue.targets.find(
    (target) => target.id === 'spherical-midpoint',
  );
  assert(
    completedTarget.labels.some(
      (label) => label.startsWith('Fixed spherical midpoint') && label.includes('norm 1.00'),
    ),
  );
  assert(
    Math.abs(completedTarget.fades[0] - endMidpointCueState.cues['slerp-b2-2'].progress) < 1e-9,
  );
});
