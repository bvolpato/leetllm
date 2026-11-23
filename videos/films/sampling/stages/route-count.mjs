import { cueStep } from '../construction.mjs';
import { samplingFilmData } from '../fixtures.mjs';

const labels = ['CI failure', 'rollback', 'access', 'log triage'];
const probabilities = [0.45, 0.2, 0.2, 0.15];
const observed = ['ci_failure', 'rollback', 'access_request', 'log_triage'].map(
  (k) => samplingFilmData.routeCounts[k],
);
const edges = [0];
for (const p of probabilities) edges.push(edges.at(-1) + p);
const rank = 0.57;
const selected = probabilities.findIndex((_, i) => rank < edges[i + 1]);
const x = (u) => 265 + 1390 * u;

export function drawRouteCount(ctx, scene, state, api) {
  const { C } = api;
  const colors = [C.blue, C.cyan, C.yellow, C.pink];
  const deal = cueStep(state, 'sp-route-count-0', 0, 0.15, 0.48);
  const marker = cueStep(state, 'route-rank', 0, 0.63, 0.79);
  const routed = cueStep(state, 'route-landed', 1, 0.08, 0.36);
  const sample = cueStep(state, 'sp-route-count-1', 2, 0.22, 0.58);
  api.focus.target('sp-route-count-visual', () => {
    if (routed === 1) api.text(ctx, 'R18  →  ' + labels[selected], 960, 286, 47, C.ink, 'center');
    else api.text(ctx, 'R18', 960, 286, 47, C.ink, 'center');
    api.line(ctx, x(0), 518, x(1), 518, C.muted, 3);
    probabilities.forEach((p, i) => {
      const mid = x(edges[i] + p / 2);
      api.text(ctx, labels[i], mid, 403, 33, colors[i], 'center');
      const right = Math.min(deal, edges[i + 1]);
      if (right > edges[i])
        api.rect(ctx, x(edges[i]), 455, x(right) - x(edges[i]), 94, colors[i], null, 0);
      if (right === edges[i + 1])
        api.text(ctx, Math.round(p * 100) + '%', mid, 516, 37, C.bg, 'center');
      if (state.beat >= 2) {
        api.text(ctx, String(Math.round(p * 500)), mid, 764, 40, C.ink, 'center');
        if (sample * 4 >= i + 1)
          api.text(ctx, String(observed[i]), mid, 855, 43, colors[i], 'center');
      }
    });
    if (marker > 0) {
      api.line(ctx, x(rank), 650 - 101 * marker, x(rank), 659, C.ink, 4);
      api.text(ctx, 'draw 0.57', x(rank), 711, 36, C.ink, 'center');
    }
    if (state.beat >= 2) {
      api.text(ctx, 'Expected', 131, 764, 30, C.muted);
      api.text(ctx, 'Sampled', 131, 855, 30, C.muted);
      if (sample === 1)
        api.text(ctx, observed.join(' + ') + ' = 500 requests', 960, 971, 39, C.ink, 'center');
    }
  });
}
export default {
  id: 'route-count',
  draw: drawRouteCount,
  cues: ['sp-route-count-0', 'route-rank', 'route-landed', 'sp-route-count-1'],
};
