import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import * as model from '../animations/tensor-shapes.mjs';
const reference = JSON.parse(
  await fs.readFile(new URL('./fixtures/tensor-shapes-numpy-reference.json', import.meta.url)),
);
registerLessonFonts();

test('a completed query-key sum reports its computed total once', () => {
  const canvas = createCanvas(1920, 1080),
    scene = { id: 'attention', title: 'Matrix multiplication compares every token pair' };
  const audit = drawFrame(
    canvas.getContext('2d'),
    {},
    scene,
    { beat: 1, beatP: 1, opacity: 1, cues: {} },
    model.draw,
  );
  const totals = audit.labels
    .filter((label) => label.text.startsWith('Σ ='))
    .map((label) =>
      label.text
        .split('=')[1]
        .trim()
        .split('·')
        .map(Number)
        .reduce((a, b) => a * b, 1),
    );
  assert.deepEqual(totals, reference.scores[0][1]);
});

const done = { beatP: 1, cues: {} };
const cue = (phase, progress = 0) => ({ phase, progress, strength: 0 });
const paint = (id, state) =>
  drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    {},
    { id, title: 'Tensor ownership' },
    { opacity: 1, ...state },
    model.draw,
  );

test('the singleton slice prediction withholds the answer until its narration cue begins', () => {
  const before = paint('index', {
    beat: 1,
    beatP: 1,
    cues: { 'keep-singleton-token': cue('before') },
  });
  assert(before.labels.some((label) => label.text === 'Predict which axis stays'));
  assert(
    !before.labels.some((label) => label.text.includes('a slice preserves the token slot')),
    'the footer must leave the token-axis prediction open',
  );
  for (const [phase, progress] of [
    ['during', 0.5],
    ['after', 1],
  ]) {
    const revealed = paint('index', {
      beat: 1,
      beatP: 1,
      cues: { 'keep-singleton-token': cue(phase, progress) },
    });
    assert(
      revealed.labels.some((label) => label.text.includes('a slice preserves the token slot')),
    );
    assert(!revealed.labels.some((label) => label.text === 'Predict which axis stays'));
    assert.deepEqual([...revealed.issues, ...layoutIssues(revealed)], []);
  }
});

test('integer and slice selections retain exactly the NumPy values and axes', () => {
  const result = model.indexFrame({ ...done, beat: 2 });
  assert.deepEqual(result.vector, reference.indexVector);
  assert.deepEqual(result.vectorShape, reference.indexVectorShape);
  assert.deepEqual(result.sliceValues, reference.indexSlice);
  assert.deepEqual(result.sliceShape, reference.indexSliceShape);
  assert.deepEqual(result.bothValues, reference.allMiddleTokens);
  assert.deepEqual(result.bothShape, reference.allMiddleTokensShape);
  assert.equal(
    model.indexFrame({ beat: 0, cues: { 'retain-index-features': cue('during', 0.49) } }).features,
    1,
  );
});

test('broadcasting preserves feature and token semantics, including the same-shape silent error', () => {
  assert.deepEqual(model.broadcastFrame({ ...done, beat: 0 }).shifted, reference.shifted);
  assert.deepEqual(model.tokenShifted, reference.tokenShifted);
  assert.deepEqual(model.wrongSquare, reference.wrongSquareBroadcast);
  assert.deepEqual(model.rightSquare, reference.rightSquareBroadcast);
  assert.notDeepEqual(model.wrongSquare, model.rightSquare);
  const partial = model.broadcastFrame({
    beat: 0,
    cues: { 'add-feature-offsets': cue('during', 0.125) },
  });
  assert.equal(partial.processed, 3);
  assert.deepEqual(partial.placed, [4, 5, 6]);
  assert.equal(partial.active, 7);
});

test('completed reductions and centering agree with independent NumPy execution', () => {
  assert.deepEqual(model.tokenMean, reference.tokenMeans);
  assert.deepEqual(model.featureMean, reference.featureMeans);
  assert.deepEqual(model.reductionFrame({ ...done, beat: 2 }).centered, reference.centered);
  const partial = model.reductionFrame({
    beat: 0,
    cues: { 'pool-token-column': cue('during', 0.24) },
  });
  assert.equal(partial.completed, 0);
  assert.equal(partial.termCount, 2);
  const exact = model.reductionFrame({
    beat: 0,
    cues: { 'pool-token-column': cue('during', 0.25) },
  });
  assert.equal(exact.completed, 1);
  assert.equal(exact.active, 1);
});

test('regrouping, axis permutation and memory sharing retain the independently executed mapping', () => {
  assert.deepEqual(model.layoutFrame({ ...done, beat: 0 }).reshape, reference.reshape[0]);
  assert.deepEqual(model.layoutFrame({ ...done, beat: 1 }).transpose, reference.transpose[0]);
  assert.deepEqual(
    model.layoutFrame({ ...done, beat: 1 }).transposeStrides,
    reference.strides.transpose,
  );
  const basic = model.memoryFrame({ ...done, beat: 0 }),
    copied = model.memoryFrame({ ...done, beat: 1 }),
    flat = model.memoryFrame({ ...done, beat: 2 });
  assert.deepEqual(basic.source, reference.sourceAfterSliceEdit.flat(2));
  assert.deepEqual(copied.source, reference.sourceAfterCopyEdit.flat(2));
  assert.equal(copied.source[0], 0);
  assert.equal(copied.independent[0], -1);
  assert.deepEqual(copied.independent, reference.retrievedCopyAfterEdit.flat(2));
  assert.equal(basic.basicSliceSharesMemory, reference.basicSliceSharesMemory);
  assert.equal(
    copied.retrievedAdvancedIndexSharesMemory,
    !reference.retrievedAdvancedIndexIsIndependent,
  );
  assert.equal(flat.transposeSharesMemory, reference.transposeSharesMemory);
  assert.equal(flat.flattenedTransposeSharesMemory, reference.flattenedTransposeSharesMemory);
  assert.deepEqual(flat.flattened, reference.flattenedTranspose);
  const pending = model.memoryFrame({
    beat: 0,
    cues: { 'edit-shared-value': cue('during', 0.99) },
  });
  assert.equal(pending.source[4], 4);
});

test('widening the accumulator changes arithmetic while the stored inputs stay identical', () => {
  const p = model.precisionFrame();
  assert.deepEqual(p.inputs, reference.precision.inputs);
  assert.equal(p.narrowMean, reference.precision.float32Mean);
  assert.equal(p.wideMean, reference.precision.float64Mean);
  assert.equal(p.narrowFirst, 2 ** 24);
  assert.equal(p.wideFirst, 2 ** 24 + 1);
});

test('the closing construction preserves all word owners while direct reshape has the same shape', () => {
  const frame = model.headFrame({ ...done, beat: 2 });
  assert.deepEqual(frame.correct, reference.heads);
  assert.deepEqual(frame.direct, reference.directHeads);
  assert.deepEqual(frame.correctPair, reference.correctHeadZeroMigrate);
  assert.deepEqual(frame.directPair, reference.directHeadZeroMigrate);
  assert.equal(frame.choiceShown, true);
  const pending = paint('heads', {
    beat: 2,
    beatP: 1,
    cues: { 'reveal-head-mismatch': cue('before'), 'resolve-head-construction': cue('before') },
  });
  assert.equal(pending.labels.filter((l) => l.text === '?').length, 4);
  assert(!pending.labels.some((l) => l.text === 'The correct shape and the correct owner'));
  const shown = paint('heads', {
    beat: 2,
    beatP: 1,
    cues: { 'reveal-head-mismatch': cue('after', 1), 'resolve-head-construction': cue('after', 1) },
  });
  assert(shown.labels.some((l) => l.text === 'These values belong to Birds'));
  assert(shown.labels.some((l) => l.text === 'The correct shape and the correct owner'));
});

test('axis braces stay clear of the retained word labels at native resolution', () => {
  const a = paint('shape', { beat: 0, beatP: 1, cues: {} });
  assert.deepEqual([...a.issues, ...layoutIssues(a)], []);
});

test('reduction arithmetic belongs to its highlighted cells throughout both axis constructions', () => {
  for (const beat of [0, 1]) {
    const completed = new Set();
    for (let step = 0; step <= 120; step++) {
      const progress = step / 120,
        grids = [],
        equations = [];
      const audit = drawFrame(
        createCanvas(1920, 1080).getContext('2d'),
        {},
        { id: 'reduce', title: 'Choose the direction to summarize' },
        {
          beat,
          beatP: 1,
          opacity: 1,
          cues: {
            [beat === 0 ? 'pool-token-column' : 'pool-feature-row']: cue(
              progress === 0 ? 'before' : progress === 1 ? 'after' : 'during',
              progress,
            ),
          },
        },
        (ctx, scene, state, api) => {
          const observed = Object.create(api),
            teaching = Object.create(api.teaching);
          Object.defineProperty(teaching, 'grid', {
            value: (options) => {
              grids.push(options);
              return api.teaching.grid(options);
            },
          });
          Object.defineProperty(observed, 'teaching', { value: teaching });
          Object.defineProperty(observed, 'math', {
            value: (canvasCtx, expression, x, ...args) => {
              equations.push({ expression, x });
              return api.math(canvasCtx, expression, x, ...args);
            },
          });
          model.draw(ctx, scene, state, observed);
        },
      );
      for (const batch of [0, 1]) {
        const source = grids.find((grid) => grid.x === 300 + batch * 900 && grid.y === 345);
        assert(
          source.highlights.length === (beat === 0 ? 3 : 4),
          'one complete column or row stays selected',
        );
        const values = source.highlights.map((cell) => source.labels[cell.row][cell.column]);
        if (beat === 0) assert.equal(new Set(source.highlights.map((cell) => cell.column)).size, 1);
        else assert.equal(new Set(source.highlights.map((cell) => cell.row)).size, 1);
        const equation = equations.find((value) => value.x === 540 + batch * 900);
        if (equation) {
          const match = equation.expression.match(/^\\frac\{([\d+]+)\}\{(\d+)\}=(.+)$/);
          assert(match, equation.expression);
          assert.deepEqual(
            match[1].split('+').map(Number),
            values,
            'the displayed numerator must use the highlighted cells',
          );
          assert.equal(
            Number(match[2]),
            values.length,
            'the divisor counts the highlighted values',
          );
          const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
          assert.equal(Number(match[3]), mean, 'the result is the highlighted mean');
          const selected = beat === 0 ? source.highlights[0].column : source.highlights[0].row;
          const output = grids.find((grid) => grid.x === 300 + batch * 900 && grid.y === 770);
          assert.equal(
            output.labels[0][selected],
            mean,
            'the completed mean stays in its matching output slot',
          );
          completed.add(batch + ':' + selected);
        } else {
          const partial = audit.labels.find(
            (label) =>
              label.x >= 300 + batch * 900 &&
              label.x < 780 + batch * 900 &&
              label.y > 650 &&
              label.y < 710 &&
              /^\d+(?: \+ \d+)*$/.test(label.text),
          );
          if (partial) {
            const terms = partial.text.split(' + ').map(Number);
            assert.deepEqual(
              terms,
              values.slice(0, terms.length),
              'partial terms must come from the selected cells',
            );
          }
        }
      }
      assert.deepEqual(
        [...audit.issues, ...layoutIssues(audit)],
        [],
        'reduction progress ' + progress,
      );
    }
    assert.equal(
      completed.size,
      beat === 0 ? 8 : 6,
      'each mean gets a complete, owned equation before the next group starts',
    );
  }
});

test('word owners remain visible throughout the physical head-axis move', () => {
  for (const progress of [0, 0.01, 0.25, 0.5, 0.7, 1]) {
    const a = paint('heads', {
      beat: 1,
      beatP: progress,
      cues: {
        'move-head-axis': cue(
          progress === 0 ? 'before' : progress === 1 ? 'after' : 'during',
          progress,
        ),
      },
    });
    for (const word of ['Birds', 'migrate', 'south'])
      assert(
        a.labels.some((l) => l.text === word),
        word + ' at ' + progress,
      );
    assert.deepEqual([...a.issues, ...layoutIssues(a)], []);
  }
});

test('a partially revealed score-transfer arrow keeps its tip on the named key cell', () => {
  for (const progress of [0.05, 0.2, 0.4, 0.5, 0.7, 0.9]) {
    const a = paint('attention', {
      beat: 2,
      beatP: 0.2,
      t: 1,
      cues: {
        'migrate-score-row-b3-1': { ...cue('during', progress), start: 0, end: 2, linger: 0 },
        'pair-grid-shape-b3-2': { ...cue('before'), start: 4, end: 5, linger: 0 },
      },
    });
    const arrow = a.connectors.find((c) => c.kind === 'arrow');
    assert(arrow);
    const keyIndex = Math.floor(progress * 3);
    assert.deepEqual(arrow.to, { x: 847 + 205 * keyIndex, y: 578 });
    const named = a.labels.find(
      (l) => l.text === ['Birds', 'migrate', 'south'][keyIndex] && l.y < 425 && l.x > 650,
    );
    assert(named);
  }
});
