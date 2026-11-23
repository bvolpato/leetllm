import { cueMotion } from '../construction.mjs';
import { dotProduct } from 'vizmatic';

const channels = [
  [1, 2, 3, 4],
  [10, 20, 30, 40],
];
const filters = [
  [1, 2, 3, 4],
  [5, 6, 7, 8],
];
const filter = filters.flat();
const convolved = channels.reduce((sum, values, i) => sum + dotProduct(values, filters[i]), 0);

export function drawConvolutionEquivalence(ctx, scene, state, api) {
  const { C } = api;
  api.focus.target('convolution-order', () => {
    if (state.beat === 0) {
      channels.forEach((values, i) => {
        const x = 190 + i * 900,
          color = i ? C.yellow : C.cyan;
        api.text(ctx, 'Channel ' + (i + 1), x, 286, 42, color);
        for (const [k, label] of ['Pixels', 'Filter'].entries()) {
          const dx = x + k * 324;
          api.text(ctx, label, dx, 382, 34, C.muted);
          (k ? filters[i] : values).forEach((v, j) => {
            const xx = dx + (j % 2) * 105,
              yy = 424 + Math.floor(j / 2) * 105;
            api.rect(ctx, xx, yy, 99, 99, C.panel, color, 0);
            api.text(ctx, v, xx + 49, yy + 70, 45, color, 'center', 'mono');
          });
        }
        api.text(ctx, 'Sum of products   ' + dotProduct(values, filters[i]), x, 745, 42, C.ink);
      });
      api.text(
        ctx,
        'Convolution output    30 + 700 = ' + convolved,
        960,
        934,
        48,
        C.green,
        'center',
      );
      return;
    }
    const change = cueMotion(state, 2, 'convolution-permute', 0.15, 0.6);
    // Separate the two channels vertically while their entries pass one another.
    const laneOffset = 68 * (api.phase(change, 0, 0.2) - api.phase(change, 0.8, 1));
    const slide = api.phase(change, 0.2, 0.8);
    const mixed = change === 1;
    const row = mixed ? channels[0].flatMap((v, j) => [v, channels[1][j]]) : channels.flat();
    const reveal = state.beat === 1 || state.beat === 3;
    api.text(ctx, 'One 2 × 2 patch, two channels, zero bias', 140, 302, 41, C.ink);
    api.text(ctx, 'Input row', 140, 473, 39, C.ink);
    api.text(ctx, 'Fixed filter', 140, 675, 39, C.ink);
    channels.flat().forEach((v, i) => {
      const dest = (i % 4) * 2 + Math.floor(i / 4);
      const x = 530 + 147 * (i + (dest - i) * slide);
      const y = 392 + (i < 4 ? -laneOffset : laneOffset);
      const color = i < 4 ? C.cyan : C.yellow;
      api.rect(ctx, x, y, 122, 110, C.panel, color, 0);
      api.text(ctx, v, x + 61, y + 78, 48, color, 'center', 'mono');
      const wx = 530 + i * 147;
      api.rect(ctx, wx, 590, 122, 110, C.panel, C.muted, 0);
      api.text(ctx, filter[i], wx + 61, 668, 45, C.ink, 'center', 'mono');
    });
    const matches = dotProduct(row, filter) === convolved;
    const answer = reveal
      ? dotProduct(row, filter) + (matches ? ' = ' : ' ≠ ') + convolved
      : 'Target   ' + convolved;
    api.text(ctx, 'dotProduct(row, filter) === convolved', 140, 842, 45, C.ink, 'left', 'mono');
    api.text(ctx, answer, 1780, 842, 47, reveal ? (matches ? C.green : C.red) : C.yellow, 'right');
    api.text(
      ctx,
      state.beat === 3
        ? 'Article fixture    2 images × 6 patch tokens × 5 coordinates'
        : state.beat === 2
          ? 'Will the interleaved row give the same output?'
          : 'Each filter weight stays at its original index.',
      960,
      970,
      36,
      C.muted,
      'center',
    );
  });
}
export default {
  id: 'convolution-equivalence',
  draw: drawConvolutionEquivalence,
  cues: ['convolution-channels', 'convolution-correct', 'convolution-permute', 'convolution-wrong'],
};
