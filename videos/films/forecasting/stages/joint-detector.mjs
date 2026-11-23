import { FORECAST_CUE_AT } from '../fixtures.mjs';
import { forecastCueProgress } from '../construction.mjs';
import { diagonalProjection } from '../model.mjs';
import { box, dot, extensionText, line, rectangle } from '../defaults.mjs';
import { smoothstep } from 'vizmatic';
export function drawJointDetector(ctx, scene, state, api) {
  if (!Object.keys(FORECAST_CUE_AT).some((id) => id.startsWith('fc-joint-detector-'))) return;
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const cueProgress = (suffix) => forecastCueProgress(state, `fc-${'joint-detector'}-${suffix}`);
  const done = (suffix) => cueProgress(suffix) >= 1;
  const lerp = (a, z, p) => a + (z - a) * smoothstep(p);
  const plot = (x, y, w, h, xmin, xmax, ymin, ymax) => {
    const X = (v) => x + ((v - xmin) / (xmax - xmin)) * w,
      Y = (v) => y + h - ((v - ymin) / (ymax - ymin)) * h;
    line(ctx, api, x, y + h, x + w, y + h);
    line(ctx, api, x, y, x, y + h);
    return {
      X,
      Y,
    };
  };
  api.focus.target('fc-joint-detector-mechanism', () => {
    const g = plot(650, 380, 600, 600, -6, 6, -6, 6),
      pointP = cueProgress('five'),
      p = [lerp(1, 5, pointP), lerp(-1, 5, pointP)],
      proj = diagonalProjection(p);
    rectangle(ctx, api, g.X(-1), g.Y(1), g.X(1) - g.X(-1), g.Y(-1) - g.Y(1), themeColors.muted);
    line(ctx, api, g.X(-6), g.Y(-6), g.X(6), g.Y(6), themeColors.blue, 4);
    for (const v of [-6, -3, 0, 3, 6]) {
      extensionText(ctx, api, v, g.X(v), 1018, 23, themeColors.muted);
      extensionText(ctx, api, v, 610, g.Y(v) + 7, 23, themeColors.muted);
    }
    if (currentBeat === 2) {
      const original = [1, -1];
      const foot = diagonalProjection(original).reconstruction;
      line(
        ctx,
        api,
        g.X(original[0]),
        g.Y(original[1]),
        g.X(foot[0]),
        g.Y(foot[1]),
        themeColors.yellow,
        5,
      );
      dot(ctx, api, g.X(foot[0]), g.Y(foot[1]), themeColors.yellow, 9);
      dot(ctx, api, g.X(original[0]), g.Y(original[1]), themeColors.pink, 13);
    }
    dot(ctx, api, g.X(p[0]), g.Y(p[1]), themeColors.pink, 13);
    if (cueProgress('projection') > 0) {
      const q = cueProgress('projection');
      line(
        ctx,
        api,
        g.X(p[0]),
        g.Y(p[1]),
        lerp(g.X(p[0]), g.X(proj.reconstruction[0]), q),
        lerp(g.Y(p[1]), g.Y(proj.reconstruction[1]), q),
        themeColors.yellow,
        5,
      );
      dot(
        ctx,
        api,
        g.X(proj.reconstruction[0]),
        g.Y(proj.reconstruction[1]),
        themeColors.yellow,
        9,
      );
    }
    extensionText(
      ctx,
      api,
      'Equal-unit metrics · diagonal reconstruction',
      960,
      325,
      31,
      themeColors.blue,
    );
    box(
      ctx,
      api,
      currentBeat === 2 ? '(1, −1)  ·  inside range' : pointP > 0 ? '(5, 5)' : '(1, −1)',
      180,
      440,
      370,
      themeColors.pink,
      28,
      100,
    );
    if (currentBeat === 2) {
      extensionText(ctx, api, 'Squared distance  2', 365, 615, 31, themeColors.yellow);
      box(ctx, api, '(5, 5)  ·  outside range', 1310, 440, 440, themeColors.pink, 28, 100);
      extensionText(ctx, api, 'Squared distance  0', 1530, 615, 31, themeColors.yellow);
    } else if (done('two') && pointP === 0)
      box(ctx, api, 'Residual score: 2', 1320, 500, 400, themeColors.yellow, 29, 100);
    if (currentBeat < 2 && done('zero'))
      box(ctx, api, 'Residual score: 0', 1320, 500, 400, themeColors.yellow, 29, 100);
    if (currentBeat < 2 && done('five'))
      extensionText(ctx, api, 'Both marginal ranges are violated', 1510, 700, 27, themeColors.pink);
    if (done('forest'))
      extensionText(ctx, api, 'Isolation Forest uses tree depth', 1520, 850, 25, themeColors.muted);
  });
  return;
}
export default {
  id: 'joint-detector',
  draw: drawJointDetector,
  cues: [
    'fc-joint-detector-point',
    'fc-joint-detector-projection',
    'fc-joint-detector-two',
    'fc-joint-detector-five',
    'fc-joint-detector-zero',
    'fc-joint-detector-forest',
  ],
};
