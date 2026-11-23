import { extendedEmbeddingState } from '../construction.mjs';
import { axes, centeredText, footer, vectorArrow } from '../defaults.mjs';
export function drawFreshRepresentation(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const fmt = (v) => (Math.abs(v) < 1e-10 ? '0' : Number(v.toFixed(3)).toString()),
    vec = (v) => '[' + v.map(fmt).join(', ') + ']';
  api.focus.target('fresh-representation-mechanism', () => {
    const f = extendedEmbeddingState('fresh-representation', state),
      fresh = true,
      labels = ['river', 'finance'],
      a = axes(ctx, api, 170, 370, 850, 540, [-1.3, 1.3], [-1.3, 1.3], [-1, 0, 1]);
    centeredText(ctx, api, 'New authored half-turn migration', 960, 285, 33, themeColors.yellow);
    vectorArrow(ctx, api, a, f.query, themeColors.yellow);
    f.docs.forEach((v, i) => vectorArrow(ctx, api, a, v, [themeColors.cyan, themeColors.green][i]));
    const visible = f.scoresVisible;
    ['query', ...labels].forEach((name, i) => {
      const value = i ? f.docs[i - 1] : f.query;
      centeredText(
        ctx,
        api,
        name + ' ' + vec(value),
        1440,
        400 + i * 145,
        32,
        [themeColors.yellow, themeColors.cyan, themeColors.green][i],
      );
    });
    if (visible)
      f.scores.forEach((v, i) =>
        centeredText(
          ctx,
          api,
          labels[i] + ' dot ' + fmt(v),
          1320 + i * 270,
          865,
          31,
          [themeColors.cyan, themeColors.green][i],
        ),
      );
    if (f.wrong)
      centeredText(ctx, api, 'Mixed-space winner: river', 1440, 955, 35, themeColors.pink);
    else if (f.repaired)
      centeredText(ctx, api, 'Aligned winner: finance', 1440, 955, 35, themeColors.green);
    else
      centeredText(
        ctx,
        api,
        visible ? 'Compare the displayed scores' : 'Predict before revealing scores',
        1440,
        955,
        28,
        themeColors.muted,
      );
    footer(ctx, api, 'No model or search service is measured by this authored rotation');
  });
}
export default {
  id: 'fresh-representation',
  draw: drawFreshRepresentation,
  cues: [
    'emb-fresh-docs',
    'emb-fresh-predict',
    'emb-fresh-scores',
    'emb-fresh-wrong',
    'emb-fresh-query',
    'emb-fresh-repaired',
    'emb-fresh-contract',
  ],
};
