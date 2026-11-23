import { chapterBox, chapterCueVisible, chapterFooter, chapterText } from '../defaults.mjs';
export function drawPcaQuery(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0;
  {
    if (currentBeat === 0) {
      chapterBox(
        ctx,
        api,
        'One versioned PCA artifact\nmean [2, 2] · axis [1, 1]/√2',
        590,
        300,
        740,
        140,
        themeColors.yellow,
      );
      chapterBox(ctx, api, 'Indexed document [3, 3]', 190, 540, 650, 110, themeColors.blue);
      chapterBox(ctx, api, 'Incoming query [4, 4]', 1080, 540, 650, 110, themeColors.cyan);
      if (chapterCueVisible(ctx, api, 'shared-transform')) {
        chapterBox(ctx, api, 'Centered [1, 1]\nscore +√2', 190, 740, 650, 140, themeColors.blue);
        chapterBox(ctx, api, 'Centered [2, 2]\nscore +2√2', 1080, 740, 650, 140, themeColors.cyan);
      }
      if (chapterCueVisible(ctx, api, 'query-sign'))
        chapterText(
          ctx,
          api,
          'A query-only sign flip makes these coordinates incomparable',
          960,
          965,
          32,
          themeColors.pink,
        );
    } else {
      const origin = teaching.axes({
          x: 210,
          y: 370,
          width: 630,
          height: 450,
          xDomain: [-1.5, 1.5],
          yDomain: [-1.5, 1.5],
          equalUnits: true,
          xTicks: [-1, 0, 1],
          yTicks: [-1, 0, 1],
          fontSize: 24,
        }),
        a = origin.point(1, 0),
        z = origin.point(0, 1),
        center = origin.point(0, 0);
      api.arrow(ctx, center.x, center.y, a.x, a.y, themeColors.blue, 4);
      api.arrow(ctx, center.x, center.y, z.x, z.y, themeColors.cyan, 4);
      if (chapterCueVisible(ctx, api, 'centering-cosine'))
        chapterBox(
          ctx,
          api,
          'Centering changes the origin\nAll PCs can still change cosine',
          1030,
          355,
          720,
          135,
          themeColors.yellow,
        );
      if (chapterCueVisible(ctx, api, 'renormalize'))
        chapterBox(
          ctx,
          api,
          'Renormalize projected vectors\ncosine uses their directions',
          1030,
          555,
          720,
          135,
          themeColors.green,
        );
      if (chapterCueVisible(ctx, api, 'reject-zero'))
        chapterBox(
          ctx,
          api,
          'Reject zero / nonfinite vectors',
          1030,
          755,
          720,
          100,
          themeColors.pink,
        );
      if (chapterCueVisible(ctx, api, 'safe-norm'))
        chapterText(
          ctx,
          api,
          'Scale by max |coordinate| before the norm',
          960,
          950,
          33,
          themeColors.cyan,
        );
    }
    chapterFooter(ctx, api, 'One saved coordinate system must govern both document and query');
  }
  return;
}
export default {
  id: 'pca-query',
  draw: drawPcaQuery,
  cues: [
    'saved-artifact',
    'shared-transform',
    'query-sign',
    'centering-cosine',
    'renormalize',
    'reject-zero',
    'safe-norm',
  ],
};
