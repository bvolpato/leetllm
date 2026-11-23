import { formatScaleValue } from '../arithmetic.mjs';
import { scaleCalculation, scaleConstruction } from '../model.mjs';
import { scaleMath, scaleText } from '../defaults.mjs';
export function drawScale(ctx, scene, state, api) {
  return api.focus.target('scale-construction', () => {
    const { C: themeColors, teaching: teaching } = api,
      model = scaleCalculation(),
      current = scaleConstruction(state);
    scaleText(
      ctx,
      api,
      'Three inspected rows from the six-row feature table',
      585,
      285,
      29,
      themeColors.muted,
      'center',
    );
    ['Row', 'Topic', 'Characters'].forEach((v, i) =>
      scaleText(ctx, api, v, 290 + i * 285, 365, 31, themeColors.muted, 'center'),
    );
    [0, 1, 3].forEach((j, i) => {
      const row = model.rows[j],
        y = 470 + i * 115;
      [row.id, ...row.raw].forEach((v, k) =>
        scaleText(
          ctx,
          api,
          String(v),
          290 + k * 285,
          y,
          36,
          k === 0 ? (j === 3 ? themeColors.pink : themeColors.blue) : themeColors.ink,
          'center',
        ),
      );
    });
    const members = state.beat > 0,
      scaled = current.scaledMemberships;
    api.focus.target('scale-memberships', () => {
      scaleText(ctx, api, 'Raw cluster', 375, 845, 29, themeColors.yellow, 'center');
      scaleText(ctx, api, 'Scaled cluster', 835, 845, 29, themeColors.green, 'center');
      scaleText(ctx, api, 'ID', 375, 895, 25, themeColors.muted, 'center');
      scaleText(ctx, api, 'ID', 835, 895, 25, themeColors.muted, 'center');
      scaleText(
        ctx,
        api,
        members ? '[0, 1, 0]' : '[ ?, ?, ? ]',
        375,
        955,
        34,
        themeColors.yellow,
        'center',
      );
      scaleText(
        ctx,
        api,
        scaled ? '[0, 0, 1]' : '[ ?, ?, ? ]',
        835,
        955,
        34,
        themeColors.green,
        'center',
      );
    });
    api.focus.target('scale-worked-row', () => {
      scaleText(ctx, api, 'Same row: B100', 1480, 275, 33, themeColors.blue, 'center');
      scaleMath(ctx, api, String.raw`z_j=(x_j-\mu_j)/s_j`, 1480, 350, 43, themeColors.cyan);
      scaleText(
        ctx,
        api,
        'mean [' + model.means.map(formatScaleValue).join(', ') + ']',
        1480,
        420,
        28,
        themeColors.muted,
        'center',
      );
      scaleText(
        ctx,
        api,
        'std [' + model.stds.map(formatScaleValue).join(', ') + ']',
        1480,
        470,
        28,
        themeColors.muted,
        'center',
      );
      model.rows[0].raw.forEach((v, axis) =>
        scaleMath(
          ctx,
          api,
          '(' +
            v +
            '-' +
            formatScaleValue(model.means[axis]) +
            ')/' +
            formatScaleValue(model.stds[axis]) +
            '=' +
            (axis < current.coordinateCount
              ? formatScaleValue(model.rows[0].standardized[axis])
              : '?'),
          1480,
          550 + axis * 80,
          36,
          axis ? themeColors.pink : themeColors.cyan,
        ),
      );
    });
    for (const [i, scaled] of [false, true].entries()) {
      const x = 1180 + i * 345;
      scaleText(
        ctx,
        api,
        scaled ? 'Standardized' : 'Raw distance',
        x + 145,
        765,
        26,
        scaled ? themeColors.green : themeColors.yellow,
        'center',
      );
      api.focus.target(scaled ? 'scale-standardized-distances' : 'scale-raw-distances', () =>
        teaching.bars({
          x,
          y: 825,
          width: 290,
          height: 135,
          values: model.pairs.map((p) => (scaled ? p.standardized : p.raw)),
          labels: model.pairs.map((p) => p.to),
          max: scaled ? 2.2 : 410,
          colors: [themeColors.blue, themeColors.pink],
          showValues: !scaled || current.progress === 1,
          format: (v) => v.toFixed(3),
          fontSize: 24,
          gap: 60,
          progress: scaled ? Number(current.progress === 1) : 1,
        }),
      );
    }
    scaleText(
      ctx,
      api,
      current.progress === 1
        ? 'Standardized distance: B500 is nearer than D110.'
        : 'Raw distance: D110 is nearer than B500.',
      960,
      1040,
      27,
      themeColors.muted,
      'center',
    );
  });
}
export default {
  id: 'scale',
  draw: drawScale,
  cues: [
    'scale-raw',
    'cp-scale-0-0',
    'cp-scale-0-1',
    'cp-scale-0-2',
    'cp-scale-0-3',
    'scale-beat-2-focus-1',
    'scale-memberships',
    'cp-scale-1-0',
    'cp-scale-1-1',
    'cp-scale-1-2',
    'cp-scale-1-3',
    'scale-contract',
    'cp-scale-2-0',
    'cp-scale-2-1',
    'cp-scale-2-2',
    'cp-scale-2-3',
  ],
};
