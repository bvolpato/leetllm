import { linearInterpolate } from '../arithmetic.mjs';
import { chip, dot, footer, text } from '../defaults.mjs';
export function drawCatalogAndTrust(ctx, scene, state, api) {
  return api.focus.target('catalog-and-trust-mechanism', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0;
    const cueProgress = (key) => api.focus.progress(`t-catalog-and-trust-${key}`, 0),
      cueVisible = (key) => api.focus.visible(`t-catalog-and-trust-${key}`);
    const cueComplete = (key) => api.focus.cue(`t-catalog-and-trust-${key}`)?.phase === 'after';
    {
      const catalogLabel = cueComplete('review')
        ? 'Catalog reviewed for search'
        : cueVisible('changed') || currentBeat > 0
          ? 'Refreshed catalog awaiting review'
          : 'Last reviewed catalog';
      text(ctx, api, catalogLabel, 960, 270, 34, themeColors.blue);
      chip(ctx, api, 'get_release_status', 620, 330, 680, themeColors.cyan, 75, 31);
      if (cueProgress('changed') > 0 || currentBeat > 0)
        chip(
          ctx,
          api,
          'new: promote_model',
          620,
          435,
          680,
          cueComplete('review') ? themeColors.cyan : themeColors.yellow,
          75,
          31,
        );
      text(ctx, api, 'search caller · private view', 480, 625, 31, themeColors.blue);
      text(ctx, api, 'ads caller · private view', 1430, 625, 31, themeColors.pink);
      chip(ctx, api, 'get_release_status', 150, 680, 650, themeColors.cyan, 70, 29);
      chip(ctx, api, 'get_release_status', 1110, 680, 650, themeColors.cyan, 70, 29);
      if (cueProgress('review') > 0) {
        const q = cueProgress('review');
        const x =
            q < 0.3
              ? linearInterpolate(600, 80, q / 0.3)
              : q < 0.85
                ? 80
                : linearInterpolate(80, 140, (q - 0.85) / 0.15),
          y = q < 0.3 ? 472 : q < 0.85 ? linearInterpolate(472, 820, (q - 0.3) / 0.55) : 820;
        dot(ctx, api, x, y, themeColors.blue, 7);
      }
      if (cueComplete('review'))
        chip(ctx, api, 'promote_model', 150, 785, 650, themeColors.blue, 70, 29);
      if (cueComplete('scope'))
        chip(
          ctx,
          api,
          'promotion absent from this scope',
          1110,
          785,
          650,
          themeColors.muted,
          70,
          27,
        );
      footer(
        ctx,
        api,
        cueVisible('execute')
          ? 'Reauthorize the verified caller and target at execution; refreshed visibility grants no new authority.'
          : 'Does a catalog notification itself grant permission to execute the new tool?',
      );
    }
  });
}
export default {
  id: 'catalog-and-trust',
  draw: drawCatalogAndTrust,
  cues: [
    'catalog-and-trust-beat-1-focus-1',
    't-catalog-and-trust-changed',
    'catalog-and-trust-beat-2-focus-1',
    'catalog-and-trust-beat-2-focus-2',
    't-catalog-and-trust-review',
    't-catalog-and-trust-scope',
    'catalog-and-trust-beat-3-focus-1',
    'catalog-and-trust-beat-3-focus-2',
    't-catalog-and-trust-execute',
  ],
};
