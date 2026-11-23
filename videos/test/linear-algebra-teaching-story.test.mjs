import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import * as model from '../animations/linear-algebra.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { findArrowheadOcclusions } from '../lib/arrowhead-occlusion.mjs';

registerLessonFonts();
const cue = (p) => ({
  phase: p === 0 ? 'before' : p === 1 ? 'after' : 'during',
  progress: p,
  strength: 0,
  targets: [],
});
const close = (a, z) => assert(Math.abs(a - z) < 1e-10, `${a} != ${z}`);
const paint = (id, beat, beatP = 0.5, cues = {}, t = 10) =>
  drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    {},
    { id, title: 'Linear algebra' },
    { beat, beatP, t, duration: 30, opacity: 1, cues },
    model.draw,
  );

test('unit components reconstruct the point and the discarded residual is perpendicular', () => {
  close(Math.hypot(...model.common), 1);
  close(Math.hypot(...model.contrast), 1);
  close(
    model.common.reduce((n, v, i) => n + v * model.contrast[i], 0),
    0,
  );
  const frame = model.basisFrame({ beat: 2, cues: { 'projection-residual': cue(1) } });
  frame.parts[0].forEach((v, i) => close(v + frame.parts[1][i], frame.x[i]));
  assert.deepEqual(
    frame.projected.map((v) => Math.round(v)),
    [2, 2],
  );
  close(
    frame.x.reduce((n, v, i) => n + (v - frame.projected[i]) * model.common[i], 0),
    0,
  );
});

test('compression error is computed from the moving rows and the final single-issue coordinates coincide', () => {
  for (const p of [0, 0.25, 0.5, 0.75, 1]) {
    const frame = model.compressionFrame({ beat: 0, cues: { 'discard-contrast': cue(p) } });
    close(
      frame.error,
      Math.hypot(...model.A.flatMap((row, i) => row.map((v, j) => v - frame.rows[i][j]))),
    );
    close(frame.error, p);
  }
  const final = model.compressionFrame({ beat: 1 });
  final.rows[0].forEach((v, i) => close(v, final.rows[1][i]));
  close(final.coordinates[0][0], final.coordinates[1][0]);
});

test('both SVD sign choices reconstruct the exact matrix and keep the fixed-input output', () => {
  for (const sign of [1, -1]) {
    const frame = model.svdBuild(1, sign);
    frame.output.forEach((v, i) => close(v, [1, 0, 1][i]));
    frame.reconstruction.forEach((row, i) => row.forEach((v, j) => close(v, model.A[i][j])));
  }
});

test('the centered spread and future-row transform derive from the retained training rows', () => {
  const frame = model.pcaFrame({ beat: 3 });
  model.mean.forEach((v, j) => close(v, model.A.reduce((n, row) => n + row[j], 0) / 3));
  frame.centered[0].forEach((_, j) =>
    close(
      frame.centered.reduce((n, row) => n + row[j], 0),
      0,
    ),
  );
  close(frame.energies[1] / frame.energies[0], 3);
  frame.currentQuery.forEach((v, i) => close(v, frame.query[i] - model.mean[i]));
});

test('nullspace travel preserves all predictions and minimum-norm selection returns to the origin-nearest fit', () => {
  for (const p of [0, 0.25, 0.5, 0.75, 1]) {
    const frame = model.rankFrame({ beat: 1, cues: { 'nullspace-rule': cue(p) } });
    assert.deepEqual(frame.prediction, [1.5, 0, 1.5]);
    assert.deepEqual(frame.nullAction, [0, 0, 0]);
  }
  const before = model.rankFrame({ beat: 2, cues: { 'minimum-weight': cue(0) } });
  const after = model.rankFrame({ beat: 2, cues: { 'minimum-weight': cue(1) } });
  assert(Math.hypot(...after.weights) < Math.hypot(...before.weights));
  assert.deepEqual(after.prediction, before.prediction);
  assert.deepEqual(after.weights, [0.75, 0.75]);
});

test('the fixed minimum-norm reference leaves the arriving mathematical arrowhead clear', () => {
  for (const p of [0, 0.25, 0.5, 0.75, 0.95, 0.99, 1]) {
    const frame = paint('rank-null', 1, 0.5, { 'minimum-weight': cue(p) });
    assert.deepEqual(
      findArrowheadOcclusions(frame),
      [],
      'the reference must stay separate from the full vector head at ' + p,
    );
  }
  const held = paint('rank-null', 1, 0.5, { 'minimum-weight': cue(1) });
  const vector = held.connectors.find((c) => c.kind === 'arrow');
  const reference = held.paths.find((p) => p.id === 'minimum-norm-reference');
  assert(reference, 'the fixed minimum retains a leader annotation');
  close(reference.points[0].x - vector.to.x, 8);
  close(reference.points[0].y - vector.to.y, -8);
  assert(held.labels.some((l) => l.text === 'minimum norm'));
});

test('the signed-score chart and worked products fit in distinct readable regions', () => {
  for (const [beat, id] of ['common-output', 'contrast-output'].entries())
    for (const p of [0.02, 0.5, 0.98]) {
      const frame = paint(id, 0, p);
      assert.deepEqual(
        [...frame.issues, ...layoutIssues(frame)],
        [],
        `strength beat${beat} at${p}`,
      );
    }
});

test('the complete inverse-error receipt waits until both constructions actually finish', () => {
  const partial = {
    beat: 1,
    cues: { 'conditioning-noise-b2-1': cue(0.98), 'conditioning-inverse-b2-2': cue(0.98) },
  };
  assert.equal(model.conditioningResult(partial), null);
  const final = model.conditioningResult({
    beat: 1,
    cues: { 'conditioning-noise-b2-1': cue(1), 'conditioning-inverse-b2-2': cue(1) },
  });
  close(final.outputWeakCoordinate / 0.01, final.recoveredWeakCoordinate);
});

test('the true-input reference leaves the complete emerging recovery triangle clear', () => {
  const inside = (point, polygon) => {
    let result = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const a = polygon[i],
        z = polygon[j];
      if (
        a.y > point.y !== z.y > point.y &&
        point.x < ((z.x - a.x) * (point.y - a.y)) / (z.y - a.y) + a.x
      )
        result = !result;
    }
    return result;
  };
  const distance = (point, a, z) => {
    const dx = z.x - a.x,
      dy = z.y - a.y,
      t = Math.max(
        0,
        Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / (dx * dx + dy * dy)),
      );
    return Math.hypot(point.x - a.x - t * dx, point.y - a.y - t * dy);
  };
  for (const p of [0.005, 0.01, 0.025, 0.05, 0.1, 0.2, 0.5, 0.9, 1]) {
    const cues = { 'conditioning-noise-b2-1': cue(1), 'conditioning-inverse-b2-2': cue(p) };
    const frame = paint('conditioning-noise', 0, 0.5, cues),
      arrow = frame.connectors.find(
        (row) => row.kind === 'arrow' && Math.abs(row.from.y - 730) < 1e-8,
      );
    assert(arrow);
    for (const path of frame.paths) {
      const first = path.points[0],
        last = path.points.at(-1);
      if (path.points.length > 3 && Math.hypot(first.x - last.x, first.y - last.y) < 1e-6) {
        assert(
          !arrow.head.some((point) => inside(point, path.points)),
          'a closed true-input reference encloses the emerging triangle at ' + p,
        );
      }
    }
    const leader = frame.paths.find(
      (row) =>
        row.points.length === 2 &&
        Math.abs(row.points[0].x - arrow.from.x + 12) < 1e-9 &&
        Math.abs(row.points[0].y - arrow.from.y - 12) < 1e-9,
    );
    assert(leader, 'the actual true input retains its separated reference');
    close(leader.points[0].x, arrow.from.x - 12);
    close(leader.points[0].y, arrow.from.y + 12);
    close(leader.points[1].x, arrow.from.x - 40);
    close(leader.points[1].y, arrow.from.y + 40);
    assert(
      arrow.head.every((point) => distance(point, ...leader.points) > 6),
      'the whole head stays clear of the reference stroke',
    );
    const expected = model.conditioningState({ beat: 1, cues });
    close(arrow.from.x, 960);
    close(arrow.from.y, 730);
    close(arrow.to.y, 730);
    close(arrow.to.x - arrow.from.x, 3500 * (expected.recovered[1] - expected.input[1]));
    assert.deepEqual([...frame.issues, ...layoutIssues(frame)], []);
  }
});

test('SVD constructs the actual first output contribution before the contrast cancels its middle entry', () => {
  const full = model.svdBuild(1);
  for (const p of [0, 0.25, 0.5, 0.75, 1]) {
    const frame = model.svdFrame({
      beat: 1,
      cues: { 'singular-strengths': cue(1), 'svd-output': cue(p) },
    });
    const phases = [Math.min(1, 2 * p), Math.max(0, 2 * p - 1)];
    const expected = model.A.map((_, j) =>
      full.left.reduce((n, u, i) => n + u[j] * full.coefficients[i] * phases[i], 0),
    );
    frame.output.forEach((v, j) => close(v, expected[j]));
  }
  const first = model.svdFrame({ beat: 1, cues: { 'svd-output': cue(0.5) } });
  first.output.forEach((v, i) => close(v, [0.5, 0.5, 1][i]));
  const finished = model.svdFrame({ beat: 1, cues: { 'svd-output': cue(1) } });
  finished.output.forEach((v, i) => close(v, [1, 0, 1][i]));
});

test('restored ticket cards describe the actual separate features while the routing answer waits for its cue', () => {
  const state = { beat: 0, cues: { 'restore-contrast': cue(1) } },
    restored = model.decisionFrame(state);
  assert.notDeepEqual(restored.rows[0], restored.rows[1]);
  const frame = paint('decision', 0, 0.5, state.cues),
    texts = frame.labels.map((l) => l.text);
  assert(
    !texts.some((t) => t.includes('common coordinate retained')),
    'Restored features must not retain the compressed-input label',
  );
  for (let i = 0; i < 3; i++) assert(texts.includes(model.labels[i]));
  assert(!texts.includes('Performance'), 'The final route remains a separate cued construction');
  const routed = paint('decision', 1, 0.5, { 'route-tickets': cue(1) }).labels.map((l) => l.text);
  assert(routed.includes('Performance'));
  assert(routed.includes('Release repair'));
  assert(routed.includes('Both teams'));
});

test('both tickets carry their marks into the shot and meet only on the rollback answer', () => {
  const marks = frame => frame.shapes.filter(s => s.kind === 'circle' && s.width > 20).map(s => s.center);
  const start = paint('intro', 0, 0, {}, 0);
  const moving = paint('intro', 0, 0, {}, 0.4);
  const startMarks = marks(start);
  const movingMarks = marks(moving);
  for (const [i, name] of model.labels.slice(0, 2).entries()) {
    const initial = start.labels.find(label => label.text === name);
    const next = moving.labels.find(label => label.text === name);
    const dx = next.x - initial.x;
    const dy = next.y - initial.y;
    assert(Math.hypot(dx, dy) > 40);
    close(movingMarks[i].x - startMarks[i].x, dx);
    close(movingMarks[i].y - startMarks[i].y, dy);
  }
  const waiting = paint('intro', 1, 0.95);
  const [slow, rollback] = marks(waiting);
  assert(rollback.x > slow.x);
  assert(rollback.y > slow.y);
  for (const progress of [0.5, 1]) {
    const [dot, ring] = marks(paint('intro', 2, 0, { 'count-flags': cue(progress) }));
    assert.deepEqual(dot, slow);
    close(ring.x, rollback.x + (slow.x - rollback.x) * progress);
    close(ring.y, rollback.y + (slow.y - rollback.y) * progress);
  }
});

test('separate narrated output contributions preserve the completed common part while contrast begins', () => {
  const c = { 'singular-strengths': cue(1), 'svd-common-output': cue(1), 'svd-output': cue(0) };
  const first = model.svdFrame({ beat: 1, cues: c });
  first.output.forEach((v, i) => close(v, [0.5, 0.5, 1][i]));
  const final = model.svdFrame({ beat: 1, cues: { ...c, 'svd-output': cue(1) } });
  final.output.forEach((v, i) => close(v, [1, 0, 1][i]));
});

test('turning the PCA measuring direction recomputes projection geometry and squared spread', () => {
  for (const p of [0, 0.25, 0.5, 0.75, 1]) {
    const c = model.spreadFrame({
      beat: 0,
      cues: { 'common-spread': cue(1), 'contrast-spread': cue(p) },
    });
    c.projected.forEach((v, i) => {
      const residual = c.centered[i].map((x, j) => x - v[j]);
      close(
        residual.reduce((n, x, j) => n + x * c.direction[j], 0),
        0,
      );
    });
    close(
      c.energy,
      c.projected.reduce((n, v) => n + v.reduce((s, x) => s + x * x, 0), 0),
    );
  }
  close(
    model.spreadFrame({ cues: { 'common-spread': cue(1), 'contrast-spread': cue(0) } }).energy,
    1 / 3,
  );
  close(
    model.spreadFrame({ cues: { 'common-spread': cue(1), 'contrast-spread': cue(1) } }).energy,
    1,
  );
});

test('the first narrated SVD contribution already draws its actual vector before contrast starts', () => {
  const cues = { 'singular-strengths': cue(1), 'svd-common-output': cue(1), 'svd-output': cue(0) };
  const frame = paint('svd-embed', 0, 0.5, cues),
    vector = frame.connectors.find((c) => c.kind === 'arrow');
  assert(vector, 'the common output contribution must be visible in geometry as well as numbers');
  const modelFrame = model.svdFrame({ beat: 1, cues }),
    pixelsPerUnit = 465 / 3.3;
  close(vector.from.x, 960);
  close(vector.from.y, 522.5);
  close(vector.to.x - vector.from.x, pixelsPerUnit * modelFrame.fixedOutputCoordinates[0]);
  close(vector.from.y - vector.to.y, pixelsPerUnit * modelFrame.fixedOutputCoordinates[1]);
});

test('ticket identities remain clear while their points cross into the feature plane', () => {
  for (let i = 0; i <= 100; i++) {
    const frame = paint('tickets', 0, 0.5, { 'ticket-coordinates': cue(i / 100) });
    assert.deepEqual(
      [...frame.issues, ...layoutIssues(frame)],
      [],
      'ticket transfer at ' + i / 100,
    );
  }
});

test('the rank-collapse grid remains visible while the narration follows its deformation', () => {
  const frame = paint('rank-collapse', 0, 0.5, { 'duplicate-columns': cue(0.5) });
  const targets = frame.targets.filter((t) => t.id === 'duplicate-columns');
  assert(targets.length > 0);
  assert(
    targets.every((target) => target.alpha >= 0.7),
    'the table and the active geometric grid must retain visible paint',
  );
});

test('least squares projects the article target onto A columns with a perpendicular residual', () => {
  const fit = model.leastSquaresFit();
  assert.deepEqual(fit.target, [1, 2, 2]);
  fit.weights.forEach((v, i) => close(v, [2 / 3, 5 / 3][i]));
  fit.prediction.forEach((v, i) => close(v, [2 / 3, 5 / 3, 7 / 3][i]));
  fit.residual.forEach((v, i) => close(v, [1 / 3, 1 / 3, -1 / 3][i]));
  close(fit.squaredError, 1 / 3);
  for (const column of [0, 1])
    close(
      fit.residual.reduce((n, r, i) => n + r * model.A[i][column], 0),
      0,
    );
  for (const p of [0, 0.25, 0.5, 0.75, 1]) {
    const frame = model.leastSquaresFrame({ beat: 1, cues: { 'fit-projection': cue(p) } });
    const error = Math.hypot(...frame.prediction.map((v, i) => v - fit.target[i])) ** 2;
    close(frame.squaredError, error);
    assert(error + 1e-10 >= fit.squaredError);
  }
});

test('the duplicate-feature fit derives the weight sum from the same target before nullspace travel', () => {
  const fit = model.leastSquaresFit(model.B);
  close(fit.weightSum, 1.5);
  assert.deepEqual(fit.prediction, [1.5, 0, 1.5]);
  close(fit.squaredError, 4.5);
  close(
    fit.residual.reduce((n, r, i) => n + r * model.B[i][0], 0),
    0,
  );
  const prior = model.duplicateFitFrame({ cues: { 'duplicate-fit': cue(0) } });
  const fitted = model.duplicateFitFrame({ cues: { 'duplicate-fit': cue(1) } });
  assert(prior.squaredError > fitted.squaredError);
  close(fitted.sum, fit.weightSum);
  close(fitted.outputCoordinates[1], 0);
  close(fitted.targetCoordinates[0], fitted.outputCoordinates[0]);
  for (const p of [0, 0.5, 1]) {
    const r = model.rankFrame({ beat: 1, cues: { 'nullspace-rule': cue(p) } });
    r.prediction.forEach((v, i) => close(v, fit.prediction[i]));
    close(
      r.weights.reduce((n, v) => n + v, 0),
      fit.weightSum,
    );
  }
});

test('the completed PCA comparison retains correctly scaled common and contrast bars together', () => {
  const frame = paint('pca-spread', 0, 0.5, { 'common-spread': cue(1), 'contrast-spread': cue(1) });
  const commonBar = frame.targets.find((t) => t.id === 'pca-common-energy');
  const contrastBar = frame.targets.find((t) => t.id === 'pca-contrast-energy');
  assert(commonBar && contrastBar, 'both measured energy bars remain on screen');
  close(contrastBar.height / commonBar.height, 3);
  assert(commonBar.x + commonBar.width < contrastBar.x);
  assert.deepEqual([...frame.issues, ...layoutIssues(frame)], []);
});

test('retrieval compression creates actual cosine ties and explicit centering fills sparse zeros', () => {
  const original = model.retrievalFrame({ cues: { 'retrieval-ties': cue(0) } });
  const compressed = model.retrievalFrame({ cues: { 'retrieval-ties': cue(1) } });
  close(original.scores[0], 1);
  close(original.scores[1], 0);
  close(original.scores[2], Math.SQRT1_2);
  compressed.scores.forEach((v) => close(v, 1));
  const sparse = model.sparseFrame({ cues: { 'sparse-center': cue(0) } });
  const dense = model.sparseFrame({ cues: { 'sparse-center': cue(1) } });
  assert.equal(sparse.nonzeros, 6);
  assert.equal(dense.nonzeros, 36);
  dense.values[0].forEach((_, column) =>
    close(
      dense.values.reduce((n, row) => n + row[column], 0),
      0,
    ),
  );
});

test('the first common-energy sliver is attached to a persistent horizontal baseline and origin', () => {
  for (const p of [0.0001, 0.001, 0.01, 0.1, 1]) {
    const frame = paint('common-output', 0, 0.5, {
      'common-scores': cue(1),
      'common-energy': cue(p),
    });
    const horizontal = frame.connectors.find(
      (c) => c.from.x === 440 && c.from.y === 887 && c.to.x === 1430 && c.to.y === 887,
    );
    const origin = frame.connectors.find(
      (c) => c.from.x === 440 && c.from.y === 812 && c.to.x === 440 && c.to.y === 897,
    );
    assert(
      horizontal && origin,
      'even the narrow initial contribution needs a connected reference',
    );
    assert.deepEqual([...frame.issues, ...layoutIssues(frame)], []);
  }
});

test('both signed singular-vector pairs preserve the first contribution and reconstructed ticket output', () => {
  for (const p of [0, 0.25, 0.5, 0.75, 1]) {
    const c = model.pairedSignFrame({ cues: { 'signed-right': cue(p) } });
    close(Math.hypot(...c.right), 1);
    close(Math.hypot(...c.left), 1);
    c.firstContribution.forEach((v, i) => close(v, [0.5, 0.5, 1][i]));
    c.output.forEach((v, i) => close(v, [1, 0, 1][i]));
  }
  for (const p of [0, 1]) {
    const frame = paint('svd-sign', 0, 0.5, { 'signed-right': cue(p) });
    const arrows = frame.connectors.filter((c) => c.kind === 'arrow' && c.alpha > 0.9);
    assert.equal(arrows.length, 2, 'both the input and output singular vectors must be visible');
    assert(arrows.every((c) => (c.to.x - c.from.x) * (p ? -1 : 1) > 50));
    assert.deepEqual([...frame.issues, ...layoutIssues(frame)], []);
  }
});

test('the joint contrast result stays hidden through the prediction cue', () => {
  const cues = { 'contrast-scores': cue(1), 'contrast-joint': cue(0), 'contrast-length': cue(0) };
  const before = paint('contrast-output', 0, 0.5, cues);
  assert(before.labels.some((l) => l.text === '-0.707'));
  assert(before.labels.some((l) => l.text === '0.707'));
  assert(!before.labels.some((l) => l.text === '0.000'));
  assert(!before.labels.some((l) => l.text.includes('joint row cancels')));
  assert(before.labels.some((l) => l.text.includes('predict the joint row')));
  const after = paint('contrast-output', 0, 0.5, { ...cues, 'contrast-joint': cue(1) });
  assert(after.labels.some((l) => l.text === '0.000'));
  assert(after.labels.some((l) => l.text.includes('joint row cancels')));
});
