import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import * as model from '../animations/logistic-regression.mjs';
import { readLesson, frameState } from '../lib/lesson.mjs';
import { drawFrame, C } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { loadMeasuredTimeline } from './helpers/measured-narration.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
registerLessonFonts();
async function fixture(id) {
  const lesson = await readLesson(root + '/videos/lessons/logistic-regression.lesson.yaml', root),
    index = lesson.scenes.findIndex((s) => s.id === id),
    scene = lesson.scenes[index];
  assert(scene, id);
  const measured = (await loadMeasuredTimeline('logistic-regression')).scenes.find(
    (s) => s.id === id,
  );
  assert(measured, id + ' needs measured narration');
  const timing = {
    ...measured,
    visualCues: resolveSceneCues(scene, measured),
    cueTiming: 'provider-words',
  };
  const paint = (t) => {
    const canvas = createCanvas(1920, 1080),
      state = frameState(timing, t, index, lesson.scenes.length),
      audit = drawFrame(canvas.getContext('2d'), lesson, scene, state, model.draw);
    assert.deepEqual([...audit.issues, ...layoutIssues(audit)], [], id + ' at ' + t);
    return { ...audit, canvas, state };
  };
  const at = (cueId, p) => {
    const cue = timing.visualCues.find((c) => c.id === cueId);
    assert(cue, cueId);
    return paint(cue.start + p * (cue.end - cue.start));
  };
  const after = (cueId) => {
    const cue = timing.visualCues.find((c) => c.id === cueId);
    return paint(Math.min(timing.duration - 0.1, cue.end + cue.linger + 0.12));
  };
  return { paint, at, after, timing };
}
const text = (frame, value) => frame.labels.some((l) => l.text === value && l.alpha > 0.9);
const caseLabels = (frame) => frame.labels.filter((l) => /^V[1-8]$/.test(l.text) && l.alpha > 0.9);
const casePosition = (frame, id) => {
  const labels = caseLabels(frame).filter((l) => l.text === id);
  assert.equal(labels.length, 1, id + ' retains one painted identity');
  return { x: labels[0].x + labels[0].width / 2, y: labels[0].y + labels[0].height / 2 };
};

test('actual validation request actors route before counts and keep their outcomes through the threshold change', async () => {
  const f = await fixture('confusion'),
    before = f.at('route-validation', -0.01),
    moving = f.at('route-validation', 0.5),
    held = f.after('route-validation');
  assert.equal(caseLabels(before).length, 8);
  assert.equal(caseLabels(moving).length, 8);
  assert.equal(caseLabels(held).length, 8);
  for (const id of ['V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8'])
    assert(
      casePosition(held, id).y - casePosition(before, id).y > 200,
      id + ' physically enters a cell',
    );
  assert(text(before, 'TP = 0'));
  assert(text(held, 'TP = 2'));
  assert(text(held, 'FN = 2'));
  const low = f.after('threshold-sweep-b2-2');
  assert(text(low, 'TP = 4'));
  assert(text(low, 'FP = 2'));
  assert(text(low, 'FN = 0'));
  assert(text(low, 'TN = 2'));
  assert(
    casePosition(low, 'V4').y < casePosition(held, 'V4').y - 200,
    'routine V4 moves from TN into FP',
  );
  assert(
    casePosition(low, 'V3').y < casePosition(held, 'V3').y - 200,
    'required V3 moves from FN into TP',
  );
  const pos = caseLabels(low).map((l) => ({ x: l.x + l.width / 2, y: l.y + l.height / 2 }));
  for (let i = 0; i < pos.length; i++)
    for (let j = i + 1; j < pos.length; j++)
      assert(Math.hypot(pos[i].x - pos[j].x, pos[i].y - pos[j].y) > 60);
});

test('sigmoid difference receipts follow completed center and tail constructions', async () => {
  const f = await fixture('sigmoid');
  assert(!text(f.at('sigmoid-center', -0.01), 'center: probability +0.462'));
  assert(text(f.after('sigmoid-center'), 'center: probability +0.462'));
  assert(!text(f.at('sigmoid-tail', -0.01), 'tail: probability +0.016'));
  assert(text(f.after('sigmoid-tail'), 'tail: probability +0.016'));
  const defined = f.after('logit-definition');
  assert(text(defined, 'z = ln[p/(1 − p)]'));
});

test('the batch mean and first coefficient update wait for their actual spoken constructions', async () => {
  const f = await fixture('batch-gradient'),
    before = f.at('collect-batch', -0.01),
    collected = f.after('collect-batch');
  assert(text(before, '0 / 8 collected'));
  assert(text(collected, '8 / 8 collected'));
  assert(
    text(f.at('collect-batch', 0.49), '4 / 8 collected'),
    'every arrived row is already included in the sum',
  );
  const pre = f.at('first-update', -0.01),
    held = f.after('first-update');
  assert(!text(pre, '0.06875'));
  assert(text(held, '0.06875'));
  assert(text(held, '0.07500'));
  assert.equal(model.learningConstruction(0.7).completed, 8);
});

test('calibration outcome covers prevent a completed observed frequency before later labels arrive', async () => {
  const f = await fixture('calibration'),
    before = f.at('calibration-outcomes', -0.01),
    after = f.after('calibration-outcomes');
  const circles = (frame) =>
    frame.shapes.filter((s) => s.kind === 'circle' && Math.abs(s.width - 56) < 0.1);
  const painted = (frame, shape, color) => {
    const actual = frame.canvas
        .getContext('2d')
        .getImageData(Math.round(shape.x + shape.width / 2), Math.round(shape.y + 7), 1, 1).data,
      expected = color
        .slice(1)
        .match(/../g)
        .map((v) => parseInt(v, 16));
    return expected.every((v, i) => Math.abs(v - actual[i]) < 3);
  };
  assert.equal(circles(before).length, 8);
  assert(circles(before).every((s) => painted(before, s, C.panel)));
  assert.equal(circles(after).filter((s) => painted(after, s, C.pink)).length, 4);
  assert.equal(circles(after).filter((s) => painted(after, s, C.blue)).length, 4);
  assert(text(after, '1 / 3'));
  assert(text(after, '1 / 2'));
  assert(!text(before, '1 / 3'));
  assert(!text(before, '1 / 2'));
  const changed = f.after('calibration-one-label');
  assert(text(changed, 'observed 2 / 2'));
});

test('the waiting request reaches review before its later label and the held error receipt', async () => {
  const f = await fixture('decision'),
    before = f.at('final-route', -0.01),
    moving = f.at('final-route', 0.5),
    routed = f.after('final-route'),
    outcome = f.after('final-outcome');
  for (const frame of [before, moving, routed, outcome]) assert(text(frame, 'Change team access'));
  const x = (frame) => frame.labels.find((l) => l.text === 'Change team access').x;
  assert(x(moving) > x(before) + 100);
  assert(x(routed) > x(before) + 800);
  assert(text(routed, 'outcome: pending'));
  assert(!text(routed, 'Unnecessary review · $18'));
  assert(text(outcome, 'outcome: routine'));
  assert(text(outcome, 'Unnecessary review · $18'));
  const beforeMiss = f.at('final-miss', -0.01);
  const afterMiss = f.after('final-miss');
  assert(!text(beforeMiss, '$120'));
  assert(text(afterMiss, '$120'));
  assert(!text(afterMiss, '$18'));
  assert(text(f.after('final-extra'), '$18'));
  const held = f.paint(f.timing.beats.at(-1).until - 0.1);
  assert(text(held, 'outcome: routine'));
  assert(text(held, 'Validation candidate: 4 reviews · $138 · capacity 4'));
});

test('the policy, pair and stable-loss arithmetic preserve their worked invariants', () => {
  assert.equal(model.validateModel(), true);
  assert.deepEqual(
    model.policies.map((p) => [p.queue, p.cost]),
    [
      [2, 240],
      [4, 138],
      [6, 36],
    ],
  );
  assert.equal(
    model.pairEvidence.reduce((n, p) => n + p.win, 0),
    13,
  );
  assert.equal(model.logLoss(-1000, 1), 1000);
  assert(model.openingRequest.p > 0.62 && model.openingRequest.p < 0.63);
  const first = model.learningConstruction(1);
  first.weights.forEach((v, i) => assert(Math.abs(v - [0, 0.06875, 0.075][i]) < 1e-12));
});

test('the painted review half-plane starts at the true threshold intersection', async () => {
  const f = await fixture('boundary'),
    frame = f.paint(2),
    ctx = frame.canvas.getContext('2d');
  const pixel = (a, s) =>
    [
      ...ctx.getImageData(
        Math.round(260 + ((a - 0.5) / 4.5) * 1000),
        Math.round(345 + 460 - (s / 9) * 460),
        1,
        1,
      ).data,
    ].slice(0, 3);
  const outside = pixel(1, 0.2),
    inside = pixel(2.5, 0.2);
  assert(inside[0] - outside[0] > 15, 'yellow review shading begins on the classified side');
  for (const t of [0.5, 0.2])
    for (const { x, y } of model.reviewRegionVertices(model.fittedWeights, t))
      assert(
        model.sigmoid(
          model.fittedWeights[0] + model.fittedWeights[1] * x + model.fittedWeights[2] * y,
        ) >=
          t - 1e-12,
      );
});

test('the worked row products wait for their spoken multiplication', async () => {
  const f = await fixture('gradient'),
    before = f.at('worked-row-gradient', -0.01),
    held = f.after('worked-row-gradient');
  assert(!before.labels.some((m) => m.text === '-0.5\\times3.5=-1.75'));
  assert(held.labels.some((m) => m.text === '-0.5\\times3.5=-1.75'));
});
