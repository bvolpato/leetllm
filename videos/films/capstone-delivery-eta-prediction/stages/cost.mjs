import { decisions } from '../model.mjs';
import { completed } from '../shipment.mjs';
import { sum } from '../arithmetic.mjs';

export function drawCost(ctx, scene, state, api) {
  const { C } = api,
    x = (h) => 250 + h * 40,
    y = (p) => 847 - p * 510;
  const ageProgress = api.focus.progress('cost-age', 0),
    riskProgress = api.focus.progress('cost-risk', 0);
  const useRisk = riskProgress > 0,
    rows = decisions(0.4, !useRisk);
  const ageCharged = completed(api, 'cost-miss'),
    riskCharged = completed(api, 'cost-false');
  const charged = useRisk ? riskCharged : ageCharged;
  const tx = (s, x, y, n, col = C.ink, a = 'left') => api.text(ctx, s, x, y, n, col, a);
  api.focus.target('order-plot', () => {
    tx('Four labelled shipments    /    Supplied scores', 140, 247, 32, C.muted);
    tx('Late risk', 156, 318, 33, C.blue);
    api.line(ctx, x(0), y(1), x(0), y(0), C.muted, 3);
    api.line(ctx, x(0), y(0), x(24), y(0), C.muted, 3);
    for (const h of [0, 6, 12, 18, 24]) tx(h + ' h', x(h), 904, 27, C.muted, 'center');
    for (const p of [0, 0.4, 1]) tx(Math.round(100 * p) + '%', 210, y(p) + 9, 28, C.muted, 'right');
    tx('Age of last carrier scan', 745, 984, 34, C.ink, 'center');
    if (ageProgress > 0 && !useRisk) {
      api.line(ctx, x(18), y(0), x(18), y(ageProgress), C.yellow, 4);
      tx('Warn →', x(18) + 23, 318, 31, C.yellow);
    }
    if (useRisk) {
      api.line(ctx, x(0), y(0.4), x(24 * riskProgress), y(0.4), C.yellow, 4);
      tx('↑ Warn', x(23), y(0.4) - 23, 31, C.yellow, 'center');
    }
    rows.forEach((r, i) => {
      const px = x(r.age),
        py = y(r.risk);
      const col = r.late ? C.pink : C.cyan;
      if (r.late)
        api.path(
          ctx,
          [
            { x: px, y: py - 12 },
            { x: px + 12, y: py },
            { x: px, y: py + 12 },
            { x: px - 12, y: py },
          ],
          { closed: true, fill: col, color: col, width: 2 },
        );
      else api.circle(ctx, px, py, 11, C.bg, col, 4);
      if (charged && r.penalty > 0) api.circle(ctx, px, py, 20, null, C.yellow, 3);
      const labelX = i === 1 ? px + 32 : px + 25;
      tx(
        'E-' + (301 + i) + (r.late ? (i === 0 ? '   expedited' : '   standard') : ''),
        labelX,
        py - 17,
        30,
        col,
      );
      tx(r.age + ' h / ' + Math.round(r.risk * 100) + '%', labelX, py + 26, 26, C.ink);
    });
    const rx = 1340;
    tx('Penalty schedule', rx, 327, 32, C.muted);
    for (const [i, [label, cost]] of [
      ['Missed expedited', 150],
      ['Missed standard', 60],
      ['False warning', 8],
    ].entries()) {
      const py = 403 + i * 63;
      tx(label, rx, py, 29, C.ink);
      tx(String(cost), 1790, py, 35, C.ink, 'right');
    }
    api.line(ctx, rx, 573, 1790, 573, C.muted, 2);
    tx(useRisk ? 'Risk rule' : 'Age rule', rx, 647, 42, C.yellow);
    if (charged) {
      const who = rows.findIndex((r) => r.penalty > 0);
      tx(
        'E-' + (301 + who) + (useRisk ? '  /  false warning' : '  /  missed late'),
        rx,
        728,
        32,
        C.pink,
      );
      tx(sum(rows.map((r) => r.penalty)) + ' units', rx, 831, 67, C.pink);
    } else tx(useRisk ? 'Which false warning?' : 'Which late order?', rx, 754, 37);
    if (useRisk && ageCharged) tx('Age rule  /  150 units', rx, 943, 30, C.muted);
  });
}
export default {
  id: 'cost',
  draw: drawCost,
  cues: ['cost-age', 'cost-miss', 'cost-risk', 'cost-false'],
};
