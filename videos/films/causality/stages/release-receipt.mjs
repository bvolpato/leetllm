import { code, dag, focusProgress, footer, label, node } from '../defaults.mjs';
export function drawReleaseReceipt(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    q = (id) => focusProgress(ctx, api, 'cau-' + id),
    done = (id) => q(id) >= 1;
  api.focus.target('cau-release-receipt-mechanism', () => {
    const nodes = [
        node(ctx, api, 'r', 'pre-routing risk', 785, 310, themeColors.yellow),
        node(ctx, api, 'a', 'workflow assignment', 180, 630, themeColors.cyan),
        node(ctx, api, 'y', '24-hour resolution', 1390, 630, themeColors.pink),
      ],
      random = currentBeat >= 1 && done('randomization-assignment');
    dag(ctx, api, nodes, [
      {
        from: 'r',
        to: 'y',
        progress: 1,
        color: themeColors.yellow,
      },
      {
        from: 'a',
        to: 'y',
        progress: 1,
        color: themeColors.cyan,
      },
      {
        from: 'r',
        to: 'a',
        progress: 1,
        color: random ? themeColors.blue : themeColors.yellow,
      },
    ]);
    if (random) {
      api.rect(ctx, 767, 292, 386, 141, null, themeColors.green, 15);
      code(ctx, api, 'condition on recorded risk', 960, 505, 29, themeColors.green, 'center');
    }
    if (random)
      label(ctx, api, 'Randomize within the declared risk strata', 960, 830, themeColors.green, 32);
    else
      label(
        ctx,
        api,
        'Raw −22 points · adjusted +10 · broad interval',
        960,
        830,
        themeColors.yellow,
        32,
      );
    label(
      ctx,
      api,
      'Target 70/30 · workflow versions · 24h horizon · support',
      960,
      920,
      themeColors.muted,
      30,
    );
    footer(
      ctx,
      api,
      'Observed rates, assumption-based effects and individual counterfactuals remain separate claims.',
    );
  });
}
export default {
  id: 'release-receipt',
  draw: drawReleaseReceipt,
  cues: [
    'cau-release-receipt-0',
    'cau-release-receipt-1',
    'cau-randomization-assignment',
    'cau-release-receipt-2',
  ],
};
