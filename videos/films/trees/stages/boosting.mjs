import { regx, targets } from '../fixtures.mjs';
import { residualStep } from '../model.mjs';
import { drawConstructionText as label } from '../defaults.mjs';

export function drawBoosting(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const p = state.beatP ?? 0;
  const apply =
    beat < 2 ? 0 : beat > 2 ? 1 : api.focus.progress('add-correction', api.phase(p, 0, 0.15));
  const repeated = beat < 3 ? 0 : api.focus.progress('next-rounds', api.phase(p, 0.17, 0.64)) * 3;
  const round = beat < 3 ? 0 : Math.min(3, 1 + Math.floor(repeated));
  const amount = beat < 3 ? apply : repeated >= 3 ? 1 : repeated % 1;
  const { previous, prediction, residuals, leaves } = residualStep(round, amount);
  const refreshed =
    beat === 2 && api.focus.progress('measure-again', api.phase(p, 0.57, 0.72)) === 1;
  const gapRead = beat > 0 ? 1 : api.focus.progress('first-gaps', api.phase(p, 0.45, 0.6));
  const remainingKnown =
    refreshed && api.focus.progress('remaining-gap', api.phase(p, 0.73, 0.91)) === 1;
  const chart = api.teaching.axes({
    x: 150,
    y: 360,
    width: 975,
    height: 425,
    xDomain: [0, 6],
    yDomain: [0, 70],
    xTicks: [1, 2, 3.5, 5],
    yTicks: [0, 10, 30, 60],
    xLabel: 'ambiguity',
    yLabel: 'handling minutes',
    fontSize: 30,
  });
  const stepLine = (values, color, width) =>
    api.path(
      ctx,
      [
        chart.point(0, values[0]),
        chart.point(3.5, values[0]),
        chart.point(3.5, values[2]),
        chart.point(6, values[2]),
      ],
      { color, width, clip: chart.bounds },
    );
  label(ctx, api, 'Observed time', 1255, 254, 31, C.yellow, 'left');
  label(ctx, api, 'Prediction', 1560, 254, 31, C.cyan, 'left');
  stepLine(previous, C.muted, 3);
  regx.forEach((x, i) => {
    const at = chart.point(x, targets[i]);
    const from = chart.point(x, prediction[i]);
    const mark = () => {
      if (gapRead > 0)
        api.line(ctx, from.x, from.y, at.x, api.lerp(from.y, at.y, gapRead), C.pink, 5);
      api.circle(ctx, at.x, at.y, 13, C.yellow);
    };
    if (i === 2) api.focus.target('long-gap', mark);
    else mark();
  });
  api.focus.target('prediction-step', () => stepLine(prediction, C.cyan, 6));
  const signed = (n) => (n > 0 ? '+' : '−') + Math.abs(n).toFixed(1);
  const gaps = refreshed ? targets.map((v, i) => v - prediction[i]) : residuals;
  if (gapRead === 1)
    api.focus.target('residuals', () => {
      label(
        ctx,
        api,
        refreshed ? 'Targets for the next tree' : 'Residuals at the start of this round',
        1480,
        354,
        33,
      );
      gaps.forEach((r, i) => {
        label(ctx, api, 'x = ' + regx[i], 1285 + i * 203, 413, 27, C.muted);
        const concealed = refreshed && i === 2 && !remainingKnown;
        label(ctx, api, concealed ? '?' : signed(r), 1285 + i * 203, 481, 48, C.pink);
      });
    });
  if (beat > 0 && !refreshed) {
    api.path(
      ctx,
      [
        { x: 1225, y: 506 },
        { x: 1225, y: 534 },
        { x: 1550, y: 534 },
        { x: 1550, y: 506 },
      ],
      { color: C.muted, width: 3 },
    );
    label(ctx, api, 'Mean of first two', 1385, 599, 29, C.muted);
    label(ctx, api, 'Last', 1691, 599, 29, C.muted);
    label(ctx, api, signed(leaves[0]), 1385, 674, 49);
    label(ctx, api, signed(leaves[1]), 1691, 674, 49);
  }
  if (beat === 0 && gapRead === 1) {
    label(ctx, api, 'The vertical gaps measure minutes.', 1480, 684, 32, C.muted);
  } else if (refreshed) {
    const gap = remainingKnown ? String(gaps[2]) : '?';
    label(
      ctx,
      api,
      targets[2] + ' − ' + prediction[2] + ' = ' + gap + ' minutes remaining',
      1470,
      670,
      35,
      C.pink,
    );
  } else if (beat === 1 || beat === 2) {
    const left = 1225,
      right = 1730,
      y = 820;
    api.focus.target('learning-rate', () => {
      label(ctx, api, 'One tenth of the gap to ' + targets[2] + ' minutes', 1477, y - 63, 31);
      api.line(ctx, left, y, right, y, C.muted, 4);
      for (let tenth = 0; tenth <= 10; tenth++) {
        const x = api.lerp(left, right, tenth / 10);
        api.line(ctx, x, y - 10, x, y + 10, C.muted, 3);
      }
      const x = api.lerp(left, right, (prediction[2] - previous[2]) / leaves[1]);
      api.line(ctx, left, y, x, y, C.cyan, 10);
      api.circle(ctx, x, y, 12, C.cyan);
      label(ctx, api, previous[2] + ' min', left, y + 52, 31, C.cyan, 'left');
      label(ctx, api, targets[2] + ' min', right, y + 52, 31, C.yellow, 'right');
    });
  } else if (beat === 3) {
    label(ctx, api, 'Keep one tenth of each leaf correction', 1465, 805, 30, C.muted);
  }
  const completed = round + (amount === 1 ? 1 : 0);
  const display = (v) => Number(v.toFixed(2));
  label(ctx, api, 'Predicted minutes', 145, 976, 36, C.muted, 'left');
  const settled = beat === 2 && apply < 1 ? previous : prediction;
  label(ctx, api, settled.map(display).join('     ·     '), 865, 980, 51, C.cyan);
  label(
    ctx,
    api,
    completed + (completed === 1 ? ' round complete' : ' rounds complete'),
    1750,
    976,
    34,
    C.muted,
    'right',
  );
}
export default {
  id: 'boosting',
  draw: drawBoosting,
  cues: ['first-gaps', 'add-correction', 'measure-again', 'remaining-gap', 'next-rounds'],
};
