import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import * as model from '../animations/hypothesis-testing.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';

registerLessonFonts();
const close = (a, b) => assert(Math.abs(a - b) < 1e-10, `${a} != ${b}`);
const cue = (p) => ({
  phase: p === 0 ? 'before' : p === 1 ? 'after' : 'during',
  progress: p,
  strength: 0,
  targets: [],
});
const reference = JSON.parse(
  await fs.readFile(new URL('./fixtures/hypothesis-testing-reference.json', import.meta.url)),
);
function paint(id, beat, p = 0.5, cues = {}) {
  const canvas = createCanvas(1920, 1080),
    ctx = canvas.getContext('2d');
  const audit = drawFrame(
    ctx,
    {},
    { id, title: 'Hypothesis testing' },
    { beat, beatP: p, t: 10, duration: 30, opacity: 1, cues },
    model.draw,
  );
  return { canvas, ctx, audit };
}
test('the close-up remains part of the same forty paired rows and every denominator includes ties', () => {
  assert(model.validateModel());
  for (const row of model.paired) {
    const retained = model.taskRows.find((r) => r.task === row.task);
    assert(retained);
    assert.equal(retained.a, row.a);
    assert.equal(retained.b, row.b);
  }
  for (const rows of [model.taskRows, model.holdoutRows]) {
    assert.equal(new Set(rows.map((r) => r.id)).size, rows.length);
    assert(rows.every((r) => r.difference === r.b - r.a));
  }
  close(model.taskRows.reduce((n, r) => n + r.difference, 0) / 40, reference.development.lift);
  close(model.holdoutRows.reduce((n, r) => n + r.difference, 0) / 400, reference.holdout.lift);
});
test('new disagreement outcomes arrive during their own clause instead of completing during the earlier run instruction', () => {
  for (const [progress, expected] of [
    [0, 28],
    [0.5, 34],
    [1, 40],
  ]) {
    const cues = { 'forty-arrive': cue(1), 'forty-sort': cue(progress) };
    const frame = paint('forty-tasks', 0, 0.5, cues).audit;
    const visible = frame.labels.filter((l) => /^T\d{2}$/.test(l.text)).map((l) => l.text);
    assert.equal(visible.length, expected);
    assert.deepEqual(
      visible,
      model.taskRows.slice(0, expected).map((r) => r.id),
    );
  }
});
test('SciPy independently verifies the exact null tails and discrete calibrated power rules', () => {
  close(model.exactRightTail(8, 13), reference.development.tail);
  for (const r of reference.power) {
    const current = model.exactSignPower(r.disagreements, 0.65, r.alpha);
    assert.equal(current.critical, r.critical);
    close(current.size, r.size);
    close(current.power, r.power);
    assert(current.size <= r.alpha);
  }
  assert.throws(() => model.exactRightTail(14, 13), RangeError);
});
test('whole-row resamples retain both outcomes, repeat permission and match an independent integer-RNG implementation', () => {
  for (const [data, rows, ref] of [
    [model.developmentBootstrap, model.taskRows, reference.development.bootstrap],
    [model.holdoutBootstrap, model.holdoutRows, reference.holdout.bootstrap],
  ]) {
    assert.deepEqual(data.first, ref.firstIndices);
    assert.deepEqual(data.interval, ref.interval);
    close(data.means[0], ref.firstMean);
    assert.deepEqual(model.bootstrapBins(data.means), ref.histogram);
    close(data.first.reduce((n, i) => n + rows[i].b - rows[i].a, 0) / rows.length, data.means[0]);
  }
  assert(
    model.developmentBootstrap.first.filter((i) => model.taskRows[i].task === 'permission').length >
      1,
  );
});
test('every retained bootstrap mean belongs to its painted lower-edge bin without overflow clamping', () => {
  const means = model.developmentBootstrap.means;
  const frame = paint('paired-uncertainty', 1, 1, {
    'bootstrap-many': cue(1),
  }).audit;
  const edges = frame.labels
    .filter((label) => label.y > 740 && label.y < 800 && /^-?\d+$/.test(label.text))
    .sort((a, b) => a.x - b.x)
    .map((label) => Number(label.text) / 100);
  assert(edges.length > 1);
  assert(
    Math.min(...means) >= edges[0],
    'The retained -27.5-point draw must fit above the first painted lower edge',
  );
  const upper = edges.at(-1) + (edges[1] - edges[0]);
  assert(Math.max(...means) < upper);
  const membershipCounts = edges.map(
    (lower, i) => means.filter((mean) => mean >= lower && mean < (edges[i + 1] ?? upper)).length,
  );
  assert.equal(
    membershipCounts.reduce((sum, count) => sum + count, 0),
    means.length,
  );
  assert.deepEqual(model.bootstrapBins(means), membershipCounts);
});
test('every repeated-study decision is derived from its retained independent signs and current critical count', () => {
  for (const [kind, list] of Object.entries(model.studies)) {
    const n = kind === 'large' ? 64 : 13,
      cut = model.exactSignPower(n).critical;
    for (const study of list) {
      assert.equal(study.signs.length, n);
      assert.equal(
        study.wins,
        study.signs.reduce((n, v) => n + v, 0),
      );
      assert.equal(study.rejects, study.wins >= cut);
    }
  }
});
test('the peeking example actually crosses the nominal threshold before returning above it', () => {
  const below = model.peeking.filter((v) => v.p < 0.05);
  assert(below.length > 0);
  assert.equal(below[0].n, 18);
  assert(model.peeking.at(-1).p > 0.05);
  for (const v of model.peeking) close(v.p, model.exactRightTail(v.wins, v.n));
});
test('the visible variant classification follows the tightened rejection boundary', () => {
  assert.equal(model.variantStudies[18].wins, 11);
  const before = paint('search', 0, 1),
    after = paint('search', 1, 0.9, { 'search-tighten': cue(1) });
  function pink(ctx) {
    const data = ctx.getImageData(1541, 350, 45, 240).data;
    let n = 0;
    for (let i = 0; i < data.length; i += 4)
      if (data[i] > 170 && data[i + 2] > 130 && data[i + 1] < 190 && data[i] > data[i + 1] * 1.12)
        n++;
    return n;
  }
  assert(pink(before.ctx) > 8000, 'Eleven wins rejects at the original ten-win cutoff');
  assert.equal(
    pink(after.ctx),
    0,
    'Eleven wins must lose rejection color when the actual cutoff becomes twelve',
  );
});
test('uniform subsets enumerate distinct candidate identities and their real all-failing complement', () => {
  assert.equal(model.candidateSubsets.length, reference.passAtThree.subsets);
  const bad = model.candidateSubsets.filter((s) => !s.passes);
  assert.equal(bad.length, reference.passAtThree.allFail);
  assert.equal(new Set(model.candidateSubsets.map((s) => s.ids.join(','))).size, 120);
  for (const subset of model.candidateSubsets) {
    assert.equal(new Set(subset.ids).size, 3);
    assert.equal(
      subset.passes,
      subset.ids.some((i) => model.passingCandidates.includes(i)),
    );
  }
  close(model.passAtK(2, 10, 3), reference.passAtThree.estimate);
  assert.equal(model.passAtK(0, 10, 3), 0);
  assert.equal(model.passAtK(10, 10, 3), 1);
});
test('percentile construction removes actual ordered means from both tails and keeps its denominator', () => {
  for (const p of [0, 0.25, 0.5, 0.75, 1]) {
    assert.equal(
      model.trimmedBootstrapBins(p).reduce((n, c) => n + c, 0),
      8000 - 2 * Math.floor(200 * p),
    );
  }
  assert.equal(
    model.trimmedBootstrapBins(1).reduce((n, c) => n + c, 0),
    7600,
  );
});
test('the two-sided explanation paints the actual mirrored null tail instead of merely naming both directions', () => {
  const before = paint('p-value', 1, 0.5, {
      'tail-mirror': cue(0),
      'tail-return': cue(0),
    }),
    after = paint('p-value', 1, 0.5, {
      'tail-mirror': cue(0.8),
      'tail-return': cue(0),
    });
  function pinkPixels(ctx) {
    const data = ctx.getImageData(210, 390, 620, 335).data;
    let n = 0;
    for (let i = 0; i < data.length; i += 4)
      if (data[i] > 170 && data[i + 2] > 130 && data[i + 1] < 190 && data[i] > data[i + 1] * 1.12)
        n++;
    return n;
  }
  assert.equal(pinkPixels(before.ctx), 0);
  assert(pinkPixels(after.ctx) > 20000, 'Left extreme bars must acquire actual pink fill');
});
test('the painted probability sum follows both highlighted tails and returns to the original one-sided plan', () => {
  const two = paint('p-value', 1, 0.5, {
    'tail-mirror': cue(0.8),
    'tail-return': cue(0),
  }).audit;
  const equation = two.labels.find((l) => l.text.startsWith('p_{two}'))?.text;
  assert(equation, 'The active two-tail geometry needs its own visible probability sum');
  assert.equal(equation, String.raw`p_{two}=4760/8192\approx0.581`);
  close(4760 / 8192, model.exactRightTail(8, 13) + model.exactRightTail(8, 13));
  const one = paint('p-value', 1, 0.9, {
    'tail-mirror': cue(1),
    'tail-return': cue(1),
  }).audit;
  assert(one.labels.some((l) => l.text === String.raw`P_0(W\geq8)=2380/8192\approx0.291`));
});
test('the fresh decision stays pending through prediction and the eventual receipt fits without covering its protocol', () => {
  for (const p of [0.02, 0.5, 0.98, 1]) {
    const f = model.holdoutFrame({ beat: 1, beatP: p });
    assert(!f.release);
    const a = paint('holdout', 1, p).audit;
    assert(!a.targets.some((t) => t.id === 'release-receipt'));
  }
  const after = paint('holdout', 2, 0.7, { 'release-receipt': cue(1) }).audit;
  assert(after.targets.some((t) => t.id === 'release-receipt'));
  assert.deepEqual([...after.issues, ...layoutIssues(after)], []);
  assert(reference.holdout.bootstrap.interval[0] > 0.02);
});
test('compact retained task identities fit their actual card interiors', () => {
  for (const scene of ['forty-tasks', 'paired-uncertainty'])
    for (const p of [0.02, 0.5, 0.98]) {
      const { audit } = paint(scene, 0, p);
      assert.deepEqual([...audit.issues, ...layoutIssues(audit)], [], `${scene}/${p}`);
    }
});
