import { spoken } from '../cue.mjs';
import { simultaneousWidthUpdate } from '../model.mjs';
import { line, rectangle, text } from '../defaults.mjs';

const widths = [16, 64, 256];

function drawPair(ctx, api, after) {
  const { C } = api;
  const { u, v } = simultaneousWidthUpdate(widths[0]);
  text(
    ctx,
    api,
    'Input = 1     ·     width = 16     ·     8 pairs of paths',
    960,
    275,
    40,
    C.ink,
    'center',
  );
  const columns = [540, 940, 1430];
  for (const [i, heading] of ['Input weight', 'Output weight', 'Contribution'].entries()) {
    text(ctx, api, heading, columns[i], 390, 38, C.muted, 'center');
  }
  for (const i of [0, 1]) {
    const y = 465 + i * 143;
    const color = i === 0 ? C.blue : C.pink;
    text(ctx, api, 'Path ' + (i + 1), 152, y + 54, 38, C.muted);
    rectangle(ctx, api, columns[0] - 94, y - 14, 188, 100, color, color);
    text(ctx, api, u[i] > 0 ? '+1' : '−1', columns[0], y + 58, 58, C.bg, 'center');
    text(ctx, api, '×', 740, y + 56, 49, C.ink, 'center');
    text(ctx, api, v[i], columns[1], y + 58, 58, C.ink, 'center');
    text(ctx, api, '=', 1180, y + 56, 49, C.muted, 'center');
    const ready = after(i === 0 ? 'width-positive' : 'sl-width-transfer-0');
    const contribution = u[i] * v[i];
    text(
      ctx,
      api,
      ready ? (contribution > 0 ? '+' : '−') + Math.abs(contribution) : '?',
      columns[2],
      y + 58,
      58,
      ready ? color : C.muted,
      'center',
    );
  }
  if (after('width-zero')) {
    text(ctx, api, '8 × (0.25 − 0.25) = 0', 960, 839, 61, C.ink, 'center');
  }
  text(ctx, api, 'Target 1     ·     loss = ½(prediction − 1)²', 960, 957, 38, C.muted, 'center');
}

export function drawWidthTransfer(ctx, scene, state, api) {
  const { C } = api;
  const after = (id) => spoken(scene, state, id).phase === 'after';
  api.focus.target('sl-width-transfer-construction', () => {
    if ((state.beat ?? 0) === 0) {
      drawPair(ctx, api, after);
      return;
    }
    const coordinated = state.beat >= 2;
    const lowerRate = after('sl-width-transfer-2');
    const eta = lowerRate ? 0.25 : 1;
    const known = after('sl-width-transfer-1') && (!lowerRate || after('width-half'));
    const standardCues = ['width-sixteen', 'width-sixty-four', 'width-standard'];
    text(
      ctx,
      api,
      'One SGD step from 0     ·     target 1     ·     base learning rate ' + eta,
      960,
      263,
      39,
      C.ink,
      'center',
    );
    text(ctx, api, 'Width', 155, 379, 43, C.ink);
    text(ctx, api, 'Standard update', 390, 379, 48, C.blue);
    text(ctx, api, 'Output weights start at 1/√width', 390, 447, 31, C.muted);
    text(ctx, api, 'Both rates equal the base rate', 390, 502, 31, C.muted);
    if (coordinated) {
      text(ctx, api, 'Coordinated update (close-up)', 1095, 379, 43, C.cyan);
      text(ctx, api, 'Output weights start at 1/width', 1095, 447, 31, C.muted);
      text(ctx, api, 'Input rate × width   ·   output rate ÷ width', 1095, 502, 31, C.muted);
    }
    const chartLeft = 390;
    const zoomLeft = 1095;
    const zoomScale = 215;
    const standardScale = 446 / simultaneousWidthUpdate(widths.at(-1)).prediction;
    if (coordinated) {
      text(ctx, api, 'Target 1', zoomLeft + zoomScale, 568, 30, C.pink, 'center');
      line(ctx, api, zoomLeft + zoomScale, 586, zoomLeft + zoomScale, 885, C.pink, 3);
    }
    widths.forEach((width, i) => {
      const y = 610 + 108 * i;
      text(ctx, api, width, 155, y + 44, 49, C.ink);
      const standard = simultaneousWidthUpdate(width, false, eta).prediction;
      if (after(standardCues[i])) {
        const length = standard * standardScale;
        rectangle(ctx, api, chartLeft, y, length, 52, C.blue, C.blue);
        text(ctx, api, standard, chartLeft + length + 18, y + 43, 40, C.blue);
      } else {
        text(ctx, api, '?', chartLeft, y + 43, 40, C.muted);
      }
      if (!coordinated) return;
      if (!known) {
        text(ctx, api, '?', zoomLeft, y + 43, 40, C.muted);
        return;
      }
      const value = simultaneousWidthUpdate(width, true, eta).prediction;
      const length = value * zoomScale;
      rectangle(ctx, api, zoomLeft, y, length, 52, C.cyan, C.cyan);
      line(ctx, api, zoomLeft + length / 2, y, zoomLeft + length / 2, y + 52, C.bg, 4);
      text(ctx, api, value, zoomLeft + length + 18, y + 43, 40, C.cyan);
    });
    if (after('width-standard')) {
      text(
        ctx,
        api,
        'Prediction = ' + (lowerRate ? '0.25 × (width + 1)' : 'width + 1'),
        chartLeft,
        977,
        36,
        C.blue,
      );
    }
    if (coordinated) {
      text(
        ctx,
        api,
        known
          ? eta + ' + ' + eta + ' from the two layers'
          : 'Where will the three predictions land?',
        zoomLeft,
        977,
        36,
        known ? C.cyan : C.ink,
      );
    }
  });
}

export default {
  id: 'width-transfer',
  draw: drawWidthTransfer,
  cues: [
    'width-positive',
    'sl-width-transfer-0',
    'width-zero',
    'width-sixteen',
    'width-sixty-four',
    'width-standard',
    'width-recipe',
    'sl-width-transfer-1',
    'sl-width-transfer-2',
    'width-half',
  ],
};
