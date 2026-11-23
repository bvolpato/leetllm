import {
  drawExtendedArrow,
  drawExtendedBox,
  drawExtendedLine,
  drawExtendedTarget,
  drawExtendedText,
  drawExtendedTitle,
} from '../defaults.mjs';
export function drawBenchmarkEvidence(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0);
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
      drawExtendedTitle(ctx, api, '4,194,304 inputs');
      drawExtendedTarget(ctx, api, 'benchmark-composition', () => {
        ['Allocate and upload', '5 warmups', '30 full invocations'].forEach((v, i) =>
          drawExtendedBox(
            ctx,
            api,
            v,
            190 + i * 560,
            390,
            450,
            90,
            i === 2 ? themeColors.cyan : themeColors.muted,
            32,
          ),
        );
        const start = q('benchmark-event', 0.65, 0.85);
        if (start > 0)
          drawExtendedLine(ctx, api, 1310, 522, 1310 + 450 * start, 522, themeColors.cyan, 9);
        drawExtendedText(
          ctx,
          api,
          'Reduction includes its final scalar copy. Scan includes its offset passes.',
          960,
          895,
          30,
          themeColors.cyan,
        );
        drawExtendedText(
          ctx,
          api,
          'CUDA events time the 30 invocations',
          960,
          985,
          28,
          themeColors.yellow,
        );
      });
    } else if (currentBeat === 1) {
      drawExtendedTitle(ctx, api, 'Logical bytes per element');
      drawExtendedTarget(ctx, api, 'benchmark-bytes', () => {
        const n = 4194304;
        [
          ['Read input', 4, themeColors.blue],
          ['Write scan output', 8, themeColors.cyan],
        ].forEach(([label, bytes, col], i) => {
          const y = 435 + i * 210;
          drawExtendedText(ctx, api, label, 370, y + 50, 32, col);
          for (let j = 0; j < bytes; j++) api.rect(ctx, 730 + j * 110, y, 85, 85, col);
          drawExtendedText(ctx, api, bytes + ' bytes', 1670, y + 50, 31, col);
        });
        if (started('benchmark-useful', 0.25))
          drawExtendedText(
            ctx,
            api,
            '12 × ' +
              n.toLocaleString('en-US') +
              ' = ' +
              (12 * n).toLocaleString('en-US') +
              ' useful bytes',
            960,
            935,
            36,
            themeColors.yellow,
          );
      });
    } else {
      drawExtendedTitle(ctx, api, 'Test the revised build at a tile boundary');
      drawExtendedTarget(ctx, api, 'benchmark-hash', () => {
        drawExtendedBox(ctx, api, 'Older build', 200, 355, 550, 100, themeColors.blue, 38);
        drawExtendedBox(ctx, api, 'Saved GPU timings', 1050, 355, 680, 100, themeColors.blue, 34);
        drawExtendedArrow(ctx, api, 780, 405, 1020, 405, themeColors.blue);
        const tileSize = 512;
        const inputs = started('benchmark-current', 0.35) ? tileSize + 1 : tileSize;
        drawExtendedText(ctx, api, 'Revised build', 475, 648, 40, themeColors.yellow);
        drawExtendedText(ctx, api, inputs + ' inputs', 475, 739, 62, themeColors.ink);
        drawExtendedBox(ctx, api, 'Tile 0', 846, 642, 375, 96, themeColors.cyan, 40);
        drawExtendedText(ctx, api, tileSize + ' inputs', 1033, 807, 38, themeColors.cyan);
        if (inputs > tileSize) {
          drawExtendedBox(ctx, api, 'Tile 1', 1280, 642, 375, 96, themeColors.yellow, 40);
          drawExtendedText(
            ctx,
            api,
            inputs - tileSize + ' input',
            1468,
            807,
            38,
            themeColors.yellow,
          );
        }
      });
    }
    return;
  }
  return;
}
export default {
  id: 'benchmark-evidence',
  draw: drawBenchmarkEvidence,
  cues: [
    'benchmark-evidence-step-1',
    'benchmark-event',
    'benchmark-evidence-step-2',
    'benchmark-useful',
    'benchmark-evidence-step-3',
    'benchmark-current',
  ],
};
