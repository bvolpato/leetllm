import { warpRequests } from '../model.mjs';
import { cell, finished, label } from '../workbench.mjs';

function layout(ctx, api) {
  const { C } = api;
  const words = [1, 2, 3, 4, 5, 6];
  label(ctx, api, 'The six words in memory', 960, 303, 35, C.ink);
  words.forEach((v, i) => cell(ctx, api, v, 489 + 160 * i, 335, 140, 87, C.muted));
  for (const [order, x, color] of [['Row-major', 347, C.blue], ['Column-major', 1110, C.pink]]) {
    label(ctx, api, order, x + 210, 535, 36, color);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 3; j++) {
      cell(ctx, api, words[order === 'Row-major' ? i * 3 + j : j * 2 + i], x + j * 146, 572 + i * 110, 130, 92, color);
    }
  }
  label(ctx, api, 'Same buffer · same shape · different leading dimension and indexing', 960, 922, 32, C.ink);
}

export function drawAddresses(ctx, scene, state, api) {
  if (state.beat === 3) return api.focus.target('address-map', () => layout(ctx, api));
  const { C } = api;
  const columns = state.beat >= 1 && finished(state, 1, 'remap-warp');
  const { lanes, sectors } = warpRequests(columns);
  api.focus.target('address-map', () => {
    label(ctx, api, columns ? '32 × 8 block · thread x selects column' : '16 × 16 block · thread x selects row', 960, 260, 41, C.ink);
    label(ctx, api, 'Byte offset', 392, 375, 31, C.muted, 'right');
    const sample = [0, 1, 2, 15, 16, 31];
    sample.forEach((lane, j) => label(ctx, api, `lane ${lane}`, 502 + j * 172, 375, 29, C.muted));
    label(ctx, api, '32-byte sectors', 1572, 375, 30, C.yellow);
    for (const [r, [key, name, color]] of [['a', 'A load', C.blue], ['b', 'B load', C.pink], ['c', 'C store', C.cyan]].entries()) {
      const y = 414 + r * 125;
      label(ctx, api, name, 392, y + 58, 35, color, 'right');
      sample.forEach((lane, j) => cell(ctx, api, lanes[lane][key], 427 + j * 172, y, 152, 89, color, 35));
      cell(ctx, api, sectors[r], 1492, y, 160, 89, C.yellow, 45);
    }
    if (state.beat >= 2) {
      for (let sector = 0; sector < 4; sector++) {
        const x = 425 + sector * 323;
        for (let word = 0; word < 8; word++) api.rect(ctx, x + word * 37, 839, 33, 35, C.pink, undefined, 2);
        label(ctx, api, `B · sector ${sector}`, x + 146, 916, 28, C.pink);
      }
    }
    const note = finished(state, 2, 'total-sectors')
      ? 'Requested sectors across three instructions      16 + 1 + 16 = 33     →     1 + 4 + 4 = 9'
      : 'Aligned FP32 · N = K = 64 · loads at k = 0 · C stored once after the loop';
    label(ctx, api, note, 960, 1006, 29, C.muted);
  });
}
export default { id: 'addresses', draw: drawAddresses, cues: ['strided-warp', 'remap-warp', 'four-sectors', 'total-sectors', 'layout-words'] };
