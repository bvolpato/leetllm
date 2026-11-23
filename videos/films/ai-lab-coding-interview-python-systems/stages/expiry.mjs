import { sampleOriginalModel } from '../construction.mjs';
import { drawCard, drawEquation, drawText } from '../defaults.mjs';
export function drawExpiry(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = sampleOriginalModel('expiry', state);
  {
    api.focus.target('expiry-stored-record', () =>
      drawText(
        ctx,
        api,
        modelState.stored ? 'task:1 stores running' : 'task:1 removed',
        510,
        430,
        38,
        modelState.stored ? themeColors.cyan : themeColors.pink,
      ),
    );
    drawEquation(
      ctx,
      api,
      String.raw`t_{write}=10,\qquad TTL=5,\qquad t_{expires}=15`,
      1120,
      340,
      43,
    );
    api.line(ctx, 360, 680, 1600, 680, themeColors.muted, 4);
    const xAt = (time) => 400 + (time - 14.999) * 650000;
    [14.999, 15].forEach((time, i) => {
      const x = xAt(time);
      api.line(ctx, x, 625, x, 735, i ? themeColors.pink : themeColors.green, 5);
      drawText(
        ctx,
        api,
        time.toFixed(3),
        x,
        790,
        31,
        i ? themeColors.pink : themeColors.green,
        'center',
      );
    });
    const markerX = xAt(modelState.now);
    api.focus.target('expiry-clock', () => {
      api.circle(ctx, markerX, 680, 15, modelState.expired ? themeColors.pink : themeColors.green);
      drawText(
        ctx,
        api,
        'current time ' + modelState.now.toFixed(3) + ' s',
        1490,
        635,
        28,
        modelState.expired ? themeColors.pink : themeColors.green,
        'center',
      );
    });
    api.focus.target(
      'expiry-s-expired-get-task-1-missing-entry-removed-get-task-1-running-still',
      () =>
        drawCard(
          ctx,
          api,
          modelState.expired
            ? 'get(task:1) → missing · entry removed'
            : 'get(task:1) → running · still stored',
          475,
          500,
          1000,
          modelState.expired ? themeColors.pink : themeColors.green,
          92,
          34,
        ),
    );
    drawEquation(
      ctx,
      api,
      String.raw`t_{\text{expires}}\leq t_{\text{now}}`,
      960,
      930,
      43,
      themeColors.yellow,
    );
  }
}
export default {
  id: 'expiry',
  draw: drawExpiry,
  cues: ['expiry-beat-1-focus-1', 'expiry-inspect-before', 'expiry-beat-2-focus-1'],
};
