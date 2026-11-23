import {
  chapterBox,
  chapterCueVisible,
  chapterEquation,
  chapterFooter,
  chapterLine,
  chapterRectangle,
  chapterText,
} from '../defaults.mjs';
export function drawGeometryBudget(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  {
    if (currentBeat === 0) {
      chapterText(
        ctx,
        api,
        'Independent isotropic Gaussian worksheet',
        960,
        285,
        35,
        themeColors.ink,
      );
      for (let i = 0; i < 16; i++) {
        const x = 300 + i * 86;
        chapterRectangle(ctx, api, x, 400, 55, 100, themeColors.panel, themeColors.blue);
        chapterText(ctx, api, 'x', x + 27, 465, 28, themeColors.blue);
      }
      if (chapterCueVisible(ctx, api, 'gaussian-mean'))
        chapterEquation(
          ctx,
          api,
          String.raw`\mathbb E[D]=2d\sigma^2`,
          600,
          650,
          49,
          themeColors.cyan,
        );
      if (chapterCueVisible(ctx, api, 'gaussian-var'))
        chapterEquation(
          ctx,
          api,
          String.raw`\mathrm{Var}(D)=8d\sigma^4`,
          1320,
          650,
          49,
          themeColors.yellow,
        );
      if (chapterCueVisible(ctx, api, 'gaussian-ratio')) {
        chapterEquation(
          ctx,
          api,
          String.raw`\mathrm{SD}(D)/\mathbb E[D]=\sqrt{2/d}`,
          960,
          840,
          52,
          themeColors.green,
        );
        chapterText(
          ctx,
          api,
          'Relative spread narrows only under these assumptions',
          960,
          940,
          32,
          themeColors.muted,
        );
      }
    } else {
      const parts = [
        ['coordinate array', 'dimension × dtype × count', themeColors.cyan],
        ['graph links / levels', 'HNSW connections and search work', themeColors.blue],
        ['IDs / metadata', 'filters, object identities, bookkeeping', themeColors.yellow],
        ['replicas / allocator', 'complete measured working set', themeColors.muted],
      ];
      parts.forEach(([name, value, c], i) => {
        chapterBox(ctx, api, name, 190, 320 + i * 150, 620, 100, c);
        chapterBox(ctx, api, value, 1010, 320 + i * 150, 720, 100, c);
        chapterLine(ctx, api, 825, 370 + i * 150, 995, 370 + i * 150, themeColors.line);
      });
    }
    chapterFooter(
      ctx,
      api,
      'Dimension alone does not determine semantic recall, total RAM or request latency',
    );
  }
  return;
}
export default {
  id: 'geometry-budget',
  draw: drawGeometryBudget,
  cues: ['gaussian-mean', 'gaussian-var', 'gaussian-ratio', 'index-overhead', 'index-settings'],
};
