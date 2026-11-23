import { WORDS, WQ } from '../fixtures.mjs';
import { cue, done, event, sum } from '../arithmetic.mjs';
import { FEEDBACK, MODEL } from '../model.mjs';
import { caption, equation, row, target, text, withTransformerLegacyFrame } from '../defaults.mjs';
export function paintMask(ctx, scene, state, api, C, b, P, f) {
  if (b === 0) {
    text(ctx, api, C, 'the · normalized input', 960, 290, 31, C.yellow, 'center');
    row(ctx, api, C, f, MODEL.N[2], 390, 330, 1140, C.yellow);
    text(ctx, api, C, 'coefficients for query coordinate 1', 960, 490, 30, C.cyan, 'center');
    row(
      ctx,
      api,
      C,
      f,
      WQ.map((r) => r[0]),
      390,
      530,
      1140,
      C.cyan,
    );
    const p = cue(state, 'query-project'),
      n = Math.floor(p * 4 + 1e-9),
      products = MODEL.N[2].map((v, j) => v * WQ[j][0]);
    target(ctx, api, 'query-calculation', () => {
      row(
        ctx,
        api,
        C,
        f,
        products.map((v, j) => (j < n ? v : null)),
        390,
        670,
        1140,
        C.green,
        76,
        3,
      );
      equation(
        ctx,
        api,
        C,
        n === 4
          ? 'q_1\\approx' + f(MODEL.Q[2][0], 3)
          : '\\text{partial sum}\\approx' + f(sum(products.slice(0, n)), 3),
        700,
        865,
        37,
        C.green,
      );
      if (done(p)) {
        text(ctx, api, C, 'complete query', 1430, 800, 25, C.cyan, 'center');
        row(ctx, api, C, f, MODEL.Q[2], 1230, 825, 400, C.cyan, 72, 3);
      }
    });
    caption(
      ctx,
      api,
      C,
      'Q = normalized input × Wq · K = normalized input × Wk · V = normalized input',
    );
  } else if (b === 1) {
    text(ctx, api, C, 'the query', 330, 320, 32, C.yellow, 'center');
    row(ctx, api, C, f, MODEL.Q[2], 150, 370, 360, C.yellow, 85, 3);
    text(ctx, api, C, 'visible keys', 925, 300, 32, C.cyan, 'center');
    text(ctx, api, C, 'scaled dot products', 1530, 300, 30, C.green, 'center');
    const progress = cue(state, 'key-scores'),
      n = Math.floor(progress * 3 + 1e-9),
      active = Math.min(2, n);
    target(ctx, api, 'score-row', () =>
      WORDS.forEach((word, i) => {
        const y = 365 + i * 150;
        text(ctx, api, C, word, 650, y + 53, 29, C.blue, 'right');
        row(ctx, api, C, f, MODEL.K[i], 700, y, 460, C.cyan, 85, 3);
        row(ctx, api, C, f, [i < n ? MODEL.scores[2][i] : null], 1400, y, 260, C.green, 85, 3);
      }),
    );
    const parts = MODEL.Q[2].map((v, j) => v * MODEL.K[active][j]);
    text(ctx, api, C, WORDS[active] + ' · coordinate products', 960, 825, 27, C.yellow, 'center');
    equation(
      ctx,
      api,
      C,
      '(' +
        f(parts[0], 3) +
        '+(' +
        f(parts[1], 3) +
        '))/\\sqrt{2}\\approx' +
        f(MODEL.scores[2][active], 3),
      960,
      905,
      40,
      C.yellow,
    );
    caption(ctx, api, C, 'Two query/key coordinates · four value coordinates');
  } else {
    const training = done(event(state, 2, 'training-key', 0.12, 0.46));
    const masked = done(event(state, 3, 'causal-mask')),
      p = event(state, 3, 'causal-weights', 0.5, 0.85),
      expCount = Math.floor(p * 3 + 1e-9);
    const shifted = MODEL.scores[2].map((v) => Math.exp(v - Math.max(...MODEL.scores[2])));
    const labels = [...WORDS, training ? 'training target' : 'next position'];
    labels.forEach((s, i) =>
      text(ctx, api, C, s, 455 + i * 345, 310, 29, i === 3 ? C.muted : C.cyan, 'center'),
    );
    text(ctx, api, C, 'score', 249, 407, 29, C.yellow, 'right');
    text(ctx, api, C, 'exp(score − max)', 249, 576, 26, C.pink, 'right');
    if (done(p)) text(ctx, api, C, 'weight', 249, 816, 29, C.green, 'right');
    target(ctx, api, 'masked-row', () =>
      row(
        ctx,
        api,
        C,
        f,
        [...MODEL.scores[2], masked ? '−∞' : training ? FEEDBACK.scores[2][3] : 'absent'],
        285,
        350,
        1380,
        C.yellow,
        88,
        3,
      ),
    );
    row(
      ctx,
      api,
      C,
      f,
      [...shifted.map((v, i) => (i < expCount ? v : null)), masked ? 0 : null],
      285,
      520,
      1380,
      C.pink,
      88,
      3,
    );
    if (p > 0 && p < 1) {
      const j = Math.min(2, expCount),
        t = p * 3 - j,
        xx = 455 + j * 345 + (960 - (455 + j * 345)) * t,
        yy = 620 + 55 * t;
      api.circle(ctx, xx, yy, 10, C.pink);
    }
    target(ctx, api, 'legal-weights', () => {
      text(
        ctx,
        api,
        C,
        expCount === 3
          ? 'shared denominator ≈ ' + f(sum(shifted), 3)
          : 'build the shared denominator',
        960,
        700,
        31,
        C.green,
        'center',
      );
      if (done(p)) {
        row(ctx, api, C, f, [...MODEL.weights[2], 0], 285, 760, 1380, C.green, 88, 3);
        text(
          ctx,
          api,
          C,
          'future mass = 0 · legal weights sum to 1',
          960,
          910,
          31,
          C.green,
          'center',
        );
      }
    });
    caption(
      ctx,
      api,
      C,
      training
        ? 'Training example with four input positions   ·   query at position 2'
        : 'Generating from the three-token prefix   ·   query at position 2',
    );
  }
}
export function drawMaskStage(ctx, scene, state, api) {
  withTransformerLegacyFrame(ctx, scene, state, api, paintMask);
}
export default {
  id: 'mask',
  draw: drawMaskStage,
  cues: ['query-project', 'key-scores', 'training-key', 'causal-mask', 'causal-weights'],
};
