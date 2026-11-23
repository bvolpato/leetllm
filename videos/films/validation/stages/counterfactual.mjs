import { detailText, heading, line, tile } from '../defaults.mjs';
export function drawCounterfactual(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = Math.max(0, Math.min(1, state.beatP ?? 0)),
    cueProgress = (a = 0.12, z = 0.85) => api.phase(progress, a, z);
  {
    heading(
      ctx,
      api,
      'Same request context · only the chosen logging action has an observed reward',
    );
    tile(ctx, api, 'Request opening context R', 650, 350, 620, 100, themeColors.blue);
    tile(ctx, api, 'Review · behavior P = 1', 200, 650, 650, 100, themeColors.yellow);
    tile(ctx, api, 'Automatic · behavior P = 0', 1080, 650, 650, 100, themeColors.pink);
    const q = cueProgress(),
      route = currentBeat === 0 ? api.phase(progress, 0.08, 0.45) : 1,
      px = 800 + (525 - 800) * route,
      py = 480 + (620 - 480) * route;
    if (route > 0) {
      const dx = 525 - 800,
        dy = 620 - 480,
        len = Math.hypot(dx, dy),
        ux = dx / len,
        uy = dy / len;
      if (route > 0.12) line(ctx, api, 800, 480, px - ux * 28, py - uy * 28, themeColors.yellow, 4);
      if (route < 0.85) line(ctx, api, px + ux * 28, py + uy * 28, 525, 620, themeColors.muted, 3);
      api.circle(ctx, px, py, 24, themeColors.yellow);
      detailText(ctx, api, 'R', px, py + 8, 23, themeColors.bg, 'center');
    } else api.arrow(ctx, 800, 480, 525, 620, themeColors.muted, 3);
    api.arrow(ctx, 1120, 480, 1405, 620, themeColors.muted, 3);
    if (currentBeat === 0) {
      if (q > 0.45) {
        detailText(
          ctx,
          api,
          'log[R] = (review, observed reward)',
          525,
          860,
          29,
          themeColors.green,
          'center',
        );
        detailText(ctx, api, 'Automatic reward ?', 1405, 860, 34, themeColors.muted, 'center');
      }
    } else {
      detailText(
        ctx,
        api,
        'log[R] = (review, observed reward)',
        525,
        860,
        29,
        themeColors.green,
        'center',
      );
      detailText(
        ctx,
        api,
        'Automatic log: no observed row',
        1405,
        860,
        29,
        themeColors.pink,
        'center',
      );
    }
    if (currentBeat === 1) {
      detailText(
        ctx,
        api,
        'Target sometimes chooses automatic',
        960,
        310,
        29,
        themeColors.pink,
        'center',
      );
      if (q > 0.25) {
        api.line(ctx, 1235, 590, 1290, 510, themeColors.pink, 7);
        detailText(ctx, api, 'π target(auto) / 0', 1405, 955, 34, themeColors.pink, 'center');
      }
      if (q > 0.6)
        detailText(
          ctx,
          api,
          'Dividing by zero cannot create an unobserved outcome',
          960,
          1035,
          31,
          themeColors.yellow,
          'center',
        );
    }
    if (currentBeat === 2) {
      detailText(ctx, api, 'Observed', 525, 950, 35, themeColors.green, 'center');
      detailText(ctx, api, 'Modeled or unobserved', 1405, 950, 35, themeColors.pink, 'center');
      detailText(
        ctx,
        api,
        'Sequential ratios require their stated support, state and dynamics assumptions',
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
  id: 'counterfactual',
  draw: drawCounterfactual,
  cues: [],
};
