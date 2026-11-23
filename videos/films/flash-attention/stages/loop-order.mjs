import { flashExtensionFrame } from '../model.mjs';
import {
  drawFlashExtensionFooter,
  drawFlashExtensionNum,
  drawFlashExtensionRectangle,
  drawFlashExtensionText,
} from '../defaults.mjs';
export function drawLoopOrder(ctx, scene, state, api) {
  const { C: themeColors } = api,
    f = flashExtensionFrame('loop-order', state),
    currentBeat = f.beat,
    progress = f.progress;
  const paint = () => {
    const fa2 = currentBeat > 0,
      order = fa2
        ? [
            [0, 0],
            [0, 1],
            [1, 0],
            [1, 1],
          ]
        : [
            [0, 0],
            [1, 0],
            [0, 1],
            [1, 1],
          ],
      n = Math.floor(4 * (fa2 ? f.go('fa-resident-loop', progress) : progress) + 0.00001);
    drawFlashExtensionText(
      ctx,
      api,
      fa2 ? 'FA2: Q outer; K/V inner' : 'FA1: K/V outer; Q inner',
      960,
      290,
      39,
      fa2 ? themeColors.cyan : themeColors.blue,
      'center',
    );
    for (let i = 0; i < 2; i++) {
      drawFlashExtensionText(ctx, api, 'Q' + i, 230, 455 + i * 220, 36, themeColors.yellow);
      for (let j = 0; j < 2; j++) {
        const index = order.findIndex((x) => x[0] === i && x[1] === j),
          done = index < n,
          x = 400 + j * 420;
        drawFlashExtensionRectangle(
          ctx,
          api,
          x,
          380 + i * 220,
          320,
          135,
          done ? themeColors.cyan + '80' : themeColors.panel,
          done ? themeColors.cyan : themeColors.muted,
        );
        drawFlashExtensionText(
          ctx,
          api,
          'K/V' + j,
          x + 160,
          460 + i * 220,
          36,
          done ? themeColors.ink : themeColors.muted,
          'center',
        );
        if (done)
          drawFlashExtensionText(
            ctx,
            api,
            'step ' + (index + 1),
            x + 160,
            555 + i * 220,
            27,
            themeColors.yellow,
            'center',
          );
      }
    }
    drawFlashExtensionNum(
      ctx,
      api,
      'O/state writes',
      fa2 ? Math.floor(n / 2) + ' final' : n + ' intermediate',
      425,
    );
    drawFlashExtensionNum(
      ctx,
      api,
      'On-chip accumulator',
      fa2 ? 'resident N' : 'normalized O',
      650,
      themeColors.yellow,
    );
    drawFlashExtensionFooter(
      ctx,
      api,
      'Two Q tiles and two K/V tiles; compare intermediate state writes without materializing S or P',
    );
  };
  let nested = paint;
  for (let i = 0; i < scene.beats.length; i++) {
    const previous = nested;
    nested = () => api.focus.target('loop-order-state-' + i, previous);
  }
  nested();
}
export default {
  id: 'loop-order',
  draw: drawLoopOrder,
  cues: ['loop-order-beat-1', 'loop-order-beat-2', 'fa-resident-loop', 'loop-order-beat-3'],
};
