import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { draw, bendFrame, heldoutFrame } from '../animations/linear-regression.mjs';
import { C, drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { frameState } from '../lib/lesson.mjs';
import { readFile } from 'node:fs/promises';
registerLessonFonts();

test('the oversized-update history contains completed steps while the parameter marker moves between them', () => {
  const ctx = createCanvas(1920, 1080).getContext('2d');
  for (const progress of [0.17, 0.35, 0.5, 0.65, 0.77]) {
    const frame = drawFrame(
      ctx,
      {},
      { id: 'fit', title: 'Gradient descent' },
      { t: 45, duration: 57, opacity: 1, beat: 2, beatP: progress },
      draw,
    );
    const points = frame.shapes
      .filter(
        (shape) =>
          shape.kind === 'circle' &&
          Math.abs(shape.width - 10) < 1e-6 &&
          shape.center.x >= 1175 &&
          shape.center.y >= 900 &&
          shape.center.y <= 985,
      )
      .map((shape) => shape.center);
    assert(points.length > 0);
    for (const point of points) {
      const update = (point.x - 1175) / 63.75;
      assert(
        Math.abs(update - Math.round(update)) < 1e-8,
        'the update-history chart must use integer optimizer steps',
      );
    }
    for (let i = 1; i < points.length; i++)
      assert(
        points[i].y <= points[i - 1].y,
        'completed oversized updates must have increasing loss',
      );
    assert(
      frame.labels.some((label) => label.text.startsWith('Large-rate run · MSE ')),
      'keep the moving current-loss readout',
    );
  }
});

const cue = (id, progress, targets, color = 'blue') => ({
  [id]: {
    progress,
    phase: progress === 0 ? 'before' : progress === 1 ? 'after' : 'during',
    active: progress > 0 && progress < 1,
    strength: progress > 0 && progress < 1 ? 1 : 0,
    targets,
    color,
  },
});
function render(scene, state) {
  const canvas = createCanvas(1920, 1080),
    ctx = canvas.getContext('2d');
  const frame = drawFrame(
    ctx,
    {},
    { id: scene, title: 'Linear regression' },
    { t: 5, duration: 20, opacity: 1, ...state },
    draw,
  );
  assert.deepEqual([...frame.issues, ...layoutIssues(frame)], []);
  return { ...frame, canvas };
}
function pixels(frame, bounds, color) {
  const rgb = color
    .slice(1)
    .match(/../g)
    .slice(0, 3)
    .map((v) => Number.parseInt(v, 16));
  const data = frame.canvas.getContext('2d').getImageData(...bounds).data;
  let count = 0;
  for (let i = 0; i < data.length; i += 4)
    if (rgb.every((value, c) => Math.abs(data[i + c] - value) < 10)) count++;
  return count;
}

test('a spoken coefficient update changes and highlights its prediction and miss while the other coefficient stays neutral', () => {
  for (const beat of [0, 1]) {
    const id = beat === 0 ? 'intercept-update' : 'slope-update',
      color = beat === 0 ? C.blue : C.cyan;
    const before = render('line', {
      beat,
      beatP: 0.99,
      cues: cue(id, 0, ['coefficient-change'], beat === 0 ? 'blue' : 'cyan'),
    });
    const moving = render('line', {
      beat,
      beatP: 0.01,
      cues: cue(id, 0.5, ['coefficient-change'], beat === 0 ? 'blue' : 'cyan'),
    });
    const held = render('line', {
      beat,
      beatP: 0.01,
      cues: cue(id, 1, ['coefficient-change'], beat === 0 ? 'blue' : 'cyan'),
    });
    const prediction = (frame) => frame.labels.find((l) => l.text.startsWith('prediction ')).text;
    assert.equal(
      prediction(before),
      beat === 0 ? 'prediction ≈ 115.0 ms' : 'prediction ≈ 130.0 ms',
    );
    assert.equal(
      prediction(moving),
      beat === 0 ? 'prediction ≈ 122.5 ms' : 'prediction ≈ 145.0 ms',
    );
    assert.equal(prediction(held), beat === 0 ? 'prediction ≈ 130.0 ms' : 'prediction ≈ 160.0 ms');
    const changing = beat === 0 ? [1250, 330, 180, 80] : [1540, 330, 180, 80],
      fixed = beat === 0 ? [1540, 330, 180, 80] : [1250, 330, 180, 80];
    for (const region of [changing, [1220, 485, 550, 90], [1220, 640, 550, 90]])
      assert(
        pixels(moving, region, color) > 40,
        'each dependent value must visibly share the update color',
      );
    assert.equal(pixels(moving, fixed, color), 0, 'the fixed coefficient must stay neutral');
    assert(pixels(moving, fixed, C.ink) > 40, 'the fixed coefficient must remain visibly painted');
    const marker = moving.shapes.find(
      (s) =>
        s.kind === 'circle' && s.width === 24 && Math.abs(s.center.x - (210 + (900 * 3) / 7)) < 1,
    );
    assert(marker, 'keep the selected prediction marker on its fixed input guide');
    const expected = beat === 0 ? 122.5 : 145;
    assert(Math.abs(marker.center.y - (350 + (470 * (250 - expected)) / 170)) < 1e-8);
  }
});

test('the bend penalty refits the centered feature under its displayed Ridge or Lasso objective', () => {
  for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
    const ridge = bendFrame({
      beat: 1,
      cues: { ...cue('curve-ridge', progress, []), ...cue('curve-lasso', 0, []) },
    });
    assert(Math.abs(5.6 * (1 + ridge.coefficient) + 2 * ridge.lambda * ridge.coefficient) < 1e-10);
    const lasso = bendFrame({
      beat: 1,
      cues: { ...cue('curve-ridge', 1, []), ...cue('curve-lasso', progress, []) },
    });
    if (progress > 0) assert(Math.abs(5.6 * (1 + lasso.coefficient) - lasso.lambda) < 1e-10);
    assert.equal(ridge.predict(3), 160 - 2 * ridge.coefficient);
  }
  assert.equal(Math.abs(bendFrame({ beat: 1, beatP: 1 }).coefficient), 0);
});

test('the held-out measurement stays covered until its reveal and produces both visible signed errors', () => {
  const before = render('generalize', {
    beat: 1,
    beatP: 0.99,
    cues: {
      ...cue('test-reveal', 0, ['heldout-observation']),
      ...cue('test-errors', 0, ['heldout-errors']),
    },
  });
  assert(before.labels.some((l) => l.text === 'outcome covered'));
  assert(!before.labels.some((l) => l.text === 'observed 219 ms'));
  const partial = render('generalize', {
    beat: 1,
    beatP: 0.99,
    cues: {
      ...cue('test-reveal', 0.5, ['heldout-observation']),
      ...cue('test-errors', 0, ['heldout-errors']),
    },
  });
  assert(partial.labels.some((l) => l.text === 'outcome covered'));
  const px = 210 + (960 * 6) / 7,
    py = 350 + (470 * (250 - 219)) / 170;
  assert.equal(
    pixels(partial, [Math.floor(px) - 6, Math.floor(py) - 6, 12, 12], C.yellow),
    0,
    'the covered outcome must stay unpainted during its reveal clause',
  );
  const state = {
    beat: 1,
    beatP: 0.01,
    cues: {
      ...cue('test-reveal', 1, ['heldout-observation']),
      ...cue('test-errors', 1, ['heldout-errors']),
    },
  };
  const held = render('generalize', state),
    values = heldoutFrame(state);
  assert.deepEqual(
    [values.line, values.curve, values.observed, values.lineResidual, values.curveResidual],
    [220, 213, 219, -1, 6],
  );
  assert(held.labels.some((l) => l.text === 'observed 219 ms'));
  assert(held.labels.some((l) => l.text === 'residuals: −1 ms       +6 ms'));
  const x = 210 + (960 * 6) / 7,
    y = 350 + (470 * (250 - 219)) / 170;
  assert(
    pixels(held, [Math.floor(x) - 6, Math.floor(y) - 6, 12, 12], C.yellow) > 70,
    'the revealed observation must actually paint at 219 ms',
  );
});

test('the measured residual transport and shift retain a readable C identity and a matching signed value', async () => {
  const { scene } = JSON.parse(
    await readFile(
      new URL('./fixtures/linear-regression-residuals-measured.json', import.meta.url),
      'utf8',
    ),
  );
  for (const time of [0.1666666667, 0.2, 0.2666666667])
    render('residuals', frameState(scene, time, 2, 8));
  for (const time of [9.3666666667, 9.4, 9.8, 19.9, 27.7, 28.3, 29.1, 30.2]) {
    const state = frameState(scene, time, 2, 8),
      frame = render('residuals', state);
    const identity = frame.labels.find((label) => label.text === 'C');
    const actor = frame.shapes.find((shape) => shape.kind === 'circle' && shape.width === 44);
    assert(identity && actor, 'the transported request must retain its painted identity');
    assert(
      Math.abs(identity.center.x - actor.center.x) < 2 &&
        Math.abs(identity.center.y - actor.center.y) < 3,
    );
    const residual = state.beat === 1 ? 4 - ((actor.center.y - 365) * 12) / 430 : 2,
      prediction = 162 - residual;
    assert(
      frame.labels.some(
        (label) =>
          label.text ===
          `C: 162 − ${prediction.toFixed(1)} = ${residual >= 0 ? '+' : ''}${residual.toFixed(1)} ms`,
      ),
    );
    assert(
      pixels(
        frame,
        [Math.round(actor.center.x) + 10, Math.round(actor.center.y) - 3, 7, 7],
        C.cyan,
      ) > 20,
      'the identity needs its actual opaque point marker',
    );
  }
});

test('the raised-line counterexample holds its increased loss until the spoken return', () => {
  for (const beatP of [0.2, 0.65]) {
    const raised = render('residuals', {
      beat: 1,
      beatP,
      cues: {
        ...cue('residual-shift', 1, ['residual-pattern'], 'pink'),
        ...cue('residual-return', 0, ['residual-pattern'], 'green'),
      },
    });
    assert(raised.labels.some((l) => l.text === 'C: 162 − 166.0 = -4.0 ms'));
    assert(raised.labels.some((l) => l.text === 'MSE 38.8 ms² · minimum 2.8 ms²'));
  }
  const returned = render('residuals', {
    beat: 1,
    beatP: 0.9,
    cues: {
      ...cue('residual-shift', 1, ['residual-pattern'], 'pink'),
      ...cue('residual-return', 1, ['residual-pattern'], 'green'),
    },
  });
  assert(returned.labels.some((l) => l.text === 'C: 162 − 160.0 = +2.0 ms'));
  assert(returned.labels.some((l) => l.text === 'MSE 2.8 ms² · minimum 2.8 ms²'));
});

test('the displayed duplicate-column coefficients preserve the same prediction during the trade', () => {
  for (const progress of [0.123, 0.33, 0.52, 0.71, 1]) {
    const frame = render('solve', {
      beat: 2,
      beatP: 0.99,
      cues: cue('solve-duplicate', progress, ['duplicate-weights'], 'yellow'),
    });
    const equation = frame.labels.find((label) => /^100\+[\d.]+x\+[\d.]+\(2x\)$/.test(label.text));
    assert(equation, 'show both actual intermediate coefficients');
    const [, a, z] = equation.text.match(/^100\+([\d.]+)x\+([\d.]+)\(2x\)$/);
    assert(
      Math.abs(Number(a) + 2 * Number(z) - 20) < 1e-10,
      'the displayed arithmetic must preserve twenty times input',
    );
    for (const y of [120, 140, 160, 180, 200])
      assert(frame.labels.some((label) => label.text === String(y)));
  }
});
