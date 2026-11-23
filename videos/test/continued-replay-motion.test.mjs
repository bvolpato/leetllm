import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { draw, replayCueFraction, replayGradient } from '../animations/continued-pretraining.mjs';
import { readLesson, frameState } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { evaluateMotionFrames, MOTION_SAMPLE_PROGRESS } from '../lib/motion-audit.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { loadMeasuredTimeline } from './helpers/measured-narration.mjs';

const root = new URL('../../', import.meta.url).pathname;
const rgb = (rgba) => {
  const data = new Uint8Array(1920 * 1080 * 3);
  for (let i = 0, j = 0; i < rgba.length; i += 4) {
    data[j++] = rgba[i];
    data[j++] = rgba[i + 1];
    data[j++] = rgba[i + 2];
  }
  return { width: 1920, height: 1080, data };
};

test('the declared replay region samples the actual provider-cued mixture movement', async () => {
  registerLessonFonts();
  const lesson = await readLesson(root + 'videos/lessons/continued-pretraining.lesson.yaml', root);
  const scene = lesson.scenes.find((scene) => scene.id === 'replay');
  const timing = (await loadMeasuredTimeline(lesson.id)).scenes.find(
    (candidate) => candidate.id === scene.id,
  );
  timing.visualCues = resolveSceneCues(scene, timing);
  timing.cueTiming = 'provider-words';
  const declaredBeat = scene.beats.findIndex((beat) => beat.motion_check);
  const interval = timing.beats[declaredBeat];
  const canvas = createCanvas(1920, 1080),
    ctx = canvas.getContext('2d');
  const markers = [],
    markerFrames = [],
    frozenMarkerFrames = [];
  const [left, top, width, height] = scene.beats[declaredBeat].motion_check.region;
  const markerOnly = (frame, color) => {
    const channels = [1, 3, 5].map((offset) =>
      Number.parseInt(color.slice(offset, offset + 2), 16),
    );
    const data = new Uint8Array(frame.data.length);
    for (let y = top; y < top + height; y++)
      for (let x = left; x < left + width; x++) {
        const offset = (y * frame.width + x) * 3;
        if (channels.every((channel, index) => frame.data[offset + index] === channel))
          data.set(channels, offset);
      }
    return { ...frame, data };
  };
  const frames = MOTION_SAMPLE_PROGRESS.map((progress) => {
    const state = frameState(
      timing,
      interval.start + progress * (interval.until - interval.start),
      5,
      lesson.scenes.length,
    );
    state.opacity = 1;
    state.cues = Object.fromEntries(
      Object.entries(state.cues).map(([id, cue]) => [id, { ...cue, strength: 0 }]),
    );
    const marker = [];
    let markerColor;
    drawFrame(ctx, lesson, scene, state, (ctx, scene, state, api) =>
      draw(ctx, scene, state, {
        ...api,
        circle(...args) {
          if (args[4] === api.C.green) {
            marker.push(args.slice(1, 4));
            markerColor = api.C.green;
          }
          return api.circle(...args);
        },
      }),
    );
    assert.equal(marker.length, 1, 'The shared gradient has one painted marker.');
    const [x, y, radius] = marker[0];
    const gradient = -0.5 + 0.25 * state.cues['replay-b2-2'].progress;
    assert(Math.abs(x - (180 + ((gradient + 0.6) / 1.2) * 900)) < 1e-8);
    assert.equal(y, 585);
    markers.push({ x, y, radius });
    const frame = rgb(ctx.getImageData(0, 0, 1920, 1080).data);
    markerFrames.push(markerOnly(frame, markerColor));
    drawFrame(ctx, lesson, scene, state, (ctx, scene, state, api) =>
      draw(ctx, scene, state, {
        ...api,
        circle(...args) {
          if (args[4] === api.C.green) args[1] = markers[0].x;
          return api.circle(...args);
        },
      }),
    );
    frozenMarkerFrames.push(markerOnly(rgb(ctx.getImageData(0, 0, 1920, 1080).data), markerColor));
    return frame;
  });
  assert(markers.at(-1).x > markers[0].x, 'The painted derivative moves as replay is mixed in.');
  for (const { x, y, radius } of markers)
    assert(
      x - radius >= left &&
        x + radius <= left + width &&
        y - radius >= top &&
        y + radius <= top + height,
      'The declared teaching region must contain the actual moving gradient marker.',
    );
  const result = evaluateMotionFrames(frames, scene.beats[declaredBeat].motion_check);
  assert(
    result.passed,
    `Actual mixture marker does not move in the declared region: ${JSON.stringify(result.pairs)}`,
  );
  assert(
    evaluateMotionFrames(markerFrames, scene.beats[declaredBeat].motion_check).passed,
    'The actual green marker pixels must move independently of arrows, text, and focus decoration.',
  );
  assert.equal(
    evaluateMotionFrames(frozenMarkerFrames, scene.beats[declaredBeat].motion_check).passed,
    false,
    'Freezing only the painted mixture marker must fail its native motion check.',
  );
  assert.equal(replayGradient(replayCueFraction(1, 0)), -0.5);
  assert.equal(replayGradient(replayCueFraction(1, 1)), -0.25);
  assert.equal(replayCueFraction(2, 0), 0.25, 'The explanation retains the completed mixture.');
  const completed = frameState(timing, timing.beats[2].start + 1, 5, lesson.scenes.length);
  completed.opacity = 1;
  const ending = drawFrame(ctx, lesson, scene, completed, draw);
  assert(ending.labels.some((label) => label.text === 'controlled input θ₀=0'));
  assert(ending.labels.some((label) => label.text === 'supplied η=1: next θ=0.250'));
});
