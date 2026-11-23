import {
  coreCueProgress,
  coreCueVisible,
  coreEquation,
  coreLine,
  coreRectangle,
  coreText,
} from '../defaults.mjs';
export function drawUmap(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  {
    const pReady = currentBeat > 0 || coreCueVisible(ctx, api, 'umap-p'),
      qReady = currentBeat > 0 || coreCueVisible(ctx, api, 'umap-q'),
      product = currentBeat > 1 || (currentBeat === 1 && coreCueVisible(ctx, api, 'umap-overlap')),
      result = currentBeat > 1 || (currentBeat === 1 && coreCueVisible(ctx, api, 'umap-result'));
    coreText(ctx, api, 'A geometric worksheet for p + q − pq', 960, 280, 34, themeColors.ink);
    const x = 1180,
      y = 355,
      w = 460,
      h = 240;
    coreRectangle(ctx, api, x, y, w, h, themeColors.panel, themeColors.line);
    if (pReady) coreRectangle(ctx, api, x, y + h * 0.2, w, h * 0.8, '#63deec66');
    if (qReady) coreRectangle(ctx, api, x, y, w * 0.6, h, '#ffd75e66');
    if (product) coreRectangle(ctx, api, x, y + h * 0.2, w * 0.6, h * 0.8, '#b9cf9988');
    coreText(ctx, api, pReady ? 'p = 0.80' : 'p', 720, 405, 35, themeColors.cyan);
    coreText(ctx, api, qReady ? 'q = 0.60' : 'q', 720, 490, 35, themeColors.yellow);
    if (product) coreText(ctx, api, 'overlap = 0.48', 1410, 650, 31, themeColors.yellow);
    if (result) coreEquation(ctx, api, '0.80+0.60-0.48=0.92', 1410, 785, 34, themeColors.green);
    const attraction = currentBeat === 2 ? coreCueProgress(ctx, api, 'umap-attraction') : 0,
      repulsion = currentBeat === 2 ? coreCueProgress(ctx, api, 'umap-repulsion') : 0,
      a = {
        x: 310 + 150 * attraction,
        y: 735,
      },
      z = {
        x: 850 - 150 * attraction,
        y: 735,
      };
    coreLine(
      ctx,
      api,
      a.x,
      a.y,
      z.x,
      z.y,
      result ? themeColors.green : themeColors.muted,
      result ? 8 : 3,
    );
    api.circle(ctx, a.x, a.y, 20, themeColors.cyan);
    api.circle(ctx, z.x, z.y, 20, themeColors.pink);
    coreText(ctx, api, 'i', a.x, a.y + 55, 30, themeColors.cyan);
    coreText(ctx, api, 'j', z.x, z.y + 55, 30, themeColors.pink);
    if (currentBeat === 2) {
      api.circle(ctx, 1050 + 170 * repulsion, 920, 17, themeColors.yellow);
      coreText(ctx, api, 'non-neighbor', 1050 + 170 * repulsion, 975, 26, themeColors.yellow);
    }
    coreText(
      ctx,
      api,
      'Keep graph weights, layout parameters and source-neighbor checks distinct',
      960,
      1040,
      27,
      themeColors.muted,
    );
  }
  return;
}
export default {
  id: 'umap',
  draw: drawUmap,
  cues: [
    'umap-beat-1-focus-1',
    'umap-p',
    'umap-q',
    'umap-beat-2-focus-1',
    'umap-overlap',
    'umap-result',
    'umap-attraction',
    'umap-repulsion',
  ],
};
