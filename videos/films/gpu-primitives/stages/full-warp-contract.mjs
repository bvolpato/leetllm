import {
  drawExtendedArrow,
  drawExtendedBox,
  drawExtendedFooter,
  drawExtendedLine,
  drawExtendedTarget,
  drawExtendedText,
  drawExtendedTitle,
} from '../defaults.mjs';
export function drawFullWarpContract(ctx, scene, state, api) {
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
  const started = (id, a = 0.2) => q(id, a, a + 0.01) > 0;
  {
    drawExtendedTitle(
      ctx,
      api,
      currentBeat < 2
        ? currentBeat === 1 && started('warp32-exit', 0.42) && !started('warp32-upper', 0.75)
          ? '32 slots · lane 20 exited · source membership fails'
          : '32 physical lanes · 20 supplied ones · 12 live zeros'
        : 'Eight warp leaders publish before the block consumer reads',
    );
    if (currentBeat < 2) {
      const upper = currentBeat === 1 && started('warp32-upper', 0.75),
        exit = currentBeat === 1 && started('warp32-exit', 0.42) && !upper,
        active = currentBeat === 1 ? (upper ? 24 : 4) : -1,
        source = currentBeat === 1 ? (upper ? -1 : 20) : -1;
      drawExtendedTarget(ctx, api, 'warp32-lanes', () => {
        for (let i = 0; i < 32; i++) {
          const x = 280 + (i % 8) * 170,
            y = 355 + Math.floor(i / 8) * 120;
          drawExtendedBox(
            ctx,
            api,
            exit && i === 20 ? '×' : i < 20 ? '1' : '0',
            x,
            y,
            130,
            70,
            i === active
              ? themeColors.yellow
              : i === source
                ? exit
                  ? themeColors.pink
                  : themeColors.cyan
                : i < 20
                  ? themeColors.blue
                  : themeColors.muted,
            30,
          );
          drawExtendedText(ctx, api, 'lane ' + i, x + 65, y - 12, 21, themeColors.muted);
        }
      });
      drawExtendedTarget(ctx, api, 'warp32-source', () => {
        if (currentBeat === 1) {
          const progress = q('full-warp-contract-step-2', 0.05, 0.28);
          if (!upper && progress > 0) {
            const sy = 630,
              ey = 390;
            api.circle(
              ctx,
              280 + 4 * 170 + 150,
              sy + (ey - sy) * progress,
              10,
              exit ? themeColors.pink : themeColors.cyan,
            );
          }
          drawExtendedText(
            ctx,
            api,
            upper
              ? 'Lane 24 + 16 is outside the warp'
              : exit
                ? 'Lane 20 exited → source read undefined'
                : 'Lane 4 reads live lane 20 → receives zero',
            960,
            900,
            35,
            exit && !upper ? themeColors.pink : themeColors.cyan,
          );
        }
      });
      drawExtendedTarget(ctx, api, 'warp32-upper-bound', () => {
        if (upper)
          drawExtendedText(
            ctx,
            api,
            'Shuffle returns caller value · helper discards this out-of-range addition',
            960,
            965,
            29,
            themeColors.yellow,
          );
      });
      if (currentBeat === 0)
        drawExtendedText(
          ctx,
          api,
          'Down-shuffle offsets 16 → 8 → 4 → 2 → 1 · full aggregate promised in lane 0',
          960,
          905,
          31,
          themeColors.cyan,
        );
    } else
      drawExtendedTarget(ctx, api, 'warp32-barrier', () => {
        const leaders = q('warp32-leaders', 0.5, 0.9);
        for (let i = 0; i < 8; i++) {
          const x = 230 + i * 200;
          drawExtendedBox(ctx, api, 'Warp ' + i, x, 375, 170, 75, themeColors.blue, 27);
          drawExtendedBox(
            ctx,
            api,
            leaders > i / 8 ? 'T' + i : '…',
            x,
            620,
            170,
            75,
            leaders > i / 8 ? themeColors.yellow : themeColors.muted,
            31,
          );
          if (leaders > i / 8)
            drawExtendedArrow(ctx, api, x + 85, 470, x + 85, 600, themeColors.yellow);
        }
        drawExtendedLine(ctx, api, 220, 780, 1770, 780, themeColors.pink, 8);
        drawExtendedText(
          ctx,
          api,
          'Block barrier after shared totals',
          960,
          835,
          32,
          themeColors.pink,
        );
        drawExtendedText(
          ctx,
          api,
          'Warp 0: eight totals + 24 live identity lanes',
          960,
          945,
          31,
          themeColors.cyan,
        );
      });
    drawExtendedFooter(
      ctx,
      api,
      'Source membership, the conditional addition and shared-memory ordering are separate contracts.',
    );
    return;
  }
  return;
}
export default {
  id: 'full-warp-contract',
  draw: drawFullWarpContract,
  cues: [
    'full-warp-contract-step-1',
    'full-warp-contract-step-2',
    'warp32-exit',
    'warp32-upper',
    'full-warp-contract-step-3',
    'warp32-leaders',
  ],
};
