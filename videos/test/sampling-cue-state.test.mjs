import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { readLesson, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { loadMeasuredTimeline } from './helpers/measured-narration.mjs';
import * as animation from '../animations/sampling.mjs';

registerLessonFonts();
const root = new URL('../../', import.meta.url).pathname;
const lesson = await readLesson(new URL('../lessons/sampling.lesson.yaml', import.meta.url), root);
const fixture = await loadMeasuredTimeline('sampling');
const at = (id, cueId, progress) => {
  const authored = lesson.scenes.find((scene) => scene.id === id),
    measured = fixture.scenes.find((scene) => scene.id === id);
  const timing = { ...measured, visualCues: resolveSceneCues(authored, measured) };
  const cue = timing.visualCues.find((candidate) => candidate.id === cueId);
  const t =
    progress < 0
      ? cue.start - 0.05
      : progress > 1
        ? cue.end + cue.linger + 0.05
        : cue.start + (cue.end - cue.start) * progress;
  return {
    authored,
    state: frameState(timing, t, lesson.scenes.indexOf(authored), lesson.scenes.length),
  };
};
const paint = (id, cue, progress) => {
  const { authored, state } = at(id, cue, progress),
    canvas = createCanvas(1920, 1080);
  const audit = drawFrame(canvas.getContext('2d'), lesson, authored, state, animation.draw);
  return { canvas, audit, state, labels: audit.labels.map((label) => label.text) };
};
const close = (actual, expected, tolerance = 1e-8) =>
  assert(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);
const paintAtTime = (id, t) => {
  const authored = lesson.scenes.find((scene) => scene.id === id),
    measured = fixture.scenes.find((scene) => scene.id === id);
  const timing = { ...measured, visualCues: resolveSceneCues(authored, measured) };
  const canvas = createCanvas(1920, 1080),
    state = frameState(timing, t, lesson.scenes.indexOf(authored), lesson.scenes.length);
  return drawFrame(canvas.getContext('2d'), lesson, authored, state, animation.draw);
};
const integrate = (fn, a, b, n = 20000) => {
  const step = (b - a) / n;
  let sum = fn(a) + fn(b);
  for (let i = 1; i < n; i++) sum += (i % 2 ? 4 : 2) * fn(a + i * step);
  return (sum * step) / 3;
};

test('the positive-duration quantile, density area and deadline probability describe the same supplied law', () => {
  animation.validateModel();
  close(animation.durationFromRank(0.5), 6, 1e-7);
  close(animation.durationFromRank(0.95), 14.82669, 0.00001);
  close(integrate(animation.durationDensity, 0, 10), animation.durationCdf(10), 2e-7);
  close(
    integrate(animation.durationDensity, 5, 7),
    animation.durationCdf(7) - animation.durationCdf(5),
    2e-7,
  );
  for (const u of [0.0001, 0.01, 0.25, 0.5, 0.95, 0.9999])
    close(animation.durationCdf(animation.durationFromRank(u)), u, 1e-12);
  assert.throws(() => animation.durationFromRank(0), /open-interval/);
  assert.throws(() => animation.durationFromRank(1), /open-interval/);
});

test('the measured inverse construction withholds its future endpoint and duration until the moving rank arrives', () => {
  const before = paint('inverse', 'inverse-quarter', -1),
    middle = paint('inverse', 'inverse-quarter', 0.5),
    held = paint('inverse', 'inverse-quarter', 2);
  assert(before.labels.includes('duration = ?'));
  assert(middle.labels.includes('duration = ?'));
  assert(held.labels.includes(animation.durationFromRank(0.25).toFixed(2) + ' seconds'));
  const destination = { x: 225 + (animation.durationFromRank(0.25) / 24) * 1000, y: 810 };
  const endpoint = (image) =>
    image.audit.shapes.some(
      (shape) =>
        shape.kind === 'circle' &&
        Math.abs(shape.center.x - destination.x) < 0.05 &&
        Math.abs(shape.center.y - destination.y) < 0.05,
    );
  assert.equal(endpoint(before), false);
  assert.equal(endpoint(middle), false);
  assert.equal(endpoint(held), true);
  assert.equal(
    before.audit.shapes.filter((shape) => shape.kind === 'circle').length,
    1,
    'Only the source rank is painted before its construction starts',
  );
  const pixels = held.canvas
    .getContext('2d')
    .getImageData(Math.floor(destination.x - 16), 806, 9, 9).data;
  let yellow = 0;
  for (let i = 0; i < pixels.length; i += 4)
    if (pixels[i] > 150 && pixels[i + 1] > 140 && pixels[i + 2] < 150) yellow++;
  assert(yellow > 5, 'The held endpoint must paint actual yellow ring pixels');
});

test('only landed requests enter the measured denominator while earlier sample identities stay at their own positions', () => {
  const moving = paint('sample', 'sample-five', 0.5),
    first = paint('sample', 'sample-five', 2),
    later = paint('sample', 'sample-twenty', 2);
  const partial = animation.sampleFrame(moving.state);
  assert.equal(partial.n, 2);
  assert.equal(partial.moving.id, 3);
  assert(
    moving.labels.includes('0 late / 2 landed') || moving.labels.includes('1 late / 2 landed'),
  );
  const firstState = animation.sampleFrame(first.state),
    finalState = animation.sampleFrame(later.state);
  assert.equal(firstState.n, 5);
  assert.equal(finalState.n, 20);
  assert.deepEqual(finalState.landed.slice(0, 5), firstState.landed);
  assert.equal(finalState.late, 6);
  for (const row of firstState.landed) {
    const expected = {
      x: 230 + ((row.bin * 2 + 1) / 20) * 1400,
      y: 790 - ((row.stack + 0.5) / 7) * 380,
    };
    for (const image of [first, later])
      assert(
        image.audit.shapes.some(
          (shape) =>
            shape.kind === 'circle' &&
            Math.abs(shape.width - 42) < 0.01 &&
            Math.abs(shape.center.x - expected.x) < 0.01 &&
            Math.abs(shape.center.y - expected.y) < 0.01,
        ),
        `Request ${row.id} must retain its physical stack position`,
      );
  }
});

test('batch growth appends to each recorded stream and the inspected sample is experiment one’s actual prefix', () => {
  const small = animation.batchFrame(at('monte-carlo', 'batch-extend', -1).state),
    middle = animation.batchFrame(at('monte-carlo', 'batch-extend', 0.5).state),
    large = animation.batchFrame(at('monte-carlo', 'batch-extend', 2).state);
  assert.equal(small.count, 100);
  assert.equal(large.count, 10000);
  assert(middle.count > 100 && middle.count < 10000);
  assert.deepEqual(
    small.rows.map((row) => [row.id, row.seed]),
    large.rows.map((row) => [row.id, row.seed]),
  );
  small.rows.forEach((row, i) => {
    assert(large.rows[i].late >= row.late);
    close(row.rate, row.late / 100);
    close(large.rows[i].rate, large.rows[i].late / 10000);
  });
  assert(small.rows[0].late >= animation.requests.filter((row) => row.late).length);
  close(small.standardError / large.standardError, 10);
  assert(large.empiricalSpread < small.empiricalSpread / 5);
});

test('the spread intervention keeps the same uniform rank and median while changing the actual p95 and tail area', () => {
  const low = animation.tailFrame(at('tail', 'tail-spread', -1).state),
    high = animation.tailFrame(at('tail', 'tail-spread', 2).state);
  assert.equal(low.rank, high.rank);
  assert.equal(low.median, high.median);
  assert.equal(low.sigma, 0.25);
  assert.equal(high.sigma, 0.8);
  assert(high.p95 > 2 * low.p95);
  assert(high.late > low.late);
  close(animation.durationCdf(low.p95, low.sigma), 0.95, 1e-12);
  close(animation.durationCdf(high.p95, high.sigma), 0.95, 1e-12);
  const prediction = paint('tail', 'tail-spread', 2),
    answer = paint('tail', 'tail-area', 2);
  assert(prediction.labels.includes('your prediction?'));
  assert(!prediction.labels.includes('26.2%'));
  assert(
    !prediction.audit.paths.some((path) => path.closed && path.fillAlpha > 0),
    'The shaded answer waits for the actual area clause',
  );
  assert(answer.labels.includes('26.2%'));
  assert(answer.audit.paths.some((path) => path.closed && path.fillAlpha > 0));
});

test('censored requests remain real cohort actors and the corrected denominator waits for their return', () => {
  const wrong = paint('audit', 'audit-completed-only', 2),
    moving = paint('audit', 'audit-denominator', 0.5),
    fixed = paint('audit', 'audit-denominator', 2);
  assert(wrong.labels.includes('160 / 200 = 80.0%'));
  assert(moving.labels.includes('Report denominator pending'));
  assert(fixed.labels.includes('160 / 250 = 64.0%'));
  for (const image of [wrong, moving, fixed])
    assert.equal(
      image.audit.shapes.filter((shape) => shape.kind === 'circle' && shape.width === 18).length,
      250,
    );
  const row = (image) =>
    image.audit.shapes.filter(
      (shape) =>
        shape.kind === 'circle' && shape.width === 18 && Math.abs(shape.center.y - 718) < 0.01,
    );
  close(row(wrong)[0].center.x - row(fixed)[0].center.x, 260);
  close(row(moving)[0].center.x - row(fixed)[0].center.x, 130);
});

test('the new deadline keeps censored completion times unknown and earns its final numerator on the same 250 requests', () => {
  const before = paint('takeaway', 'transfer-deadline', -1),
    moving = paint('takeaway', 'transfer-deadline', 0.5),
    held = paint('takeaway', 'transfer-deadline', 2),
    p95 = paint('takeaway', 'transfer-p95', 2);
  assert(before.labels.includes('160 / 250 = 64.0% finish by 10 s'));
  assert(moving.labels.includes('Deadline moving · later group spans 10 to 15 s'));
  assert(held.labels.includes('200 / 250 = 80.0% finish by 15 s'));
  assert(p95.labels.includes('\\operatorname{p95}>15\\text{ seconds}'));
  for (const image of [before, moving, held, p95])
    assert.equal(
      image.audit.shapes.filter((shape) => shape.kind === 'circle' && shape.width === 18).length,
      250,
    );
});

test('the measured normal-to-duration transport clears the signed and positive ruler labels at launch and landing', () => {
  for (const frame of [723, 724, 730, 738, 934]) {
    const audit = paintAtTime('shape', frame / 30);
    assert.deepEqual(
      [...audit.issues, ...layoutIssues(audit)],
      [],
      `Measured shape frame ${frame}`,
    );
  }
});

test('the first measured density-sweep interval can be narrower than one millisecond', () => {
  const audit = paintAtTime('area', 1057 / 30);
  assert.deepEqual([...audit.issues, ...layoutIssues(audit)], []);
  assert(audit.labels.some((label) => label.text === 'range: 0.0 to 0.0 seconds'));
  assert(
    audit.paths.some((path) => path.closed && path.fillAlpha > 0),
    'The tiny positive interval must remain a real probability-area construction',
  );
});
