import { clamp, cueStep } from '../construction.mjs';
import { samplingFilmData } from '../fixtures.mjs';

const samples = samplingFilmData.countHistograms.map((bins) => {
  const n = bins.reduce((a, b) => a + b, 0);
  const mean = bins.reduce((a, count, k) => a + count * k, 0) / n;
  const variance = bins.reduce((a, count, k) => a + count * (k - mean) ** 2, 0) / n;
  return { bins, n, mean, variance };
});

export function drawBurstyMixture(ctx, scene, state, api) {
  const { C } = api;
  const mixture = cueStep(state, 'sp-bursty-mixture-0', 0, 0.23, 0.72);
  const sweep = cueStep(state, 'sp-bursty-mixture-1', 1, 0.05, 0.5);
  const dispersion = cueStep(state, 'sp-bursty-mixture-2', 2, 0.03, 0.3);
  const x = (k) => 270 + 49 * k;
  const through = 5 + Math.floor(16 * sweep);
  api.focus.target('sp-bursty-mixture-visual', () => {
    api.text(ctx, '5,000 requests per run', 210, 251, 34, C.ink);
    api.text(ctx, 'over five calls', x(8.8), 311, 32, C.pink, 'center');
    api.line(ctx, x(5.5), 330, x(5.5), 846, C.pink, 3);
    samples.forEach(({ bins, n, mean, variance }, i) => {
      const base = 535 + 300 * i;
      const growth = i ? mixture : 1;
      api.line(ctx, x(0) - 23, base, x(21.5), base, C.muted, 2);
      api.text(ctx, i ? 'Two rates' : 'One rate', 201, base - 48, 34, C.ink, 'right');
      if (!growth) return;
      bins.forEach((count, k) => {
        const height = 0.113 * count * growth;
        if (height > 0)
          api.rect(
            ctx,
            x(k) - 16,
            base - height,
            32,
            height,
            k > 5 && k <= through ? C.pink : C.blue,
            null,
            0,
          );
      });
      if (growth === 1) {
        api.text(ctx, 'mean ' + mean.toFixed(2), 1420, base - 149, 35, C.ink);
        if (sweep > 0) {
          const crossed = bins.slice(6, through + 1).reduce((a, b) => a + b, 0);
          api.text(ctx, crossed + ' / ' + n, 1420, base - 76, 48, C.pink);
          api.text(ctx, ((100 * crossed) / n).toFixed(1) + '%', 1420, base - 18, 37, C.pink);
        }
        if (dispersion === 1)
          api.text(ctx, 'variance ' + variance.toFixed(2), 1420, base + 36, 32, C.muted);
      }
    });
    for (const k of [0, 2, 5, 10, 15, 20])
      api.text(ctx, String(k), x(k), 892, 30, C.muted, 'center');
    api.text(ctx, 'tool calls per request', x(10.5), 958, 35, C.muted, 'center');
    if (sweep > 0 && sweep < 1) {
      const edge = x(5.5 + 16 * clamp(sweep));
      api.line(ctx, edge, 349, edge, 840, C.yellow, 3);
    }
  });
}

export default {
  id: 'bursty-mixture',
  draw: drawBurstyMixture,
  cues: ['sp-bursty-mixture-0', 'sp-bursty-mixture-1', 'sp-bursty-mixture-2'],
};
