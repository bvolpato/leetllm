import { graphSearch } from '../model.mjs';
import { geometryText, heading, line } from '../defaults.mjs';
export function drawIndexMemory(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    cueProgress = (a = 0.12, z = 0.85) => api.phase(progress, a, z);
  {
    const q = cueProgress();
    if (currentBeat === 0) {
      heading(ctx, api, 'Analytic expected population out of 1024 · M 32');
      const counts = [1024, 32, 1];
      counts.forEach((count, j) => {
        const y = 360 + j * 220;
        geometryText(ctx, api, 'Layer≥' + j, 200, y + 50, 31, themeColors.muted);
        const visible = Math.floor(q * count);
        for (let i = 0; i < visible; i++) {
          const x = 510 + (i % 64) * 19,
            yy = y + Math.floor(i / 64) * 8;
          api.rect(ctx, x, yy, 9, 5, [themeColors.blue, themeColors.cyan, themeColors.yellow][j]);
        }
        geometryText(
          ctx,
          api,
          count + ' expected',
          1600,
          y + 150,
          32,
          [themeColors.blue, themeColors.cyan, themeColors.yellow][j],
          'center',
        );
      });
      geometryText(
        ctx,
        api,
        'P(L≥ℓ)=32^−ℓ · scale 1/ln32≈0.289 is not the layer-one probability',
        960,
        1040,
        29,
        themeColors.yellow,
        'center',
      );
    }
    if (currentBeat === 1) {
      heading(ctx, api, 'Keep the built graph fixed while changing query effort');
      const sets = [graphSearch(1), graphSearch(3)];
      sets.forEach((run, j) => {
        const y = 430 + j * 270;
        geometryText(ctx, api, 'ef' + [1, 3][j], 220, y + 50, 34, themeColors.yellow);
        run.events.forEach((e, i) => {
          const x = 500 + i * 230;
          if (q > (i + 1) / 6) {
            api.circle(ctx, x, y + 30, 32, themeColors.blue);
            geometryText(ctx, api, e.id, x, y + 40, 29, themeColors.bg, 'center');
          }
          if (i && q > (i + 1) / 6)
            line(ctx, api, x - 180, y + 30, x - 50, y + 30, themeColors.cyan, 3);
        });
        geometryText(
          ctx,
          api,
          q > (run.events.length + 1) / 6 ? 'returns ' + run.winner : 'trace in progress',
          1630,
          y + 50,
          31,
          j ? themeColors.green : themeColors.pink,
          'center',
        );
      });
      geometryText(
        ctx,
        api,
        'M / construction effort: build controls · ef: retained search list, not visit cap',
        960,
        1030,
        29,
        themeColors.muted,
        'center',
      );
    }
    if (currentBeat === 2) {
      heading(ctx, api, 'One implementation reserves 2M four-byte base neighbor IDs');
      const vals = [256, 192, 96],
        names = ['64 neighbor slots', '1536 sign bits', 'PQ96 code'];
      vals.forEach((v, i) => {
        const y = 410 + i * 190;
        geometryText(
          ctx,
          api,
          names[i],
          220,
          y + 45,
          30,
          [themeColors.blue, themeColors.pink, themeColors.yellow][i],
        );
        line(ctx, api, 650, y + 40, 1630, y + 40, themeColors.muted, 1);
        api.rect(
          ctx,
          650,
          y,
          ((980 * v) / 256) * q,
          75,
          [themeColors.blue, themeColors.pink, themeColors.yellow][i],
        );
        geometryText(ctx, api, v + ' B', 1730, y + 50, 32, themeColors.ink, 'center');
      });
      geometryText(
        ctx,
        api,
        'Counts, upper links, labels, metadata, retained vectors and replicas add more',
        960,
        1040,
        29,
        themeColors.muted,
        'center',
      );
    }
    return;
  }
  return;
}
export default {
  id: 'index-memory',
  draw: drawIndexMemory,
  cues: [],
};
