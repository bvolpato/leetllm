import { arrow, box, datum, focusProgress, footer, label } from '../defaults.mjs';
export function drawSequentialPolicy(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    q = (id) => focusProgress(ctx, api, 'cau-' + id),
    done = (id) => q(id) >= 1;
  api.focus.target('cau-sequential-policy-mechanism', () => {
    const same = done('same-policy-ratios'),
      ratios = same ? [1, 1, 1] : [2, 0.5];
    ratios.forEach((v, i) => {
      const x = 230 + i * 570;
      box(
        ctx,
        api,
        'History h' + (i + 1),
        ['observed action / reward', 'target/log ratio ' + v],
        x,
        370,
        450,
        205,
        i % 2 ? themeColors.yellow : themeColors.cyan,
      );
      if (i < ratios.length - 1) arrow(ctx, api, x + 465, 470, x + 555, 470, themeColors.cyan);
    });
    const product = ratios.reduce((a, b) => a * b, 1);
    datum(
      ctx,
      api,
      'Trajectory weight ' + product,
      960,
      735,
      done('trajectory-product'),
      themeColors.green,
      44,
    );
    if (currentBeat >= 1)
      label(
        ctx,
        api,
        'Sequential corrections also carry future value and changed state',
        960,
        875,
        themeColors.yellow,
        31,
      );
    footer(
      ctx,
      api,
      'A one-step immediate-reward correction is not automatically a whole-agent-return estimator.',
    );
  });
}
export default {
  id: 'sequential-policy',
  draw: drawSequentialPolicy,
  cues: [
    'cau-sequential-policy-0',
    'cau-trajectory-product',
    'cau-sequential-policy-1',
    'cau-same-policy-ratios',
    'cau-sequential-policy-2',
  ],
};
