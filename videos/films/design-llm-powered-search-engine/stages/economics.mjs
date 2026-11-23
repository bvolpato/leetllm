import { spoken } from '../construction.mjs';
import { sampleModel } from '../model.mjs';

const routes = sampleModel('economics', { beat: 0, beatP: 0 }).routes;
const population = 100;

export function drawEconomics(ctx, scene, state, api) {
  const { C } = api;
  const cue = (id) => spoken(scene, state, id);
  const moved = Math.round(10 * cue('cost-reroute').progress);
  const counts = routes.map((route) => Math.round(route.share * population));
  counts[0] += moved;
  counts[1] -= moved;
  const total = routes.reduce((sum, route, i) => sum + counts[i] * route.cost, 0);
  const colors = [C.blue, C.green, C.yellow];
  const names = ['Full synthesis', 'Valid cache', 'Live lookup'];
  const baseline = routes.reduce((sum, route) => sum + route.share * route.cost, 0);
  api.focus.target('cost-cohort', () => {
    api.text(ctx, '100 search requests', 155, 308, 42, C.ink);
    for (let i = 0; i < population; i++) {
      const route = i < counts[0] ? 0 : i < counts[0] + counts[1] ? 1 : 2;
      const flagged = i >= 60 && i < 70 && cue('cost-stale').phase !== 'before';
      const x = 165 + (i % 10) * 64,
        y = 374 + Math.floor(i / 10) * 47;
      api.rect(ctx, x, y, 48, 31, colors[route], flagged ? C.ink : undefined, 4);
      if (flagged && route === 1) api.line(ctx, x + 10, y + 25, x + 37, y + 6, C.bg, 4);
    }
    api.text(
      ctx,
      cue('cost-stale').phase === 'before'
        ? 'One mark per request'
        : moved < 10
          ? 'Marked row · 10 cached answers expired'
          : 'Marked row · 10 fresh searches',
      160,
      903,
      29,
      C.muted,
    );
  });
  api.focus.target('cost-prices', () => {
    api.text(ctx, 'Route', 906, 310, 30, C.muted);
    api.text(ctx, 'Requests × unit price', 1737, 310, 30, C.muted, 'right');
    routes.forEach((route, i) => {
      const y = 426 + i * 118;
      api.text(ctx, names[i], 904, y, 37, colors[i]);
      api.text(
        ctx,
        `${counts[i]} × ${(route.cost * 100).toFixed(2)}¢`,
        1740,
        y,
        37,
        colors[i],
        'right',
        'mono',
      );
    });
    api.line(ctx, 904, 724, 1740, 724, C.muted, 2);
    api.text(ctx, 'Mean per request', 904, 799, 36, C.ink);
    const showMean =
      cue('cost-base').phase === 'after' &&
      (moved === 0 || cue('cost-new-mean').phase !== 'before');
    api.text(
      ctx,
      showMean ? `${((total * 100) / population).toFixed(3)}¢` : '…',
      1740,
      803,
      48,
      C.ink,
      'right',
    );
  });
  api.focus.target('cost-question', () => {
    const asked = cue('cost-question').phase !== 'before';
    const paid = cue('cost-new-mean').phase === 'after';
    api.text(
      ctx,
      paid
        ? `Each rerouted request adds ${((routes[0].cost - routes[1].cost) * 100).toFixed(2)}¢. The previous mean was ${(baseline * 100).toFixed(3)}¢.`
        : asked
          ? 'Same 100 requests. What happens to the mean cost?'
          : 'Illustrative all-in prices in US cents.',
      155,
      1000,
      36,
      paid ? C.green : asked ? C.yellow : C.muted,
    );
  });
}
export default {
  id: 'economics',
  draw: drawEconomics,
  cues: [
    'cost-requests',
    'cost-base',
    'cost-stale',
    'cost-question',
    'cost-reroute',
    'cost-new-mean',
  ],
};
