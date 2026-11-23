import { chooseRoute } from './model.mjs';

export function drawRouteBoard(
  ctx,
  api,
  { rows, cap, inspected, question, reveal, moving = false },
) {
  const { C, focus } = api;
  const limits = { recall: 0.9, cost: cap, latency: 12 };
  const { checked, choice } = chooseRoute(rows, limits);
  const x = (price) => 1010 + (price / 0.6) * 710;
  const money = (price) => '$' + price.toFixed(2);
  const targets = ['route-direct-result', 'route-repl-result', 'route-recursive-result'];
  api.text(ctx, 'Same labeled tasks  /  illustrative values', 123, 270, 31, C.muted);
  api.text(ctx, 'Route', 125, 372, 34, C.ink);
  api.text(ctx, 'Recall ≥ .90', 510, 372, 34, C.ink, 'center');
  api.text(ctx, 'p95 ≤ 12 s', 806, 372, 34, C.ink, 'center');
  api.text(ctx, 'p95 token cost per task (USD)', 1010, 372, 34, C.ink);
  focus.target('cost-cap', () => {
    for (let i = 0; i < checked.length; i++) {
      const row = 538 + i * 130;
      api.line(ctx, x(cap), row - 69, x(cap), row - 7, C.yellow, 4);
    }
    api.text(ctx, money(cap) + ' cap', x(cap), 448, 32, C.yellow, 'center');
  });
  checked.forEach((row, i) => {
    focus.target(targets[i], () => {
      const y = 538 + i * 130;
      const shade = (j) => (!moving && inspected[i] ? (row.passes[j] ? C.green : C.pink) : C.ink);
      api.text(ctx, row.id, 125, y, 42, C.blue);
      api.text(ctx, row.recall.toFixed(2), 512, y, 43, shade(0), 'center');
      api.text(ctx, row.latency.toFixed(1) + ' s', 806, y, 40, shade(2), 'center');
      api.line(ctx, x(0), y - 18, x(0.6), y - 18, C.muted, 2);
      api.circle(ctx, x(row.cost), y - 18, 13, shade(1));
      api.text(ctx, row.cost.toFixed(2), x(row.cost), y + 35, 33, shade(1), 'center');
    });
  });
  focus.target('selected-route', () =>
    api.text(
      ctx,
      !reveal ? question : choice === 'HOLD' ? 'Hold  ·  no eligible route' : 'Selected: ' + choice,
      960,
      940,
      43,
      reveal ? (choice === 'HOLD' ? C.pink : C.green) : C.ink,
      'center',
    ),
  );
}
