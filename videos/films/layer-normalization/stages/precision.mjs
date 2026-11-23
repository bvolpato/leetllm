import { ln } from '../arithmetic.mjs';
import { text } from '../defaults.mjs';
import { motion, landed } from '../timing.mjs';

const original = [10000, 10001, 9999, 10002];
const middle = original[0];
const spacing = 2 ** (Math.floor(Math.log2(middle)) - 10);
const ticks = [middle - spacing, middle, middle + spacing];
const stored = original.map(v => ticks.reduce((best, tick) =>
  Math.abs(v - tick) < Math.abs(v - best) ? tick : best));
const colors = ['cyan', 'yellow', 'pink', 'green'];
const halfMax = (2 - 2 ** -10) * 2 ** 15;
const sample = 300;
const square = sample ** 2;

function squares(ctx, state, api) {
  const { C } = api;
  text(ctx, api, `Stored FP16 input     [ ${sample},  −${sample} ]`, 960, 300, 48, C.ink, 'center');
  text(ctx, api, 'Both paths compute the root mean square', 960, 380, 34, C.muted, 'center');
  const narrow = landed(state, 'narrow-square', 0, 0.22, 0.37);
  const wide = landed(state, 'wide-square', 0, 0.63, 0.73);
  const rmsReady = landed(state, 'wide-rms', 0, 0.82, 0.99);
  for (const [i, ready] of [narrow, wide].entries()) {
    const y = 560 + 192 * i;
    const color = i ? C.green : C.pink;
    api.focus.target(i ? 'wide-path' : 'narrow-path', () => {
      text(ctx, api, i ? 'Cast, then square' : 'Square, then cast', 135, y, 42, color);
      text(ctx, api, i ? 'FP32 product' : 'FP16 product', 780, y - 52, 29, C.muted, 'center');
      const product = i || square <= halfMax ? square.toLocaleString('en-US') : '∞';
      text(ctx, api, ready ? product : '?', 780, y + 24, 59, color, 'center');
      api.arrow(ctx, 1005, y - 8, 1280, y - 8, color, 4);
      text(ctx, api, 'RMS', 1500, y - 52, 29, C.muted, 'center');
      text(ctx, api, (i ? rmsReady : ready) ? (i ? String(Math.sqrt(square)) : '∞') : '?', 1500, y + 24, 59, color, 'center');
    });
  }
  text(ctx, api, `Largest finite FP16 value     ${halfMax.toLocaleString('en-US')}`, 960, 964, 39, C.ink, 'center');
}

export function drawPrecision(ctx, scene, state, api) {
  if (state.beat === 0) return squares(ctx, state, api);
  const { C } = api;
  const round = motion(state, 'store-half', 2, 0.01, 0.16);
  const showReference = landed(state, 'rounded-reference', 2, 0.34, 0.48);
  const toX = value => 1040 + (value - middle) * 80;
  text(ctx, api, 'Source', 160, 282, 34, C.muted, 'center');
  text(ctx, api, 'FP16 storage near 10,000', 1040, 282, 40, C.ink, 'center');
  ticks.forEach(tick => {
    const x = toX(tick);
    api.line(ctx, x, 402, x, 750, C.muted, 2);
    text(ctx, api, tick, x, 366, 36, C.ink, 'center');
  });
  api.focus.target('storage-grid', () => {
    original.forEach((value, i) => {
      const y = 440 + 90 * i;
      const color = C[colors[i]];
      text(ctx, api, value, 160, y + 14, 38, color, 'center');
      api.line(ctx, toX(ticks[0]), y, toX(ticks[2]), y, C.muted, 1);
      const x = toX(value + (stored[i] - value) * round);
      if (round > 0 && value !== stored[i]) {
        api.circle(ctx, toX(value), y, 12, C.bg, color, 2);
        api.line(ctx, toX(value), y, x, y, color, 4);
      }
      api.circle(ctx, x, y, 14, color);
    });
  });
  if (state.beat === 1) {
    text(ctx, api, 'Which tick will each stored feature occupy?', 960, 928, 49, C.yellow, 'center');
    return;
  }
  const showStored = landed(state, 'store-half', 2, 0.01, 0.16);
  const originalOut = ln(original);
  const storedOut = ln(stored);
  api.focus.target('stored-reference', () => {
    text(ctx, api, 'Wide reference', 140, 863, 32, C.ink);
    text(ctx, api, 'On original input', 645, 865, 33, C.muted, 'center');
    text(ctx, api, 'On stored input', 1450, 865, 33, C.muted, 'center');
    text(ctx, api, originalOut.map(v => v.toFixed(3)).join('     '), 645, 946, 40, C.ink, 'center');
    text(ctx, api, showReference ? storedOut.join('          ') : showStored ? 'LN([10000, 10000, 10000, 10000])' : '?', 1450, 946, showReference ? 48 : 32, C.green, 'center');
  });
}
export default { id: 'precision', draw: drawPrecision, cues: ['narrow-square', 'wide-square', 'wide-rms', 'store-half', 'rounded-reference'] };
