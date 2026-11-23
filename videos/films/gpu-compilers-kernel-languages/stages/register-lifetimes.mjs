import { liveSlots, residency } from '../arithmetic.mjs';
import {
  arrow,
  box,
  codeText,
  cueProgress,
  detailText,
  focusTarget,
  footer,
  line,
  visible,
} from '../defaults.mjs';
export function drawRegisterLifetimes(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  {
    if (currentBeat < 2) {
      const extend = currentBeat === 1 ? cueProgress(ctx, api, 'extend-a') : 0,
        baseline = liveSlots(false),
        ends = baseline.intervals.map((row, i) => row.end + (i === 0 ? 2 * extend : 0)),
        colors = [themeColors.blue, themeColors.yellow, themeColors.green],
        start = [0, 2, 4],
        x = (i) => 330 + i * 140;
      focusTarget(ctx, api, 'lifetime-intervals', () => {
        for (let i = 0; i < 8; i++) {
          line(ctx, api, x(i), 360, x(i), 805, themeColors.muted, 1);
          detailText(ctx, api, i, x(i), 860, 26, themeColors.muted, 'center');
        }
        detailText(ctx, api, 'operation', 960, 920, 29, themeColors.muted, 'center');
        ['A', 'B', 'C'].forEach((id, i) => {
          if (
            currentBeat === 0 &&
            !visible(ctx, api, ['lifetime-a', 'lifetime-b', 'lifetime-c'][i])
          )
            return;
          const y = 425 + i * 130;
          detailText(ctx, api, id, 180, y + 25, 36, colors[i]);
          api.rect(ctx, x(start[i]), y, x(ends[i]) - x(start[i]) + 24, 55, colors[i], null, 0, 8);
          detailText(
            ctx,
            api,
            `${start[i]}…${ends[i] === Math.round(ends[i]) ? ends[i] : ends[i].toFixed(1)}`,
            x(start[i]) + 20,
            y + 40,
            24,
            themeColors.panel,
          );
        });
        if (extend === 1) {
          api.rect(ctx, x(4), 350, 140, 470, '#ef9ac820', themeColors.pink, 2, 4);
          detailText(ctx, api, '3 live', x(4) + 70, 330, 29, themeColors.pink, 'center');
        }
      });
      focusTarget(ctx, api, 'physical-slots', () => {
        if (currentBeat === 0 && visible(ctx, api, 'reuse-slot')) {
          detailText(ctx, api, 'Physical slots', 1460, 330, 28, themeColors.cyan);
          box(ctx, api, 1460, 410, 330, 95, themeColors.cyan);
          detailText(ctx, api, 'slot1: A → C', 1490, 470, 29, themeColors.cyan);
          box(ctx, api, 1460, 565, 330, 95, themeColors.yellow);
          detailText(ctx, api, 'slot2: B', 1490, 625, 29, themeColors.yellow);
        }
        if (currentBeat === 1 && visible(ctx, api, 'third-live')) {
          detailText(ctx, api, 'Physical slots', 1460, 330, 28, themeColors.pink);
          ['A', 'B', 'C'].forEach((name, i) => {
            box(ctx, api, 1460, 410 + i * 135, 330, 95, colors[i]);
            detailText(
              ctx,
              api,
              'slot' + (i + 1) + ': ' + name,
              1490,
              470 + i * 135,
              29,
              colors[i],
            );
          });
          detailText(
            ctx,
            api,
            'Same B and C · only A lasts longer · 2 → 3 slots',
            960,
            980,
            31,
            themeColors.pink,
            'center',
          );
        }
      });
    } else
      focusTarget(ctx, api, 'rounded-demand', () => {
        const r = 32,
          a = residency(r);
        detailText(ctx, api, 'Supplied eight-warp-block model', 150, 310, 32, themeColors.yellow);
        const steps = [
          ['32 registers × 32 threads', '1024 requested / warp'],
          ['ceil(1024 / 256) × 256', '1024 allocated / warp'],
          ['1024 × 8 warps', '8192 allocated / block'],
          ['floor(65536 / 8192)', '8 complete blocks · 64 warps'],
        ];
        steps.forEach(([op, result], i) => {
          const y = 420 + i * 125;
          codeText(ctx, api, op, 170, y, 32);
          if (visible(ctx, api, 'rounded-demand')) {
            arrow(ctx, api, 900, y - 10, 1070, y - 10, themeColors.cyan);
            detailText(ctx, api, result, 1110, y, 30, themeColors.cyan);
          }
        });
      });
    if (currentBeat === 0) footer(ctx, api, 'A slot can be reused after the last read of its value.');
  }
}
export default {
  id: 'register-lifetimes',
  draw: drawRegisterLifetimes,
  cues: [
    'lifetime-a',
    'lifetime-b',
    'lifetime-c',
    'reuse-slot',
    'extend-a',
    'third-live',
    'rounded-demand',
  ],
};
