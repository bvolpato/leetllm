import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import * as animation from '../animations/transformer.mjs';
import { drawFrame, C } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { findArrowheadOcclusions } from '../lib/arrowhead-occlusion.mjs';

registerLessonFonts();
const cue = (progress) => ({
  phase: progress === 0 ? 'before' : progress === 1 ? 'after' : 'during',
  progress,
  strength: 0,
});
const state = (beat, cues) => ({ beat, beatP: 0.5, t: 12, duration: 50, opacity: 1, cues });
const near = (actual, expected) =>
  assert(Math.abs(actual - expected) < 1e-12, `${actual} != ${expected}`);
function render(id, s) {
  const canvas = createCanvas(1920, 1080),
    frame = drawFrame(canvas.getContext('2d'), {}, { id, title: 'Transformer' }, s, animation.draw);
  assert.deepEqual([...frame.issues, ...layoutIssues(frame)], []);
  return { ...frame, canvas };
}

test('the carried row comes from its token ID and own position, then normalizes across its features', () => {
  assert.equal(animation.validateModel(), true);
  assert.deepEqual(
    animation.INPUT[2],
    animation.EMBED[2].map((v, i) => v + animation.position(2)[i]),
  );
  const partial = animation.embeddingFrame(state(1, { 'position-add': cue(0.5) }));
  assert.equal(partial.coordinates, 2);
  const centered = animation.normalizationFrame(state(0, { 'center-row': cue(1) }));
  near(
    centered.points.reduce((a, n) => a + n, 0),
    0,
  );
  const normalized = animation.normalizationFrame(state(1, { 'rescale-row': cue(1) }));
  assert.deepEqual(normalized.points, animation.MODEL.N[2]);
  near(
    normalized.points.reduce((a, n) => a + n * n, 0) / 4,
    normalized.variance / (normalized.variance + 1e-5),
  );
});

test('each whole weighted vector joins the persistent mixture only when its spoken transfer completes', () => {
  for (let source = 0; source < 3; source++) {
    const id = ['mix-function', 'mix-returns', 'mix-the'][source];
    for (const p of [0, 0.5, 1]) {
      const f = animation.attentionMixFrame(source, 0.02, { [id]: cue(p) });
      f.sum.forEach((v, j) =>
        near(
          v,
          f.products.slice(0, source).reduce((a, row) => a + row[j], 0) +
            (p === 1 ? f.products[source][j] : 0),
        ),
      );
      assert.equal(f.count, source + (p === 1 ? 1 : 0));
    }
  }
  const complete = animation.attentionMixFrame(2, 0.02, { 'mix-the': cue(1) });
  assert.deepEqual(complete.sum, animation.MODEL.A[2]);
  assert.deepEqual(animation.attentionMixFrame(2, 0.95, { 'mix-the': cue(1) }).sum, complete.sum);
});

test('the full block respects causal direction while the two residual branches retain their exact operands', () => {
  const m = animation.MODEL;
  m.Y.forEach((row, i) => row.forEach((v, j) => near(v, animation.INPUT[i][j] + 0.35 * m.A[i][j])));
  m.Z.forEach((row, i) => row.forEach((v, j) => near(v, m.Y[i][j] + m.F[i][j])));
  assert.deepEqual(
    m.H,
    m.pre.map((row) => row.map((v) => Math.max(0, v))),
  );
  const changed = animation.INPUT.map((row) => [...row]);
  changed[2][0] += 4;
  const future = animation.compute(changed);
  assert.deepEqual(future.Z.slice(0, 2), m.Z.slice(0, 2));
  assert.notDeepEqual(future.Z[2], m.Z[2]);
  changed[2][0] -= 4;
  changed[0][0] += 4;
  assert(
    animation
      .compute(changed)
      .Z.every((row, i) => row.some((v, j) => Math.abs(v - m.Z[i][j]) > 1e-8)),
  );
});

test('the result dot product uses the completed final normalized row and reveals its actual four products', () => {
  const early = state(0, {
    'final-normalization': cue(0.5),
    'result-product': cue(1),
    'vocabulary-products': cue(0),
  });
  assert.equal(animation.choiceFrame(early).resultKnown, false);
  const before = render('logits', early);
  assert(!before.labels.some((l) => l.text.startsWith('sum ≈')));
  const middle = state(0, {
    'final-normalization': cue(1),
    'result-product': cue(0.5),
    'vocabulary-products': cue(0),
  });
  assert.equal(animation.choiceFrame(middle).productCount, 2);
  const held = render(
    'logits',
    state(0, {
      'final-normalization': cue(1),
      'result-product': cue(1),
      'vocabulary-products': cue(0),
    }),
  );
  assert(held.labels.some((l) => l.text === 'sum ≈ ' + animation.MODEL.logits[3].toFixed(3)));
  near(
    animation.MODEL.logits[3],
    animation.MODEL.final[2].reduce((a, v, j) => a + v * animation.WOUT[3][j], 0),
  );
});

test('a shared complete denominator precedes the actual probability shares, with focus disabled', () => {
  assert.equal(
    animation.choiceFrame(
      state(1, { 'next-token-probabilities-b2-1': cue(0.5), 'probability-shares': cue(1) }),
    ).shareCount,
    0,
  );
  const renderShares = (progress) =>
    render(
      'logits',
      state(1, { 'next-token-probabilities-b2-1': cue(1), 'probability-shares': cue(progress) }),
    );
  const before = renderShares(0),
    during = renderShares(0.5),
    held = renderShares(1);
  const pixels = (f) => f.canvas.getContext('2d').getImageData(240, 755, 1440, 52).data;
  const a = pixels(before),
    b = pixels(during),
    c = pixels(held);
  assert(a.some((v, i) => v !== b[i]));
  assert(b.some((v, i) => v !== c[i]));
  near(
    animation.MODEL.probs.reduce((a, p) => a + p, 0),
    1,
  );
  assert.equal(animation.choiceFrame(state(2, { 'greedy-choice': cue(0.5) })).choice, null);
  assert.equal(animation.choiceFrame(state(3, { 'greedy-choice': cue(1) })).choice, 3);
});

test('the chosen actual ID is re-embedded at the new position and earns a different second choice', () => {
  assert.deepEqual(animation.FEEDBACK_IDS, [0, 1, 2, animation.MODEL.choice]);
  assert.deepEqual(
    animation.FEEDBACK_INPUT[3],
    animation.EMBED[3].map((v, j) => v + animation.position(3)[j]),
  );
  assert.deepEqual(animation.FEEDBACK.Z.slice(0, 3), animation.MODEL.Z);
  assert.notDeepEqual(animation.FEEDBACK.final[3], animation.MODEL.final[2]);
  assert.deepEqual(
    [0, 0.4, 0.8, 1].map(
      (p) => animation.feedbackFrame(state(1, { 'feedback-state': cue(p) })).stage,
    ),
    [0, 1, 2, 3],
  );
  assert.equal(animation.feedbackFrame(state(3, { 'feedback-choice': cue(0.5) })).choice, null);
  assert.equal(
    animation.feedbackFrame(state(3, { 'feedback-point': cue(1), 'feedback-choice': cue(1) }))
      .choice,
    5,
  );
  assert.equal(
    animation.FEEDBACK.choice,
    animation.FEEDBACK.probs.indexOf(Math.max(...animation.FEEDBACK.probs)),
  );
});

test('actual full-block causal differences leave a clear gutter before their numerical readouts', () => {
  for (const s of [
    state(1, { 'change-future': cue(1), 'compare-future': cue(1), 'change-past': cue(0) }),
    state(2, { 'change-past': cue(1), 'compare-past': cue(1) }),
  ]) {
    const frame = render('causality', s),
      bars = frame.shapes.filter((shape) => shape.kind === 'rect' && shape.height === 45);
    const labels = frame.labels.filter((label) => label.text.startsWith('output change '));
    assert.equal(bars.length, labels.length);
    bars.forEach((bar, i) =>
      assert(
        bar.x + bar.width + 24 <= labels[i].x,
        'the causal-change bar must leave a 24px gutter before its actual readout',
      ),
    );
  }
});

test('the held contextual blend is three actual head-to-tail value contributions on equal coordinate scales', () => {
  const frame = render('attention', state(2, { 'mix-the': cue(1) }));
  const arrows = frame.connectors.filter((c) => c.kind === 'arrow');
  assert.equal(
    arrows.length,
    3,
    'three mathematical contribution vectors must construct the held mixture',
  );
  const products = animation.MODEL.V.map((row, i) =>
    row.map((v) => v * animation.MODEL.weights[2][i]),
  );
  const scale = (arrows[0].to.x - arrows[0].from.x) / products[0][0];
  arrows.forEach((arrow, i) => {
    near((arrow.to.x - arrow.from.x) / scale, products[i][0]);
    near((arrow.from.y - arrow.to.y) / scale, products[i][3]);
    if (i) {
      near(arrow.from.x, arrows[i - 1].to.x);
      near(arrow.from.y, arrows[i - 1].to.y);
    }
  });
  const reference = frame.paths.find((p) => p.id === 'attention-sum-reference');
  assert(reference, 'the completed blend retains its labeled computed-point reference');
  const last = arrows[2],
    length = Math.hypot(last.to.x - last.from.x, last.to.y - last.from.y);
  near(reference.points[0].x, last.to.x + (10 * (last.to.x - last.from.x)) / length);
  near(reference.points[0].y, last.to.y + (10 * (last.to.y - last.from.y)) / length);
  assert(frame.labels.some((l) => l.text === 'read'));
  assert.equal(
    frame.shapes.filter((s) => s.kind === 'circle' && s.fillAlpha > 0.5 && s.width === 24).length,
    3,
    'the three original value-point markers keep their owners and positions',
  );
});

test('the same residual slice translates actual full rows while an unchanged coordinate stays neutral', () => {
  const s = state(1, { 'residual-add': cue(0.5) }),
    f = animation.residualSpatialFrame(s),
    frame = render('residual', s);
  f.current.forEach((v, j) => near(v, animation.INPUT[2][j] + 0.5 * animation.MODEL.update[2][j]));
  const arrow = frame.connectors.find((c) => c.kind === 'arrow'),
    scale = (arrow.to.x - arrow.from.x) / (f.current[0] - animation.INPUT[2][0]);
  near((arrow.from.y - arrow.to.y) / scale, f.current[3] - animation.INPUT[2][3]);
  const second = animation.ffnSpatialFrame(
    state(2, { 'ffn-project': cue(1), 'ffn-add': cue(0.5) }),
  );
  second.current.forEach((v, j) =>
    near(v, animation.MODEL.Y[2][j] + 0.5 * animation.MODEL.F[2][j]),
  );
  const native = render('feed-forward', state(2, { 'ffn-project': cue(1), 'ffn-add': cue(0.5) }));
  const arrows = native.connectors.filter((c) => c.kind === 'arrow');
  near(arrows[1].from.x, arrows[1].to.x);
  const rgba = native.canvas.getContext('2d').getImageData(1080, 735, 165, 78).data;
  const pixels = (color) => {
    const rgb = color
      .slice(1)
      .match(/../g)
      .map((v) => parseInt(v, 16));
    let n = 0;
    for (let i = 0; i < rgba.length; i += 4)
      if (rgb.every((v, j) => Math.abs(rgba[i + j] - v) < 8)) n++;
    return n;
  };
  assert(pixels(C.muted) > 100);
  assert.equal(pixels(C.green), 0, 'the unchanged first coordinate must stay neutral');
  for (const p of [0.25, 0.5, 0.75]) {
    const partial = render('feed-forward', state(2, { 'ffn-project': cue(1), 'ffn-add': cue(p) }));
    assert(
      !partial.labels.some((l) => l.text === 'Z'),
      'the final block-output label must wait for the completed addition',
    );
  }
  assert(
    render('feed-forward', state(2, { 'ffn-project': cue(1), 'ffn-add': cue(1) })).labels.some(
      (l) => l.text === 'Z',
    ),
  );
});

test('the pairwise boundary uses actual output weights and withholds the new computed point and winner', () => {
  const before = render(
    'feedback',
    state(3, { 'feedback-point': cue(0.5), 'feedback-choice': cue(1) }),
  );
  assert(
    before.shapes.some((s) => s.kind === 'circle' && s.width === 32),
    'the same owned marker moves while its numeric answer stays held',
  );
  assert.equal(
    animation.decisionSpatialFrame(
      state(3, { 'feedback-point': cue(0.5), 'feedback-choice': cue(1) }),
    ).choice,
    null,
  );
  const focused = render(
    'feedback',
    state(3, {
      'feedback-point': {
        ...cue(0.5),
        id: 'feedback-point',
        active: true,
        strength: 1,
        targets: ['decision-comparison', 'full-vocabulary-scores'],
        color: 'cyan',
      },
      'feedback-choice': cue(0),
    }),
  );
  assert(
    focused.shapes.some((s) => s.kind === 'circle' && s.width === 24),
    'the original computed point remains painted during the new-point cue',
  );
  assert(
    !focused.labels.some((l) => l.text === '2'),
    'the destination label waits for completed motion',
  );
  const held = render(
    'feedback',
    state(3, { 'feedback-point': cue(1), 'feedback-choice': cue(1) }),
  );
  const diagonal = held.paths.find(
    (p) =>
      p.points.length === 2 &&
      p.points[1].x - p.points[0].x > 400 &&
      p.points[0].y - p.points[1].y > 400,
  );
  assert(diagonal, 'the pairwise tie must be painted in the coordinate plane');
  const [start, end] = diagonal.points;
  near(end.x - start.x, start.y - end.y);
  for (const [model, radius, row] of [
    [animation.MODEL, 24, animation.MODEL.final[2]],
    [animation.FEEDBACK, 32, animation.FEEDBACK.final[3]],
  ]) {
    const marker = held.shapes.find((s) => s.kind === 'circle' && s.width === radius);
    near(marker.center.x, start.x + (row[2] / 1.5) * (end.x - start.x));
    near(marker.center.y, start.y - (row[3] / 1.5) * (start.y - end.y));
    near(model.logits[3] - model.logits[5], row[3] - row[2]);
    assert(
      model.logits
        .filter((_, i) => i !== 3 && i !== 5)
        .every((v) => v < Math.min(model.logits[3], model.logits[5])),
    );
  }
  assert(animation.MODEL.final[2][3] > animation.MODEL.final[2][2]);
  assert(animation.FEEDBACK.final[3][3] < animation.FEEDBACK.final[3][2]);
});

test('computed attention and residual states preserve their mathematical arrow tips', () => {
  const cases = [
    ['attention', state(0, { 'mix-function': cue(1) })],
    ['attention', state(1, { 'mix-returns': cue(0.5) })],
    ['attention', state(2, { 'mix-the': cue(1) })],
    ...[0.25, 0.5, 1].map((p) => ['residual', state(1, { 'residual-add': cue(p) })]),
    ...[0.25, 0.5, 1].map((p) => [
      'feed-forward',
      state(2, { 'ffn-project': cue(1), 'ffn-add': cue(p) }),
    ]),
  ];
  for (const [id, s] of cases) {
    const frame = render(id, s);
    assert.deepEqual(
      findArrowheadOcclusions(frame),
      [],
      id + ' fills a computed circle over a mathematical arrow tip',
    );
  }
});

test('prediction beats withhold the new choice and fresh numerical read until their separate completed reveal', () => {
  assert.equal(animation.choiceFrame(state(2, { 'greedy-choice': cue(1) })).choice, null);
  assert.equal(
    animation.decisionSpatialFrame(
      state(2, { 'feedback-point': cue(1), 'feedback-choice': cue(1) }),
    ).known,
    false,
  );
  for (const progress of [0, 0.5, 0.999, 1]) {
    const frame = animation.extendedFrame(
      'fresh-decoder',
      state(1, {
        'tr-fresh-decoder-scores': cue(progress),
        'tr-fresh-decoder-shares': cue(progress),
        'tr-fresh-decoder-read': cue(progress),
      }),
    );
    assert.equal(frame.readKnown, progress === 1);
    assert.equal(frame.sharesKnown, progress === 1);
  }
  const split = animation.splitHeads(animation.HEAD_WORKSHEET);
  assert.equal(split.length, 3);
  assert(split.every((h) => h.length === 3 && h.every((r) => r.length === 2)));
  assert.deepEqual(animation.mergeHeads(split), animation.HEAD_WORKSHEET);
  near(animation.FRESH.read[0], 4 * animation.FRESH.weights[0]);
  near(animation.FRESH.read[1], 2 * animation.FRESH.weights[1]);
  assert.notDeepEqual(animation.FRESH.read, animation.FRESH.wrong);
});

test('unmasked reads follow a row permutation without claiming input rows equal attention outputs', () => {
  const order = [2, 0, 1],
    original = animation.unmaskedRead(animation.INPUT),
    permuted = animation.unmaskedRead(order.map((i) => animation.INPUT[i]));
  permuted.forEach((r, i) => r.forEach((x, j) => near(x, original[order[i]][j])));
  assert.notDeepEqual(original, animation.INPUT);
});

test('a fresh read accumulates supplied value contributions before its complete numerical reveal', () => {
  const cues = {
    'tr-fresh-decoder-voice-1': cue(0.8),
    'tr-fresh-decoder-scores': cue(1),
    'tr-fresh-decoder-shares': cue(1),
    'tr-fresh-decoder-read': cue(0),
  };
  const before = render(
    'fresh-decoder',
    state(1, { ...cues, 'tr-fresh-decoder-accumulate': cue(0) }),
  );
  assert.equal(before.connectors.filter((x) => x.kind === 'arrow').length, 0);
  const mid = render(
    'fresh-decoder',
    state(1, { ...cues, 'tr-fresh-decoder-accumulate': cue(0.5) }),
  );
  assert.equal(mid.connectors.filter((x) => x.kind === 'arrow').length, 1);
  const after = render(
    'fresh-decoder',
    state(1, { ...cues, 'tr-fresh-decoder-read': cue(1), 'tr-fresh-decoder-accumulate': cue(1) }),
  );
  assert.equal(after.connectors.filter((x) => x.kind === 'arrow').length, 2);
  assert.deepEqual(findArrowheadOcclusions(after), []);
});

test('both coordinate operands can merge and reach their owned result without crossing live labels or panels', () => {
  for (const progress of [
    0.0125, 0.025, 0.05, 0.075, 0.1, 0.15, 0.2, 0.24, 0.275, 0.325, 0.45, 0.55, 0.7, 0.8, 0.95,
    0.99,
  ])
    render('embedding', state(1, { 'position-add': cue(progress) }));
});
