import { extendedEmbeddingState } from '../construction.mjs';
import { axes, centeredText, footer, vectorArrow } from '../defaults.mjs';
export function drawSpaceContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const fmt = (v) => (Math.abs(v) < 1e-10 ? '0' : Number(v.toFixed(3)).toString()),
    vec = (v) => '[' + v.map(fmt).join(', ') + ']';
  api.focus.target('space-contract-mechanism', () => {
    const f = extendedEmbeddingState('space-contract', state),
      fresh = false,
      labels = ['invoice', 'phone'],
      a = axes(ctx, api, 170, 370, 850, 540, [-1.3, 1.3], [-1.3, 1.3], [-1, 0, 1]);
    centeredText(
      ctx,
      api,
      'Same supplied rotation · retain query and document owners',
      960,
      285,
      33,
      themeColors.yellow,
    );
    vectorArrow(ctx, api, a, f.query, themeColors.yellow);
    f.docs.forEach((v, i) => vectorArrow(ctx, api, a, v, [themeColors.cyan, themeColors.green][i]));
    const visible = currentBeat > 0;
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
      centeredText(ctx, api, 'Mixed-space winner: phone', 1440, 955, 35, themeColors.pink);
    else if (f.repaired)
      centeredText(ctx, api, 'Aligned winner: invoice', 1440, 955, 35, themeColors.green);
    else
      centeredText(
        ctx,
        api,
        'Same dimensions · basis and roles must agree',
        1440,
        955,
        28,
        themeColors.muted,
      );
    footer(
      ctx,
      api,
      'Pin the compatible model revisions, preprocessing, pooling, role formatting and metric',
    );
  });
}
export default {
  id: 'space-contract',
  draw: drawSpaceContract,
  cues: [
    'emb-rotate-together',
    'emb-rotate-docs',
    'emb-rotate-wrong',
    'emb-rotate-repair',
    'emb-rotate-contract',
  ],
};
