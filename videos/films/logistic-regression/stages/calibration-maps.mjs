import { sigmoid } from '../arithmetic.mjs';
import { plattFitStates, training, validationScores } from '../fixtures.mjs';
import { mix } from '../construction.mjs';
import { isotonicFixture } from '../model.mjs';
import {
  axes,
  cueAmount,
  curve,
  equation,
  labelPoint,
  rectangle,
  segment,
  text,
} from '../defaults.mjs';
import { sampleFunction } from 'vizmatic';
export function drawCalibrationMaps(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    op = api.focus.progress('lr-calibration-maps-step-' + currentBeat, 0);
  api.focus.target('lr-calibration-maps-mechanism', () => {
    if (currentBeat === 0) {
      const amount = cueAmount(ctx, api, 'lr-calibrator-data');
      text(ctx, api, 'Fitting labels', 430, 300, 35, themeColors.blue);
      text(ctx, api, 'Calibration labels', 1000, 300, 35, themeColors.yellow);
      text(ctx, api, 'Fresh verification', 1550, 300, 35, themeColors.green);
      [430, 1000, 1550].forEach((x) =>
        rectangle(ctx, api, x - 210, 390, 420, 300, themeColors.panel, themeColors.muted),
      );
      training.forEach((r, i) => {
        const x = 280 + (i % 4) * 90,
          y = 460 + Math.floor(i / 4) * 125;
        api.circle(ctx, x, y, 24, r[2] ? themeColors.pink : themeColors.blue);
        text(ctx, api, 'R' + (i + 1), x, y + 55, 26, themeColors.muted);
      });
      validationScores.forEach((r, i) => {
        const x = 850 + (i % 4) * 90,
          y = 460 + Math.floor(i / 4) * 125;
        api.circle(ctx, x, y, 24, themeColors.yellow);
        text(ctx, api, r.id, x, y + 55, 26, themeColors.muted);
      });
      for (let i = 0; i < 4; i++) text(ctx, api, '?', 1420 + i * 85, 570, 48, themeColors.green);
      const platt = cueAmount(ctx, api, 'lr-platt-fit');
      if (platt > 0) {
        const [a, beta] = plattFitStates[Math.min(1000, Math.floor(platt * 1000))];
        text(ctx, api, 'Platt fit · eight calibration labels', 430, 735, 27, themeColors.cyan);
        equation(
          ctx,
          api,
          'p=\\sigma(' + a.toFixed(2) + 'z' + (beta >= 0 ? '+' : '') + beta.toFixed(2) + ')',
          430,
          825,
          30,
          themeColors.cyan,
        );
        const points = sampleFunction((z) => sigmoid(a * z + beta), -4, 4, 80).map((v) => ({
          x: 270 + (v.x + 4) * 40,
          y: 935 - 90 * v.y,
        }));
        api.path(ctx, points, {
          color: themeColors.cyan,
          width: 3,
        });
      }
      const map = cueAmount(ctx, api, 'lr-isotonic-map'),
        iso = isotonicFixture();
      if (map > 0) {
        text(ctx, api, 'Score → fitted isotonic probability', 1000, 755, 28, themeColors.yellow);
        iso.forEach((row, i) => {
          const x = 825 + i * 47,
            from = 850 - 95 * row.p,
            to = 850 - 95 * row.mapped;
          api.circle(ctx, x, mix(from, to, map), 6, themeColors.yellow);
        });
      }
      const fixed = validationScores[3];
      if (amount > 0) {
        text(ctx, api, 'V4 fixed score ' + fixed.p.toFixed(3), 430, 785, 28, themeColors.cyan);
        const mapped = isotonicFixture().find((r) => r.id === 'V4').mapped;
        const at = mix(600, 1380, amount);
        api.circle(ctx, at, 870, 12, themeColors.cyan);
        if (amount === 1)
          text(ctx, api, 'Fresh labels still reserved', 1550, 785, 28, themeColors.green);
      }
      text(
        ctx,
        api,
        'Classifier → fixed scores → fit map → reserve verification',
        960,
        990,
        31,
        themeColors.muted,
      );
    } else if (currentBeat === 1) {
      const q = axes(
          ctx,
          api,
          210,
          365,
          720,
          450,
          [0, 1],
          [0, 1],
          'original score',
          'mapped probability',
        ),
        r = axes(ctx, api, 1170, 365, 560, 450, [-4, 4], [0, 1], 'logit', 'probability'),
        amount = cueAmount(ctx, api, 'lr-map-ties'),
        iso = isotonicFixture();
      let previous = null;
      iso.forEach((row) => {
        const val = mix(row.p, row.mapped, amount),
          p = q.point(row.p, val);
        if (previous)
          segment(ctx, api, previous.x, previous.y, p.x, previous.y, themeColors.yellow, 4);
        segment(ctx, api, p.x, p.y, p.x, previous?.y ?? p.y, themeColors.yellow, 4);
        api.circle(ctx, p.x, p.y, 9, row.label ? themeColors.pink : themeColors.blue);
        previous = p;
      });
      const temp = 1 + cueAmount(ctx, api, 'lr-positive-temperature');
      curve(ctx, api, r, (z) => sigmoid(z / temp), -4, 4, themeColors.cyan);
      labelPoint(ctx, api, r, 0, 0.5, themeColors.yellow);
      text(
        ctx,
        api,
        'Nondecreasing isotonic fit to these eight calibration labels',
        570,
        925,
        27,
        themeColors.muted,
      );
      text(ctx, api, 'Positive T = ' + temp.toFixed(2), 1450, 925, 33, themeColors.cyan);
      text(
        ctx,
        api,
        'Flat steps create ties; zero-logit boundary stays fixed under T>0',
        960,
        1000,
        30,
        themeColors.muted,
      );
    } else {
      const row = isotonicFixture().find((r) => r.id === 'V4'),
        cut = mix(0.5, 0.6, cueAmount(ctx, api, 'lr-post-calibration-policy'));
      text(ctx, api, 'Same target: review required', 960, 285, 36);
      text(
        ctx,
        api,
        'V4 raw ' + row.p.toFixed(3) + ' → mapped ' + row.mapped.toFixed(3),
        960,
        390,
        38,
        themeColors.cyan,
      );
      const x = 340,
        w = 1200;
      rectangle(ctx, api, 340, 540, 1200, 95, themeColors.panel, themeColors.muted);
      rectangle(ctx, api, 340, 540, 1200 * row.mapped, 95, themeColors.cyan);
      segment(ctx, api, 340 + 1200 * cut, 490, 340 + 1200 * cut, 710, themeColors.yellow, 5);
      text(ctx, api, 'Policy cut ' + cut.toFixed(2), 340 + 1200 * cut, 770, 34, themeColors.yellow);
      text(
        ctx,
        api,
        row.mapped >= cut ? 'Routes to review' : 'Routes to automatic handling',
        960,
        875,
        37,
        row.mapped >= cut ? themeColors.yellow : themeColors.blue,
      );
      text(
        ctx,
        api,
        'Routing labels do not authorize access changes',
        960,
        985,
        34,
        themeColors.muted,
      );
    }
  });
}
export default {
  id: 'calibration-maps',
  draw: drawCalibrationMaps,
  cues: [
    'lr-calibration-maps-step-0',
    'lr-calibrator-data',
    'lr-isotonic-map',
    'lr-platt-fit',
    'lr-calibration-maps-step-1',
    'lr-map-ties',
    'lr-positive-temperature',
    'lr-calibration-maps-step-2',
    'lr-post-calibration-policy',
  ],
};
