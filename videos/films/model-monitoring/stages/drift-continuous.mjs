import { chip, cueProgress, cueVisible, dot, fade, footer, line, text } from '../defaults.mjs';
function drawMonitoring(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const done = (key) => state.cues?.[`m-${'drift-continuous'}-${key}`]?.phase === 'after';
  const smooth = (q) => q * q * (3 - 2 * q);
  const lerp = (a, z, q) => a + (z - a) * q;
  {
    const x = (v) => 340 + v * 270,
      y = (v) => 760 - v * 360;
    line(ctx, api, 340, 760, 1550, 760, themeColors.muted);
    line(ctx, api, 340, 800, 340, 340, themeColors.muted);
    [0, 2, 4].forEach((v) => text(ctx, api, v, x(v), 845, 27, themeColors.muted));
    text(ctx, api, 'hours', 1540, 815, 27, themeColors.muted);
    text(ctx, api, 'CDF', 245, 390, 28, themeColors.muted);
    [0, 0.5, 1].forEach((v) => text(ctx, api, v.toFixed(1), 285, y(v) + 10, 25, themeColors.muted));
    // F is 0.5 on [0, 4). G jumps from 0 to 1 at two hours.
    if (cueVisible(ctx, api, 'drift-continuous', 'cdf') || currentBeat > 0) {
      line(ctx, api, x(0), y(0), x(0), y(0.5), themeColors.blue, 4);
      line(ctx, api, x(0), y(0.5), x(4), y(0.5), themeColors.blue, 4);
      line(ctx, api, x(4), y(0.5), x(4), y(1), themeColors.blue, 4);
      line(ctx, api, x(4), y(1), 1550, y(1), themeColors.blue, 4);
      line(ctx, api, x(0), y(0), x(2), y(0), themeColors.pink, 4);
      line(ctx, api, x(2), y(0), x(2), y(1), themeColors.pink, 4);
      line(ctx, api, x(2), y(1), 1550, y(1), themeColors.pink, 4);
    }
    if (cueVisible(ctx, api, 'drift-continuous', 'at-one')) {
      text(ctx, api, '1', x(1), 845, 29, themeColors.yellow);
      dot(ctx, api, x(1), y(0), themeColors.yellow, 7);
      dot(ctx, api, x(1), y(0.5), themeColors.yellow, 7);
    }
    if (cueVisible(ctx, api, 'drift-continuous', 'gap') || currentBeat > 0) {
      line(ctx, api, x(1), y(0), x(1), y(0.5), themeColors.yellow, 7);
      if (done('gap') || currentBeat > 0)
        text(ctx, api, 'D = 0.5', x(1), y(0.5) - 35, 31, themeColors.yellow);
    }
    if (currentBeat >= 1) {
      fade(ctx, api, 0.18, () => {
        api.rect(ctx, x(0), y(0.5), 540, 180, themeColors.yellow);
        api.rect(ctx, x(2), y(1), 540, 180, themeColors.yellow);
      });
      const fromZero = cueProgress(ctx, api, 'drift-continuous', 'from-zero');
      const fromFour = cueProgress(ctx, api, 'drift-continuous', 'from-four');
      dot(ctx, api, lerp(x(0), x(2), smooth(fromZero)), 877, themeColors.blue, 10);
      dot(ctx, api, lerp(x(4), x(2), smooth(fromFour)), 901, themeColors.blue, 10);
      if (done('move'))
        chip(ctx, api, 'W1 = ½×2 + ½×2 = 2 h', 470, 225, 1020, themeColors.yellow, 65, 32);
    } else {
      dot(ctx, api, x(0), 865, themeColors.blue, 13);
      dot(ctx, api, x(4), 865, themeColors.blue, 13);
    }
    text(ctx, api, 'source [0, 4]', 570, currentBeat >= 1 ? 330 : 280, 29, themeColors.blue);
    text(ctx, api, 'other [2, 2]', 1030, currentBeat >= 1 ? 330 : 280, 29, themeColors.pink);
    footer(
      ctx,
      api,
      currentBeat === 2
        ? 'Largest vertical gap: 0.5     /     Average distance moved: 2 hours'
        : 'Each sample has mean 2 h; the cumulative curves still differ.',
    );
  }
}
export function drawDriftContinuous(ctx, scene, state, api) {
  return api.focus?.target
    ? api.focus.target('drift-continuous-mechanism', () => drawMonitoring(ctx, scene, state, api))
    : drawMonitoring(ctx, scene, state, api);
}
export default {
  id: 'drift-continuous',
  draw: drawDriftContinuous,
  cues: [
    'drift-continuous-beat-0',
    'm-drift-continuous-cdf',
    'm-drift-continuous-at-one',
    'm-drift-continuous-gap',
    'drift-continuous-beat-1',
    'm-drift-continuous-from-zero',
    'm-drift-continuous-from-four',
    'm-drift-continuous-move',
    'drift-continuous-beat-2',
    'm-drift-continuous-limits',
  ],
};
