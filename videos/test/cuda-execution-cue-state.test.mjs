import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { readLesson, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { loadMeasuredTimeline } from './helpers/measured-narration.mjs';
import * as animation from '../animations/cuda-execution.mjs';

registerLessonFonts();
const root = new URL('../../', import.meta.url).pathname;
const lesson = await readLesson(
  new URL('../lessons/cuda-execution.lesson.yaml', import.meta.url),
  root,
);
const measured = await loadMeasuredTimeline('cuda-execution');
const { numeric } = JSON.parse(
  await readFile(new URL('./fixtures/measured-narration/cuda-execution.json', import.meta.url)),
);
const at = (id, cueId, progress) => {
  const authored = lesson.scenes.find((scene) => scene.id === id),
    source = measured.scenes.find((scene) => scene.id === id);
  const timing = { ...source, visualCues: resolveSceneCues(authored, source) };
  const cue = timing.visualCues.find((candidate) => candidate.id === cueId);
  assert(cue, `${id}/${cueId}`);
  const time =
    progress < 0
      ? cue.start - 0.05
      : progress > 1
        ? cue.end + cue.linger + 0.05
        : cue.start + (cue.end - cue.start) * progress;
  const state = frameState(timing, time, lesson.scenes.indexOf(authored), lesson.scenes.length);
  return { authored, state, timing, time };
};
const paint = (id, cue, progress, quantized = false) => {
  const sampled = at(id, cue, progress),
    { authored } = sampled,
    canvas = createCanvas(1920, 1080);
  const state = quantized
    ? frameState(
        sampled.timing,
        Math.round(sampled.time * 30) / 30,
        lesson.scenes.indexOf(authored),
        lesson.scenes.length,
      )
    : sampled.state;
  const audit = drawFrame(canvas.getContext('2d'), lesson, authored, state, animation.draw);
  assert.deepEqual([...audit.issues, ...layoutIssues(audit)], []);
  return { canvas, audit, state, labels: audit.labels.map((label) => label.text) };
};
const model = (id, cue, progress) => animation.sampleModel(id, at(id, cue, progress).state);

test('the reduction and address models match an independently executed CPU reference', () => {
  animation.validateModel();
  assert.deepEqual(animation.tokenValues, numeric.values);
  for (const [values, expected] of [
    [numeric.values, numeric.base],
    [[...numeric.values, 6, 0], numeric.extended],
  ]) {
    const actual = animation.reduction(values);
    assert.deepEqual(
      actual.blocks.map((block) => block.subtotal),
      expected.blocks.map((block) => block.subtotal),
    );
    assert.equal(actual.total, expected.total);
    assert.equal(actual.denominator, expected.denominator);
    assert.equal(actual.mean, expected.mean);
    assert(
      actual.blocks.flatMap((block) => block.threads).every((worker) => worker.reachesBarrier),
    );
    assert(
      actual.blocks
        .flatMap((block) => block.threads)
        .filter((worker) => !worker.valid)
        .every((worker) => worker.value === 0),
    );
  }
  for (const [name, stride, broadcast] of [
    ['adjacent', 1, false],
    ['column', 32, false],
    ['padded', 33, false],
    ['broadcast', 0, true],
  ]) {
    const actual = animation.memoryRequests(stride, broadcast),
      expected = numeric.addresses[name];
    assert.deepEqual(
      actual.rows.map((row) => row.word),
      expected.words,
    );
    assert.deepEqual(
      actual.rows.map((row) => row.address),
      expected.addresses,
    );
    assert.deepEqual(actual.segments, expected.segments);
    assert.equal(actual.footprint, expected.footprint);
    assert.equal(actual.maxDistinctWords, expected.maxDistinctWords);
  }
  for (const row of numeric.roofline)
    assert.equal(animation.roofline(row.intensity).bound, row.bound);
});

test('the opening holds the Python receipt during the prediction while the GPU advances afterward', () => {
  const question = paint('intro', 'opening-prediction', 0.5);
  const during = paint('intro', 'stream-advances', 0.5);
  assert.equal(animation.sampleModel('intro', question.state).time, 2);
  assert(during.labels.includes('return 2'));
  assert(animation.sampleModel('intro', during.state).time > 2);
  for (const frame of [question, during]) {
    assert(frame.labels.includes('Python number'));
    assert(frame.labels.includes('?'));
  }
  assert(question.labels.includes('CUDA tensor'));
  assert(during.labels.includes('pooled.item()'));
  const read = paint('intro', 'number-returns', 2);
  assert(read.labels.includes(String(numeric.base.mean)));
  assert(!read.labels.includes('?'));
});

test('the owner prediction keeps token six local identity covered until the measured answer arrives', () => {
  const question = paint('mapping', 'predict-owner', 2),
    moving = paint('mapping', 'owner-answer', 0.5),
    held = paint('mapping', 'owner-answer', 2);
  assert(
    question.labels.includes('local ?'),
    'Token six must retain an unresolved local owner during the prediction',
  );
  assert(moving.labels.includes('local ?'));
  assert(!question.labels.includes('i=1\\times4+2=6'));
  assert(held.labels.includes('i=1\\times4+2=6'));
  const index = held.audit.labels.find((label) => label.text === 'T6');
  assert(index.x > 1200 && index.x < 1600, 'The same token remains physically inside block one');
});

test('the same eight copy payloads move before device values become available', () => {
  const before = paint('residence', 'copy-row', -1),
    middle = paint('residence', 'copy-row', 0.5),
    held = paint('residence', 'copy-row', 2);
  assert.equal(animation.sampleModel('residence', before.state).landed, 0);
  assert.equal(animation.sampleModel('residence', middle.state).landed, 0);
  assert.equal(animation.sampleModel('residence', held.state).landed, 8);
  const cards = (image) =>
    image.audit.shapes.filter(
      (shape) =>
        shape.kind === 'rect' &&
        Math.abs(shape.width - 130) < 0.01 &&
        Math.abs(shape.height - 65) < 0.01,
    );
  assert.equal(cards(before).length, 0);
  assert.equal(cards(middle).length, 8);
  assert.equal(cards(held).length, 0);
  assert(cards(middle).every((shape) => shape.y > 485 && shape.y < 595));
  assert(before.labels.includes('0 / 8 device values ready'));
  assert(held.labels.includes('8 / 8 device values ready'));
  const code = paint('residence', 'queue-mean', 0.5);
  assert(code.labels.includes('cpu_row = torch.tensor(values, dtype=torch.float32)'));
  assert(code.labels.includes('pooled = x.mean()'));
});

test('the footprint receipt counts completed physical requests instead of future destinations', () => {
  const before = model('coalescing', 'fan-segments', -1),
    middle = model('coalescing', 'fan-segments', 0.5),
    held = model('coalescing', 'fan-segments', 2);
  assert.equal(before.footprint, 32);
  assert.equal(before.waiting, true);
  assert.equal(middle.completed, 4);
  assert.equal(middle.footprint, 128);
  assert.equal(held.footprint, 256);
  const painted = paint('coalescing', 'fan-segments', 0.5);
  assert(painted.labels.includes('4/8 lanes traced     4 segments × 32 B = 128 B'));
  const padded = model('banks', 'pad-banks', 2),
    broadcast = model('banks', 'broadcast-word', 2);
  assert.equal(padded.maxDistinctWords, 1);
  assert.equal(broadcast.maxDistinctWords, 1);
  assert.equal(new Set(padded.rows.map((row) => row.bank)).size, 8);
  assert.equal(new Set(broadcast.rows.map((row) => row.word)).size, 1);
});

test('the bank broadcast heading waits for all eight displayed routes', () => {
  const heading = 'All eight lanes read word zero';
  for (const progress of [-1, 0.5]) {
    assert(!paint('banks', 'broadcast-word', progress).labels.includes(heading));
  }
  assert(paint('banks', 'broadcast-word', 2).labels.includes(heading));
});

test('the fresh reduction holds the division until the spoken numerical answer finishes', () => {
  const cue = 'fresh-mean';
  const quotient = '35 ÷ 13';
  const result = quotient + ' ≈ 2.6923';
  const { timing } = at('fresh-runtime', cue, 0.5);
  const measuredCue = timing.visualCues.find((entry) => entry.id === cue);
  const finalWord = timing.sounds[measuredCue.beat].words.findLast((word) =>
    word.text.toLowerCase().replace(/[^a-z]/g, '') === 'three');
  assert(finalWord);
  const finalWordEnd = timing.beats[measuredCue.beat].start + finalWord.end;
  assert(Math.abs(measuredCue.end - finalWordEnd) < 0.001);
  for (const progress of [-1, 0.95]) {
    const { labels } = paint('fresh-runtime', cue, progress);
    assert(labels.includes(quotient));
    assert(!labels.includes(result));
  }
  assert(paint('fresh-runtime', cue, 2).labels.includes(result));
});

test('the warp rows retain token identity across tiny blocks and name local indices in the larger block', () => {
  const first = paint('warps', 'populate-warps', 2),
    tiny = paint('warps', 'next-block-warp', 2),
    large = paint('warps', 'warp-remainder', 2);
  assert(first.labels.includes('T3'));
  assert(!first.labels.includes('T4'));
  for (const [text, y] of [
    ['T0', 430],
    ['T3', 430],
    ['T4', 650],
    ['T7', 650],
  ]) {
    const label = tiny.audit.labels.find(
      (label) => label.text === text && label.y > y && label.y < y + 110,
    );
    assert(label, `The actual warp row must retain token ${text} at its own block`);
  }
  assert(large.labels.includes('31'));
  assert(large.labels.includes('32'));
  assert(large.labels.includes('35'));
  const boundary = large.audit.labels.find(
    (label) => label.text === '32' && label.y > 650 && label.y < 760,
  );
  assert(boundary, 'Local thread32 starts the second warp of the same36-thread block');
  assert.equal(animation.warpMap([4, 4]).length, 2);
  assert.equal(animation.warpMap([36])[1].lanes[0], 32);
});

test('a racing read has no defined result and the barrier waits for all four published values', () => {
  const early = animation.sharedTrace(0.6, false),
    later = animation.sharedTrace(1.5, false),
    blocked = animation.sharedTrace(2, true),
    ready = animation.sharedTrace(2.1, true);
  assert.deepEqual(early.slots, numeric.earlyRead);
  for (const racing of [early, later]) {
    assert(racing.attempted);
    assert.equal(racing.readSlots, null);
    assert.equal(racing.result, null);
  }
  assert.deepEqual(later.slots, numeric.laterWrites);
  assert.equal(blocked.result, null);
  assert.equal(blocked.attempted, false);
  assert.deepEqual(ready.readSlots, numeric.barrierRead);
  assert.equal(ready.result, 10);
  const raw = paint('barrier', 'early-reader', 2),
    waiting = paint('barrier', 'barrier-read', -1),
    complete = paint('barrier', 'barrier-read', 2);
  const readerSlots = (frame) =>
    frame.audit.labels
      .filter((label) => label.x >= 335 && label.y > 827 && label.y < 909)
      .sort((a, b) => a.x - b.x)
      .map((label) => label.text);
  assert(raw.labels.includes('sum   ?'));
  assert(raw.labels.includes('Unordered read and writes'));
  assert.deepEqual(readerSlots(waiting), ['·', '·', '·', '·']);
  assert(waiting.labels.includes('Waiting to read'));
  assert.deepEqual(readerSlots(complete), ['3', '1', '4', '2']);
  assert(complete.labels.includes('Block A sum   10'));
});

test('host return, device completion and completed host reporting have distinct modeled boundaries', () => {
  const returned = animation.executionAt(2),
    device = animation.executionAt(41),
    reported = animation.executionAt(42);
  assert(returned.returned);
  assert.equal(returned.scalar, null);
  assert.equal(returned.deviceComplete, false);
  assert.equal(device.eventInterval, numeric.modeledTiming.eventInterval);
  assert.equal(device.scalar, null);
  assert.equal(reported.hostInterval, numeric.modeledTiming.hostReadComplete);
  assert.equal(reported.scalar, numeric.base.mean);
  const pending = paint('clocks', 'finish-device', 2),
    reporting = paint('clocks', 'report-scalar', 0.5),
    held = paint('clocks', 'report-scalar', 2);
  for (const frame of [pending, reporting, held]) {
    assert(frame.labels.includes('Python number'));
    assert(frame.labels.includes('41 − 1 = 40 ms'));
  }
  for (const frame of [pending, reporting]) {
    assert(frame.labels.includes('?'));
    assert(!frame.labels.includes('2.625'));
  }
  assert(held.labels.includes('2.625'));
  assert(held.labels.includes('42 − 0 = 42 ms'));
  assert.equal(animation.warmupTrace(21).mean, null);
  assert.equal(animation.warmupTrace(22).mean, numeric.warmup.mean);
  assert.equal(animation.warmupTrace(30).completed, 2);
});

test('near-landed shared-write rings remain physically separate from their complete arrow triangles', () => {
  const segmentDistance = (p, a, z) => {
    const dx = z.x - a.x,
      dy = z.y - a.y,
      q = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(p.x - a.x - q * dx, p.y - a.y - q * dy);
  };
  let moving = 0;
  for (const progress of [0.9, 0.95, 0.99, 1]) {
    const image = paint('barrier', 'barrier-publish', progress, true);
    const rings = image.audit.shapes.filter(
      (shape) => shape.kind === 'circle' && shape.fillAlpha === 0 && shape.strokeAlpha > 0.25,
    );
    for (const ring of rings)
      for (const arrow of image.audit.connectors)
        if (Math.abs(ring.center.x - arrow.to.x) < 0.01) {
          assert.equal(arrow.head.length, 3);
          moving++;
          const outer = Math.hypot(ring.axisX.x, ring.axisX.y) + ring.strokeWidth / 2;
          const distance = Math.min(
            ...arrow.head.map((p, i) => segmentDistance(ring.center, p, arrow.head[(i + 1) % 3])),
          );
          assert(
            distance > outer + 3,
            'The actual moving ring must clear the entire triangle, regardless of paint order',
          );
        }
  }
  assert(moving > 0, 'The measured frame selections must contain a real moving write marker');
  assert(paint('barrier', 'barrier-read', 2).labels.includes('Block A sum   10'));
});

test('the transfer retains ten valid values, twelve barrier participants and a withheld denominator payoff', () => {
  const prediction = paint('transfer', 'final-predict', 2),
    sums = paint('transfer', 'final-sums', 2),
    dividing = paint('transfer', 'final-divide', 0.5),
    held = paint('transfer', 'final-divide', 2);
  assert(prediction.labels.includes('\\text{pooled feature}=?'));
  assert(sums.labels.includes('\\frac{27}{?}=?'));
  assert(dividing.labels.includes('\\frac{27}{?}=?'));
  assert(held.labels.includes('\\frac{10+11+6}{10}'));
  assert(!held.labels.includes('\\frac{10+11+6}{10}=2.7'));
  const answer = paint('transfer', 'final-numeric-result', 2);
  assert(answer.labels.includes('\\frac{10+11+6}{10}=2.7'));
  const workers = model('transfer', 'final-tail', 2).blocks.flatMap((block) => block.threads);
  assert.equal(workers.length, 12);
  assert.equal(workers.filter((worker) => worker.valid).length, 10);
  assert.deepEqual(
    workers.filter((worker) => !worker.valid).map((worker) => worker.value),
    [0, 0],
  );
  assert(workers.every((worker) => worker.reachesBarrier));
  const completed = paint('transfer', 'final-report', 2);
  assert(completed.labels.includes('Python .item()   ' + Math.fround(2.7)));
  assert(completed.labels.includes('Log   ·'));
  assert(paint('transfer', 'final-format', 2).labels.includes('Log (.1f)   2.7'));
});
