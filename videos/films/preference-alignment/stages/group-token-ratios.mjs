import { prefBound } from '../arithmetic.mjs';
import {
  caption,
  cell,
  constructionEquation,
  constructionText,
  focusTarget,
  heading,
  table,
} from '../defaults.mjs';
export function drawGroupTokenRatios(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = prefBound(state.beatP ?? 0);
  const cueProgress = (id, beat = currentBeat) => {
    const cue = state.cues?.[id];
    if (state.cues && !Object.hasOwn(state.cues, id))
      throw Error('Undeclared cue group-token-ratios/' + id);
    return cue
      ? cue.phase === 'before'
        ? 0
        : cue.phase === 'after'
          ? 1
          : prefBound(cue.progress)
      : currentBeat < beat
        ? 0
        : currentBeat > beat
          ? 1
          : prefBound((progress - 0.12) / 0.76);
  };
  const resultComplete = (id, beat = currentBeat) => cueProgress(id, beat) >= 1 - 1e-8;
  const construction = () => {
    if (currentBeat < 2) {
      const sequence = currentBeat === 1 && resultComplete('pa-group-sequence', 1);
      heading(ctx, api, 'Same two generated-token ratios · A = 1 · ε = 0.2');
      cell(ctx, api, 'ρ0 = 1.10', 220, 440, 550, 110, themeColors.cyan, 39);
      cell(ctx, api, 'ρ1 = 1.10', 1150, 440, 550, 110, themeColors.cyan, 39);
      if (!sequence) {
        constructionEquation(
          ctx,
          api,
          String.raw`{\min(1.10,1.20)+\min(1.10,1.20)\over2}=1.10`,
          960,
          760,
          44,
          themeColors.green,
        );
      } else {
        api.arrow(ctx, 780, 495, 1130, 495, themeColors.yellow, 5);
        constructionEquation(
          ctx,
          api,
          String.raw`\rho_{\rm seq}=1.10\times1.10=1.21`,
          960,
          700,
          45,
          themeColors.yellow,
        );
        constructionEquation(
          ctx,
          api,
          String.raw`\min(1.21,1.20)=1.20\ne1.10`,
          960,
          875,
          44,
          themeColors.pink,
        );
      }
      caption(
        ctx,
        api,
        'Tokenwise averaging and one product-ratio clip are distinct surrogates on identical sampled tokens.',
      );
    } else if (currentBeat === 2) {
      const p = [0.8, 0.2],
        q = [0.5, 0.5],
        rows = p.map((v, i) => {
          const ell = Math.log(q[i] / v),
            k = Math.exp(ell) - ell - 1;
          return [i, ell.toFixed(6), k.toFixed(6), v.toFixed(1)];
        });
      heading(ctx, api, 'Declared two-token example · π = [.8,.2], reference = [.5,.5]');
      table(
        ctx,
        api,
        ['token', 'ell = ln(ref/current)', 'exp(ell)−ell−1', 'current weight'],
        rows,
        170,
        450,
        1580,
        150,
      );
      constructionText(
        ctx,
        api,
        'Weighted expectation = ' +
          p
            .reduce((s, v, i) => {
              const ell = Math.log(q[i] / v);
              return s + v * (Math.exp(ell) - ell - 1);
            }, 0)
            .toFixed(6),
        170,
        870,
        37,
        themeColors.yellow,
      );
      constructionText(
        ctx,
        api,
        'One sample and reused old-policy weights need their own interpretation.',
        170,
        955,
        28,
        themeColors.muted,
      );
      caption(
        ctx,
        api,
        'The regularizer stays outside reward centering and depends on its declared sampling convention.',
      );
    } else {
      heading(ctx, api, 'Inspected trainer edition · choices are part of the experiment');
      table(
        ctx,
        api,
        ['setting', 'shown edition', 'interpretation'],
        [
          ['normalization / ratios', 'selectable', 'objective can change'],
          ['reward scaling', 'group, batch or none', 'weighting changes'],
          ['β = 0', 'reference disabled', 'no loaded reference for KL'],
        ],
        170,
        440,
        1580,
        145,
      );
      caption(ctx, api, 'Record the ratio, the reward scaling and β when comparing runs.');
    }
    return;
  };
  focusTarget(ctx, api, 'group-token-ratios-construction', construction);
}
export default {
  id: 'group-token-ratios',
  draw: drawGroupTokenRatios,
  cues: [
    'group-token-ratios-b0',
    'pa-group-token',
    'group-token-ratios-b1',
    'pa-group-sequence',
    'group-token-ratios-b2',
    'pa-group-kl',
    'group-token-ratios-b3',
  ],
};
