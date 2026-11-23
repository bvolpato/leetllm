import { quadratic } from '../arithmetic.mjs';
import { directed, finished } from '../construction.mjs';
import { data } from '../fixtures.mjs';
import { heldoutFrame, predict, testMeanSquares, testScores } from '../model.mjs';
import { curve, observations, plot, target, text } from '../defaults.mjs';

const signed = (n) => (n < 0 ? '−' + Math.abs(n) : '+' + n);

function drawComparison(ctx, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const f = heldoutFrame(state);
  const second = beat >= 2;
  const q = plot(ctx, api, 210, 350, 960, 470);
  const extend = beat > 0 ? 1 : directed(state, 'test-predict', 0.1, 0.55);
  const trainingEnd = data.at(-1).x;
  const tip = trainingEnd + extend * (f.x - trainingEnd);
  curve(ctx, api, q, (x) => predict(x), C.cyan, 1, tip, 6);
  curve(ctx, api, q, quadratic, C.pink, 1, tip, 5);
  observations(ctx, api, q);
  const sixth = q.point(f.x, 80);
  api.line(ctx, sixth.x, sixth.y, sixth.x, q.point(f.x, 236).y, C.muted, 2);
  text(ctx, api, 'Training lengths', 560, 285, 31, C.muted, 'center');
  text(ctx, api, '600 tokens', sixth.x, 285, 34, C.ink, 'center');
  const models = [
    { name: 'line', value: f.line, x: 1470, color: C.cyan },
    { name: 'curve', value: f.curve, x: 1710, color: C.pink },
  ];
  const zoomY = (ms) => 406 + (f.line - ms) * 41;
  text(ctx, api, '600-token latency, enlarged', 1590, 252, 34, C.muted, 'center');
  target(ctx, api, 'heldout-forecasts', () => {
    for (const model of models) {
      text(
        ctx,
        api,
        model.name + ' ' + model.value + ' ms',
        model.x,
        338,
        36,
        model.color,
        'center',
      );
      api.circle(ctx, model.x, zoomY(model.value), 12, C.bg, model.color, 4);
      if (extend === 1) {
        const p = q.point(f.x, model.value);
        api.circle(ctx, p.x, p.y, 12, C.bg, model.color, 4);
      }
    }
  });
  if (beat === 0) {
    const lineBase = predict(trainingEnd),
      curveBase = quadratic(trainingEnd);
    text(ctx, api, 'From 500 to 600 tokens', 1590, 805, 30, C.muted, 'center');
    text(ctx, api, lineBase + ' + ' + (f.line - lineBase), models[0].x, 890, 39, C.cyan, 'center');
    text(
      ctx,
      api,
      curveBase + ' + ' + (f.curve - curveBase),
      models[1].x,
      890,
      39,
      C.pink,
      'center',
    );
  }

  target(ctx, api, 'heldout-observation', () => {
    const label = f.observed === null ? 'outcome covered' : 'observed ' + f.observed + ' ms';
    text(ctx, api, label, 690, 964, 42, f.observed === null ? C.muted : C.yellow, 'center');
    text(ctx, api, second ? 'Replay 2' : 'Replay 1', 690, 1036, 32, C.muted, 'center');
    if (f.observed !== null) {
      const p = q.point(f.x, f.observed),
        y = zoomY(f.observed);
      api.circle(ctx, p.x, p.y, 13, C.yellow);
      api.line(ctx, 1395, y, 1795, y, C.yellow, 3);
      for (const model of models) api.circle(ctx, model.x, y, 8, C.yellow);
    }
  });

  target(ctx, api, 'heldout-errors', () => {
    if (f.observed === null) return;
    const y = zoomY(f.observed);
    for (const model of models) {
      const from = zoomY(model.value);
      api.line(ctx, model.x, from, model.x, api.lerp(from, y, f.errors), model.color, 6);
    }
    if (f.errors === 1) {
      text(
        ctx,
        api,
        'residuals: ' + signed(f.lineResidual) + ' ms       ' + signed(f.curveResidual) + ' ms',
        1160,
        900,
        50,
        C.ink,
        'left',
      );
    } else if (second && beat === 2) {
      text(ctx, api, 'Which forecast is closer?', 1505, 839, 34, C.ink, 'center');
    }
  });
}

function drawScorecard(ctx, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const scored = beat > 4 || (beat === 4 && finished(state, 'pooled-score', 0.32));
  const square = beat > 3 ? 1 : directed(state, 'square-errors', 0.55, 0.78);
  const missTarget = square === 0 ? 'heldout-errors' : 'squared-misses';
  text(ctx, api, 'Two constructed requests at 600 tokens', 960, 257, 40, C.ink, 'center');
  const columns = [510, 1020, 1510];
  text(ctx, api, 'Observed latency', columns[0], 376, 34, C.yellow, 'center');
  text(ctx, api, 'Line · ' + testScores[0].line + ' ms', columns[1], 376, 37, C.cyan, 'center');
  text(ctx, api, 'Curve · ' + testScores[0].curve + ' ms', columns[2], 376, 37, C.pink, 'center');
  testScores.forEach((row, i) => {
    const y = 505 + 135 * i;
    text(ctx, api, 'Replay ' + (i + 1), 120, y, 31, C.muted);
    text(ctx, api, row.y + ' ms', columns[0], y, 46, C.yellow, 'center');
    for (const [j, residual] of [row.lineResidual, row.curveResidual].entries()) {
      const color = j ? C.pink : C.cyan;
      const label =
        square === 1 ? '(' + signed(residual) + ')² = ' + residual ** 2 : signed(residual) + ' ms';
      target(ctx, api, missTarget, () => {
        const size = 13 * Math.abs(residual),
          cx = columns[j + 1] - 181;
        api.rect(
          ctx,
          cx - size / 2,
          y - 18 - (size * square) / 2,
          size,
          Math.max(3, size * square),
          color,
        );
        text(ctx, api, label, columns[j + 1], y, 44, color, 'center');
      });
    }
  });
  api.line(ctx, 230, 712, 1710, 712, C.muted, 2);
  target(ctx, api, 'test-score', () => {
    text(ctx, api, 'Mean squared error', columns[0], 814, 35, C.ink, 'center');
    for (const [i, name] of ['line', 'curve'].entries()) {
      const a = testScores[0][name + 'Residual'] ** 2;
      const b = testScores[1][name + 'Residual'] ** 2;
      const value = scored
        ? testMeanSquares[name] + ' ms²'
        : square === 1
          ? '(' + a + ' + ' + b + ') / 2'
          : '?';
      text(ctx, api, value, columns[i + 1], 821, 46, i ? C.pink : C.cyan, 'center');
    }
  });
  text(
    ctx,
    api,
    scored ? 'Equal error on these two replays' : 'Which model has the lower mean squared error?',
    960,
    971,
    42,
    scored ? C.yellow : C.ink,
    'center',
  );
}

function drawRange(ctx, state, api) {
  const { C } = api;
  const distant = 5000;
  const scale = (tokens) => 185 + (1520 * tokens) / distant;
  const y = 595;
  text(ctx, api, 'Retrieved tokens', 960, 315, 43, C.ink, 'center');
  api.line(ctx, scale(0), y, scale(distant), y, C.muted, 3);
  api.line(ctx, scale(100), y, scale(500), y, C.cyan, 12);
  for (const row of data) api.circle(ctx, scale(row.x * 100), y, 8, C.cyan);
  const tested = scale(testScores[0].x * 100);
  api.circle(ctx, tested, y, 12, C.yellow);
  api.line(ctx, tested, y + 17, tested, y + 94, C.yellow, 2);
  text(ctx, api, '100–500 fitted', scale(330), y - 70, 32, C.cyan, 'center');
  text(ctx, api, '600 tested twice', tested, y + 144, 35, C.yellow, 'center');
  target(ctx, api, 'distant-request', () => {
    api.circle(ctx, scale(distant), y, 15, C.bg, C.pink, 4);
    text(ctx, api, '5,000', scale(distant), y - 65, 44, C.pink, 'center');
    if (finished(state, 'use-fallback', 0.65)) {
      text(ctx, api, 'Time requests here', scale(distant), y + 104, 35, C.pink, 'center');
    }
  });
}

export function drawGeneralize(ctx, scene, state, api) {
  const beat = state.beat ?? 0;
  if (beat === 5) return drawRange(ctx, state, api);
  const compare = state.cues?.['compare-both'];
  const showBoth = compare ? compare.phase !== 'before' : (state.beatP ?? 0) >= 0.53;
  if (beat === 4 || (beat === 3 && showBoth)) {
    return drawScorecard(ctx, state, api);
  }
  return drawComparison(ctx, state, api);
}

export default {
  id: 'generalize',
  draw: drawGeneralize,
  cues: [
    'test-predict',
    'test-reveal',
    'test-errors',
    'test-second',
    'second-errors',
    'compare-both',
    'square-errors',
    'pooled-score',
    'use-fallback',
  ],
};
