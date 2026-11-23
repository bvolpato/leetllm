import { cueProgress } from '../latency-ruler.mjs';
import {
  drawExtensionArrow,
  drawExtensionCaption,
  drawExtensionEquation,
  drawExtensionLine,
  drawExtensionPanel,
  drawExtensionText,
  withTarget,
} from '../defaults.mjs';
export function drawExpandedStorage(ctx, scene, state, api) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const paint = () => {
    drawExtensionText(
      ctx,
      api,
      'one source value · expanded view stride 0',
      960,
      300,
      35,
      themeColors.yellow,
      'center',
    );
    drawExtensionPanel(
      ctx,
      api,
      200,
      430,
      190,
      120,
      () => drawExtensionText(ctx, api, '2x', 295, 505, 45, themeColors.yellow, 'center'),
      themeColors.yellow,
    );
    const cloned = currentBeat > 0;
    for (let i = 0; i < 3; i++) {
      const yy = 410 + i * 150;
      drawExtensionLine(ctx, api, 390, 490, 650, yy, themeColors.border, 3);
      drawExtensionPanel(
        ctx,
        api,
        680,
        yy - 40,
        200,
        80,
        () => drawExtensionText(ctx, api, '2x', 780, yy + 14, 35, themeColors.cyan, 'center'),
        themeColors.cyan,
      );
      if (cloned) {
        drawExtensionArrow(ctx, api, 900, yy, 1150, yy, themeColors.cyan);
        drawExtensionPanel(
          ctx,
          api,
          1190,
          yy - 40,
          240,
          80,
          () =>
            drawExtensionText(
              ctx,
              api,
              'independent ' + (i + 1),
              1310,
              yy + 10,
              25,
              themeColors.green,
              'center',
            ),
          themeColors.green,
        );
      }
    }
    withTarget(ctx, api, 'storage-contract', () => {
      drawExtensionText(
        ctx,
        api,
        cloned
          ? 'clone: three independent writable entries'
          : 'all three view indices alias one address',
        960,
        900,
        34,
        cloned ? themeColors.green : themeColors.pink,
        'center',
      );
      if (cloned && cueProgress(state, api, 'cloned-gradient', 1, 0.6, 0.8) === 1)
        drawExtensionEquation(
          ctx,
          api,
          String.raw`\frac{d}{dx}\sum_{i=1}^{3}2x=6`,
          1620,
          610,
          40,
          themeColors.pink,
        );
    });
    drawExtensionCaption(
      ctx,
      api,
      cloned
        ? 'Independent storage preserves the differentiable route to x.'
        : 'The vectorized in-place write is rejected for overlapping storage.',
    );
  };
  withTarget(ctx, api, 'expanded-storage-mechanism', paint);
  ctx.restore();
}
export default {
  id: 'expanded-storage',
  draw: drawExpandedStorage,
  cues: ['expanded-storage-b1', 'expanded-storage-b2', 'cloned-gradient'],
};
