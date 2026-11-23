import { modelSnapshot } from '../construction.mjs';
import { card, text } from '../defaults.mjs';
import { FEATURES, LABELS } from '../fixtures.mjs';
import { scoreTicket, signed } from '../route-ruler.mjs';
import { finished } from '../scene-clock.mjs';
import { stableSoftmax } from 'vizmatic';

function weightTable(ctx, api, x, name, values, color, highlight, cellWidth = 150) {
  const { C } = api;
  const cellHeight = 150;
  const gap = 7;
  const columnStride = cellWidth + gap;
  text(ctx, api, name, x + (columnStride + cellWidth) / 2, 404, 43, color, 'center');
  ['Urgency', 'Severity'].forEach((feature, j) =>
    text(ctx, api, feature, x + cellWidth / 2 + j * columnStride, 451, 29, C.muted, 'center'),
  );
  ['Standard', 'Escalate'].forEach((route, i) => {
    const y = 465 + (cellHeight + gap) * i;
    text(ctx, api, route, x - 27, y + cellHeight / 2 + 10, 31, C.ink, 'right');
    for (let j = 0; j < 2; j++) {
      const selected = highlight && i === 1 && j === 0;
      const value = values ? Number(values[i][j].toFixed(3)) : '·';
      card(
        ctx,
        api,
        String(value),
        x + j * columnStride,
        y,
        cellWidth,
        cellHeight,
        selected ? C.yellow : color,
        1,
        selected ? 50 : 42,
      );
    }
  });
}

export function drawPhases(ctx, scene, state, api) {
  const { C } = api;
  const current = modelSnapshot('phases', state);
  const a = finished(state, 'phases-contrib-a', 1, 0.32);
  const b = finished(state, 'phases-contrib-b', 1, 0.59);
  api.focus.target('phases-pair', () => {
    text(ctx, api, 'A   [1, 1]   →   escalate', 510, 260, 39, C.blue, 'center');
    text(ctx, api, 'B   [−1, −1]   →   standard', 1410, 260, 39, C.blue, 'center');
    if (a) text(ctx, api, '(0.5 − 1) × (+1) = −0.5', 510, 335, 36, C.yellow, 'center');
    if (b) text(ctx, api, '(0.5 − 0) × (−1) = −0.5', 1410, 335, 36, C.yellow, 'center');
  });
  api.focus.target('phases-weight-matrix', () =>
    weightTable(ctx, api, 450, 'Weights  W', current.weights, C.green, false, 176),
  );
  api.focus.target('phases-gradient-matrix', () =>
    weightTable(
      ctx,
      api,
      1130,
      'Gradient buffer  W.grad',
      current.gradient,
      current.gradient ? C.pink : C.muted,
      a,
    ),
  );
  const rows = FEATURES.map((ticket) => scoreTicket(current.weights, ticket));
  const loss =
    rows.reduce((sum, row, i) => sum - Math.log(stableSoftmax(row.logits)[LABELS[i]]), 0) /
    rows.length;
  api.focus.target('phases-readout', () => {
    text(
      ctx,
      api,
      'A scores   ' + rows[0].logits.map(signed).join('   /   '),
      520,
      895,
      37,
      C.cyan,
      'center',
    );
    text(
      ctx,
      api,
      'Mean loss   ' + loss.toFixed(4) + ' nats/ticket',
      1390,
      895,
      37,
      C.cyan,
      'center',
    );
    const call = [
      'zero_grad  →  forward  →  cross entropy',
      'loss.backward()',
      'optimizer.step()  →  score again',
    ][state.beat];
    api.text(ctx, call, 960, 985, 35, C.ink, 'center', 'mono');
  });
}
export default {
  id: 'phases',
  draw: drawPhases,
  cues: [
    'phases-inputs',
    'phases-loss',
    'phases-contrib-a',
    'phases-contrib-b',
    'phases-written',
    'phases-weights-still-zero',
    'phases-beat-3-focus-1',
    'phases-rescore',
  ],
};
