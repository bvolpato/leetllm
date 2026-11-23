import { samplingFilmData } from '../fixtures.mjs';
import { samplingExtensionModel } from '../construction.mjs';
import { durationDensity } from '../model.mjs';
import {
  drawSamplingExtensionCurve,
  drawSamplingExtensionFooter,
  drawSamplingExtensionL,
  drawSamplingExtensionNum,
  drawSamplingExtensionPlot,
  drawSamplingExtensionRectangle,
  drawSamplingExtensionText,
} from '../defaults.mjs';
export function drawLaunchReport(ctx, scene, state, api) {
  const { C: themeColors } = api,
    f = samplingExtensionModel(state, 'launch-report'),
    currentBeat = f.beat,
    progress = f.progress;
  api.focus.target('sp-launch-report-visual', () => {
    const r = samplingFilmData.launch,
      labels = [
        ['resolution_rate', 'Resolution', themeColors.green],
        ['rollback_share', 'Rollback', themeColors.blue],
        ['mean_tool_calls', 'Tool count', themeColors.yellow],
        ['share_over_5_tools', 'Costly >5', themeColors.pink],
      ];
    if (currentBeat === 0) {
      labels.forEach(([key, name, color], i) => {
        const y = 390 + i * 125;
        drawSamplingExtensionText(ctx, api, name, 280, y + 20, 33, color);
        const w = key === 'mean_tool_calls' ? r[key] / 3 : r[key];
        drawSamplingExtensionRectangle(ctx, api, 650, y - 20, 850 * w * progress, 55, color);
        drawSamplingExtensionText(
          ctx,
          api,
          progress === 1 ? r[key].toFixed(3) : 'building',
          1590,
          y + 20,
          34,
          color,
          'center',
        );
      });
    } else {
      const q = drawSamplingExtensionPlot(
        ctx,
        api,
        [0, 24],
        [0, 0.16],
        230,
        365,
        1080,
        455,
        'duration seconds',
        'supplied density',
      );
      drawSamplingExtensionCurve(ctx, api, q, durationDensity, 0.03, 24, themeColors.blue);
      for (const [key, color] of [
        ['median_seconds', themeColors.cyan],
        ['p95_seconds', themeColors.pink],
      ]) {
        const x = r[key],
          at = q.point(x, 0);
        drawSamplingExtensionL(ctx, api, [at, q.point(x, 0.15)], color, 3);
        drawSamplingExtensionText(
          ctx,
          api,
          key === 'median_seconds' ? 'median' : 'interpolated p95',
          at.x,
          310,
          28,
          color,
          'center',
        );
      }
      drawSamplingExtensionNum(
        ctx,
        api,
        'Executed median',
        r.median_seconds.toFixed(3) + ' s',
        420,
      );
      drawSamplingExtensionNum(
        ctx,
        api,
        'Executed p95',
        r.p95_seconds.toFixed(3) + ' s',
        650,
        themeColors.pink,
      );
    }
    drawSamplingExtensionFooter(
      ctx,
      api,
      currentBeat === 2
        ? 'Compare tool counts and durations on the same held-out requests'
        : '5,000 simulated requests from seed 7',
    );
  });
}
export default {
  id: 'launch-report',
  draw: drawLaunchReport,
  cues: ['sp-launch-report-0', 'sp-launch-report-1', 'sp-launch-report-2'],
};
