import { EIGHTY } from '../fixtures.mjs';
import { fmt, loss, pair, vector } from '../arithmetic.mjs';
import { cueProgress } from '../construction.mjs';
import {
  drawBudgetDiagnosisAndTransferTarget,
  drawBudgetDiagnosisAndTransferText,
} from '../defaults.mjs';

function drawSquaredHistory(ctx, state, api) {
  const { C, teaching } = api;
  const inputs = [4, 0, 3];
  const squared = [0];
  const maximum = [0];
  for (const g of inputs) {
    const next = (squared.at(-1) + g * g) / 2;
    squared.push(next);
    maximum.push(Math.max(maximum.at(-1), next));
  }
  api.text(ctx, 'Incoming gradients', 175, 240, 32, C.muted);
  api.text(ctx, inputs.join('   →   '), 175, 330, 60, C.ink);
  api.text(ctx, 'New buffer = ½ old buffer + ½ gradient²', 1750, 315, 39, C.ink, 'right');
  const plot = teaching.axes({
    x: 260,
    y: 425,
    width: 1110,
    height: 450,
    xDomain: [-0.1, 3.2],
    yDomain: [-0.4, 9],
    xTicks: [0, 1, 2, 3],
    yTicks: [0, 4, 8],
    xLabel: 'update',
    yLabel: 'buffer value',
    fontSize: 28,
    color: C.muted,
  });
  function segment(values, i, progress, color) {
    if (progress <= 0) return;
    const start = plot.point(i, values[i]);
    const tip = plot.point(i + progress, values[i] + progress * (values[i + 1] - values[i]));
    api.line(ctx, start.x, start.y, tip.x, tip.y, color, 6);
    if (progress === 1) api.circle(ctx, tip.x, tip.y, 10, color);
  }
  api.focus.target('square-history', () => {
    api.text(ctx, 'Squared average', 1450, 545, 32, C.cyan);
    api.circle(ctx, plot.point(0, 0).x, plot.point(0, 0).y, 10, C.cyan);
    const cues = ['square-first', 'square-second', 'square-third'];
    cues.forEach((id, i) => {
      const p = cueProgress(state, id, 2, 0.17 + i * 0.13, 0.27 + i * 0.13);
      segment(squared, i, p, C.cyan);
      if (p === 1) {
        const point = plot.point(i + 1, squared[i + 1]);
        api.text(ctx, fmt(squared[i + 1]), point.x, point.y + 55, 34, C.cyan, 'center');
      }
    });
  });
  api.focus.target('amsgrad-max', () => {
    const p = cueProgress(state, 'amsgrad-max', 2, 0.62, 0.79);
    if (p === 0) return;
    api.text(ctx, 'AMSGrad maximum', 1450, 665, 32, C.green);
    for (let i = 0; i < inputs.length; i++) {
      segment(maximum, i, Math.max(0, Math.min(1, inputs.length * p - i)), C.green);
    }
    if (p === 1)
      api.text(ctx, 'Largest value seen = ' + maximum.at(-1), 960, 1012, 42, C.green, 'center');
  });
}

export function drawEvidenceBudget(ctx, scene, state, api) {
  const { C: themeColors, teaching } = api,
    currentBeat = state.beat ?? 0;
  const phase = (id, b) => cueProgress(state, id, b);
  {
    if (currentBeat < 2)
      drawBudgetDiagnosisAndTransferText(
        ctx,
        api,
        themeColors,
        'Same loss and start (1, 1)   ·   80 gradient evaluations per recipe',
        170,
        245,
        30,
        themeColors.muted,
      );
    if (currentBeat === 0) {
      drawBudgetDiagnosisAndTransferTarget(ctx, api, 'budget-inputs', () => {
        drawBudgetDiagnosisAndTransferText(
          ctx,
          api,
          themeColors,
          'SGD peak 0.018',
          1240,
          355,
          34,
          themeColors.blue,
        );
        drawBudgetDiagnosisAndTransferText(
          ctx,
          api,
          themeColors,
          'AdamW peak 0.08 · decay 0.01',
          1240,
          420,
          31,
          themeColors.green,
        );
      });
      drawBudgetDiagnosisAndTransferTarget(ctx, api, 'budget-paths', () => {
        const count = Math.floor(phase('budget-paths', 0) * 80);
        const plot = teaching.axes({
          x: 250,
          y: 370,
          width: 850,
          height: 560,
          xDomain: [-0.9, 1.1],
          yDomain: [-0.15, 1.1],
          equalUnits: true,
          xTicks: [-0.8, 0, 1],
          yTicks: [0, 0.5, 1],
          xLabel: 'a',
          yLabel: 'b',
          fontSize: 25,
          color: themeColors.muted,
        });
        for (const level of [0.5, 2, 8, 32, 50.5])
          teaching.curve({
            plot,
            points: Array.from(
              {
                length: 181,
              },
              (_, i) => ({
                x: Math.sqrt(level / 50) * Math.cos((i / 180) * 2 * Math.PI),
                y: Math.sqrt(2 * level) * Math.sin((i / 180) * 2 * Math.PI),
              }),
            ),
            color: '#293c59',
            width: 2,
          });
        for (const [i, [name, run, color]] of [
          ['SGD', EIGHTY.sgd, themeColors.blue],
          ['AdamW', EIGHTY.adamw, themeColors.green],
        ].entries()) {
          teaching.curve({
            plot,
            points: run.points.slice(0, count + 1),
            color,
            width: 4,
          });
          const w = vector(run.points[count]),
            p = plot.point(...w);
          api.circle(ctx, p.x, p.y, 7, color);
          const y = 570 + i * 205;
          drawBudgetDiagnosisAndTransferText(
            ctx,
            api,
            themeColors,
            name + ' · completed ' + count,
            1240,
            y,
            34,
            color,
          );
          drawBudgetDiagnosisAndTransferText(
            ctx,
            api,
            themeColors,
            'θ ≈ ' + pair(w, 5),
            1240,
            y + 65,
            31,
            color,
          );
          drawBudgetDiagnosisAndTransferText(
            ctx,
            api,
            themeColors,
            'L ≈ ' + fmt(loss(w), 6),
            1240,
            y + 125,
            31,
            color,
          );
        }
        drawBudgetDiagnosisAndTransferText(
          ctx,
          api,
          themeColors,
          'Each gradient belongs to that method’s current point.',
          960,
          1040,
          31,
          themeColors.muted,
          'center',
        );
      });
    } else if (currentBeat === 1) {
      drawBudgetDiagnosisAndTransferTarget(ctx, api, 'finite-checks', () => {
        drawBudgetDiagnosisAndTransferText(
          ctx,
          api,
          themeColors,
          'Both coordinate errors, measured against initial magnitude 1',
          200,
          350,
          35,
          themeColors.ink,
        );
        for (const [i, [name, run, color]] of [
          ['SGD', EIGHTY.sgd, themeColors.blue],
          ['AdamW', EIGHTY.adamw, themeColors.green],
        ].entries()) {
          const last = run.records.at(-1),
            y = 475 + i * 280;
          drawBudgetDiagnosisAndTransferText(ctx, api, themeColors, name, 230, y, 37, color);
          for (let j = 0; j < 2; j++) {
            const yy = y + 70 + j * 75;
            drawBudgetDiagnosisAndTransferText(
              ctx,
              api,
              themeColors,
              j ? '|b|' : '|a|',
              240,
              yy + 25,
              29,
              color,
            );
            api.rect(ctx, 370, yy, 950, 30, undefined, themeColors.muted, 1);
            const width = Math.abs(last.next[j]) * 950;
            if (width > 0) api.rect(ctx, 370, yy, width, 30, color, undefined, 1);
            drawBudgetDiagnosisAndTransferText(
              ctx,
              api,
              themeColors,
              fmt(Math.abs(last.next[j]), 5),
              1400,
              yy + 25,
              31,
              color,
            );
          }
        }
      });
      drawBudgetDiagnosisAndTransferTarget(ctx, api, 'recipe-rates', () =>
        drawBudgetDiagnosisAndTransferText(
          ctx,
          api,
          themeColors,
          'Different peak rates: 0.018 versus 0.08 · complete recipes share the budget',
          960,
          1010,
          29,
          themeColors.yellow,
          'center',
        ),
      );
      drawBudgetDiagnosisAndTransferTarget(ctx, api, 'recipe-symmetry', () =>
        drawBudgetDiagnosisAndTransferText(
          ctx,
          api,
          themeColors,
          'AdamW normalizes the two gradient histories to nearly the same step.',
          960,
          1060,
          28,
          themeColors.muted,
          'center',
        ),
      );
    } else {
      drawSquaredHistory(ctx, state, api);
    }
  }
}
export default {
  id: 'evidence-budget',
  draw: drawEvidenceBudget,
  cues: [
    'budget-inputs',
    'budget-paths',
    'finite-checks',
    'recipe-rates',
    'recipe-symmetry',
    'square-first',
    'square-second',
    'square-third',
    'amsgrad-max',
  ],
};
