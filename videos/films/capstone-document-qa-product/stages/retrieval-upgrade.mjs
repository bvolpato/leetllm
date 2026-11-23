import {
  cueProgress,
  detailParagraph,
  detailRectangle,
  detailTag,
  detailText,
} from '../defaults.mjs';
export function drawRetrievalUpgrade(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    resultComplete = (id) => cueProgress(ctx, api, id) === 1;
  const tick = (i, total, progress) => Math.max(0, Math.min(1, progress * total - i));
  api.focus.target('retrieval-upgrade-mechanism', () => {
    if (currentBeat === 0) {
      detailParagraph(
        ctx,
        api,
        ['Reviewed rewording: live-service credential / proves who they are'],
        280,
        themeColors.blue,
        31,
      );
      detailTag(ctx, api, 'Meaningful term intersection: 0', 960, 430, themeColors.pink, 1280);
      if (resultComplete('known-miss'))
        detailText(ctx, api, 'No lexical candidate at minimum 2', 960, 545, 35, themeColors.pink);
      if (cueProgress(ctx, api, 'retrieval-bm25')) {
        detailTag(ctx, api, 'BM25', 500, 700, themeColors.yellow, 650);
        detailText(ctx, api, 'frequency + rarity + length', 500, 795, 29, themeColors.yellow);
      }
      if (cueProgress(ctx, api, 'retrieval-dual')) {
        detailTag(ctx, api, 'Bi-encoder', 1430, 700, themeColors.cyan, 650);
        detailText(ctx, api, 'query vector · passage vector', 1430, 795, 29, themeColors.cyan);
      }
      if (resultComplete('retrieval-dual'))
        detailText(
          ctx,
          api,
          'If search recovers the passage, review it for the reworded question.',
          960,
          930,
          34,
          themeColors.muted,
        );
    } else if (currentBeat === 1) {
      detailText(
        ctx,
        api,
        'Authored rank fixture · ranks start at 1',
        960,
        280,
        32,
        themeColors.muted,
      );
      const lists = [
        ['Lexical', 'A', 'B'],
        ['Dense', 'B', 'A'],
      ];
      lists.forEach((list, i) => {
        detailTag(
          ctx,
          api,
          list[0],
          490 + i * 940,
          390,
          [themeColors.yellow, themeColors.cyan][i],
          650,
        );
        for (let j = 1; j < 3; j++) {
          detailTag(
            ctx,
            api,
            j + ' · ' + list[j],
            490 + i * 940,
            480 + j * 110,
            [themeColors.yellow, themeColors.cyan][i],
            430,
          );
        }
      });
      if (cueProgress(ctx, api, 'rrf-add')) {
        api.math(
          ctx,
          resultComplete('rrf-k')
            ? String.raw`k=60\qquad\operatorname{RRF}(A)=\frac{1}{61}+\frac{1}{62}`
            : String.raw`\operatorname{RRF}(A)=\frac{1}{k+1}+\frac{1}{k+2}`,
          960,
          800,
          41,
          themeColors.blue,
          'center',
        );
      }
      if (resultComplete('rrf-param'))
        detailText(
          ctx,
          api,
          'A and B tie at approximately ' + (1 / 61 + 1 / 62).toFixed(6),
          960,
          900,
          33,
          themeColors.green,
        );
      if (resultComplete('rrf-rule'))
        detailText(
          ctx,
          api,
          'C is absent from both lists → contribution 0',
          960,
          970,
          29,
          themeColors.pink,
        );
    } else {
      detailText(
        ctx,
        api,
        'Cross-encoder: query and passage tokens interact',
        960,
        280,
        35,
        themeColors.blue,
      );
      const q = ['restore', 'access'],
        p = ['identity', 'manager', 'approval'];
      q.forEach((v, i) => detailText(ctx, api, v, 520, 475 + i * 160, 30, themeColors.blue));
      p.forEach((v, i) => detailText(ctx, api, v, 845 + i * 340, 365, 29, themeColors.cyan));
      for (let i = 0; i < 2; i++)
        for (let j = 0; j < 3; j++) {
          const progress = tick(i * 3 + j, 6, cueProgress(ctx, api, 'cross-token'));
          detailRectangle(
            ctx,
            api,
            700 + j * 340,
            420 + i * 160,
            290,
            110,
            themeColors.panel,
            progress > 0 ? themeColors.cyan : themeColors.muted,
          );
          if (progress > 0)
            detailRectangle(
              ctx,
              api,
              710 + j * 340,
              495 + i * 160,
              270 * progress,
              20,
              themeColors.cyan,
            );
        }
      const movingPassage = cueProgress(ctx, api, 'position-move');
      if (movingPassage > 0) {
        detailText(ctx, api, 'Position in the context', 960, 765, 31, themeColors.muted);
        const x = 450;
        const width = 340;
        for (let i = 0; i < 3; i++)
          detailRectangle(ctx, api, x + width * i, 808, width - 6, 75, themeColors.panel);
        const tileX = x + width * movingPassage;
        detailRectangle(ctx, api, tileX, 808, width - 6, 75, themeColors.blue);
        detailText(ctx, api, 'Policy passage', tileX + (width - 6) / 2, 856, 32, themeColors.bg);
      } else if (resultComplete('cross-token'))
        detailText(
          ctx,
          api,
          'One joint scoring pass for each candidate',
          960,
          820,
          33,
          themeColors.yellow,
        );
      if (cueProgress(ctx, api, 'position-experiment'))
        detailText(
          ctx,
          api,
          'With the same questions, compare answer quality and latency.',
          960,
          963,
          29,
          themeColors.muted,
        );
    }
  });
  return;
}
export default {
  id: 'retrieval-upgrade',
  draw: drawRetrievalUpgrade,
  cues: [
    'known-miss',
    'retrieval-bm25',
    'retrieval-dual',
    'rrf-rule',
    'rrf-add',
    'rrf-k',
    'rrf-param',
    'rerank-scope',
    'cross-token',
    'position-move',
    'position-experiment',
  ],
};
