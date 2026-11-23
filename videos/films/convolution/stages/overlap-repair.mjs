import { poolSnapshot } from '../arithmetic.mjs';
import { OVERLAP_MAP, POOL_INCOMING } from '../fixtures.mjs';
import { cueClock, footprint } from '../footprint.mjs';
import { positions } from '../pooling-picture.mjs';
import { formatChapterValue as fmt, text, valueGrid } from '../defaults.mjs';

const input = POOL_INCOMING.flat();
const pool = poolSnapshot(OVERLAP_MAP, { stride: 1 });
const increments = [
  'accumulate-first',
  'accumulate-negative',
  'accumulate-half',
  'correct-gradient',
];

export function drawOverlapRepair(ctx, scene, state, api) {
  const cue = cueClock(scene, state, api);
  const { C } = api;
  const beat = state.beat;
  const count = beat === 0 ? Math.floor(4 * cue('overlap-owners')) : pool.owners.length;
  const lost = beat > 1 ? input.length : Math.floor(input.length * cue('overwrite-gradient'));
  const kept = increments.filter((id) => cue(id) === 1).length;
  const adding = beat > 1 && cue('accumulate-reset') === 1;
  const step = beat === 0 ? count : adding ? kept : lost;
  const window = Math.max(0, step - 1);
  const owner = pool.owners[window];
  const [r, c] = owner.input;
  const sum = (n) => input.slice(0, n).reduce((a, b) => a + b, 0);
  api.focus.target('overlap-input', () => {
    text(ctx, api, 'Input responses', 365, 281, 37, C.ink, 'center');
    valueGrid(ctx, api, OVERLAP_MAP, 155, 352, 143, { font: 51, active: owner.flat });
    footprint(ctx, api, 155, 352, 143, window >> 1, window % 2, 2, 2, C.cyan);
    if (beat > 0 || count === 4)
      text(ctx, api, 'Saved cell (' + r + ', ' + c + ')', 365, 874, 36, C.yellow, 'center');
    if (beat > 0) {
      const current = adding ? sum(kept) : (input[lost - 1] ?? 0);
      text(ctx, api, 'Center gradient', 365, 947, 30, C.muted, 'center');
      text(ctx, api, fmt(current), 365, 1016, 54, adding ? C.green : C.pink, 'center');
    }
  });
  api.focus.target('overlap-ledger', () => {
    text(ctx, api, 'Pooled values', 1420, 278, 37, C.ink, 'center');
    text(ctx, api, 'Saved indices', 1720, 278, 35, C.ink, 'center');
    const values = pool.values.map((row, r) =>
      row.map((v, c) => (r * row.length + c < count ? v : '?')),
    );
    valueGrid(ctx, api, values, 1280, 335, 142, { font: 49, active: step > 0 ? window : undefined });
    if (beat > 0 || cue('overlap-index') === 1) {
      for (const [i, saved] of pool.owners.entries()) {
        const color = i === window ? C.yellow : C.ink;
        text(ctx, api, 'out ' + i + ' → flat ' + saved.flat, 1720, 373 + 75 * i, 32, color, 'center');
      }
    }
    if (beat === 0) return;
    api.line(ctx, 705, 646, 1800, 646, C.muted, 2);
    const columnX = (i) => 1060 + i * 198;
    const label = (s, y, color) => text(ctx, api, s, 715, y, 33, color);
    const value = (v, i, y, color) => text(ctx, api, fmt(v), columnX(i), y, 45, color, 'center');
    for (const [i, name] of positions.entries())
      text(ctx, api, name, columnX(i), 711, 29, i === window ? C.cyan : C.muted, 'center');
    label('Incoming', 790, C.ink);
    input.forEach((v, i) => value(v, i, 790, v < 0 ? C.pink : C.ink));
    label('Assign  =', 888, C.pink);
    for (let i = 0; i < lost; i++) value(input[i], i, 888, i === lost - 1 ? C.pink : C.muted);
    if (!adding) return;
    label('Add  +=', 986, C.green);
    for (let i = 0; i < kept; i++) value(sum(i + 1), i, 986, C.green);
  });
}
export default {
  id: 'overlap-repair',
  draw: drawOverlapRepair,
  cues: ['overlap-owners', 'overlap-index', 'overwrite-gradient', 'accumulate-reset', ...increments, 'overlap-check'],
};
