import {
  drawExtendedArrow,
  drawExtendedBox,
  drawExtendedFooter,
  drawExtendedRow,
  drawExtendedTarget,
  drawExtendedText,
  drawExtendedTitle,
} from '../defaults.mjs';
export function drawPartialRange(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    F = api.components.fade;
  const q = (id, a = 0.12, z = 0.8) => {
    const v = state.cues?.[id];
    return v
      ? v.phase === 'before'
        ? 0
        : v.phase === 'after'
          ? 1
          : api.clamp(v.progress)
      : api.phase(progress, a, z);
  };
  const started = (id, a = 0.2) => q(id, a, a + 0.01) > 0;
  {
    if (currentBeat === 0) {
      drawExtendedTitle(ctx, api, 'Signed int64 toy · every intermediate must fit');
      drawExtendedTarget(ctx, api, 'range-overflow', () => {
        drawExtendedRow(ctx, api, ['MAX', '1', '−1', '0'], 400, {
          x: 370,
          step: 320,
          w: 230,
        });
        const over = q('partial-range-step-1', 0.4, 0.6),
          final = q('range-final', 0.15, 0.3);
        if (final)
          drawExtendedText(ctx, api, 'Exact final sum = MAX', 960, 340, 31, themeColors.muted);
        if (over) {
          drawExtendedBox(ctx, api, 'MAX + 1', 420, 650, 420, 100, themeColors.pink, 40);
          drawExtendedText(ctx, api, '2⁶³ is outside signed int64', 630, 825, 32, themeColors.pink);
          drawExtendedArrow(ctx, api, 610, 495, 610, 625, themeColors.pink);
          drawExtendedBox(ctx, api, 'Rejected here', 1100, 650, 410, 100, themeColors.pink, 35);
        }
        drawExtendedText(
          ctx,
          api,
          'A later −1 cannot repair the invalid earlier operation',
          960,
          965,
          31,
          themeColors.yellow,
        );
      });
    }
    if (currentBeat === 1) {
      drawExtendedTitle(ctx, api, 'Float32 toy · [100,000,000, 1, −100,000,000]');
      drawExtendedTarget(ctx, api, 'range-rounding', () => {
        const zero = started('range-zero', 0.4),
          one = started('partial-range-step-2', 0.75);
        drawExtendedBox(ctx, api, '100,000,000 + 1', 170, 420, 640, 100, themeColors.blue, 37);
        drawExtendedBox(
          ctx,
          api,
          zero ? '100,000,000' : '…',
          170,
          610,
          640,
          100,
          themeColors.yellow,
          37,
        );
        drawExtendedArrow(ctx, api, 490, 540, 490, 590, themeColors.yellow);
        if (zero)
          drawExtendedText(ctx, api, 'then −100,000,000 → 0', 490, 825, 35, themeColors.pink);
        drawExtendedBox(
          ctx,
          api,
          '100,000,000 − 100,000,000',
          1000,
          420,
          760,
          100,
          themeColors.cyan,
          35,
        );
        drawExtendedBox(
          ctx,
          api,
          one ? '0 + 1 → 1' : '…',
          1110,
          610,
          540,
          100,
          one ? themeColors.green : themeColors.muted,
          40,
        );
        drawExtendedArrow(ctx, api, 1380, 540, 1380, 590, themeColors.green);
        drawExtendedText(
          ctx,
          api,
          'A deterministic tree can still repeat the less accurate result',
          960,
          955,
          31,
          themeColors.yellow,
        );
      });
    }
    if (currentBeat === 2) {
      drawExtendedTitle(ctx, api, 'Accuracy and bitwise repeatability are different axes');
      drawExtendedTarget(ctx, api, 'range-contracts', () => {
        drawExtendedText(ctx, api, 'Distance from reference', 430, 390, 32, themeColors.yellow);
        drawExtendedText(ctx, api, 'Repeated bit pattern', 1400, 390, 32, themeColors.cyan);
        const trials = [0, 0, 0],
          reference = 1;
        trials.forEach((v, i) => {
          drawExtendedBox(ctx, api, v, 300 + i * 135, 530, 110, 80, themeColors.pink);
          drawExtendedBox(
            ctx,
            api,
            '0x00000000',
            1040 + i * 248,
            530,
            225,
            80,
            themeColors.cyan,
            27,
          );
        });
        if (started('range-reference', 0.2)) {
          drawExtendedText(ctx, api, '|0 − 1| = 1', 520, 770, 45, themeColors.pink);
          drawExtendedText(ctx, api, 'same bits × 3', 1410, 770, 41, themeColors.cyan);
        }
        drawExtendedText(
          ctx,
          api,
          'Same tree / GPU / build / configuration · verify the installed library default',
          960,
          950,
          29,
          themeColors.muted,
        );
        void reference;
      });
    }
    drawExtendedFooter(
      ctx,
      api,
      'The fixture bound 9 × length protects int64 partials only for its stated −9…9 inputs.',
    );
    return;
  }
  return;
}
export default {
  id: 'partial-range',
  draw: drawPartialRange,
  cues: [
    'partial-range-step-1',
    'range-final',
    'partial-range-step-2',
    'range-zero',
    'partial-range-step-3',
    'range-reference',
  ],
};
