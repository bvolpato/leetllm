import { speculativeMass, stablePolicy } from '../arithmetic.mjs';
import { policyCueProgress } from '../construction.mjs';
import { drawCaption, drawPolicyText, drawProbabilityBars } from '../defaults.mjs';
export function drawSpeculativeBalance(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0;
  const progress = policyCueProgress('speculative-balance', state),
    currentBeat = Math.min(beat, scene.beats.length - 1);
  const target = (paint) =>
    api.focus ? api.focus.target(`${'speculative-balance'}-state-${currentBeat}`, paint) : paint();
  const colors = [themeColors.blue, themeColors.pink, themeColors.cyan, themeColors.yellow];
  const policy = stablePolicy();
  {
    const { C, teaching, components } = api;
    const id = 'speculative-balance',
      beat = state.beat ?? 0;
    {
      const proof = speculativeMass([0.6, 0.3, 0.1], [0.8, 0.1, 0.1]);
      drawPolicyText(
        ctx,
        api,
        'One position · same intended target p and actual draft q',
        960,
        300,
        32,
        C.ink,
        'center',
      );
      const columns =
        beat === 0
          ? [
              {
                name: 'Draft q',
                values: proof.draft,
              },
              {
                name: 'Accepted min(p,q)',
                values: proof.accepted,
              },
            ]
          : beat === 1
            ? [
                {
                  name: 'Accepted mass',
                  values: proof.accepted,
                },
                {
                  name: 'Residual (p−q)₊',
                  values: proof.residual,
                },
              ]
            : [
                {
                  name: 'Correct output',
                  values: proof.restored,
                },
                {
                  name: 'Wrong target redraw',
                  values: proof.wrongRedraw,
                },
              ];
      columns.forEach((column, index) => {
        const x = 160 + index * 900;
        drawPolicyText(
          ctx,
          api,
          column.name,
          x + 360,
          385,
          31,
          index ? C.yellow : C.blue,
          'center',
        );
        target(() =>
          drawProbabilityBars(
            ctx,
            api,
            colors,
            column.values,
            ['create', 'revoke', 'rename'],
            x,
            490,
            800,
            1,
            [0, 1, 2],
            (v) => v.toFixed(3),
            index === 0 ? 1 : progress,
          ),
        );
      });
      if (beat === 1)
        drawPolicyText(
          ctx,
          api,
          `Rejection mass ${proof.rejected.toFixed(2)} → normalized residual [0, 1, 0]`,
          960,
          875,
          31,
          C.green,
          'center',
        );
      if (beat >= 2)
        drawPolicyText(
          ctx,
          api,
          'Accepted mass + rejection mass × normalized residual = target p',
          960,
          875,
          32,
          C.green,
          'center',
        );
      drawCaption(
        ctx,
        api,
        'A distribution-preservation result for the declared policies, not identical seeded text or verified task correctness.',
      );
    }
    return;
  }
  return;
}
export default {
  id: 'speculative-balance',
  draw: drawSpeculativeBalance,
  cues: [
    'speculative-balance-build-0',
    'speculative-balance-build-1',
    'speculative-balance-build-2',
  ],
};
