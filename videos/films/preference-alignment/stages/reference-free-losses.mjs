import { prefBound, prefLoss } from '../arithmetic.mjs';
import {
  caption,
  cell,
  constructionEquation,
  constructionText,
  focusTarget,
  heading,
  table,
} from '../defaults.mjs';
export function drawReferenceFreeLosses(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = prefBound(state.beatP ?? 0);
  const construction = () => {
    if (currentBeat === 0) {
      heading(
        ctx,
        api,
        'ORPO: supervised imitation and odds-based comparison both update the policy',
      );
      const pa = 0.2,
        pb = 0.1,
        oddsA = pa / (1 - pa),
        oddsB = pb / (1 - pb);
      table(
        ctx,
        api,
        ['one-token toy', 'probability p', 'odds p/(1−p)'],
        [
          ['chosen A', pa.toFixed(2), oddsA.toFixed(6)],
          ['rejected B', pb.toFixed(2), oddsB.toFixed(6)],
        ],
        170,
        430,
        1570,
        150,
      );
      constructionText(
        ctx,
        api,
        'Remaining probability = 0.70 on other outcomes',
        170,
        820,
        30,
        themeColors.muted,
      );
      constructionEquation(
        ctx,
        api,
        String.raw`L=-\ln p(A)+\lambda\left[-\ln\sigma\!\left(\ln{\operatorname{odds}(A)\over\operatorname{odds}(B)}\right)\right]`,
        960,
        930,
        34,
        themeColors.cyan,
      );
      caption(
        ctx,
        api,
        'The odds ratio is 2.25 here; the ordinary probability ratio is 2. No reference model is used.',
      );
    } else if (currentBeat === 1) {
      heading(ctx, api, 'SimPO: average token log scores and an explicit target margin');
      table(
        ctx,
        api,
        ['authored scalar terms', 'chosen A', 'rejected B'],
        [
          ['mean token log p', '−0.10', '−0.15'],
          ['scaled reward, β=2', '−0.20', '−0.30'],
        ],
        170,
        430,
        1570,
        150,
      );
      const z = 2 * (-0.1 + 0.15) - 0.2;
      constructionEquation(
        ctx,
        api,
        String.raw`z=2(-0.10+0.15)-0.20=` + z.toFixed(2),
        960,
        820,
        44,
        themeColors.yellow,
      );
      constructionText(
        ctx,
        api,
        'γ = 0.20; loss = ' + prefLoss(z).toFixed(6),
        170,
        945,
        33,
        themeColors.cyan,
      );
      caption(
        ctx,
        api,
        'These supplied scalar values illustrate a different objective, not an equivalent token-averaged DPO implementation.',
      );
    } else {
      heading(ctx, api, 'Removing reference scoring leaves the trainable policy computation');
      cell(ctx, api, 'policy forward', 170, 450, 460, 110, themeColors.cyan, 34);
      cell(ctx, api, 'declared objective', 735, 450, 460, 110, themeColors.yellow, 32);
      cell(ctx, api, 'policy backward', 1300, 450, 450, 110, themeColors.green, 34);
      api.arrow(ctx, 645, 505, 715, 505, themeColors.cyan, 5);
      api.arrow(ctx, 1210, 505, 1280, 505, themeColors.green, 5);
      constructionText(
        ctx,
        api,
        'Reference model: absent by design',
        170,
        770,
        35,
        themeColors.muted,
      );
      constructionText(
        ctx,
        api,
        'Compare actual normalization, memory, correctness and concision.',
        170,
        935,
        33,
        themeColors.blue,
      );
      caption(
        ctx,
        api,
        'Reference-free storage savings do not establish a measured training-speed or quality advantage.',
      );
    }
    return;
  };
  focusTarget(ctx, api, 'reference-free-losses-construction', construction);
}
export default {
  id: 'reference-free-losses',
  draw: drawReferenceFreeLosses,
  cues: [
    'reference-free-losses-b0',
    'pa-orpo-odds',
    'reference-free-losses-b1',
    'pa-simpo-margin',
    'reference-free-losses-b2',
  ],
};
