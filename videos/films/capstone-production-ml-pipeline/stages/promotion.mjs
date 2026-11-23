import { probeRelease } from '../model.mjs';
import { card, line, panel } from '../defaults.mjs';
export function drawPromotion(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress2 = state.beatP ?? 0;
  const drawText = (v, x, y, z = 30, col = themeColors.ink, a = 'left', mono = false) => {
    const text = String(v);
    const paint = () =>
      api.text(ctx, text, x, y, z, col, a, mono || text.includes('_') ? 'mono' : 'sans');
    return paint();
  };
  const resultComplete = (n) => api.focus.progress('pipe-result-' + n, 0) === 1,
    footer = (v) => drawText(v, 960, 1025, 24, themeColors.muted, 'center');
  const paper = (title, rows, x, y, w = 760, col = themeColors.blue) => {
    panel(ctx, api, x, y, w, 95 + rows.length * 48, col);
    drawText(title, x + 20, y + 40, 30, col);
    line(ctx, api, x + 18, y + 60, x + w - 18, y + 60, col, 2);
    rows.forEach((v, i) => drawText(v, x + 22, y + 105 + i * 48, 27, col));
  };
  const probe = (release, x, y, ready = true) => {
    const v = probeRelease(release, 9);
    panel(
      ctx,
      api,
      x,
      y,
      730,
      210,
      ready ? (release === 'v1' ? themeColors.green : themeColors.blue) : themeColors.muted,
    );
    drawText('Same request: delay 9', x + 365, y + 45, 33, themeColors.ink, 'center');
    drawText('z = (9 − 5) / 10 = 0.4', x + 365, y + 105, 31, themeColors.yellow, 'center');
    drawText(
      ready
        ? `${v.model.intercept} + ${v.model.slope} × 0.4 = ${v.score.toFixed(2)} → ${v.warning ? 'WARN' : 'SILENT'}`
        : `${v.model.intercept} + ${v.model.slope} × 0.4 = pending`,
      x + 365,
      y + 168,
      31,
      ready ? (v.warning ? themeColors.green : themeColors.blue) : themeColors.muted,
      'center',
    );
  };
  {
    const moved = resultComplete('promotion-local-commit'),
      release = moved ? 'v1' : 'v0';
    paper(
      'Retained v0',
      ['center 5 · range 10', 'slope 0 · intercept 0', 'threshold 0.5'],
      130,
      350,
      740,
      themeColors.blue,
    );
    paper(
      'Fitted v1',
      ['center 5 · range 10', 'slope 1.2 · intercept 0.5', 'threshold 0.5'],
      1050,
      350,
      740,
      themeColors.cyan,
    );
    const xx = release === 'v0' ? 130 : 1050;
    card(ctx, api, 'production → ' + release, xx, 640, 740, 95, themeColors.yellow, 36);
    drawText(
      moved
        ? 'Local checks/reload complete; separate real routing evidence still needed'
        : 'READY receipt exists; production still selects v0',
      960,
      280,
      32,
      themeColors.green,
      'center',
    );
    probe(release, 600, 785, true);
    footer(
      'Local pointer + reload probe; worker readiness, routing convergence and external effects are separate',
    );
  }
  return;
}
export default {
  id: 'promotion',
  draw: drawPromotion,
  cues: [
    'promotion-b1-1',
    'promotion-b1-2',
    'promotion-b1-3',
    'promotion-b2-1',
    'promotion-b2-2',
    'promotion-commit',
    'pipe-result-promotion-local-commit',
  ],
};
