import { clamp } from '../construction.mjs';
import { edgeState } from '../model.mjs';
import {
  drawEdgeCard,
  drawEdgeL,
  drawEdgeRectangle,
  drawEdgeRow,
  drawEdgeText,
} from '../defaults.mjs';
export function drawResidentMemory(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = edgeState('resident-memory', state),
    { b: currentBeat, q, done, progress } = modelState;
  let edgeHeading = '',
    edgeNote = '';
  const note = (v) => (edgeNote = v),
    heading = (v) => (edgeHeading = v);
  api.focus.target('edge-resident-memory-mechanism', () => {
    heading('Keep downloaded storage separate from peak resident allocations');
    drawEdgeCard(ctx, api, 'Flash: downloaded artifact', 150, 350, 650, themeColors.blue, 110);
    drawEdgeL(ctx, api, 900, 345, 900, 560, themeColors.muted);
    drawEdgeCard(
      ctx,
      api,
      'RAM: tensors + live state + workspace',
      1040,
      350,
      710,
      themeColors.cyan,
      110,
    );
    const values = [1280, 16, 384, 192],
      names = ['weights', 'KV', 'workspace', 'runtime'],
      colors = [themeColors.blue, themeColors.cyan, themeColors.yellow, themeColors.green],
      scale = 1480 / 2304;
    drawEdgeL(ctx, api, 155 + 2048 * scale, 530, 155 + 2048 * scale, 920, themeColors.pink, 4);
    drawEdgeText(
      ctx,
      api,
      '2,048 MiB budget',
      155 + 2048 * scale,
      490,
      27,
      themeColors.pink,
      'center',
    );
    let x = 155;
    values.forEach((v, i) => {
      const ready = currentBeat > 1 || (currentBeat === 1 && done(names[i]));
      const p = currentBeat === 0 ? clamp(q * 4 - i) : ready ? 1 : 0,
        w = v * scale * p;
      drawEdgeRectangle(ctx, api, x, 590, w, 190, colors[i]);
      if (p === 1 && i !== 1)
        drawEdgeText(ctx, api, `${v} MiB`, x + w / 2, 685, 27, themeColors.bg, 'center');
      x += v * scale;
    });
    drawEdgeRow(
      ctx,
      api,
      ['weights', 'KV: 16 MiB', 'workspace', 'runtime'],
      150,
      845,
      1300,
      70,
      themeColors.blue,
    );
    if (currentBeat === 1 && done('sum'))
      drawEdgeText(ctx, api, 'Resident total 1,872 MiB', 150, 960, 31, themeColors.cyan);
    if (currentBeat === 1 && done('margin'))
      drawEdgeText(ctx, api, 'Headroom 176 MiB', 1250, 960, 31, themeColors.green);
    if (currentBeat === 2) {
      const p = progress('overflow');
      drawEdgeRectangle(ctx, api, x, 590, 256 * scale * p, 190, themeColors.pink);
      if (done('overflow'))
        drawEdgeText(
          ctx,
          api,
          '2,128 MiB peak > 2,048 MiB',
          960,
          960,
          33,
          themeColors.pink,
          'center',
        );
    }
    note('MiB resident ledger is supplied separately from compressed download size');
  });
  if (edgeHeading) drawEdgeText(ctx, api, edgeHeading, 960, 270, 33, themeColors.yellow, 'center');
  if (edgeNote) drawEdgeText(ctx, api, edgeNote, 960, 1020, 26, themeColors.muted, 'center');
}
export default {
  id: 'resident-memory',
  draw: drawResidentMemory,
  cues: [
    'edge-resident-memory-op-0',
    'edge-resident-memory-op-1',
    'edge-resident-memory-weights',
    'edge-resident-memory-kv',
    'edge-resident-memory-workspace',
    'edge-resident-memory-runtime',
    'edge-resident-memory-sum',
    'edge-resident-memory-margin',
    'edge-resident-memory-op-2',
    'edge-resident-memory-overflow',
  ],
};
