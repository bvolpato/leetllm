import { beatCue } from '../arithmetic.mjs';
import { center, pixels } from '../fixtures.mjs';
import { mse, recon, z } from '../model.mjs';
import { chapterGrid, text } from '../defaults.mjs';

export function drawDecoderPixel(ctx, scene, state, api) {
  const { C } = api;
  const left = 260,
    right = 1170,
    top = 318,
    side = 88;
  if (state.beat === 3) {
    const errors = pixels.map((v, i) => (v - recon[i]) ** 2);
    const gain = 1 + 34 * beatCue(state, 3, 'error-gain', 0.3, 0.65);
    [
      [left, 1],
      [right, gain],
    ].forEach(([x, factor]) => {
      chapterGrid(
        ctx,
        api,
        errors.map((v) => v * factor),
        x,
        top,
        side,
      );
      text(
        ctx,
        api,
        'Squared error   ×' + Number(factor.toFixed(1)),
        x + 215,
        260,
        38,
        C.ink,
        'center',
      );
    });
    text(ctx, api, 'Mean squared error   ' + mse.toFixed(6), 960, 870, 42, C.ink, 'center');
    return;
  }

  const neighbor = state.beat === 2;
  const index = neighbor ? 15 : center[0];
  const indices = neighbor ? [index] : center;
  const paint = beatCue(state, 0, 'paint-center', 0.38, 0.63);
  const centerReady = beatCue(state, 0, 'show-center', 0.64, 0.8) === 1;
  const flagged = beatCue(state, 1, 'flag-four', 0.02, 0.13) === 1;
  const weighted = beatCue(state, 2, 'paint-neighbor', 0.31, 0.55);
  const neighborReady = beatCue(state, 2, 'show-neighbor', 0.55, 0.72) === 1;
  const inputCells = chapterGrid(ctx, api, pixels, left, top, side);
  const outputCells = chapterGrid(ctx, api, recon, right, top, side);
  text(ctx, api, 'Original crop', left + 215, 254, 40, C.cyan, 'center');
  text(ctx, api, 'Fixed decoder', right + 215, 254, 40, C.green, 'center');
  for (const i of indices) {
    const a = inputCells[i],
      b = outputCells[i];
    const color = flagged && !neighbor && pixels[i] > 0.9 ? C.pink : C.cyan;
    api.rect(ctx, a.x, a.y, a.width, a.height, null, color, 4, 2);
    text(
      ctx,
      api,
      pixels[i].toFixed(2),
      a.x + a.width / 2,
      a.y + 52,
      29,
      pixels[i] > 0.5 ? C.bg : C.ink,
      'center',
    );
    const visible = neighbor ? neighborReady : centerReady;
    api.rect(
      ctx,
      b.x,
      b.y,
      b.width,
      b.height,
      visible ? null : C.panel,
      flagged && !neighbor ? C.pink : C.yellow,
      4,
      2,
    );
    text(
      ctx,
      api,
      visible ? recon[i].toFixed(4).replace(/^0/, '') : '?',
      b.x + b.width / 2,
      b.y + 51,
      visible ? 23 : 32,
      visible && recon[i] > 0.5 ? C.bg : C.ink,
      'center',
    );
  }
  const operand = neighbor ? z[1] : z[0];
  text(ctx, api, neighbor ? 'Lower average' : 'Center average', 935, 420, 32, C.yellow, 'center');
  text(ctx, api, String(operand), 935, 488, 48, C.yellow, 'center');
  if (neighbor ? weighted === 1 : paint === 1) {
    const weight = neighbor ? 0.35 : 1;
    text(ctx, api, weight + ' × ' + operand, 935, 594, 31, C.ink, 'center');
    text(ctx, api, '+ 0.08', 935, 656, 34, C.ink, 'center');
  }
  if (flagged && !neighbor) {
    [pixels, recon].forEach((row, j) => {
      const n = center.filter((i) => row[i] > 0.9).length;
      text(ctx, api, n + ' of 4 above 0.90', (j ? right : left) + 215, 850, 40, C.pink, 'center');
    });
  }
  if (neighborReady && neighbor)
    text(
      ctx,
      api,
      '0.08 + ' + (operand * 0.35).toFixed(4) + ' = ' + recon[index].toFixed(4),
      right + 215,
      850,
      36,
      C.green,
      'center',
    );
}

export default {
  id: 'decoder-pixel',
  draw: drawDecoderPixel,
  cues: [
    'paint-center',
    'show-center',
    'flag-four',
    'paint-neighbor',
    'show-neighbor',
    'error-gain',
  ],
};
