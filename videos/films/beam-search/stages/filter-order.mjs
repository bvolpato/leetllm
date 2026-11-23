import { retainedPolicy, stablePolicy } from '../arithmetic.mjs';
import { policyCueProgress } from '../construction.mjs';
import { drawCaption, drawPolicyCard, drawPolicyText } from '../defaults.mjs';
export function drawFilterOrder(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0;
  const progress = policyCueProgress('filter-order', state),
    currentBeat = Math.min(beat, scene.beats.length - 1);
  const target = (paint) =>
    api.focus ? api.focus.target(`${'filter-order'}-state-${currentBeat}`, paint) : paint();
  const colors = [themeColors.blue, themeColors.pink, themeColors.cyan, themeColors.yellow];
  const policy = stablePolicy();
  {
    const { C, teaching, components } = api;
    const id = 'filter-order',
      beat = state.beat ?? 0;
    {
      const base = [0.6, 0.25, 0.15],
        firstK = retainedPolicy(base, 'k', 2),
        thenP = retainedPolicy(firstK.probabilities, 'p', 0.7);
      const firstP = retainedPolicy(base, 'p', 0.7),
        thenK = retainedPolicy(firstP.probabilities, 'k', 2);
      drawPolicyText(ctx, api, 'One input A=.60, B=.25, C=.15', 960, 300, 34, C.ink, 'center');
      [0, 1].forEach((row) => {
        const y = 430 + row * 245,
          middle = row === 0 ? firstK : firstP,
          final = row === 0 ? thenP : thenK;
        drawPolicyText(
          ctx,
          api,
          row === 0 ? 'k=2 → normalize → p=.70' : 'p=.70 → normalize → k=2',
          180,
          y + 38,
          30,
          colors[row],
        );
        drawPolicyCard(
          ctx,
          api,
          'filter-order',
          `A ${middle.probabilities[0].toFixed(3)}\nB ${middle.probabilities[1].toFixed(3)}`,
          780,
          y - 10,
          350,
          130,
          colors[row],
          30,
        );
        const known = beat > 1 || progress === 1;
        target(() => {
          api.arrow(ctx, 1170, y + 55, 1330, y + 55, C.yellow);
          drawPolicyCard(
            ctx,
            api,
            'filter-order',
            known ? final.indices.map((i) => ['A', 'B', 'C'][i]).join(' + ') : '?',
            1390,
            y + 7,
            300,
            90,
            known ? C.green : C.muted,
            39,
          );
        });
      });
      drawCaption(
        ctx,
        api,
        'Intermediate normalization changes the next operator’s input. Record the actual processor order.',
      );
    }
    return;
  }
  return;
}
export default {
  id: 'filter-order',
  draw: drawFilterOrder,
  cues: ['filter-order-build-0', 'filter-order-build-1', 'filter-order-build-2'],
};
