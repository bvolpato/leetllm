import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import * as moderation from '../animations/design-real-time-content-moderation-system.mjs';
import { drawFrame } from '../lib/scene.mjs';

const cue = (phase = 'after', progress = 1) => ({ phase, progress, strength: 0 });
const paint = (scene, state) =>
  drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    {},
    { id: scene, title: scene },
    { opacity: 1, t: 1, duration: 60, ...state },
    moderation.draw,
  );

test('the controller combines all completed category results and retains both reasons', () => {
  for (const beatP of [0.7, 0.99]) {
    const frame = paint('categories', {
      beat: 0,
      beatP,
      cues: { 'category-controller-precedence': cue() },
    });
    assert(frame.labels.some((label) => label.text === 'Violence → BLOCK'));
    assert(frame.labels.some((label) => label.text === 'Spam → REVIEW'));
    assert(
      frame.labels.some((label) => label.text === '6 / 6 checked · BLOCK outranks REVIEW → BLOCK'),
    );
  }
});

test('the controller waits for both the measured operation and every required category', () => {
  const before = paint('categories', {
    beat: 0,
    beatP: 0.99,
    cues: { 'category-controller-precedence': cue('before', 0) },
  });
  assert(!before.labels.some((label) => label.text.includes('BLOCK outranks REVIEW → BLOCK')));
  const incomplete = paint('categories', {
    beat: 0,
    beatP: 0.1,
    cues: { 'category-controller-precedence': cue() },
  });
  assert(!incomplete.labels.some((label) => label.text.includes('BLOCK outranks REVIEW → BLOCK')));
});

test('sensitive admission follows the immutable trusted intake rather than model agreement or caller flags', () => {
  const admitted = moderation.sensitiveAdmission({ id: 'SR17', modelAgreement: false });
  assert.equal(admitted.admitted, true);
  assert.equal(admitted.workflow, 'S3 sensitive-review');
  assert.equal(admitted.modelAgreement, false);
  assert.equal(
    moderation.sensitiveAdmission({
      id: 'unknown',
      trusted: true,
      authorized: true,
      modelAgreement: true,
    }).admitted,
    false,
  );
});

test('the sensitive-report clause targets its own request, trusted gate, and retained admission receipt', () => {
  const frame = paint('surfaces', {
    beat: 1,
    beatP: 0.99,
    cues: {
      'surfaces-beat-2-focus-2': cue(),
      'trusted-report-intake': cue(),
      'model-independent-review': cue(),
    },
  });
  assert(frame.labels.some((label) => label.text.includes('SR17 · admitted')));
  assert(
    frame.labels.some(
      (label) => label.text === 'Model agreement: false · trusted workflow admits SR17',
    ),
  );
  for (const id of ['sensitive-report', 'sensitive-intake-gate', 'sensitive-review-receipt']) {
    assert(frame.targets.some((target) => target.id === id && target.markCounts.shapes > 0));
  }
});
