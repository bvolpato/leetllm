import { calibrationBins, validationScores } from '../fixtures.mjs';
import { mix, phase, progress, smooth } from '../construction.mjs';
import { T, mark, token } from '../defaults.mjs';
export function drawCalibration(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    collect = progress(state, 'collect-calibration', 0),
    labels = progress(state, 'calibration-outcomes', 1),
    flip = progress(state, 'calibration-one-label', 2);
  if (currentBeat === 2) {
    T(ctx, api, 'The bin near our waiting request has only two cases', 960, 280, 35, api.C.muted);
    const rows = calibrationBins[2].rows;
    rows.forEach((v, i) =>
      token(
        ctx,
        api,
        {
          ...v,
          label: flip === 1 ? 1 : v.label,
        },
        780 + i * 360,
        430,
        {
          radius: 40,
        },
      ),
    );
    mark(api, 'calibration-fragility', () => {
      const observed = flip === 1 ? 1 : 0.5;
      T(ctx, api, 'forecast ≈ ' + calibrationBins[2].forecast.toFixed(3), 620, 600, 37, api.C.cyan);
      T(ctx, api, 'observed ' + (flip === 1 ? '2 / 2' : '1 / 2'), 1300, 600, 37, api.C.yellow);
      api.rect(
        ctx,
        450,
        850 - 220 * calibrationBins[2].forecast,
        340,
        220 * calibrationBins[2].forecast,
        api.C.cyan,
      );
      api.rect(ctx, 1130, 850 - 220 * observed, 340, 220 * observed, api.C.yellow);
    });
    T(ctx, api, 'One changed label is a sensitivity check', 960, 965, 35, api.C.muted);
    return;
  }
  T(
    ctx,
    api,
    currentBeat === 0
      ? 'Forecasts exist before outcomes'
      : 'Count later labels inside each score bin',
    960,
    265,
    35,
    api.C.muted,
  );
  mark(api, 'calibration-bins', () =>
    calibrationBins.forEach((bin, i) => {
      const x = 215 + i * 390;
      T(
        ctx,
        api,
        (i / 4).toFixed(2) + '–' + ((i + 1) / 4).toFixed(2) + ' · n=' + bin.rows.length,
        x + 140,
        330,
        29,
        api.C.muted,
      );
      if (collect === 1) api.rect(ctx, x - 10, 370, 310, 150, api.C.panel, undefined, 8);
      const forecast = bin.forecast * smooth(phase(collect, 0.6, 1));
      api.rect(ctx, x + 15, 850 - 300 * forecast, 90, Math.max(1, 300 * forecast), api.C.cyan);
      if (collect === 1)
        T(ctx, api, bin.forecast.toFixed(3), x + 60, 850 - 300 * forecast - 20, 29, api.C.cyan);
      T(ctx, api, 'forecast', x + 60, 915, 28, api.C.cyan);
    }),
  );
  const sorted = [...validationScores].sort((a, b) => a.p - b.p);
  mark(api, 'calibration-tokens', () =>
    calibrationBins.forEach((bin, i) =>
      bin.rows.forEach((v, j) => {
        const q = smooth(collect),
          rank = sorted.findIndex((row) => row.id === v.id),
          from = {
            x: 225 + rank * 210,
            y: 370,
          },
          to = {
            x: 355 + i * 390 + (j - (bin.rows.length - 1) / 2) * 90,
            y: 435,
          },
          known = currentBeat > 0 && labels >= (v.index + 1) / 8,
          at = {
            x: mix(from.x, to.x, q),
            y: mix(from.y, to.y, q),
          };
        token(ctx, api, v, at.x, at.y, {
          hidden: !known,
          radius: 28,
        });
        T(ctx, api, v.p.toFixed(2), at.x, at.y + 58, 27, api.C.muted);
      }),
    ),
  );
  mark(api, 'observed-frequencies', () =>
    calibrationBins.forEach((bin, i) => {
      const x = 215 + i * 390,
        known = bin.rows.filter((v) => labels >= (v.index + 1) / 8),
        positive = known.reduce((n, v) => n + v.label, 0),
        complete = known.length === bin.rows.length,
        observed = complete ? positive / bin.rows.length : 0;
      api.rect(ctx, x + 155, 850 - 300 * observed, 90, Math.max(1, 300 * observed), api.C.yellow);
      T(
        ctx,
        api,
        currentBeat === 0
          ? '?'
          : complete
            ? positive + ' / ' + bin.rows.length
            : known.length + ' labels seen',
        x + 200,
        850 - 300 * observed - 20,
        28,
        api.C.yellow,
      );
      T(ctx, api, 'observed', x + 200, 915, 28, api.C.yellow);
    }),
  );
  T(
    ctx,
    api,
    currentBeat === 0
      ? 'Outcome labels covered'
      : 'Tiny bin populations need a larger verification sample',
    960,
    1000,
    32,
    api.C.muted,
  );
}
export default {
  id: 'calibration',
  draw: drawCalibration,
  cues: ['collect-calibration', 'calibration-outcomes', 'calibration-one-label'],
};
