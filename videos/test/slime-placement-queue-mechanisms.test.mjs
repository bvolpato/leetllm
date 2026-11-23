import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import * as animation from '../animations/deep-dive-slime.mjs';
import { readLesson } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { compareMotionRegion } from '../lib/motion-audit.mjs';

const root = new URL('../../', import.meta.url).pathname;
registerLessonFonts();
const lesson = await readLesson(root + 'videos/lessons/deep-dive-slime.lesson.yaml', root);
const cue = (progress) => ({
  phase: progress === 1 ? 'after' : progress > 0 ? 'during' : 'before',
  progress,
  strength: 0,
  reveal: 1,
});
function state(sceneId, beat, overrides = {}) {
  const scene = lesson.scenes.find((s) => s.id === sceneId);
  const cues = Object.fromEntries(
    scene.beats.flatMap((b, i) =>
      b.visual_cues.map((c) => [c.id, { ...c, ...cue(i < beat ? 1 : 0) }]),
    ),
  );
  for (const [id, progress] of Object.entries(overrides))
    cues[id] = { ...cues[id], ...cue(progress) };
  return { beat, beatP: 0.01, t: 0, opacity: 1, cues, cueTiming: 'provider-words' };
}
function paint(sceneId, s) {
  const canvas = createCanvas(1920, 1080),
    ctx = canvas.getContext('2d');
  const audit = drawFrame(
    ctx,
    lesson,
    lesson.scenes.find((scene) => scene.id === sceneId),
    s,
    animation.draw,
  );
  const rgba = ctx.getImageData(0, 0, 1920, 1080).data,
    data = new Uint8Array(1920 * 1080 * 3);
  for (let i = 0, j = 0; i < rgba.length; i += 4) {
    data[j++] = rgba[i];
    data[j++] = rgba[i + 1];
    data[j++] = rgba[i + 2];
  }
  return { audit, frame: { width: 1920, height: 1080, data } };
}

test('decoupled placement paints two independently bounded devices and overlapping work', () => {
  const s = state('placement', 2, { 'placement-overlap': 0.5 });
  const model = animation.sampleModel('placement', s),
    { audit } = paint('placement', s);
  assert(audit.labels.some((l) => l.text === 'Used 12 / 16 GiB'));
  assert(audit.labels.some((l) => l.text === 'Used 10 / 16 GiB'));
  assert.equal(model.devices.length, 2);
  assert(model.devices.every((d) => d.resident <= d.capacity && d.fits));
  assert.equal(
    model.devices.reduce((n, d) => n + d.resident, 0),
    22,
  );
  assert.equal(model.overlapProgress, 0.5);
  assert(model.intervals.every((i) => i.start === 0 && i.end === 0.5));
  const before = paint('placement', state('placement', 2, { 'placement-overlap': 0 }));
  assert(
    compareMotionRegion(before.frame, paint('placement', s).frame, {
      region: [150, 715, 1600, 235],
      minimumChangedFraction: 0.002,
    }).passed,
  );
});

test('the same G4 and G5 cards travel from running to queued and keep every identity', () => {
  const cases = [
    [0, 0, ['G1', 'G2', 'G3'], ['G4', 'G5']],
    [0.5, 0, ['G1', 'G2', 'G3'], ['G4', 'G5']],
    [1, 0, ['G1', 'G2', 'G3', 'G4'], ['G5']],
    [1, 1, ['G1', 'G2', 'G3', 'G4', 'G5'], []],
  ];
  const positions = [];
  for (const [first, second, queued, running] of cases) {
    const s = state('queue', 1, {
      'queue-first-completion': first,
      'queue-second-completion': second,
    });
    const model = animation.sampleModel('queue', s),
      { audit } = paint('queue', s);
    assert.deepEqual(model.queued, queued);
    assert.deepEqual(model.runningIds, running);
    assert.equal(model.running, running.length);
    assert.equal(model.submitted, 5);
    assert.equal(new Set([...model.queued, ...model.runningIds]).size, 5);
    assert.equal(model.launch, queued.length < 4);
    const labels = audit.labels.filter((l) => /^G[1-5]$/.test(l.text));
    assert.deepEqual(labels.map((l) => l.text).sort(), ['G1', 'G2', 'G3', 'G4', 'G5']);
    positions.push(labels.find((l) => l.text === 'G4').y);
  }
  assert(positions[0] > positions[1] && positions[1] > positions[2]);
  assert.equal(positions[2], positions[3]);
});

test('completed groups move in the declared region without focus animation and stay queued', () => {
  const before = paint('queue', state('queue', 1));
  const completed = paint(
    'queue',
    state('queue', 1, { 'queue-first-completion': 1, 'queue-second-completion': 1 }),
  );
  const declaration = lesson.scenes.find((s) => s.id === 'queue').beats[1].motion_check;
  assert(compareMotionRegion(before.frame, completed.frame, declaration).passed);
  for (const beatP of [0.01, 0.5, 0.99]) {
    const s = { ...state('queue', 2), beatP },
      model = animation.sampleModel('queue', s);
    assert.deepEqual(model.queued, ['G1', 'G2', 'G3', 'G4', 'G5']);
    assert.deepEqual(model.runningIds, []);
  }
  animation.validateModel();
});
