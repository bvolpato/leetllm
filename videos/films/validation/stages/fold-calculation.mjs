import { foldScores } from '../fixtures.mjs';
import { oneFoldModel } from '../model.mjs';
import { f1, mean } from '../arithmetic.mjs';
import { phraseProgress } from '../defaults.mjs';

export function drawFoldCalculation(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const model = oneFoldModel();
  const write = (v, x, y, size = 35, ink = C.ink, align = 'center') =>
    api.text(ctx, v, x, y, size, ink, align);

  if (beat < 3) {
    const xAt = (value) => 270 + (value + 4) * 173;
    const y = 530;
    write('Training mean   (2 + 4 + 8 + 10) / 4 = ' + model.center, 960, 260, 40);
    api.line(ctx, xAt(-4), y, xAt(4), y, C.muted, 3);
    for (let v = -4; v <= 4; v++) {
      const x = xAt(v);
      api.line(ctx, x, y, x, y + 13, C.muted, 3);
      write(v, x, y + 57, 31, C.muted);
    }
    model.training.forEach((r) => {
      const x = xAt(r.x - model.center);
      api.circle(ctx, x, y, 15, r.y ? C.pink : C.blue);
      write('x = ' + r.x, x, y - 53, 32, r.y ? C.pink : C.blue);
    });
    for (const label of [0, 1]) {
      const x = xAt(model.means[label]);
      const color = label ? C.pink : C.blue;
      api.line(ctx, x, y - 120, x, y - 20, color, 3);
      write('Class ' + label + ' mean  ' + model.means[label], x, y - 151, 34, color);
    }
    write('Centered value  (x − 6)', 960, 653, 31, C.muted);
    if (beat === 0) {
      write('Predict the nearer class mean. At a tie, predict 0.', 960, 854, 40);
    } else if (beat === 1) {
      const r = model.held.find((r) => r.x === 9);
      const centered = r.x - model.center;
      api.circle(ctx, xAt(centered), y, 20, C.yellow);
      write('Held-out x = 9     →     9 − 6 = ' + centered, 960, 818, 48, C.yellow);
      write('Which class would you predict?', 960, 943, 41);
    } else {
      model.held.forEach((r, i) => {
        const x = 320 + i * 425;
        const pred = model.predictions[i];
        write('Held-out x = ' + r.x, x, 756, 32, C.muted);
        write(
          'Predict ' + pred + '   /   audit ' + r.y,
          x,
          828,
          36,
          r.y === pred ? C.blue : C.pink,
        );
      });
      const { tp, fp, fn, tn } = model.counts;
      write(
        'TP ' +
          tp +
          '     FP ' +
          fp +
          '     FN ' +
          fn +
          '     TN ' +
          tn +
          '          F1 = 2 / (2 + 1 + 1) = ' +
          model.f1,
        960,
        971,
        38,
      );
    }
  } else if (beat === 3) {
    const a = model.counts;
    const b = { tp: 1, fp: 0, fn: 0, tn: 0 };
    const pooled = { tp: a.tp + b.tp, fp: a.fp + b.fp, fn: a.fn + b.fn };
    const average = phraseProgress(state, api, 'average-folds', 3, 0.22, 0.36);
    const combine = phraseProgress(state, api, 'combine-counts', 3, 0.37, 0.47);
    const score = phraseProgress(state, api, 'score-pool', 3, 0.48, 0.58);
    const xs = [338, 763, 996, 1229, 1575];
    ['Held-out fold', 'TP', 'FP', 'FN', 'F1'].forEach((v, i) => write(v, xs[i], 352, 34, C.muted));
    [
      ['Four requests', a],
      ['One request', b],
      ['Pooled counts', pooled],
    ].forEach(([name, c], i) => {
      if (i === 2 && combine === 0) return;
      const y = 477 + i * 128;
      const values = [
        name,
        c.tp,
        c.fp,
        c.fn,
        i < 2 ? f1(c).toFixed(2) : score < 1 ? '?' : 2 * c.tp + '/' + (2 * c.tp + c.fp + c.fn),
      ];
      const paint = () =>
        values.forEach((v, j) => write(v, xs[j], y, 43, i === 2 ? C.yellow : C.ink));
      if (i === 2) api.focus.target('pooled-row', paint);
      else paint();
    });
    api.line(ctx, 165, 658, 1755, 658, C.muted, 2);
    api.focus.target('fold-average', () => {
      write('Give each fold one vote', 541, 869, 34, C.muted);
      if (average > 0)
        write('(0.50 + 1.00) / 2 = ' + (average < 1 ? '?' : mean([f1(a), f1(b)])), 541, 949, 43);
    });
    if (combine > 0)
      api.focus.target('pooled-score', () => {
        write('Pool predictions first', 1405, 869, 34, C.muted);
        if (score > 0)
          write(
            'F1 = 4 / (4 + 1 + 1) ≈ ' + (score < 1 ? '?' : f1(pooled).toFixed(2)),
            1405,
            949,
            43,
            C.yellow,
          );
      });
  } else if (beat === 4) {
    const avg = mean(foldScores);
    const sd = Math.sqrt(
      foldScores.reduce((s, v) => s + (v - avg) ** 2, 0) / (foldScores.length - 1),
    );
    write('Five development folds · supplied F1 scores', 960, 267, 35, C.ink);
    foldScores.forEach((v, i) => {
      const x = 270 + i * 335;
      api.rect(ctx, x - 68, 767 - 425 * v, 136, 425 * v, i === 2 ? C.yellow : C.blue, undefined, 3);
      write(v.toFixed(2), x, 726 - 425 * v, 42);
      write('Fold ' + (i + 1), x, 834, 33, C.muted);
    });
    write(
      'Mean ' + avg.toFixed(3) + '      Sample standard deviation ' + sd.toFixed(3),
      960,
      979,
      40,
    );
  } else {
    write('Three positive requests · five folds', 960, 294, 39);
    for (let i = 0; i < 5; i++) {
      const x = 135 + 335 * i;
      api.rect(ctx, x, 415, 292, 272, C.panel, C.muted, 10);
      if (i < 3) api.circle(ctx, x + 146, 545, 34, C.pink);
      write('Fold ' + (i + 1), x + 146, 761, 33, C.muted);
    }
    write('At least two folds have no positives.', 960, 929, 44, C.yellow);
  }
}

export default {
  id: 'fold-calculation',
  draw: drawFoldCalculation,
  cues: ['average-folds', 'combine-counts', 'score-pool'],
};
