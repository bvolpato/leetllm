import { NF4_LEVELS } from '../fixtures.mjs';
import { nf4Block } from '../model.mjs';
import { resultAfter, cueMotion } from '../construction.mjs';
import { text, line, circle } from '../defaults.mjs';
import { point } from '../geometry.mjs';

const weights = [-0.2, 0, 0.2, 2];
const block = nf4Block(weights);
const fmt = (value) => String(Number(value.toFixed(6))).replace('-', '−');

export function drawNf4Codec(ctx, scene, state, api) {
  const { C } = api;
  const zoom = state.beat > 0;
  const domain = zoom ? 0.21 : 1;
  const map = (v) => 960 + (v / domain) * 754;
  const y = 486;
  const norm = resultAfter(state, 'nf4-normalized', 1, 0.53);
  const pos = resultAfter(state, 'nf4-positive', 2, 0.3);
  const neg = resultAfter(state, 'nf4-negative', 2, 0.65);
  const ends = resultAfter(state, 'nf4-ends', 2, 0.9);
  const decodedPositive = resultAfter(state, 'nf4-read-positive', 3, 0.28);
  const decodedNegative = resultAfter(state, 'nf4-read-negative', 3, 0.55);

  api.focus.target('nf4-ruler', () => {
    text(
      ctx,
      api,
      zoom ? 'Central five NF4 levels  ·  magnified' : 'All sixteen NF4 levels',
      170,
      247,
      37,
      C.ink,
    );
    line(ctx, api, point(map(-domain), y), point(map(domain), y), C.muted, 3);
    for (const [code, value] of NF4_LEVELS.entries()) {
      if (Math.abs(value) > domain) continue;
      const x = map(value);
      line(ctx, api, point(x, y - 18), point(x, y + 17), C.ink, 4);
      if (zoom || [0, 7, 15].includes(code)) {
        text(ctx, api, 'code ' + code, x, y - 74, 31, C.muted, 'center');
        text(ctx, api, fmt(value), x, y - 29, 33, C.ink, 'center', 'mono');
      }
    }
    if (norm) {
      for (const [i, cue, low, high] of [
        [0, 'nf4-negative', 0.37, 0.65],
        [2, 'nf4-positive', 0.04, 0.3],
      ]) {
        const start = map(block.normalized[i]),
          finish = map(NF4_LEVELS[block.codes[i]]);
        const progress = cueMotion(state, cue, 2, low, high);
        const x = start + (finish - start) * progress;
        const color = i === 0 ? C.pink : C.yellow;
        line(ctx, api, point(start, y + 38), point(start, y + 77), color, 3);
        text(ctx, api, fmt(block.normalized[i]), start, y + 113, 35, color, 'center', 'mono');
        if (progress > 0) line(ctx, api, point(start, y + 32), point(x, y + 32), color, 5);
        circle(ctx, api, x, y + 32, 9, color);
      }
    }
  });
  api.focus.target('nf4-block', () => {
    if (!zoom) {
      text(ctx, api, 'Weight block', 170, 700, 33, C.muted);
      text(ctx, api, '[−0.2,   0,   +0.2,   2]', 170, 792, 62, C.cyan, 'left', 'mono');
      text(ctx, api, 'Four bits select a position on this ruler.', 170, 913, 39, C.ink);
      return;
    }
    const scaleReady = resultAfter(state, 'nf4-scale', 1, 0.29);
    const cols = [207, 590, 970, 1410];
    const labels = [
      'Weight',
      scaleReady ? 'Divide by ' + block.scale : 'Divide by absmax',
      'Nearest code',
      'Reconstructed weight',
    ];
    labels.forEach((label, i) => text(ctx, api, label, cols[i], 684, 32, C.muted));
    for (const [i, weight] of weights.entries()) {
      const rowY = 747 + i * 73;
      const ready = [neg, ends, pos, ends][i];
      const decoded = [decodedNegative, ends, decodedPositive, ends][i];
      const color = [C.pink, C.muted, C.yellow, C.muted][i];
      const values = [
        fmt(weight),
        norm ? fmt(block.normalized[i]) : '?',
        ready ? String(block.codes[i]) : '?',
        decoded ? fmt(block.decoded[i]) : '?',
      ];
      values.forEach((value, j) => text(ctx, api, value, cols[j], rowY, 38, color, 'left', 'mono'));
    }
  });
}
export default {
  id: 'nf4-codec',
  draw: drawNf4Codec,
  cues: [
    'nf4-levels',
    'nf4-scale',
    'nf4-normalized',
    'nf4-question',
    'nf4-positive',
    'nf4-negative',
    'nf4-ends',
    'nf4-read-positive',
    'nf4-read-negative',
  ],
};
