import { completed, limits, propose } from '../shipment.mjs';

export function drawFreshness(ctx, scene, state, api) {
  const { C } = api,
    scanCase = state.beat === 4;
  const scanAge = scanCase ? 31 : 4,
    risk = scanCase ? 0.81 : 0.75,
    threshold = 0.4;
  const repair = api.focus.progress('freshness-repair', 0);
  const backlogAge = scanCase ? 2 : 12 + (7 - 12) * repair,
    action = propose(scanAge, backlogAge, risk, threshold);
  const known = scanCase
    ? completed(api, 'freshness-scan-stop')
    : repair === 0
      ? completed(api, 'freshness-stop')
      : completed(api, 'freshness-warn');
  const tx = (s, x, y, n, col = C.ink, a = 'left') => api.text(ctx, s, x, y, n, col, a);
  const x = (h) => 520 + h * 34;
  api.focus.target('age-gate', () => {
    tx(
      (scanCase ? 'O-203' : 'O-204') + '    /    Noon snapshot    /    Supplied score',
      145,
      248,
      32,
      C.muted,
    );
    for (const [i, [name, age, limit]] of [
      ['Carrier scan', scanAge, limits.scan],
      ['Backlog report', backlogAge, limits.backlog],
    ].entries()) {
      const y = 425 + i * 194;
      tx(name, 145, y + 14, 41);
      api.line(ctx, x(0), y, x(36), y, C.muted, 3);
      api.line(ctx, x(0), y, x(age), y, C.cyan, 8);
      api.line(ctx, x(limit), y - 29, x(limit), y + 28, C.yellow, 4);
      tx('Limit ' + limit + ' h', x(limit), y - 54, 32, C.yellow, 'center');
      api.circle(ctx, x(age), y, 14, C.cyan);
      tx(Number(age.toFixed(1)) + ' h old', x(age), y + 70, 34, C.cyan, 'center');
    }
    api.line(ctx, 145, 743, 1775, 743, C.muted, 2);
    tx('Supplied risk', 145, 813, 29, C.muted);
    tx(Math.round(100 * risk) + '%', 145, 891, 62, C.blue);
    tx('Warning threshold', 572, 813, 29, C.muted);
    tx('40%', 572, 891, 62, C.yellow);
    tx('Proposed action', 1080, 813, 29, C.muted);
    tx(
      known ? action.action : 'Where should it go?',
      1080,
      891,
      53,
      known ? (action.action === 'Manual review' ? C.pink : C.green) : C.ink,
    );
    if (known) api.text(ctx, action.reason, 1080, 955, 31, C.muted, 'left', 'mono');
  });
}
export default {
  id: 'freshness',
  draw: drawFreshness,
  cues: [
    'freshness-backlog',
    'freshness-stop',
    'freshness-repair',
    'freshness-warn',
    'freshness-scan-stop',
  ],
};
