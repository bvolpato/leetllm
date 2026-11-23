import { event } from '../construction.mjs';
import { solverRoundingExample } from '../model.mjs';
import { target, text } from '../defaults.mjs';

export function drawConditioningSolve(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const stored = event(state, 3, 'rounded-solve') === 1;
  const c = solverRoundingExample(3, stored ? 1 : 0);
  const pair = (values) => values.map((v) => Number(v.toFixed(4))).join('    ');
  if (beat === 0) {
    target(ctx, api, 'solve-inputs', () => {
      text(ctx, api, 'Measurement', 200, 315, 33, C.muted);
      text(ctx, api, 'Weight 1', 680, 315, 30, C.muted, 'center');
      text(ctx, api, 'Weight 2', 900, 315, 30, C.muted, 'center');
      text(ctx, api, 'Observed', 1200, 315, 30, C.yellow, 'center');
      c.table.forEach((row, i) => {
        const y = 435 + 125 * i;
        text(ctx, api, i ? 'Second' : 'First', 200, y, 41, C.ink);
        text(ctx, api, row[0].toFixed(2), 680, y, 41, C.blue, 'center');
        text(ctx, api, row[1].toFixed(2), 900, y, 41, C.pink, 'center');
        text(ctx, api, c.observations[i].toFixed(3), 1200, y, 41, C.yellow, 'center');
      });
      text(ctx, api, 'Clean weights   1, 2', 1520, 435, 30, C.muted, 'center');
      text(ctx, api, '3.080  +  0.001', 1520, 560, 30, C.muted, 'center');
    });
    target(ctx, api, 'stable-solver', () => {
      api.line(ctx, 240, 640, 1670, 640, C.muted, 2);
      text(ctx, api, 'Subtract the two rows', 360, 745, 32, C.muted);
      if (event(state, 0, 'stable-solver') === 1) {
        text(ctx, api, '0.04 × w₂ = 0.081', 1100, 752, 48, C.green, 'center');
        text(ctx, api, 'Direct fit     ' + pair(c.directWeights), 960, 895, 42, C.green, 'center');
      }
    });
    return;
  }

  if (beat === 1) {
    text(ctx, api, 'Gram matrix   DᵀD', 445, 332, 38, C.ink, 'center');
    api.components.matrix({
      values: c.gram.map((row) => row.map((v) => String(Number(v.toFixed(4))))),
      x: 225, y: 421, cellSize: 182, gap: 9,
      style: { fill: C.panel, stroke: C.muted, textColor: C.ink, fontSize: 39 },
    });
    text(ctx, api, 'Right-hand side   Dᵀb', 1295, 332, 38, C.ink, 'center');
    c.table[0].forEach((_, j) => {
      const color = j === 0 ? C.blue : C.pink;
      const y = 448 + j * 205;
      const progress = j === 0
        ? event(state, 1, 'first-column-rhs', 0.43, 0.59)
        : event(state, 1, 'second-column-rhs', 0.60, 0.81);
      target(ctx, api, j === 0 ? 'rhs-first' : 'rhs-second', () => {
        text(ctx, api, 'Column ' + (j + 1) + ' × observed readings', 865, y, 32, color);
        const terms = c.table.map((row, i) => row[j] + ' × ' + c.observations[i].toFixed(3));
        const rhs = Number(c.storedTarget[j].toFixed(5));
        text(ctx, api, terms.join('   +   ') + '   =   ' + (progress === 1 ? rhs : '?'),
          865, y + 82, 40, C.ink);
      });
    });
    text(ctx, api, 'Each right-hand entry pairs one feature column with the same readings.',
      960, 950, 33, C.muted, 'center');
    return;
  }

  if (beat <= 3) {
    const g = c.storedGram;
    const b = c.storedTarget;
    const multiplier = g[1][0] / g[0][0];
    const pivot = g[1][1] - multiplier * g[0][1];
    const rhs = b[1] - multiplier * b[0];
    text(
      ctx,
      api,
      stored
        ? 'Normal equations stored to three decimals'
        : 'Normal equations before storage rounding',
      960,
      272,
      37,
      C.ink,
      'center',
    );
    target(ctx, api, 'normal-equation-condition', () => {
      text(ctx, api, '2w₁ + 2.04w₂ = 6.081', 960, 363, 40, C.muted, 'center');
      text(
        ctx,
        api,
        '2.04w₁ + ' + g[1][1].toFixed(stored ? 3 : 4) + 'w₂ = ' + b[1].toFixed(stored ? 3 : 5),
        960,
        430,
        40,
        C.ink,
        'center',
      );
      text(ctx, api, 'Second row  −  1.02 × first row', 960, 526, 33, C.yellow, 'center');
    });
    const scale = 365000;
    const left = 650;
    const showRemainders = event(state, 2, 'normal-equation-condition') === 1;
    target(ctx, api, 'rounded-solve', () => {
      const names = ['Coefficient left on w₂', 'Target left'];
      const exact = solverRoundingExample(3, 0);
      const original = [
        exact.gram[1][1] - multiplier * exact.gram[0][1],
        exact.storedTarget[1] - multiplier * exact.storedTarget[0],
      ];
      [pivot, rhs].forEach((v, i) => {
        const y = 625 + 106 * i;
        text(ctx, api, names[i], 570, y + 11, 32, C.muted, 'right');
        api.line(ctx, left, y, left + 0.002 * scale, y, C.muted, 2);
        if (showRemainders) {
          const x = left + v * scale;
          api.line(ctx, left, y, x, y, i ? C.yellow : C.blue, 10);
          if (stored) {
            const was = left + original[i] * scale;
            api.line(ctx, was, y - 23, was, y + 23, C.ink, 3);
          }
          api.circle(ctx, x, y, 8, i ? C.yellow : C.blue);
          text(ctx, api, v.toFixed(5), 1500, y + 12, 40, i ? C.yellow : C.blue);
        }
      });
      if (showRemainders) {
        text(
          ctx,
          api,
          'w₂ = target left ÷ coefficient left = ' + Number((rhs / pivot).toFixed(3)),
          960,
          891,
          41,
          stored ? C.pink : C.green,
          'center',
        );
        if (stored)
          text(
            ctx,
            api,
            'White ticks mark the two values before rounding.',
            960,
            980,
            30,
            C.muted,
            'center',
          );
      }
    });
    return;
  }

  text(ctx, api, 'Weights inferred from the same two readings', 960, 282, 38, C.ink, 'center');
  text(ctx, api, 'Direct fit', 480, 382, 32, C.muted, 'center');
  text(ctx, api, pair(c.directWeights), 480, 470, 54, C.green, 'center');
  text(ctx, api, 'Rounded normal equations', 1370, 382, 32, C.muted, 'center');
  text(ctx, api, pair(c.normalWeights), 1370, 470, 54, C.pink, 'center');
  target(ctx, api, 'rounded-results', () => {
    text(ctx, api, 'Output', 250, 590, 30, C.muted);
    text(ctx, api, 'Observed', 1380, 590, 30, C.yellow, 'center');
    text(ctx, api, 'Rounded fit', 1630, 590, 30, C.pink, 'center');
    c.observations.forEach((v, i) => {
      const y = 680 + i * 113;
      const x = (value) => 520 + (value - 2.98) * 6200;
      text(ctx, api, i ? 'Second' : 'First', 250, y + 12, 33, C.ink);
      api.line(ctx, 520, y, 1202, y, C.muted, 2);
      api.line(ctx, x(v), y - 20, x(v), y + 20, C.yellow, 4);
      api.circle(ctx, x(c.normalPrediction[i]), y, 10, C.pink);
      text(ctx, api, v.toFixed(4), 1380, y + 12, 35, C.yellow, 'center');
      text(ctx, api, c.normalPrediction[i].toFixed(4), 1630, y + 12, 35, C.pink, 'center');
    });
  });
  text(ctx, api, 'Independent columns     κ₂(DᵀD) = κ₂(D)²', 960, 950, 36, C.ink, 'center');
}

export default {
  id: 'conditioning-solve',
  draw: drawConditioningSolve,
  cues: [
    'solve-inputs',
    'stable-solver',
    'first-column-rhs',
    'second-column-rhs',
    'normal-equation-condition',
    'rounded-solve',
    'rounded-results',
  ],
};
