import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import * as model from '../animations/vectors.mjs';

registerLessonFonts();
const cue = (progress) => ({
  progress,
  phase: progress === 0 ? 'before' : progress === 1 ? 'after' : 'during',
  strength: 0,
});
const state = (beat, cues = {}) => ({ beat, beatP: 0.99, t: 10, duration: 40, opacity: 1, cues });
const near = (actual, expected) =>
  assert(Math.abs(actual - expected) < 1e-10, actual + ' differs from ' + expected);
const product = (vector, matrix) =>
  matrix[0].map((_, j) => vector.reduce((sum, value, i) => sum + value * matrix[i][j], 0));
function render(id, s) {
  const canvas = createCanvas(1920, 1080);
  const audit = drawFrame(
    canvas.getContext('2d'),
    {},
    { id, title: 'One Word, Many Coordinates' },
    s,
    model.draw,
  );
  assert.deepEqual([...audit.issues, ...layoutIssues(audit)], []);
  return audit;
}

test('the row-vector map and composed rule agree on independent inputs', () => {
  assert.equal(model.validateModel(), true);
  assert.deepEqual(model.COMPOSED, [
    [1.5, 0.5],
    [0.5, 1.5],
  ]);
  for (const a of [-0.5, 0, 0.25, 1.5])
    for (const b of [-0.5, 0.5, 1]) {
      const row = [a, b],
        intermediate = product(row, model.P);
      assert.deepEqual(model.transform(row), intermediate);
      product(intermediate, model.R).forEach((value, j) =>
        near(value, product(row, model.COMPOSED)[j]),
      );
      near(intermediate[2], (intermediate[0] + intermediate[1]) / 2);
    }
});

test('the vector sum stays covered until the narrated join has completed', () => {
  for (const p of [0, 0.25, 0.5, 0.99]) {
    const s = state(2, { 'join-vectors': cue(p) }),
      f = model.mixtureFrame(s);
    assert.equal(f.result, null);
    assert.deepEqual(f.rows, [
      [0.5, 0, 0.25],
      [0, 0.5, 0.25],
    ]);
    f.secondTip.forEach((value, j) => near(value - f.secondOrigin[j], f.rows[1][j]));
    assert.equal(render('mixture', s).shapes.filter((shape) => shape.kind === 'circle').length, 0);
  }
  assert.deepEqual(
    model.mixtureFrame(state(2, { 'join-vectors': cue(1) })).result,
    [0.5, 0.5, 0.5],
  );
});

test('the plotted join preserves full-vector contributions and equal coordinate units', () => {
  const frame = render('mixture', state(2, { 'join-vectors': cue(1) }));
  const [first, second] = frame.connectors.filter((item) => item.kind === 'arrow');
  const scale = (first.to.x - first.from.x) / 0.5;
  near((first.from.y - first.to.y) / scale, 0.25);
  near(second.from.x, first.to.x);
  near(second.from.y, first.to.y);
  near((second.from.y - second.to.y) / scale, 0.25);
  near(second.to.x, second.from.x);
  near((second.to.x - first.from.x) / scale, 0.5);
  near((first.from.y - second.to.y) / scale, 0.5);
});

test('the downstream accumulator and direct route reach the same actual point', () => {
  const downstream = model.compositionFrame(
    state(0, {
      'downstream-first': cue(1),
      'downstream-second': cue(1),
      'downstream-third': cue(1),
    }),
  );
  assert.deepEqual(downstream.sum, [1, 1]);
  const partial = model.compositionFrame(
    state(2, { 'direct-first': cue(1), 'direct-second': cue(0) }),
  );
  assert.deepEqual(partial.directSum, [0.75, 0.25]);
  assert.equal(partial.directComplete, false);
  const complete = model.compositionFrame(
    state(2, { 'direct-first': cue(1), 'direct-second': cue(1) }),
  );
  assert.deepEqual(complete.directSum, downstream.sum);
  assert.equal(complete.directComplete, true);
  const frame = render(
    'composition',
    state(2, { 'direct-first': cue(1), 'direct-second': cue(1) }),
  );
  const arrows = frame.connectors.filter((item) => item.kind === 'arrow');
  near(arrows[1].from.x, arrows[0].to.x);
  near(arrows[1].from.y, arrows[0].to.y);
  const reference = frame.shapes.find((shape) => shape.kind === 'circle' && shape.fillAlpha === 0);
  assert(reference, 'the completed two-stage route keeps an outlined reference point');
  near(reference.center.x, arrows.at(-1).to.x);
  near(reference.center.y, arrows.at(-1).to.y);
});

test('each word output waits for its own completed row operation', () => {
  const cues = { 'row-reset': cue(0), 'row-my': cue(0), 'row-password': cue(0) };
  assert.equal(model.rowsFrame(state(1, cues)).completed, 0);
  assert.equal(
    render('rows', state(1, cues)).labels.filter((label) => label.text === '?').length,
    9,
  );
  cues['row-reset'] = cue(1);
  assert.equal(model.rowsFrame(state(1, cues)).completed, 1);
  assert.equal(
    model.rowsFrame(state(1, cues)).active,
    0,
    'reset retains ownership until the next spoken row begins',
  );
  assert.equal(
    render('rows', state(1, cues)).labels.filter((label) => label.text === '?').length,
    6,
  );
  cues['row-my'] = cue(0.5);
  assert.equal(model.rowsFrame(state(1, cues)).completed, 1);
  assert.equal(model.rowsFrame(state(1, cues)).active, 1);
  cues['row-my'] = cue(1);
  assert.equal(
    model.rowsFrame(state(1, cues)).active,
    1,
    'my retains ownership while its completed result is held',
  );
  cues['row-password'] = cue(0.1);
  assert.equal(model.rowsFrame(state(1, cues)).active, 2);
});

test('a local hidden-state intervention changes one owned row and leaves five controls intact', () => {
  const before = structuredClone(model.H);
  assert.deepEqual(model.localEditFrame(state(0)).changed, []);
  for (const p of [0.01, 0.25, 0.5, 1]) {
    const f = model.localEditFrame(state(1, { 'change-password': cue(p) }));
    assert.deepEqual(f.changed, [[0, 2]]);
    assert.deepEqual(f.hidden[0][2], [0.5 + p, 0.5]);
    [p, 0, 0.5 * p].forEach((delta, j) => near(f.delta[j], delta));
    for (const [b, t] of [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
      [1, 2],
    ])
      assert.deepEqual(f.output[b][t], model.BASE_OUTPUT[b][t]);
  }
  assert.deepEqual(model.H, before);
  assert.deepEqual(model.localEditFrame(state(2)).selected, [1.5, 0.5, 1]);
});

test('the actual input and output trajectories encode the same local edit', () => {
  const frame = render('local-edit', state(1, { 'change-password': cue(0.5) }));
  const [input, output] = frame.connectors.filter((item) => item.kind === 'arrow');
  const unitScale = (input.to.x - input.from.x) / 0.5;
  near(input.from.y, input.to.y);
  near((output.to.x - output.from.x) / unitScale, 0.5);
  near((output.from.y - output.to.y) / unitScale, 0.25);
});

test('mathematical arrowheads remain visible instead of becoming filled endpoint dots', () => {
  const cases = [
    ['mixture', state(2, { 'join-vectors': cue(1) })],
    [
      'composition',
      state(0, {
        'downstream-first': cue(1),
        'downstream-second': cue(1),
        'downstream-third': cue(1),
      }),
    ],
    ['composition', state(2, { 'direct-first': cue(1), 'direct-second': cue(1) })],
    ['local-edit', state(1, { 'change-password': cue(1) })],
  ];
  for (const [id, s] of cases) {
    const frame = render(id, s),
      arrows = frame.connectors.filter((item) => item.kind === 'arrow');
    assert(arrows.length > 0);
    for (const arrow of arrows) {
      const covered = frame.shapes
        .filter(
          (shape) =>
            shape.kind === 'circle' && shape.fillAlpha >= 0.25 && shape.order > arrow.order,
        )
        .some(
          (shape) =>
            ((arrow.to.x - shape.center.x) / (shape.width / 2)) ** 2 +
              ((arrow.to.y - shape.center.y) / (shape.height / 2)) ** 2 <
            1,
        );
      assert.equal(covered, false, id + ' paints an opaque dot over a triangular arrow tip');
    }
  }
});
