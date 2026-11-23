import { freshGroupWorksheet } from '../model.mjs';
import { sampleModel } from '../construction.mjs';
import { motion, settled } from '../timing.mjs';

const separate = freshGroupWorksheet(true);
const together = freshGroupWorksheet();
const firstStep = together.scale * 2 ** -9;
const scaleLabel = (scale) => (scale === separate.scale ? '2⁻¹⁸' : String(scale));

export function drawFreshGroup(ctx, scene, state, api) {
  const { C } = api;
  const s = sampleModel('fresh-group', state);
  const join = motion(state, 'fresh-join', 0);
  const split = motion(state, 'fresh-split', 3);
  const rechecked = settled(state, 'fresh-recheck', 3);
  const separated = join === 0 || split >= 1;
  // Widen the two probe columns so their values travel inside their cells.
  const cellWidth = (k) => (k === 0 ? 140 : k === 3 ? 100 : 35);
  const slotX = (k) => 494 + 35 * k + (k > 0 ? 105 : 0) + (k > 3 ? 65 : 0);
  const rowY = [348, 498];
  const spikeY = rowY[1] - (rowY[1] - rowY[0]) * join * (1 - split);
  api.focus.target('fresh-blocks', () => {
    api.text(ctx, '32 E4M3 values per block', 145, 241, 33, C.ink);
    api.text(ctx, 'All other input values are zero', 1770, 241, 29, C.muted, 'right');
    for (const [r, y] of rowY.entries()) {
      api.text(ctx, 'Block ' + (r === 0 ? 'A' : 'B'), 145, y + 13, 38, C.ink);
      const hasScale = separated || (r === 0 ? s.showScale : s.showZero);
      const scale = (separated ? separate : together).scales[r];
      api.text(ctx, hasScale ? 'S = ' + scaleLabel(scale) : 'S = ?', 145, y + 65, 31, C.yellow);
      for (let k = 0; k < 32; k++) {
        const width = cellWidth(k) - 2;
        if (k === 3 && spikeY > rowY[0] && spikeY < rowY[1]) {
          api.line(ctx, slotX(k), y - 25, slotX(k), y + 25, C.muted, 2);
          api.line(ctx, slotX(k) + width, y - 25, slotX(k) + width, y + 25, C.muted, 2);
        } else {
          api.rect(ctx, slotX(k), y - 27, width, 54, C.panel, C.muted, 1);
        }
      }
    }
    api.text(ctx, String(s.tiny.original), slotX(0) + 69, rowY[0] + 11, 33, C.blue, 'center');
    api.rect(ctx, slotX(3) + 3, spikeY - 24, 92, 48, C.panel, C.yellow, 3);
    api.text(ctx, String(s.spike.original), slotX(3) + 49, spikeY + 11, 32, C.yellow, 'center');
  });
  api.focus.target('fresh-probe', () => {
    const selected = state.beat === 2 ? 3 : 0;
    api.text(ctx, 'Block A weights', 145, 625, 31, C.cyan);
    for (let k = 0; k < 32; k++) {
      const h = k === selected ? 43 : 3;
      const center = slotX(k) + cellWidth(k) / 2;
      api.rect(ctx, center - 8, 615 - h, 16, h, k === selected ? C.cyan : C.muted, undefined, 0);
    }
    if (state.beat === 0) {
      api.text(
        ctx,
        'Read index 0 with weight 1. Every other weight is zero.',
        960,
        703,
        39,
        C.blue,
        'center',
      );
      api.text(
        ctx,
        'Choose the smallest power of two ≥ max |x| / 448',
        960,
        824,
        36,
        C.ink,
        'center',
      );
      const ask = join === 1 ? '       What will index 0 return?' : '';
      api.text(ctx, 'First positive step = S × 2⁻⁹' + ask, 960, 950, 38, C.ink, 'center');
      return;
    }
    if (state.beat === 1 && !s.showScale) {
      api.text(ctx, '700 / 448 = ' + s.spike.original / 448, 960, 790, 49, C.yellow, 'center');
      api.text(ctx, 'Which power of two covers this group?', 960, 935, 40, C.ink, 'center');
      return;
    }
    if (state.beat === 2) {
      api.text(ctx, 'Read index 3', 160, 675, 33, C.muted);
      api.text(ctx, '700 / 2 = ' + s.spike.scaled, 160, 775, 52, C.blue);
      api.text(ctx, 'Nearest E4M3 value', 749, 675, 33, C.muted);
      api.text(ctx, s.showSpike ? s.spike.value : '?', 749, 775, 52, C.yellow);
      api.text(ctx, 'Multiply by S', 1425, 675, 33, C.muted);
      api.text(ctx, s.showSpike ? s.spike.reconstructed : '?', 1425, 775, 52, C.cyan);
      api.text(ctx, 'Index 0 still reads ' + s.tiny.reconstructed, 960, 950, 37, C.blue, 'center');
      return;
    }
    const x = (v) => 285 + (v / firstStep) * 1345;
    const y = 817;
    api.line(ctx, x(0), y, x(firstStep), y, C.muted, 3);
    api.text(ctx, 'Index 0 in activation units', 160, 681, 32, C.ink);
    for (const [v, label] of [
      [0, '0'],
      [firstStep / 2, 'midpoint'],
      [firstStep, String(firstStep)],
    ]) {
      api.line(ctx, x(v), y - 13, x(v), y + 13, C.muted, 3);
      api.text(
        ctx,
        state.beat === 3 && v !== 0 ? String(v) : label,
        x(v),
        y + 64,
        30,
        C.muted,
        'center',
      );
    }
    api.circle(ctx, x(s.tiny.original), y - 13, 11, C.blue);
    api.text(ctx, 'Input ' + s.tiny.original, x(s.tiny.original), y - 52, 32, C.blue, 'center');
    const decoded = rechecked ? separate.tiny.reconstructed : together.tiny.reconstructed;
    if (s.showTiny && (split === 0 || rechecked)) api.circle(ctx, x(decoded), y + 15, 12, C.cyan);
    if (rechecked) {
      api.circle(ctx, x(together.tiny.reconstructed), y + 15, 12, C.pink);
      api.text(ctx, 'Spike in block A', 250, 942, 31, C.muted);
      api.text(ctx, 'Index 0 returned ' + together.tiny.reconstructed, 250, 1001, 42, C.pink);
      api.text(ctx, 'Spike back in block B', 895, 942, 31, C.muted);
      api.text(ctx, separate.tiny.value + ' × 2⁻¹⁸ = ' + decoded, 895, 1001, 42, C.cyan);
      return;
    }
    const middle = firstStep / 2;
    const detail =
      state.beat === 3 && split > 0
        ? 'Same input, same selector. Re-encode each block.'
        : s.showTiny
          ? s.tiny.original + ' < ' + middle + '     →     stored operand  ' + decoded
          : 'Shared block: half of one step = ' + middle;
    api.text(ctx, detail, 960, 982, 41, C.cyan, 'center');
  });
}

export default {
  id: 'fresh-group',
  draw: drawFreshGroup,
  cues: [
    'fresh-join',
    'fresh-question',
    'lp-fresh-group-scale',
    'lp-fresh-group-tiny',
    'lp-fresh-group-spike',
    'lp-fresh-group-zero',
    'fresh-split',
    'fresh-recheck',
  ],
};
