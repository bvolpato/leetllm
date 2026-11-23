import { effectAtMix } from '../model.mjs';
import { code, datum, detailText, focusProgress, footer, label } from '../defaults.mjs';
export function drawEstimands(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    q = (id) => focusProgress(ctx, api, 'cau-' + id),
    done = (id) => q(id) >= 1;
  const pc = (v, d = 1) => Number((100 * v).toFixed(d)) + '%',
    points = (v, d = 1) => Number((100 * v).toFixed(d)) + ' points',
    num = (v, d = 3) => Number(v.toFixed(d));
  api.focus.target('cau-estimands-mechanism', () => {
    const changed = done('effect-vector'),
      effects = changed ? [0.04, 0.16] : [0.1, 0.1],
      mixes = [
        ['Log population', 0.5, 'ate-result'],
        ['Assigned assistant', 0.1, 'att-result'],
        ['Deployment', 0.7, 'deployment-effect'],
      ];
    label(
      ctx,
      api,
      changed
        ? 'Separate effects: low 4 / high 16 points'
        : 'Original effects: low 10 / high 10 points',
      960,
      285,
      themeColors.yellow,
      34,
    );
    mixes.forEach(([name, w, id], i) => {
      const yy = 410 + i * 170,
        values = [w * effects[0], (1 - w) * effects[1]],
        scale = 4500,
        earned = !changed || done(id);
      detailText(ctx, api, name, 180, yy + 50, 31, themeColors.ink);
      let x = 620;
      if (earned)
        for (const [v, color] of [
          [values[0], themeColors.green],
          [values[1], themeColors.red],
        ]) {
          api.rect(ctx, x, yy, v * scale, 72, color, undefined, 5);
          x += v * scale;
        }
      else
        code(ctx, api, `${num(w)} × 4 + ${num(1 - w)} × 16`, 620, yy + 48, 28, themeColors.muted);
      code(
        ctx,
        api,
        `${pc(w, 0)} low / ${pc(1 - w, 0)} high`,
        620,
        yy + 125,
        26,
        themeColors.muted,
      );
      datum(
        ctx,
        api,
        points(effectAtMix(w, effects)),
        1570,
        yy + 48,
        earned,
        themeColors.yellow,
        34,
      );
    });
    footer(
      ctx,
      api,
      'Changing the target changes the average under heterogeneous effects; no paired outcome is observed.',
    );
  });
}
export default {
  id: 'estimands',
  draw: drawEstimands,
  cues: [
    'cau-estimands-0',
    'cau-estimands-1',
    'cau-effect-vector',
    'cau-ate-result',
    'cau-att-result',
    'cau-estimands-2',
    'cau-deployment-effect',
  ],
};
