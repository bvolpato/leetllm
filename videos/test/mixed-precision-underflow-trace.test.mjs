import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { fileURLToPath } from 'node:url';
import { draw, underflowTraceSnapshot, fp16 } from '../animations/mixed-precision.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { readLesson, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { loadMeasuredTimeline } from './helpers/measured-narration.mjs';

const before = { phase: 'before', progress: 0 };
const after = { phase: 'after', progress: 1 };

test('the format model preserves infinity through later arithmetic instead of turning it into NaN', () => {
  assert.equal(fp16(40000 + 40000), Infinity);
  assert.equal(fp16(fp16(40000 + 40000) - 40000), Infinity);
  assert.equal(fp16(-Infinity), -Infinity);
  assert(Number.isNaN(fp16(NaN)));
});

test('the same small gradient survives scaling and unscaling while forward rounding stays separate', () => {
  const prediction = underflowTraceSnapshot({ beat: 0, cues: { 'tiny-gradient': before } });
  assert.equal(prediction.zeroProgress, 0);
  assert.equal(prediction.gradient, 2 ** -26);
  assert.equal(prediction.forwardStored, 1);

  const zero = underflowTraceSnapshot({ beat: 0, cues: { 'tiny-gradient': after } });
  assert.equal(zero.zeroProgress, 1);
  const scaling = underflowTraceSnapshot({
    beat: 1,
    cues: {
      'scale-gradient': { phase: 'during', progress: 0.5 },
      'scaled-storage': before,
    },
  });
  assert.equal(scaling.scaledExponent, -22);
  assert.equal(scaling.storedProgress, 0);
  const stored = underflowTraceSnapshot({
    beat: 1,
    cues: {
      'scale-gradient': after,
      'scaled-storage': after,
    },
  });
  assert.equal(stored.stored, 2 ** -18);
  assert.equal(stored.recovered, 2 ** -26);
  assert.equal(stored.storedProgress, 1);

  const restored = underflowTraceSnapshot({
    beat: 2,
    cues: {
      'unscale-gradient': after,
      'recovered-gradient': after,
      'forward-rounding': after,
    },
  });
  assert.equal(restored.scaledExponent, -18);
  assert.equal(restored.unscaleProgress, 1);
  assert.equal(restored.recoveredProgress, 1);
  assert.equal(restored.forwardProgress, 1);
  assert.equal(restored.recovered, restored.gradient);
  assert.equal(restored.forwardInput, 1.0001);
  assert.equal(restored.forwardStored, 1);
});

test('the measured scaling path crosses the half-step boundary without crossing its label', async () => {
  registerLessonFonts();
  const root = fileURLToPath(new URL('../../', import.meta.url));
  const lesson = await readLesson(
    new URL('../lessons/mixed-precision.lesson.yaml', import.meta.url),
    root,
  );
  const index = lesson.scenes.findIndex((scene) => scene.id === 'transfer'),
    scene = lesson.scenes[index];
  const measured = (await loadMeasuredTimeline('mixed-precision')).scenes[0];
  const timing = {
    ...measured,
    visualCues: resolveSceneCues(scene, measured),
    cueTiming: 'provider-words',
  };
  const scaling = timing.visualCues.find((cue) => cue.id === 'scale-gradient');
  const canvas = createCanvas(1920, 1080);
  const times = [12.3, scaling.start - 0.04, scaling.end + scaling.linger + 0.04];
  for (
    let frame = Math.ceil(scaling.start * timing.fps);
    frame <= Math.ceil((scaling.end + scaling.linger) * timing.fps);
    frame++
  ) {
    times.push(frame / timing.fps);
  }
  for (const time of times) {
    const state = frameState(timing, time, index, lesson.scenes.length);
    const audit = drawFrame(canvas.getContext('2d'), lesson, scene, state, draw);
    assert.deepEqual(layoutIssues(audit), [], `measured scaling path at ${time}s`);
    const label = audit.labels.find((label) => label.text === 'half-step threshold');
    const threshold = audit.targets.find((target) => target.id === 'underflow-threshold');
    const arrow = audit.connectors.find((connector) => connector.kind === 'arrow');
    assert(
      label?.alpha > 0.25 && threshold?.markCounts.connectors > 0,
      'the threshold and its readable label remain painted',
    );
    const progress = underflowTraceSnapshot(state).scaleProgress;
    if (progress > 0) assert(arrow, 'the scaling path remains visible after movement starts');
    if (progress > 0.125) {
      assert(
        arrow.from.x < threshold.x && arrow.to.x > threshold.x,
        'the path visibly crosses the half-step boundary',
      );
    }
  }
});
