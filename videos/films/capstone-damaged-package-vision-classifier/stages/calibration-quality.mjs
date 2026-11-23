import { visionSigmoid } from '../arithmetic.mjs';
import { visionFrame } from '../model.mjs';
import { visionCard, visionLine, visionNote, visionText } from '../defaults.mjs';
export function drawCalibrationQuality(ctx, scene, state, api) {
  const frameState = visionFrame('calibration-quality', state);
  return api.focus.target('dv-calibration-quality-mechanism', () => {
    const { C: themeColors } = api;
    const currentBeat = frameState.beat,
      resultComplete = frameState.after;
    {
      if (currentBeat === 1) {
        const plot = api.teaching.axes({
          x: 250,
          y: 380,
          width: 1260,
          height: 330,
          xDomain: [-4, 4],
          yDomain: [0, 1],
          xTicks: [-4, 0, 2, 4],
          yTicks: [0, 0.5, 1],
          xLabel: 'Supplied logit',
          fontSize: 26,
        });
        for (const [temperature, color] of [
          [1, themeColors.blue],
          [2, themeColors.cyan],
        ]) {
          let prior;
          for (let i = 0; i <= 80; i++) {
            const z = -4 + i * 0.1,
              at = plot.point(z, visionSigmoid(z / temperature));
            if (prior) visionLine(ctx, api, prior.x, prior.y, at.x, at.y, color, 3);
            prior = at;
          }
        }
        const show = resultComplete('temperature-scores', 1);
        if (show)
          for (const [temperature, color] of [
            [1, themeColors.blue],
            [2, themeColors.cyan],
          ]) {
            const at = plot.point(2, visionSigmoid(2 / temperature));
            api.circle(ctx, at.x, at.y, 12, color);
            visionText(
              ctx,
              api,
              'T=' + temperature + ' · ' + visionSigmoid(2 / temperature).toFixed(4),
              1630,
              temperature === 1 ? 430 : 590,
              29,
              color,
              'center',
            );
          }
        visionText(
          ctx,
          api,
          resultComplete('temperature-boundary', 1)
            ? 'Same side of .5 · a different queue cutoff can change the route'
            : 'Positive temperature rescales the logit',
          960,
          875,
          34,
          themeColors.ink,
          'center',
        );
        visionNote(
          ctx,
          api,
          'Both curves are analytic examples. A fitted temperature requires separate held-out validation data.',
        );
      } else if (currentBeat === 2) {
        const rows = [
          ['Accepted · damaged', 'Priority'],
          ['Accepted · clear', 'Normal'],
          ['Human-usable damaged', 'Request new photo'],
        ];
        rows.forEach(([label, route], i) => {
          visionCard(
            ctx,
            api,
            label,
            180,
            360 + i * 160,
            650,
            105,
            i === 2 ? themeColors.pink : themeColors.blue,
          );
          visionCard(
            ctx,
            api,
            route,
            1130,
            360 + i * 160,
            580,
            105,
            i === 2 ? themeColors.pink : themeColors.cyan,
          );
          api.arrow(ctx, 870, 410 + i * 160, 1090, 410 + i * 160, themeColors.muted, 3);
        });
        if (resultComplete('rejected-cohort', 2))
          visionText(
            ctx,
            api,
            'Accepted-only reporting omits this quality-stage miss',
            960,
            915,
            34,
            themeColors.pink,
            'center',
          );
        visionNote(
          ctx,
          api,
          'Illustrative cohort structure. The fixture does not measure calibration or quality-stage error rates.',
        );
      } else {
        visionText(
          ctx,
          api,
          'Predicted probabilities ↔ observed frequencies',
          960,
          350,
          39,
          themeColors.ink,
          'center',
        );
        const plot = api.teaching.axes({
          x: 470,
          y: 470,
          width: 880,
          height: 340,
          xDomain: [0, 1],
          yDomain: [0, 1],
          xTicks: [0, 0.5, 1],
          yTicks: [0, 0.5, 1],
          xLabel: 'Predicted probability',
          yLabel: 'Observed frequency',
          fontSize: 26,
        });
        const a = plot.point(0, 0),
          z = plot.point(1, 1);
        visionLine(ctx, api, a.x, a.y, z.x, z.y, themeColors.cyan, 4);
        visionText(
          ctx,
          api,
          'Ideal reference · no measured bins',
          960,
          935,
          31,
          themeColors.muted,
          'center',
        );
        visionNote(
          ctx,
          api,
          'Reserve calibrator-fitting data and final test data separately. A dark-frame high score is insufficient evidence.',
        );
      }
    }
  });
}
export default {
  id: 'calibration-quality',
  draw: drawCalibrationQuality,
  cues: [
    'dv-calibration-quality-0',
    'dv-calibration-quality-operation-0',
    'dv-calibration-quality-1',
    'dv-calibration-quality-operation-1',
    'dv-temperature-scores',
    'dv-temperature-boundary',
    'dv-calibration-quality-2',
    'dv-calibration-quality-operation-2',
    'dv-rejected-cohort',
  ],
};
