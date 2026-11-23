import { governingRecall } from '../arithmetic.mjs';
import { prEvent } from '../construction.mjs';
import { card, centeredText, extensionFooter, extensionText } from '../defaults.mjs';
export function drawRecallContracts(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    ev = (name, beat) => prEvent(state, name, beat),
    done = (name, beat) => ev(name, beat) === 1;
  api.focus.target('recall-contracts-mechanism', () => {
    const exact = Array.from(
        {
          length: 10,
        },
        (_, i) => 'P' + (i + 1),
      ),
      approx = [...exact.slice(0, 8), 'P11', 'P12'],
      result = governingRecall(exact, approx, ['P9']);
    centeredText(ctx, api, 'Governing passage = P9', 960, 285, 35, themeColors.yellow);
    extensionText(ctx, api, 'Exact top 10', 140, 390, 31, themeColors.blue);
    extensionText(ctx, api, 'Approximate top 10', 140, 650, 31, themeColors.cyan);
    [exact, approx].forEach((rows, r) =>
      rows.forEach((id, i) =>
        card(
          ctx,
          api,
          id,
          130 + i * 170,
          430 + r * 260,
          140,
          100,
          id === 'P9'
            ? themeColors.yellow
            : exact.includes(id)
              ? themeColors.cyan
              : themeColors.pink,
          29,
        ),
      ),
    );
    if (currentBeat > 0 && done('eight', 1))
      centeredText(ctx, api, 'ANN overlap 8 / 10 = ' + result.ann, 600, 920, 35, themeColors.cyan);
    if (currentBeat > 0 && done('missing', 1))
      centeredText(ctx, api, 'Required P9: 0 / 1 → task recall 0', 1410, 920, 33, themeColors.pink);
    if (currentBeat === 2)
      centeredText(
        ctx,
        api,
        'Retrieval → packing → claim support need distinct checks',
        960,
        340,
        30,
        themeColors.yellow,
      );
    extensionFooter(
      ctx,
      api,
      'Keep eligible corpus, exact metric and normalization fixed; nearest neighbors are not task judgments',
    );
  });
}
export default {
  id: 'recall-contracts',
  draw: drawRecallContracts,
  cues: ['pr-ann', 'pr-task', 'pr-eight', 'pr-missing', 'pr-context', 'pr-faithful'],
};
