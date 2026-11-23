import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { readLesson, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { loadMeasuredTimeline } from './helpers/measured-narration.mjs';

const model = await import(
  process.env.VAE_ANIMATION
    ? pathToFileURL(process.env.VAE_ANIMATION).href
    : new URL('../animations/vae.mjs', import.meta.url).href
);

registerLessonFonts();
const cue = (progress) => ({
  progress,
  reveal: progress,
  phase: progress === 0 ? 'before' : progress === 1 ? 'after' : 'during',
  active: false,
  strength: 0,
  targets: [],
});
function paint(id, beat, cues) {
  const canvas = createCanvas(1920, 1080),
    ctx = canvas.getContext('2d');
  cues = { 'standard-deviation-transform-b3-1': cue(0), ...cues };
  const audit = drawFrame(
    ctx,
    {},
    { id, title: 'What survives two numbers?' },
    { beat, beatP: 0.95, t: 15, duration: 30, opacity: 1, cueTiming: 'provider-words', cues },
    model.draw,
  );
  assert.deepEqual([...audit.issues, ...layoutIssues(audit)], []);
  return {
    ...audit,
    pixels: (x, y, width, height) =>
      createHash('sha256')
        .update(ctx.getImageData(x, y, width, height).data)
        .digest('hex'),
  };
}

test('the candidate code stays unknown through the actual pixel-exchange prediction', () => {
  const frame = paint('bottleneck', 2, {
    'pixel-exchange': cue(1),
    'candidate-code': cue(1),
    'equal-code': cue(0),
  });
  const candidate = frame.labels.filter(
    (label) => label.x > 850 && label.x < 1650 && label.y > 600 && label.y < 760,
  );
  assert(
    candidate.some((label) => /\?/.test(label.text)),
    'The candidate pair must remain unknown throughout the prediction pause',
  );
  assert(
    !candidate.some((label) => /0\.8875|0\.170/.test(label.text)),
    'The candidate answer must be withheld',
  );
  const beforeReveal = paint('bottleneck', 3, {
    'equal-code': cue(0),
    'same-reconstruction': cue(0),
  });
  assert(!beforeReveal.labels.some((label) => label.text === 'equal code → equal reconstruction'));
  const afterDecode = paint('bottleneck', 3, {
    'equal-code': cue(1),
    'same-reconstruction': cue(1),
  });
  assert(afterDecode.labels.some((label) => label.text === 'equal code → equal reconstruction'));
});

test('a new input selection changes the actual posterior cloud pixels', () => {
  const first = paint('posterior', 1, { 'posterior-other': cue(0) });
  const second = paint('posterior', 1, { 'posterior-other': cue(1) });
  assert.notEqual(
    first.pixels(1090, 375, 650, 400),
    second.pixels(1090, 375, 650, 400),
    'Selecting the lower crop must move its posterior',
  );
});

test('VQ backward paths build their gradient receipts instead of holding the nearest-code plot', () => {
  const before = paint('codes', 1, {
    'vq-reconstruction-path': cue(0),
    'vq-codebook-path': cue(0),
    'vq-commitment-path': cue(0),
  });
  const after = paint('codes', 1, {
    'vq-reconstruction-path': cue(1),
    'vq-codebook-path': cue(1),
    'vq-commitment-path': cue(1),
  });
  assert.notEqual(
    before.pixels(850, 350, 920, 565),
    after.pixels(850, 350, 920, 565),
    'Backward work must change the painted destinations',
  );
  assert(after.labels.some((label) => label.text === 'entry 1 → [0.664, -0.06]'));
  assert(after.labels.some((label) => label.text === 'combined encoder step → [0.7015, -0.0825]'));
});

test('the encoder constructs both averages and the exchanged image preserves them', () => {
  const partial = model.bottleneckFrame(0, 0, { 'center-add': cue(0.5), 'center-mean': cue(0) });
  assert.equal(partial.centerCount, 2);
  assert.equal(partial.centerSum, 0.85 + 0.88);
  assert.equal(partial.centerReady, false);
  const built = model.bottleneckFrame(1, 0, { 'lower-add': cue(1) });
  assert(built.centerReady && built.lowerReady);
  model
    .encode(built.values)
    .forEach((value, i) => assert(Math.abs(value - [0.8875, 0.17][i]) < 1e-12));
  for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
    const predicting = model.bottleneckFrame(2, 0, {
      'pixel-exchange': cue(progress),
      'equal-code': cue(0),
    });
    predicting.candidateCode.forEach((value, i) =>
      assert(Math.abs(value - predicting.originalCode[i]) < 1e-12),
    );
    assert.equal(predicting.candidateReady, false);
  }
  assert(model.bottleneckFrame(3, 0, { 'equal-code': cue(1) }).candidateReady);
});

test('the pixel error proceeds through subtraction, square, sum and mean', () => {
  const subtract = model.reconstructionFrame(0, 0, {
    'pixel-subtract': cue(1),
    'pixel-square': cue(0),
  });
  assert(subtract.differenceReady && !subtract.squareReady);
  assert(Math.abs(subtract.differences[6] + 0.1175) < 1e-12);
  assert(Math.abs(subtract.errors[6] - 0.01380625) < 1e-12);
  const partial = model.reconstructionFrame(1, 0, { 'error-sum': cue(0.5), 'error-mean': cue(0) });
  assert.equal(partial.count, 12);
  assert.equal(partial.meanReady, false);
  assert.equal(
    partial.sum,
    partial.errors.slice(0, 12).reduce((sum, value) => sum + value, 0),
  );
  const complete = model.reconstructionFrame(1, 0, { 'error-sum': cue(1), 'error-mean': cue(1) });
  assert.equal(complete.count, 25);
  assert(complete.meanReady);
  assert.equal(complete.mean, complete.sum / 25);
  const unknown = paint('reconstruction', 1, { 'error-sum': cue(0.5), 'error-mean': cue(0) });
  const known = paint('reconstruction', 1, { 'error-sum': cue(1), 'error-mean': cue(1) });
  assert(unknown.labels.some((label) => label.text === 'MSE = sum / 25 = ?'));
  assert(known.labels.some((label) => label.text === 'MSE = sum / 25 ≈ 0.0027'));
  assert.notEqual(unknown.pixels(1235, 350, 610, 595), known.pixels(1235, 350, 610, 595));
});

test('the code intervention changes the decoder output and its actual reconstruction error', () => {
  const frame = model.codeSwapFrame();
  assert.deepEqual(model.encode(model.probePixels), frame.replacementCode);
  assert.deepEqual(model.decodeCode(frame.replacementCode), frame.changedOutput);
  const independentlyScored =
    frame.changedOutput.reduce((sum, value, i) => sum + (value - model.PIXELS[i]) ** 2, 0) / 25;
  assert.equal(independentlyScored, frame.changedMSE);
  assert(frame.changedMSE > frame.originalMSE * 20);
});

test('posterior scale is the exponential of half log variance throughout the measured construction', () => {
  for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
    const frame = model.posteriorFrame(2, 0, {
      'posterior-return': cue(1),
      'posterior-scale': cue(progress),
    });
    frame.scale.forEach((value, i) => assert.equal(value, Math.exp(frame.logVariance[i] / 2)));
  }
  const ready = model.posteriorFrame(2, 0, {
    'posterior-return': cue(1),
    'posterior-scale': cue(1),
  });
  assert.deepEqual(ready.mean, [0.4, -0.2]);
  assert.deepEqual(ready.logVariance, [-0.7, 0.1]);
});

test('the three VQ gradient routes match independent loss derivatives and leave unselected entries fixed', () => {
  const f = model.vqGradientSnapshot(),
    h = 1e-6;
  const derivative = (fn, values) =>
    values.map((_, i) => {
      const lo = [...values],
        hi = [...values];
      lo[i] -= h;
      hi[i] += h;
      return (fn(hi) - fn(lo)) / (2 * h);
    });
  const close = (actual, expected) =>
    actual.forEach((value, i) => assert(Math.abs(value - expected[i]) < 1e-9));
  close(
    f.reconstructionGradient,
    derivative(
      (values) =>
        0.5 * values.reduce((sum, value, i) => sum + (value * f.theta[i] - f.target[i]) ** 2, 0),
      f.entry,
    ),
  );
  close(
    f.decoderGradient,
    derivative(
      (values) =>
        0.5 * values.reduce((sum, value, i) => sum + (f.entry[i] * value - f.target[i]) ** 2, 0),
      f.theta,
    ),
  );
  close(
    f.codebookGradient,
    derivative(
      (values) => values.reduce((sum, value, i) => sum + (f.encoder[i] - value) ** 2, 0),
      f.entry,
    ),
  );
  close(
    f.commitmentGradient,
    derivative(
      (values) =>
        f.commitmentWeight * values.reduce((sum, value, i) => sum + (value - f.entry[i]) ** 2, 0),
      f.encoder,
    ),
  );
  assert.deepEqual(f.nextCodebook[0], [-0.8, 0.2]);
  assert.deepEqual(f.nextCodebook[2], [0.1, 0.9]);
  close(f.nextEncoder, [0.7015, -0.0825]);
  close(f.nextEntry, [0.664, -0.06]);
});

test('measured clauses preserve the bottleneck prediction and earn the mean and VQ updates', async () => {
  const lesson = await readLesson(
    new URL('../lessons/vae.lesson.yaml', import.meta.url),
    new URL('../../', import.meta.url).pathname,
  );
  const measured = await loadMeasuredTimeline('vae');
  function sceneFrame(id, timeFor) {
    const index = lesson.scenes.findIndex((scene) => scene.id === id),
      scene = lesson.scenes[index];
    const timing = measured.scenes.find((scene) => scene.id === id);
    const visualCues = resolveSceneCues(scene, timing),
      time = timeFor(timing, visualCues);
    const canvas = createCanvas(1920, 1080);
    const frame = drawFrame(
      canvas.getContext('2d'),
      lesson,
      scene,
      frameState(
        { ...timing, visualCues, cueTiming: 'provider-words' },
        time,
        index,
        lesson.scenes.length,
      ),
      model.draw,
    );
    assert.deepEqual([...frame.issues, ...layoutIssues(frame)], []);
    return frame.labels.map((label) => label.text);
  }
  const predicting = sceneFrame('bottleneck', (timing) => timing.beats[2].until - 0.05);
  assert(predicting.includes('[ ?, ? ]'));
  const meanPending = sceneFrame(
    'reconstruction',
    (_, cues) => cues.find((cue) => cue.id === 'error-mean').start - 0.02,
  );
  assert(meanPending.includes('MSE = sum / 25 = ?'));
  const meanReady = sceneFrame(
    'reconstruction',
    (_, cues) => cues.find((cue) => cue.id === 'error-mean').end + 0.05,
  );
  assert(meanReady.includes('MSE = sum / 25 ≈ 0.0027'));
  const entryPending = sceneFrame(
    'codes',
    (_, cues) => cues.find((cue) => cue.id === 'vq-codebook-path').start - 0.02,
  );
  assert(!entryPending.includes('entry 1 → [0.664, -0.06]'));
  const entryReady = sceneFrame(
    'codes',
    (_, cues) => cues.find((cue) => cue.id === 'vq-codebook-path').end + 0.05,
  );
  assert(entryReady.includes('entry 1 → [0.664, -0.06]'));
});
