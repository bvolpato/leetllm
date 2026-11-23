import { mapPairFixture, pairDistanceFor } from '../arithmetic.mjs';
import {
  chapterBox,
  chapterCueVisible,
  chapterEquation,
  chapterFooter,
  chapterMatrix,
  chapterText,
} from '../defaults.mjs';
export function drawTsneContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  {
    const distance = chapterCueVisible(ctx, api, 'tsne-coupled')
        ? pairDistanceFor(0.1)
        : pairDistanceFor(0.01),
      q = mapPairFixture(distance);
    chapterText(
      ctx,
      api,
      currentBeat === 0
        ? 'Build source conditionals, then symmetric pair mass'
        : 'One map move changes the full normalizer',
      960,
      285,
      35,
      themeColors.ink,
    );
    if (currentBeat === 0) {
      chapterBox(
        ctx,
        api,
        'Gaussian distance weights\nlocal bandwidth σᵢ',
        200,
        390,
        680,
        140,
        themeColors.blue,
      );
      chapterBox(ctx, api, 'Normalize row → p(j | i)', 1030, 390, 680, 140, themeColors.cyan);
      if (chapterCueVisible(ctx, api, 'tsne-perplexity'))
        chapterEquation(
          ctx,
          api,
          String.raw`\mathrm{perplexity}=\exp(H)`,
          960,
          665,
          45,
          themeColors.yellow,
        );
      if (chapterCueVisible(ctx, api, 'tsne-symmetry'))
        chapterEquation(
          ctx,
          api,
          String.raw`p_{ij}=(p_{j|i}+p_{i|j})/(2N)`,
          960,
          805,
          45,
          themeColors.cyan,
        );
      if (chapterCueVisible(ctx, api, 'tsne-q-normalize'))
        chapterText(
          ctx,
          api,
          'Self-pairs are zero · map mass sums over ordered nonself pairs',
          960,
          935,
          31,
          themeColors.green,
        );
    } else {
      chapterMatrix(
        ctx,
        api,
        q.q.map((r) => r.map((x) => x.toFixed(3))),
        240,
        360,
        150,
        105,
        themeColors.cyan,
      );
      chapterBox(
        ctx,
        api,
        '12 nonself weights\nZ = ' + q.denominator.toFixed(4),
        1100,
        390,
        650,
        140,
        themeColors.yellow,
      );
      chapterBox(
        ctx,
        api,
        'i→j mass = ' + q.q[0][1].toFixed(3),
        1100,
        620,
        650,
        110,
        themeColors.pink,
      );
      if (chapterCueVisible(ctx, api, 'tsne-kl'))
        chapterEquation(
          ctx,
          api,
          String.raw`\sum_{ij}p_{ij}\log(p_{ij}/q_{ij})\ge0`,
          960,
          920,
          43,
          themeColors.green,
        );
    }
    chapterFooter(
      ctx,
      api,
      'Heavy-tail inspection layout · original nonparametric t-SNE has no future-query encoder',
    );
  }
  return;
}
export default {
  id: 'tsne-contract',
  draw: drawTsneContract,
  cues: [
    'tsne-gaussian',
    'tsne-perplexity',
    'tsne-symmetry',
    'tsne-q-normalize',
    'tsne-coupled',
    'tsne-kl',
    'tsne-future',
  ],
};
