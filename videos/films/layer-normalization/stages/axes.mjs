import { ln, mean } from '../arithmetic.mjs';
import { row1, row2 } from '../fixtures.mjs';
import { text } from '../defaults.mjs';
import { motion } from '../timing.mjs';

export function drawAxes(ctx, scene, state, api) {
  const { C } = api;
  const edit = motion(state, 'axes-edit', 1, 0.01, 0.16);
  const later = row2.map(v => v + 100 * edit);
  const all = row1.concat(later);
  text(ctx, api, 'One sentence', 150, 290, 38, C.ink);
  ['Feature 1', 'Feature 2', 'Feature 3'].forEach((s, i) => text(ctx, api, s, 415 + 205 * i, 392, 30, C.muted, 'center'));

  for (const [i, values] of [row1, later].entries()) {
    const y = 515 + i * 164;
    text(ctx, api, i ? 'Later' : 'First', 150, y, 40, i ? C.yellow : C.ink);
    api.focus.target(i ? 'peer-features' : 'first-features', () => {
      values.forEach((v, j) => text(ctx, api, Number.isInteger(v) ? v : v.toFixed(1), 415 + j * 205, y, 48, i ? C.yellow : C.ink, 'center'));
    });
  }

  const rows = [
    { x: 905, top: 448, bottom: 555, color: C.green, label: 'Only the first token', values: row1, original: row1 },
    { x: 975, top: 423, bottom: 726, color: C.pink, label: 'Both tokens together', values: all, original: row1.concat(row2) },
  ];
  for (const [i, row] of rows.entries()) {
    api.path(ctx, [{ x: row.x - 20, y: row.top }, { x: row.x, y: row.top }, { x: row.x, y: row.bottom }, { x: row.x - 20, y: row.bottom }], { color: row.color, width: 4 });
    const y = 390 + i * 256;
    text(ctx, api, row.label, 1080, y, 39, row.color);
    text(ctx, api, `Mean    ${mean(row.values).toFixed(3)}`, 1080, y + 75, 35, C.ink);
    const before = ln(row.original)[0].toFixed(3);
    const now = ln(row.values)[0].toFixed(3);
    text(ctx, api, `First output    ${before}${edit > 0 ? '   →   ' + now : ''}`, 1080, y + 145, 39, row.color);
  }
  const footer = state.beat === 0 ? 'Add 100 only to the later token. Which first output changes?' :
    state.beat === 1 ? 'The first token still contains 1, 2 and 4.' : 'LayerNorm(3)    ·    features only                 LayerNorm((2, 3))    ·    time and features';
  text(ctx, api, footer, 960, 979, 39, C.ink, 'center');
}
export default { id: 'axes', draw: drawAxes, cues: ['axes-edit'] };
