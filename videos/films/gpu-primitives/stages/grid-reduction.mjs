import { hierarchyCounts } from '../arithmetic.mjs';
import {
  drawExtendedArrow,
  drawExtendedBox,
  drawExtendedFooter,
  drawExtendedLine,
  drawExtendedTarget,
  drawExtendedText,
  drawExtendedTitle,
} from '../defaults.mjs';
export function drawGridReduction(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress2 = api.clamp(state.beatP ?? 0),
    F = api.components.fade;
  const q = (id, a = 0.12, z = 0.8) => {
    const v = state.cues?.[id];
    return v
      ? v.phase === 'before'
        ? 0
        : v.phase === 'after'
          ? 1
          : api.clamp(v.progress)
      : api.phase(progress2, a, z);
  };
  {
    if (currentBeat === 0) {
      drawExtendedTitle(ctx, api, 'Each block consumes up to 256 × 2 = 512 inputs');
      const qs = [
          1,
          q('grid-first-pass', 0.45, 0.6),
          q('grid-second-pass', 0.65, 0.78),
          q('grid-reduction-step-1', 0.8, 0.95),
        ],
        counts = [4194304, ...hierarchyCounts(4194304)];
      drawExtendedTarget(ctx, api, 'grid-passes', () =>
        counts.forEach((count, i) => {
          const x = 160 + i * 460;
          drawExtendedBox(
            ctx,
            api,
            i === 0 || qs[i] > 0 ? count.toLocaleString('en-US') : '…',
            x,
            470,
            310,
            100,
            i === 3 ? themeColors.green : themeColors.blue,
            38,
          );
          drawExtendedText(
            ctx,
            api,
            i === 0 ? 'int32 inputs' : 'int64 partials',
            x + 155,
            625,
            29,
            themeColors.muted,
          );
          if (i && qs[i] > 0) {
            drawExtendedArrow(ctx, api, x - 120, 520, x - 25, 520, themeColors.yellow);
            drawExtendedText(ctx, api, '÷512, ceil', x - 70, 435, 24, themeColors.yellow);
          }
        }),
      );
      drawExtendedText(
        ctx,
        api,
        'Later kernels consume completed same-stream outputs',
        960,
        825,
        35,
        themeColors.cyan,
      );
    }
    if (currentBeat === 1) {
      drawExtendedTitle(ctx, api, 'Ordinary grid toy: four resident slots, eight required blocks');
      const fill = q('grid-resident', 0.15, 0.35);
      drawExtendedTarget(ctx, api, 'grid-deadlock', () => {
        for (let i = 0; i < 8; i++) {
          const x = 300 + (i % 4) * 360,
            y = i < 4 ? 425 : 715;
          drawExtendedBox(
            ctx,
            api,
            'Block ' + i,
            x,
            y,
            280,
            100,
            i < 4 ? themeColors.pink : themeColors.muted,
            33,
          );
          drawExtendedText(
            ctx,
            api,
            i < 4 && fill > 0 ? 'waiting for 8' : i < 4 ? 'resident' : 'queued',
            x + 140,
            y + 155,
            29,
            i < 4 ? themeColors.pink : themeColors.muted,
          );
        }
        drawExtendedText(
          ctx,
          api,
          'Occupied slots cannot launch their missing dependencies',
          960,
          970,
          32,
          themeColors.pink,
        );
      });
    }
    if (currentBeat === 2) {
      drawExtendedTitle(ctx, api, 'Atomic accumulation has one output and many producers');
      drawExtendedTarget(ctx, api, 'grid-atomics', () => {
        const progress = q('grid-atomic-write', 0.05, 0.45),
          xs = [350, 750, 1150, 1550];
        xs.forEach((x, i) => {
          drawExtendedBox(ctx, api, 't' + i, x - 90, 390, 180, 80, themeColors.blue);
          drawExtendedLine(ctx, api, x, 490, x, 610, themeColors.muted);
          drawExtendedLine(ctx, api, x, 610, 960, 610, themeColors.muted);
          if (progress > i / 4)
            api.circle(
              ctx,
              x + (960 - x) * api.clamp(progress * 4 - i),
              610,
              13,
              themeColors.yellow,
            );
        });
        drawExtendedArrow(ctx, api, 960, 630, 960, 735, themeColors.yellow);
        drawExtendedBox(ctx, api, 'Initialized output', 700, 765, 520, 100, themeColors.yellow, 32);
        drawExtendedText(
          ctx,
          api,
          'Skew can concentrate contention at one address',
          960,
          940,
          32,
          themeColors.pink,
        );
      });
    }
    drawExtendedFooter(
      ctx,
      api,
      'Compare full algorithms, including bounds, wider partials, launches and supported atomic types.',
    );
    return;
  }
  return;
}
export default {
  id: 'grid-reduction',
  draw: drawGridReduction,
  cues: [
    'grid-reduction-step-1',
    'grid-first-pass',
    'grid-second-pass',
    'grid-reduction-step-2',
    'grid-resident',
    'grid-reduction-step-3',
    'grid-atomic-write',
  ],
};
