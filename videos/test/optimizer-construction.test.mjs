import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { findLabelCollisions } from '../lib/label-collisions.mjs';
const model = await import(
  process.env.OPTIMIZERS_ANIMATION
    ? pathToFileURL(process.env.OPTIMIZERS_ANIMATION).href
    : new URL('../animations/optimizers.mjs', import.meta.url).href
);
registerLessonFonts();
const cue = (progress) => ({
  progress,
  phase: progress === 0 ? 'before' : progress === 1 ? 'after' : 'during',
  strength: 0,
  targets: [],
});
function paint(id, beat, cues = {}) {
  const canvas = createCanvas(1920, 1080),
    ctx = canvas.getContext('2d');
  const audit = drawFrame(
    ctx,
    {},
    { id, title: 'Two wrong numbers' },
    { beat, beatP: 0.5, t: 10, duration: 40, opacity: 1, cues },
    model.draw,
  );
  assert.deepEqual(
    [...audit.issues, ...layoutIssues(audit), ...findLabelCollisions(audit.labels)],
    [],
    id + ' native geometry',
  );
  return {
    ...audit,
    pixels: (x, y, w, h) =>
      createHash('sha256')
        .update(ctx.getImageData(x, y, w, h).data)
        .digest('hex'),
  };
}
const has = (frame, value) => frame.labels.some((label) => label.text === value);
const close = (actual, expected, epsilon = 1e-10) =>
  assert(Math.abs(actual - expected) < epsilon, actual + ' ≈ ' + expected);

test('the article quadratic and independently calculated recipes share an initial state and evaluation budget', () => {
  close(model.loss([2, 3]), 204.5);
  assert.deepEqual(model.gradient([-2, 3]), [-200, 3]);
  for (const kind of ['sgd', 'momentum', 'adam']) {
    let w = [1, 1],
      m = [0, 0],
      v = [0, 0];
    const eta = kind === 'adam' ? 0.08 : 0.018;
    for (let t = 1; t <= 40; t++) {
      const g = [100 * w[0], w[1]];
      m = m.map((x, j) => 0.9 * x + 0.1 * g[j]);
      v = v.map((x, j) => 0.999 * x + 0.001 * g[j] ** 2);
      w = w.map(
        (x, j) =>
          x -
          eta *
            (kind === 'sgd'
              ? g[j]
              : kind === 'momentum'
                ? m[j]
                : m[j] / (1 - 0.9 ** t) / (Math.sqrt(v[j] / (1 - 0.999 ** t)) + 1e-8)),
      );
      close(model.PATHS[kind][t].x, w[0]);
      close(model.PATHS[kind][t].y, w[1]);
    }
  }
  close(model.PATHS.sgd[1].x, -0.8);
  close(model.PATHS.sgd[1].y, 0.982);
});

test('a growing transition retains the completed endpoint loss and counter until the computed state arrives', () => {
  const a = paint('first-step', 1, { 'multiply-gradient': cue(1), 'take-first-step': cue(0.2) });
  const z = paint('first-step', 1, { 'multiply-gradient': cue(1), 'take-first-step': cue(0.8) });
  for (const frame of [a, z]) {
    assert(has(frame, 'Update 0 · loss 50.5'));
    assert.equal(frame.labels.filter((label) => label.text === 'start 1').length, 2);
    assert(!has(frame, 'a = -0.8'));
    assert(!has(frame, 'b = 0.982'));
  }
  assert.notEqual(
    a.pixels(240, 310, 1060, 570),
    z.pixels(240, 310, 1060, 570),
    'the actual parameter arrow grows while the completed receipt holds',
  );
  const arrived = paint('first-step', 1, {
    'multiply-gradient': cue(1),
    'take-first-step': cue(1),
  });
  assert(has(arrived, 'Update 1 · loss 50.5 → 32.4822'));
  assert(has(arrived, 'a = -0.8'));
  assert(has(arrived, 'b = 0.982'));
});

test('the fifth momentum direction opposes the local gradient and increases loss after separately constructed memory pieces', () => {
  const r = model.RUNS.momentum.records[4];
  close(r.before[0], -0.21875264);
  close(r.gradient[0], -21.875264);
  close(0.9 * r.oldMean[0], 17.932032);
  close(0.1 * r.gradient[0], -2.1875264);
  close(r.mean[0], 15.7445056);
  close(r.update[0], -0.2834011008);
  assert(r.loss > model.loss(r.before));
  const pending = paint('momentum', 1, {
    'retain-memory': cue(1),
    'incoming-memory': cue(1),
    'sum-memory': cue(0),
    'momentum-fifth': cue(0),
  });
  assert(has(pending, 'New buffer: ?'));
  assert(!has(pending, 'New buffer: (15.745, 0.406)'));
  assert.equal(
    pending.targets.find((target) => target.id === 'memory-result').markCounts.shapes,
    0,
    'the resultant endpoint remains unpainted during the hold',
  );
  const held = paint('momentum', 1, {
    'retain-memory': cue(1),
    'incoming-memory': cue(1),
    'sum-memory': cue(1),
    'momentum-fifth': cue(1),
  });
  assert(has(held, 'New buffer: (15.745, 0.406)'));
  assert(has(held, 'Completed updates 5  ·  loss ≈ 13.085'));
  assert(held.targets.find((target) => target.id === 'memory-result').markCounts.shapes > 0);
});

test('opposing prescribed gradients reverse RMSProp while Adam retains its positive signed history', () => {
  const second = model.PRESCRIBED[1],
    fourth = model.PRESCRIBED[3];
  close(second.rms[0], 1540);
  close(second.rms[1], 0.18604);
  assert(second.rmsUpdate[0] < 0 && second.adamUpdate[0] > 0);
  assert(fourth.rmsUpdate[0] < 0 && fourth.adamUpdate[0] > 0);
  close(fourth.mean[0], 1.11);
  close(fourth.square[0], 24.85233639);
  assert(fourth.adamUpdate[1] > 24 * fourth.adamUpdate[0]);
});

test('incoming momentum geometry cannot run ahead of its retained contribution', () => {
  const partial = paint('momentum', 1, {
    'retain-memory': cue(0.5),
    'incoming-memory': cue(1),
    'sum-memory': cue(1),
    'momentum-fifth': cue(0),
  });
  assert(has(partial, 'New buffer: ?'));
  assert.equal(partial.labels.filter((label) => label.text === 'pending').length, 1);
  assert.equal(
    partial.targets.find((target) => target.id === 'memory-incoming').markCounts.shapes,
    0,
  );
});

test('zero input, absent gradient and retained moments produce three distinct AdamW continuations', () => {
  const { cold, absent, retained } = model.ZERO_DECAY;
  close(cold.weight, 9.99);
  assert.equal(cold.mean, 0);
  assert.equal(cold.square, 0);
  assert.equal(cold.count, 1);
  assert.equal(absent.weight, 10);
  assert.equal(absent.count, 0);
  assert.equal(absent.skipped, true);
  close(retained.mean, 0.9);
  close(retained.square, 0.0999);
  assert.equal(retained.count, 2);
  assert(retained.dataStep > 0 && retained.weight < cold.weight);
  close(retained.shrink, 0.01);
  const pending = paint('zero-data-decay', 0, {
    'zero-input': cue(1),
    'zero-shrink': cue(1),
    'zero-result': cue(0),
  });
  const unbuilt = paint('zero-data-decay', 0, {
    'zero-input': cue(1),
    'zero-shrink': cue(0),
    'zero-result': cue(0),
  });
  assert(!has(pending, '9.99'));
  assert(has(pending, 'New θ = ?'));
  assert.equal(
    pending.pixels(290, 635, 1370, 80),
    unbuilt.pixels(290, 635, 1370, 80),
    'the result geometry stays held while its operands are spoken',
  );
  const arrived = paint('zero-data-decay', 0, {
    'zero-input': cue(1),
    'zero-shrink': cue(1),
    'zero-result': cue(1),
  });
  assert(has(arrived, '9.99'));
  assert(has(arrived, 'New θ = 9.99 · both moments remain zero'));
  assert.notEqual(pending.pixels(290, 635, 1370, 80), arrived.pixels(290, 635, 1370, 80));
});

test('the fresh weighted,clipped and decayed update holds its final endpoint until the spoken result', () => {
  const f = model.FRESH_RECIPE;
  close(f.weighted, f.gradients.reduce((a, b) => a + b, 0) / f.gradients.length);
  assert.notEqual(f.weighted, f.wrong);
  assert.equal(f.clipped, -3);
  close(f.update.weight, 2.048);
  close(f.update.shrink, 0.002);
  const prediction = paint('fresh-recipe', 0, {
    'fresh-inputs': cue(1),
    'fresh-means': cue(1),
    'fresh-gradient-question': cue(1),
  });
  assert(has(prediction, 'Correctly accumulated mean gradient = ?'));
  assert(!has(prediction, 'Final parameter = 2.048'));
  const pending = paint('fresh-recipe', 2, {
    'fresh-data-step': cue(1),
    'fresh-decay-term': cue(1),
    'fresh-old-weight': cue(1),
    'fresh-final': cue(0),
    'fresh-clock': cue(0),
  });
  assert(has(pending, 'Final parameter = ?'));
  assert(has(pending, 'Completed optimizer updates: 0'));
  assert.equal(pending.targets.find((target) => target.id === 'fresh-final').markCounts.shapes, 0);
  const arrived = paint('fresh-recipe', 2, {
    'fresh-data-step': cue(1),
    'fresh-decay-term': cue(1),
    'fresh-old-weight': cue(1),
    'fresh-final': cue(1),
    'fresh-clock': cue(1),
  });
  assert(has(arrived, 'Final parameter = 2.048'));
  assert(has(arrived, 'Completed optimizer updates: 1'));
  assert(arrived.targets.find((target) => target.id === 'fresh-final').markCounts.shapes > 0);
});

test('zero-rate Adam updates advance the raw buffers and observation weights while corrected estimates agree', () => {
  for (const [i, r] of model.COLD.records.entries()) {
    const t = i + 1;
    assert.deepEqual(r.next, [1, 1]);
    close(r.mean[0], 100 * (1 - 0.9 ** t));
    close(r.square[0], 10000 * (1 - 0.999 ** t));
    close(r.correctedMean[0], 100);
    close(r.correctedMean[1], 1);
    close(r.correctedSquare[0], 10000, 1e-8);
    close(r.correctedSquare[1], 1);
  }
  const held = paint('adam-buffers', 2, { 'cold-start-check': cue(1) });
  assert(has(held, 'Completed updates t = 3  ·  η = 0  ·  parameters = (1, 1)'));
  assert(has(held, 'weight ≈ 0.271'));
  assert(has(held, 'weight ≈ 0.002997'));
});

test('Adam denominator and transfer endpoints remain unknown through prediction holds with separate cue-driven answers', () => {
  const prediction = paint('adam-step', 0, { 'adam-normalization-prediction': cue(1) });
  assert(has(prediction, '(?, ?)'));
  assert(has(prediction, 'Next = (?, ?)'));
  assert(!has(prediction, 'Next ≈ (0.92, 0.92)'));
  const fresh = paint('transfer', 0, { 'transfer-prediction': cue(1) });
  assert.equal(fresh.labels.filter((label) => label.text === 'Next = (?, ?)').length, 3);
  const sgdOnly = paint('transfer', 1, {
    'transfer-sgd': cue(1),
    'transfer-momentum': cue(0),
    'transfer-adam': cue(0),
  });
  assert(has(sgdOnly, 'Next ≈ (0.4, 0.491)'));
  assert.equal(sgdOnly.labels.filter((label) => label.text === 'Next = (?, ?)').length, 2);
  const all = paint('transfer', 2);
  assert(has(all, 'Next ≈ (-0.41, 0.4991)'));
  assert(has(all, 'Next ≈ (-0.42, 0.42)'));
});

test('the schedule changes actual Adam displacements and retains its larger residual as a counterexample', () => {
  const run = model.SCHEDULED;
  assert.deepEqual(run.records[0].next, [1, 1]);
  assert.equal(run.records[0].t, 1);
  assert.equal(run.records[0].mean[0], 10);
  close(run.records[4].eta, 0.08);
  close(run.records[39].eta, 0);
  for (const r of run.records)
    r.update.forEach((value, j) => close(value, -r.eta * r.normalized[j]));
  close(run.records[39].loss, 0.6275066011071627);
  assert(run.records[39].loss > model.RUNS.adam.records[39].loss);
  const done = paint('schedule', 2, { 'schedule-late': cue(1) });
  assert(has(done, 'a ≈ -0.11147  ·  last η = 0  ·  L ≈ 0.62751'));
});

test('AdamW uses prior parameters for separate shrink while the coupled gradient enters its own buffers', () => {
  const r = model.DECAY,
    coupled = model.COUPLED;
  r.shrink.forEach((x) => close(x, -0.008));
  r.next.forEach((x, j) => close(x, model.RUNS.adam.records[0].next[j] - 0.008));
  assert.deepEqual(coupled.gradient, [100.1, 1.1]);
  coupled.next.forEach((x) => close(x, 0.92, 1e-8));
  const base = paint('decay', 0, { 'decay-data': cue(1), 'decay-shrink': cue(0) });
  assert(has(base, 'Extra shrink = ?'));
  assert(!has(base, 'AdamW endpoint ≈ (0.912, 0.912)'));
  const held = paint('decay', 0, { 'decay-data': cue(1), 'decay-shrink': cue(1) });
  assert(has(held, 'AdamW endpoint ≈ (0.912, 0.912)'));
});

test('measured provider clauses stage gradient reversal, denominators and separately held challenge answers', async () => {
  const [{ readLesson, frameState }, { resolveSceneCues }, { loadMeasuredTimeline }] =
    await Promise.all([
      import('../lib/lesson.mjs'),
      import('../lib/narration-cues.mjs'),
      import('./helpers/measured-narration.mjs'),
    ]);
  const lesson = await readLesson(
    new URL('../lessons/optimizers.lesson.yaml', import.meta.url).pathname,
    new URL('../..', import.meta.url).pathname,
  );
  const measured = await loadMeasuredTimeline('optimizers');
  function sample(sceneId, cueId, offset) {
    const index = lesson.scenes.findIndex((s) => s.id === sceneId),
      scene = lesson.scenes[index],
      data = measured.scenes.find((s) => s.id === sceneId);
    assert.deepEqual(
      data.beats.map((x) => [x.say, x.hold]),
      scene.beats.map((x) => [x.say, x.hold]),
    );
    const timing = {
      ...data,
      cueTiming: 'provider-words',
      visualCues: resolveSceneCues(scene, data),
    };
    const cue = timing.visualCues.find((c) => c.id === cueId);
    assert(cue);
    const state = frameState(
      timing,
      (offset < 0 ? cue.start : cue.end) + offset,
      index,
      lesson.scenes.length,
    );
    const c = createCanvas(1920, 1080),
      a = drawFrame(c.getContext('2d'), lesson, scene, state, model.draw);
    assert.deepEqual(
      [...a.issues, ...layoutIssues(a), ...findLabelCollisions(a.labels)],
      [],
      sceneId + '/' + cueId,
    );
    return a;
  }
  const pending = sample('first-step', 'take-second-step', -1 / 30);
  assert(has(pending, 'Completed updates  1'));
  assert(has(pending, '(a, b) = (-0.8, 0.982)'));
  const second = sample('first-step', 'take-second-step', 1 / 30);
  assert(has(second, 'Completed updates  2'));
  assert(has(second, '(a, b) = (0.64, 0.964)'));
  const question = sample('adam-step', 'adam-normalization-prediction', 1 / 30);
  assert(has(question, 'Next = (?, ?)'));
  assert(!has(question, '(100 + ε, 1 + ε)'));
  const root = sample('adam-step', 'root-scale', 1 / 30);
  assert(has(root, '(100 + ε, 1 + ε)'));
  assert(has(root, 'Next = (?, ?)'));
  const sgd = sample('transfer', 'transfer-sgd', 1 / 30);
  assert(has(sgd, 'Next ≈ (0.4, 0.491)'));
  assert.equal(sgd.labels.filter((l) => l.text === 'Next = (?, ?)').length, 2);
  const all = sample('transfer', 'transfer-adam', 1 / 30);
  assert(has(all, 'Next ≈ (-0.41, 0.4991)'));
  assert(has(all, 'Next ≈ (-0.42, 0.42)'));
});

test('a partial buffer construction retains zero completed updates until both memories are ready', () => {
  const partial = paint('adam-buffers', 0, {
    'adam-raw-mean': cue(1),
    'adam-raw-square': cue(0.5),
  });
  assert(has(partial, 'Completed updates t = 0  ·  η = 0  ·  parameters = (1, 1)'));
  const complete = paint('adam-buffers', 0, { 'adam-raw-mean': cue(1), 'adam-raw-square': cue(1) });
  assert(has(complete, 'Completed updates t = 1  ·  η = 0  ·  parameters = (1, 1)'));
});

test('the first momentum endpoint stays unknown until a completed parameter update earns it', () => {
  const stored = paint('momentum', 0, { 'first-memory': cue(1), 'momentum-first-four': cue(0) });
  assert(has(stored, 'First endpoint = ?'));
  assert(has(stored, 'Completed updates 0  ·  loss ≈ 50.5'));
  const arrived = paint('momentum', 0, { 'first-memory': cue(1), 'momentum-first-four': cue(0.3) });
  assert(has(arrived, 'First endpoint = (0.82, 0.9982)'));
});

test('the measured zero-rate explanation holds update one until the next-four-rates clause begins', async () => {
  const [{ readLesson, frameState }, { resolveSceneCues }, { loadMeasuredTimeline }] =
    await Promise.all([
      import('../lib/lesson.mjs'),
      import('../lib/narration-cues.mjs'),
      import('./helpers/measured-narration.mjs'),
    ]);
  const lesson = await readLesson(
    new URL('../lessons/optimizers.lesson.yaml', import.meta.url).pathname,
    new URL('../..', import.meta.url).pathname,
  );
  const data = (await loadMeasuredTimeline('optimizers')).scenes.find((s) => s.id === 'schedule'),
    scene = lesson.scenes.find((s) => s.id === 'schedule');
  const timing = {
      ...data,
      cueTiming: 'provider-words',
      visualCues: resolveSceneCues(scene, data),
    },
    words = data.sounds[0].words;
  const normalize = (text) => text.toLowerCase().replace(/[^a-z]/g, '');
  function window(phrase) {
    const wanted = phrase.split(' '),
      i = words.findIndex((_, n) =>
        wanted.every((w, j) => normalize(words[n + j]?.text ?? '') === w),
      );
    assert(i >= 0, phrase + ' has actual measured provider words');
    return {
      start: data.beats[0].start + words[i].start,
      end: data.beats[0].start + words[i + wanted.length - 1].end,
    };
  }
  function inspect(t) {
    const c = createCanvas(1920, 1080),
      state = frameState(timing, t, lesson.scenes.indexOf(scene), lesson.scenes.length);
    const a = drawFrame(c.getContext('2d'), lesson, scene, state, model.draw);
    assert.deepEqual([...a.issues, ...layoutIssues(a), ...findLabelCollisions(a.labels)], []);
    return a;
  }
  const hold = window('while moments and the counter still advance'),
    warm = window('the next four rates ramp to the peak');
  for (const time of [hold.start, (hold.start + hold.end) / 2, hold.end, warm.start - 1 / 30]) {
    const a = inspect(time);
    assert(
      has(a, 'Completed t = 1  ·  last η = 0'),
      'the first update must hold throughout its zero-rate explanation',
    );
    assert(has(a, '(a, b) ≈ (1, 1)  ·  endpoint L ≈ 50.5'));
  }
  const complete = inspect(warm.end + 1 / 30);
  assert(has(complete, 'Completed t = 5  ·  last η = 0.08'));
  assert(has(complete, '(a, b) ≈ (0.8008, 0.8008)  ·  endpoint L ≈ 32.38727'));
});

test('the coupled-gradient native receipt has a separate row below the horizontal-axis label', () => {
  const frame = paint('decay', 1, { 'coupled-penalty': cue(1), 'coupled-result': cue(1) });
  const axis = frame.labels.find((label) => label.text === 'a');
  const receipt = frame.labels.find((label) => label.text === 'Coupled g + λw = (100.1, 1.1)');
  assert(axis && receipt);
  assert(
    receipt.y - (axis.y + axis.height) >= 20,
    'the coupled gradient must have a distinct row clear of the x-axis label',
  );
});
