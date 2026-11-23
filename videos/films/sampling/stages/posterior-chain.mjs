import { cueStep } from '../construction.mjs';
import { samplingFilmData } from '../fixtures.mjs';

export function drawPosteriorChain(ctx, scene, state, api) {
  const { C } = api;
  const colors = [C.cyan, C.blue, C.yellow, C.pink];
  const rows = samplingFilmData.chains;
  const trace = cueStep(state, 'sp-posterior-chain-0', 0, 0.28, 0.6);
  const mark = cueStep(state, 'chain-repeat', 1, 0.05, 0.3);
  const extend = cueStep(state, 'sp-posterior-chain-1', 2, 0.1, 0.44);
  const diagnose = cueStep(state, 'sp-posterior-chain-2', 3, 0.05, 0.32);
  api.focus.target('sp-posterior-chain-visual', () => {
    const close = state.beat < 2;
    const plot = api.teaching.axes({
      x: 217,
      y: 360,
      width: 1080,
      height: 445,
      xDomain: close ? [1, 6] : [1, 240],
      yDomain: [0, 1],
      xTicks: close ? [1, 2, 3, 4, 5, 6] : [1, 60, 120, 180, 240],
      yTicks: [0, 0.5, 1],
      xLabel: 'retained iteration after warmup',
      yLabel: 'resolution probability',
    });
    api.text(
      ctx,
      close ? 'One chain, first six kept states' : 'Four chains, first 240 kept states',
      217,
      250,
      39,
      C.ink,
    );
    const n = close ? Math.floor(trace * 6) : 6 + Math.floor(extend * 234);
    if (!close)
      api.path(ctx, [plot.point(1, 10 / 14), plot.point(240, 10 / 14)], {
        color: C.muted,
        width: 3,
      });
    rows.slice(0, close ? 1 : 4).forEach((chain, i) => {
      const pts = chain.first240.slice(0, n).map((value, j) => plot.point(j + 1, value));
      if (pts.length > 1) api.path(ctx, pts, { color: colors[i], width: close ? 6 : 3 });
      if (close) pts.forEach((p) => api.circle(ctx, p.x, p.y, 12, colors[i]));
    });
    if (close) {
      api.text(ctx, 'Starting value', 1503, 403, 32, C.muted, 'center');
      api.text(ctx, '0.10', 1503, 471, 47, C.ink, 'center');
      api.text(ctx, '2,000 warmup steps', 1503, 572, 33, C.ink, 'center');
      if (mark > 0) {
        const a = plot.point(2, rows[0].first240[1]),
          b = plot.point(3, rows[0].first240[2]);
        api.path(ctx, [a, b], { color: C.yellow, width: 8 });
        api.circle(ctx, a.x, a.y, 13, C.yellow);
        api.circle(ctx, b.x, b.y, 13, C.yellow);
        api.text(ctx, rows[0].first240[1].toFixed(3) + ' twice', 1503, 724, 45, C.yellow, 'center');
      }
    } else {
      api.text(ctx, 'Start', 1450, 366, 30, C.muted, 'center');
      api.text(ctx, 'Full-run mean', 1675, 366, 30, C.muted, 'center');
      for (const [i, chain] of rows.entries()) {
        const y = 457 + i * 85;
        api.text(ctx, chain.start.toFixed(2), 1450, y, 37, colors[i], 'center');
        if (extend === 1) api.text(ctx, chain.mean.toFixed(3), 1675, y, 39, colors[i], 'center');
      }
      api.text(ctx, 'Target mean   10 / 14 ≈ 0.714', 1320, 845, 31, C.ink);
      if (diagnose > 0) api.text(ctx, 'Lag-one correlation ≈ 0.72', 1320, 941, 34, C.yellow);
    }
  });
}

export default {
  id: 'posterior-chain',
  draw: drawPosteriorChain,
  cues: ['sp-posterior-chain-0', 'chain-repeat', 'sp-posterior-chain-1', 'sp-posterior-chain-2'],
};
