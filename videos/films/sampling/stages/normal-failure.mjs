import { samplingExtensionModel } from '../construction.mjs';
import {
  drawSamplingExtensionCurve,
  drawSamplingExtensionFooter,
  drawSamplingExtensionL,
  drawSamplingExtensionNum,
  drawSamplingExtensionPlot,
} from '../defaults.mjs';
import { sampleFunction } from 'vizmatic';
export function drawNormalFailure(ctx, scene, state, api) {
  const { C: themeColors } = api,
    f = samplingExtensionModel(state, 'normal-failure'),
    currentBeat = f.beat,
    progress = f.progress;
  api.focus.target('sp-normal-failure-visual', () => {
    const q = drawSamplingExtensionPlot(
      ctx,
      api,
      [-18, 30],
      [0, 0.08],
      250,
      365,
      1080,
      455,
      'completion time (seconds)',
      'normal density',
    );
    drawSamplingExtensionCurve(
      ctx,
      api,
      q,
      (x) => Math.exp(-0.5 * ((x - 8) / 6) ** 2) / (6 * Math.sqrt(2 * Math.PI)),
      -18,
      30,
      themeColors.blue,
    );
    drawSamplingExtensionL(ctx, api, [q.point(0, 0), q.point(0, 0.08)], themeColors.pink, 4);
    const pts = [
      q.point(-18, 0),
      ...sampleFunction(
        (x) => Math.exp(-0.5 * ((x - 8) / 6) ** 2) / (6 * Math.sqrt(2 * Math.PI)),
        -18,
        0,
        80,
      ).map((v) => q.point(v.x, v.y)),
      q.point(0, 0),
    ];
    api.path(ctx, pts, {
      color: themeColors.pink,
      fill: themeColors.pink + '60',
      closed: true,
      width: 1,
    });
    drawSamplingExtensionNum(
      ctx,
      api,
      'Actual sample below 0',
      'about 9.5%',
      410,
      themeColors.pink,
    );
    if (currentBeat === 1) {
      const at = q.point(0, 0.035 * progress);
      drawSamplingExtensionL(ctx, api, [q.point(0, 0), at], themeColors.yellow, 14);
      drawSamplingExtensionNum(
        ctx,
        api,
        'Clipping creates',
        'a point mass at 0',
        650,
        themeColors.yellow,
      );
    } else
      drawSamplingExtensionNum(ctx, api, 'Actual minimum', 'about −15.7 s', 650, themeColors.pink);
    drawSamplingExtensionFooter(
      ctx,
      api,
      currentBeat === 1
        ? 'A clipped, truncated or different positive law is a changed model'
        : 'A plausible mean does not rescue impossible negative completion times',
    );
  });
}
export default {
  id: 'normal-failure',
  draw: drawNormalFailure,
  cues: ['sp-normal-failure-0', 'sp-normal-failure-1'],
};
