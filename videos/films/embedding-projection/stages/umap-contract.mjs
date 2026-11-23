import {
  chapterBox,
  chapterCueVisible,
  chapterEquation,
  chapterFooter,
  chapterText,
} from '../defaults.mjs';
export function drawUmapContract(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0;
  {
    if (currentBeat === 0) {
      const ds = [1, 2, 3],
        rho = 1,
        sigma = 1;
      chapterText(ctx, api, 'Authored local row · ρ = 1 · σ = 1', 960, 285, 35, themeColors.ink);
      ds.forEach((d, i) => {
        const x = 420 + i * 550,
          w = Math.exp(-Math.max(0, d - rho) / sigma);
        chapterBox(ctx, api, 'distance ' + d, x - 200, 410, 400, 100, themeColors.blue);
        if (chapterCueVisible(ctx, api, 'umap-local'))
          chapterBox(
            ctx,
            api,
            'membership ' + w.toFixed(3),
            x - 200,
            610,
            400,
            100,
            themeColors.cyan,
          );
      });
      if (chapterCueVisible(ctx, api, 'umap-memberships'))
        chapterText(
          ctx,
          api,
          '1 + 0.368 + 0.135 > 1 · memberships are not a normalized row',
          960,
          855,
          33,
          themeColors.yellow,
        );
      if (chapterCueVisible(ctx, api, 'umap-combine'))
        chapterEquation(ctx, api, String.raw`w_{ij}=p+q-pq`, 960, 950, 44, themeColors.green);
    } else {
      chapterText(
        ctx,
        api,
        'Map memberships and graph evidence have different roles',
        960,
        285,
        35,
        themeColors.ink,
      );
      const plot = teaching.axes({
        x: 180,
        y: 380,
        width: 780,
        height: 450,
        xDomain: [0, 3],
        yDomain: [0, 1],
        xTicks: [0, 1, 2, 3],
        yTicks: [0, 1],
        fontSize: 24,
      });
      teaching.curve({
        plot,
        points: Array.from(
          {
            length: 61,
          },
          (_, i) => ({
            x: i / 20,
            y: 1 / (1 + (i / 20) ** 2),
          }),
        ),
        color: themeColors.cyan,
        width: 4,
      });
      chapterEquation(ctx, api, String.raw`q(d)=1/(1+a d^{2b})`, 1320, 430, 41, themeColors.cyan);
      if (chapterCueVisible(ctx, api, 'umap-ce'))
        chapterBox(
          ctx,
          api,
          'Edges attract\nnonedges repel',
          1080,
          590,
          650,
          140,
          themeColors.yellow,
        );
      if (chapterCueVisible(ctx, api, 'umap-sampling'))
        chapterBox(
          ctx,
          api,
          'Negative sampling changes\neffective weighting',
          1080,
          790,
          650,
          140,
          themeColors.pink,
        );
    }
    chapterFooter(
      ctx,
      api,
      'Neighbor count and minimum distance differ · fitted transform is not a PCA multiplication',
    );
  }
  return;
}
export default {
  id: 'umap-contract',
  draw: drawUmapContract,
  cues: [
    'umap-local',
    'umap-memberships',
    'umap-combine',
    'umap-map-rule',
    'umap-ce',
    'umap-sampling',
    'umap-transform',
  ],
};
