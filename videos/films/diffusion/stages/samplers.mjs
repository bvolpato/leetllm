import { valueColor } from '../defaults.mjs';
import { TOP_PIXEL } from '../fixtures.mjs';
import { afterPhrase, blend, cueProgress, decimal, drawPair, drawRuler, worksheet } from '../pixel-study.mjs';

const jump = worksheet(0.5, 0.9);
const columns = 16;
const firstRow = 3;
const rows = 12;
const crop = (field) => field.slice(firstRow * columns, (firstRow + rows) * columns);
const reference = crop(jump.reference);

function compareGrain(ctx, state, api) {
  const scaling = cueProgress(state, 'jump-scale', 2);
  const restoring = cueProgress(state, 'jump-direction', 4);
  const pixels = state.beat < 4
    ? blend(jump.recovered, jump.scaled, scaling)
    : blend(jump.scaled, jump.destination, restoring);
  const x = 560, y = 259, cell = 50;
  const sampleCenter = ((TOP_PIXEL % columns) + 0.5) / columns;
  const split = state.beat < 4
    ? 0.68 + (sampleCenter - 0.68) * scaling
    : sampleCenter + (0.68 - sampleCenter) * restoring;
  const { C } = api;

  api.focus.target('pixel-reference', () => {
    api.text(ctx, 'Saved exposure', 297, 468, 40, C.cyan, 'center');
    api.text(ctx, decimal(jump.reference[TOP_PIXEL]), 297, 561, 78, C.ink, 'center');
  });
  api.focus.target('pixel-working', () => {
    api.text(ctx, 'Working exposure', 1625, 468, 40, C.yellow, 'center');
    api.text(ctx, decimal(pixels[TOP_PIXEL]), 1625, 561, 78, C.ink, 'center');
    const { dividerX } = api.teaching.rasterWipe({
      x, y, width: columns * cell, height: rows * cell, rows, columns,
      left: reference, right: crop(pixels), split, color: valueColor,
    });

    const squareX = x + (TOP_PIXEL % columns) * cell;
    const squareY = y + (Math.floor(TOP_PIXEL / columns) - firstRow) * cell;
    api.rect(ctx, squareX, squareY, cell, cell, 'transparent', C.bg, 0);
    api.rect(ctx, squareX + 2, squareY + 2, cell - 4, cell - 4, 'transparent', C.yellow, 0);
    if (restoring < 1) {
      ctx.save();
      ctx.globalAlpha *= 1 - restoring;
      api.line(ctx, dividerX, y, dividerX, y + rows * cell, C.ink, 3);
      ctx.restore();
    }
  });
  api.focus.target('pixel-method', () => {
    const action = state.beat < 4 ? 'Scale the clean estimate' : 'Restore the noise direction';
    api.text(ctx, action, 960, 222, 35, C.ink, 'center');
  });
  api.focus.target('pixel-brightness', () =>
    drawRuler(ctx, api, {
      left: 0.35, right: 1.05, ticks: [0.4, 0.6, 0.8, 1],
      reference: jump.reference[TOP_PIXEL], current: pixels[TOP_PIXEL],
    }),
  );
}

export function drawSamplers(ctx, scene, state, api) {
  const b = state.beat;
  if (b >= 2 && typeof api.teaching?.rasterWipe === 'function') return compareGrain(ctx, state, api);
  let pixels = jump.input;
  let title = 'Noisy input';
  let notes = ['Known noise', 'ε = −0.400', '0.50 → 0.90'];
  if (b === 1) {
    const subtract = cueProgress(state, 'jump-subtract', 1);
    const divide = cueProgress(state, 'jump-divide', 1);
    pixels = blend(blend(jump.input, jump.signal, subtract), jump.recovered, divide);
    title = divide >= 1 ? 'Recovered clean estimate' : 'Undo the forward mix';
    notes = ['Recover clean brightness', '0.424 − (−0.283)', 'then divide by √0.50'];
  } else if (b === 2 || b === 3) {
    const p = cueProgress(state, 'jump-scale', 2);
    pixels = blend(jump.recovered, jump.scaled, p);
    title = p === 1 ? 'Clean contribution' : 'Scale the clean estimate';
    notes = ['Destination level 0.90', '√0.90 × clean'];
    if (b === 3) notes.push('Which term moves it back?');
  } else if (b >= 4) {
    const p = cueProgress(state, 'jump-direction', 4);
    pixels = blend(jump.scaled, jump.destination, p);
    title = p === 1 ? 'Sampler output' : 'Add the noise direction';
    notes = [
      'Destination level 0.90',
      '√0.10 × (−0.4)',
      afterPhrase(state, 'jump-match', 4) ? 'Readings match' : 'Fresh draw × 0',
    ];
  }
  drawPair(ctx, api, {
    left: { title: 'Saved exposure', subtitle: 'Retained variance  0.90', pixels: jump.reference },
    right: { title, pixels },
    notes,
    ruler: { left: 0.35, right: 1.05, ticks: [0.4, 0.6, 0.8, 1] },
  });
}
export default {
  id: 'samplers',
  draw: drawSamplers,
  cues: [
    'jump-input',
    'jump-subtract',
    'jump-divide',
    'jump-scale',
    'jump-question',
    'jump-direction',
    'jump-match',
  ],
};
