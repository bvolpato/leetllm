import { stablePolicy } from '../arithmetic.mjs';
import { freshPolicyFrame, policyCueProgress } from '../construction.mjs';
import { drawCaption, drawPolicyCard, drawPolicyText, drawProbabilityStrip } from '../defaults.mjs';
export function drawFreshPolicy(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0;
  const progress = policyCueProgress('fresh-policy', state),
    currentBeat = Math.min(beat, scene.beats.length - 1);
  const target = (paint) =>
    api.focus ? api.focus.target(`${'fresh-policy'}-state-${currentBeat}`, paint) : paint();
  const colors = [themeColors.blue, themeColors.pink, themeColors.cyan, themeColors.yellow];
  const policy = stablePolicy();
  {
    const { C, teaching, components } = api;
    const id = 'fresh-policy',
      beat = state.beat ?? 0;
    {
      const frame = freshPolicyFrame(state),
        labels = ['backup', 'rotate', 'remove', 'quota'];
      drawPolicyText(ctx, api, 'NEW SUPPLIED GUIDE', 170, 292, 26, C.muted);
      ['backup', 'rotate', 'remove'].forEach((s, i) => {
        drawPolicyCard(
          ctx,
          api,
          'fresh-policy',
          s,
          180 + i * 560,
          345,
          390,
          82,
          i === 0 ? C.green : C.muted,
          35,
        );
        if (i < 2) api.arrow(ctx, 600 + i * 560, 386, 700 + i * 560, 386, C.muted);
      });
      if (beat === 0) {
        drawPolicyText(
          ctx,
          api,
          'A=.46, B=.32, C=.14, D=.08 · nucleus p=.75 · supplied u=.65',
          960,
          535,
          30,
          C.ink,
          'center',
        );
        target(() => {
          drawProbabilityStrip(ctx, api, colors, frame.probabilities, labels, 230, 675, 1460, 0.65);
          drawPolicyText(
            ctx,
            api,
            'Which tokens survive, and what are their normalized probabilities?',
            960,
            890,
            31,
            C.yellow,
            'center',
          );
        });
        drawCaption(
          ctx,
          api,
          'The complete input stays visible. Hold your prediction before the result.',
        );
      } else {
        const probabilities = frame.repaired ? [1, 0, 0, 0] : frame.filtered.probabilities;
        target(() => {
          drawProbabilityStrip(ctx, api, colors, probabilities, labels, 230, 600, 1460, 0.65);
          if (frame.known)
            drawPolicyCard(
              ctx,
              api,
              'fresh-policy',
              frame.selected,
              680,
              835,
              560,
              83,
              frame.repaired ? C.green : C.pink,
              39,
            );
          else
            drawPolicyText(
              ctx,
              api,
              beat >= 2
                ? 'Apply the explicitly supplied eligibility repair…'
                : 'Compare .65 with the normalized intervals…',
              960,
              890,
              31,
              C.muted,
              'center',
            );
        });
        drawCaption(
          ctx,
          api,
          beat >= 2
            ? frame.repaired
              ? 'Only backup is explicitly eligible. The same draw now chooses backup; the guide supplied the evidence.'
              : 'Apply the guide-derived eligibility filter, renormalize, and reuse the supplied draw.'
            : 'Retained mass .78 → backup .58974, rotate .41026. Valid enum syntax still permits the wrong first step.',
        );
      }
    }
    return;
  }
  return;
}
export default {
  id: 'fresh-policy',
  draw: drawFreshPolicy,
  cues: ['fresh-policy-build-0', 'fresh-policy-build-1', 'fresh-policy-build-2'],
};
