import { POLICY_TOKENS } from '../fixtures.mjs';
import { retainedPolicy, stablePolicy } from '../arithmetic.mjs';
import { policyCueProgress } from '../construction.mjs';
import {
  drawCaption,
  drawLine,
  drawPolicyEquation,
  drawPolicyText,
  drawProbabilityBars,
} from '../defaults.mjs';
export function drawFilterK(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0;
  const progress = policyCueProgress('filter-k', state),
    currentBeat = Math.min(beat, scene.beats.length - 1);
  const target = (paint) =>
    api.focus ? api.focus.target(`${'filter-k'}-state-${currentBeat}`, paint) : paint();
  const colors = [themeColors.blue, themeColors.pink, themeColors.cyan, themeColors.yellow];
  const policy = stablePolicy();
  {
    const { C, teaching, components } = api;
    const id = 'filter-k',
      beat = state.beat ?? 0;
    {
      const flat = beat === 1,
        probabilities = flat ? [0.28, 0.25, 0.24, 0.23] : [0.568, 0.345, 0.077, 0.01];
      const kind = 'k';
      const parameter = 2;
      const kept = retainedPolicy(probabilities, 'k', parameter);
      if (beat === 2) {
        const stages = Math.floor(500 * progress),
          tail = 1 - 0.998 ** stages;
        drawPolicyText(
          ctx,
          api,
          'Supplied conditional tail probability .002 at each next position',
          960,
          310,
          31,
          C.ink,
          'center',
        );
        target(() => {
          const points = Array.from(
            {
              length: 151,
            },
            (_, i) => ({
              x: 230 + (i / 150) * 1430,
              y: 810 - (1 - 0.998 ** ((i / 150) * 500)) * 620,
            }),
          );
          for (const probability of [0, 0.2, 0.4, 0.6]) {
            const y = 810 - probability * 620;
            drawLine(ctx, api, 230, y, 1660, y, C.panel, 2);
            drawPolicyText(ctx, api, probability.toFixed(1), 200, y + 9, 25, C.muted, 'right');
          }
          api.path(ctx, points, {
            color: C.blue,
            width: 5,
          });
          drawLine(ctx, api, 230, 810, 1660, 810);
          drawLine(ctx, api, 230, 810, 230, 400);
          for (const position of [0, 250, 500]) {
            const x = 230 + (position / 500) * 1430;
            drawLine(ctx, api, x, 810, x, 822);
            drawPolicyText(ctx, api, position, x, 855, 25, C.muted, 'center');
          }
          const x = 230 + (stages / 500) * 1430,
            y = 810 - tail * 620;
          api.circle(ctx, x, y, 12, C.yellow);
          drawPolicyText(
            ctx,
            api,
            `Generated positions · current ${stages}`,
            960,
            915,
            29,
            C.yellow,
            'center',
          );
        });
        drawPolicyText(ctx, api, 'Chance of ≥1 tail token', 230, 395, 25, C.muted);
        drawPolicyEquation(
          ctx,
          api,
          String.raw`1-(1-.002)^{${stages}}=${tail.toFixed(3)}`,
          960,
          355,
          42,
          C.cyan,
          'center',
        );
        drawCaption(
          ctx,
          api,
          'A probability calculation under the declared process, not a measured hallucination rate.',
        );
      } else {
        drawPolicyText(
          ctx,
          api,
          flat ? 'FLAT INPUT' : 'PEAKED INPUT · exact worksheet probabilities',
          180,
          300,
          29,
          C.muted,
        );
        drawPolicyText(ctx, api, 'Keep exactly 2 ranked candidates', 1040, 300, 28, C.yellow);
        drawProbabilityBars(ctx, api, colors, probabilities, POLICY_TOKENS, 150, 420, 800);
        target(() => {
          if (progress === 0)
            drawPolicyText(ctx, api, 'Retained distribution?', 1400, 590, 34, C.muted, 'center');
          else
            drawProbabilityBars(
              ctx,
              api,
              colors,
              kept.probabilities,
              POLICY_TOKENS,
              1040,
              420,
              800,
              1,
              kept.indices,
              (v) => v.toFixed(3),
              progress,
            );
        });
        drawPolicyText(ctx, api, 'Original mass', 535, 890, 29, C.muted, 'center');
        if (progress > 0)
          drawPolicyText(
            ctx,
            api,
            `Retained mass ${kept.mass.toFixed(3)} → divide each kept probability by that mass`,
            1390,
            890,
            24,
            C.green,
            'center',
          );
        drawCaption(
          ctx,
          api,
          'A fixed rank cutoff keeps the same count in a peaked or flat distribution.',
        );
      }
    }
    return;
  }
  return;
}
export default {
  id: 'filter-k',
  draw: drawFilterK,
  cues: ['filter-k-build-0', 'filter-k-build-1', 'filter-k-build-2'],
};
