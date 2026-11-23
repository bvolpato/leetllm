import {
  chapterBox,
  chapterCueComplete,
  chapterCueVisible,
  chapterFooter,
  chapterText,
} from '../defaults.mjs';
export function drawReleaseExperiment(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  {
    if (currentBeat === 0) {
      const fields = [
        'encoder / corpus / query versions',
        'mean / basis / seed',
        'metric / codec / search settings',
        'recall / slices / bytes / build / latency',
      ];
      fields.forEach((v, i) =>
        chapterBox(
          ctx,
          api,
          v,
          260,
          330 + i * 150,
          1400,
          105,
          [themeColors.blue, themeColors.cyan, themeColors.yellow, themeColors.green][i],
        ),
      );
      if (chapterCueVisible(ctx, api, 'release-invalid'))
        chapterText(
          ctx,
          api,
          'Reject missing / nonfinite / invalid-domain evidence first',
          960,
          980,
          30,
          themeColors.pink,
        );
    } else if (currentBeat === 1) {
      chapterText(
        ctx,
        api,
        'Supplied table: Recall@10 ≥ .975 · bytes ≤ 1,200',
        960,
        285,
        35,
        themeColors.ink,
      );
      const rows = [
        ['full', 6144, 1],
        ['native', 1024, 0.984],
        ['PCA', 1024, 0.971],
        ['PQ', 16, 0.939],
      ];
      rows.forEach(([name, bytes, recall], i) => {
        const y = 390 + i * 130,
          pass = bytes <= 1200 && recall >= 0.975;
        chapterBox(ctx, api, name, 210, y, 340, 90, themeColors.blue);
        chapterText(ctx, api, bytes + ' B', 820, y + 55, 34, themeColors.cyan);
        chapterText(ctx, api, recall.toFixed(3), 1210, y + 55, 34, themeColors.cyan);
        if (chapterCueComplete(ctx, api, 'release-pick'))
          chapterText(
            ctx,
            api,
            pass ? 'PASS' : 'FAIL',
            1580,
            y + 55,
            34,
            pass ? themeColors.green : themeColors.pink,
          );
      });
    } else {
      chapterText(
        ctx,
        api,
        'Compose only supported, tested transformations',
        960,
        285,
        35,
        themeColors.ink,
      );
      chapterBox(ctx, api, '1,536 × 4 B\n6,144 raw bytes', 190, 420, 450, 170, themeColors.blue);
      chapterBox(ctx, api, '256 × 4 B\n1,024 raw bytes', 735, 420, 450, 170, themeColors.cyan);
      chapterBox(
        ctx,
        api,
        '256 × 1 B\n256 raw code bytes',
        1280,
        420,
        450,
        170,
        themeColors.yellow,
      );
      if (chapterCueComplete(ctx, api, 'release-24'))
        chapterText(
          ctx,
          api,
          '6,144 / 256 = 24× raw coordinate/code saving',
          960,
          775,
          38,
          themeColors.green,
        );
      if (chapterCueVisible(ctx, api, 'release-full-store'))
        chapterText(
          ctx,
          api,
          'Full-vector rescore store + graph + IO remain additional',
          960,
          925,
          33,
          themeColors.pink,
        );
    }
    chapterFooter(
      ctx,
      api,
      'Authored release worksheet, not a provider benchmark or total-latency promise',
    );
  }
  return;
}
export default {
  id: 'release-experiment',
  draw: drawReleaseExperiment,
  cues: [
    'release-bind',
    'release-invalid',
    'release-premises',
    'release-table',
    'release-pick',
    'release-24',
    'release-full-store',
  ],
};
