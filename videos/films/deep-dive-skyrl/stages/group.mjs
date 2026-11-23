import { sampleModel } from '../model.mjs';
import { drawSkyEquation, drawSkyText } from '../defaults.mjs';
export function drawGroup(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = sampleModel('group', state),
    currentBeat = modelState.b;
  {
    drawSkyText(
      ctx,
      api,
      'Four responses to the same prompt',
      960,
      285,
      39,
      themeColors.yellow,
      'center',
    );
    const centered = currentBeat === 0 ? Math.min(1, modelState.q / 0.65) : 1,
      values = modelState.reward.map((value) => value - modelState.mean * centered),
      X = (i) => 450 + i * 360,
      Y = (value) => 650 - value * 230;
    const zero = Y(0),
      mean = Y(modelState.mean * (1 - centered));
    api.line(ctx, 250, zero, 1710, zero, themeColors.muted, 3);
    if (centered < 1) {
      api.line(ctx, 250, mean, 1710, mean, themeColors.yellow, 3);
      drawSkyText(
        ctx,
        api,
        'current average ' + (modelState.mean * (1 - centered)).toFixed(2),
        1710,
        mean - 20,
        27,
        themeColors.yellow,
        'right',
      );
    }
    api.focus.target('group-reward-states', () =>
      values.forEach((value, i) => {
        const x = X(i),
          y = Y(value),
          color = value > 0 ? themeColors.green : value < 0 ? themeColors.pink : themeColors.muted;
        drawSkyText(
          ctx,
          api,
          'response ' + i + ' · reward ' + modelState.reward[i].toFixed(2),
          x,
          330,
          27,
          themeColors.blue,
          'center',
        );
        api.line(ctx, x, zero, x, y, color, 8);
        api.circle(ctx, x, y, 15, color);
        drawSkyText(
          ctx,
          api,
          value > 0 ? '+' + value.toFixed(2) : value.toFixed(2),
          x,
          y + (value < 0 ? 60 : -35),
          32,
          color,
          'center',
        );
      }),
    );
    drawSkyText(
      ctx,
      api,
      centered === 1
        ? 'Centered comparison · zero marks the peer average'
        : 'Shift every reward by the same group mean',
      960,
      925,
      31,
      themeColors.cyan,
      'center',
    );
    api.focus.target('group-math-a-i-r-i-ar-r-quad-ar-rapprox', () =>
      drawSkyEquation(
        ctx,
        api,
        String.raw`A_i=r_i-\bar r,\quad\bar r\approx${modelState.mean.toFixed(2)}`,
        960,
        1010,
        43,
      ),
    );
  }
}
export default {
  id: 'group',
  draw: drawGroup,
  cues: [
    'group-beat-1-focus-1',
    'group-beat-2-focus-1',
    'group-beat-3-focus-1',
    'group-equal-rewards',
    'group-zero-signal',
  ],
};
