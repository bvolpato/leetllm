import { assertEqual, column, dot, dynamic, line, place } from 'vizmatic/stage';
import { area, label, mono, note } from '../kit-narrated.mjs';
import { BUDGET, groundingPacket, report } from './parts.mjs';

export const points = (rate) => (100 * rate).toFixed(2);
const signed = (v) => (v < 0 ? '−' : '+') + Math.abs(v).toFixed(2);

export function auditRuler(s) {
  const [unit, field, calculation, footer] = area.rows([0.8, 4.7, 1.1, 1], 'normal');
  const [ids, tracks] = field.columns([1, 3], 'wide');
  const [cap, first, second, ticks] = tracks.rows([1, 2, 2, 1], 'tight');
  const x = (pp) => tracks.point('left')[0] + tracks.width * (0.08 + (0.84 * (pp + 1)) / 2);
  const bottom = ticks.point('top')[1];
  const cutoff = BUDGET.grounding;
  const step = (xa, ya, xb, yb, options) => line([xa, ya], [xb, yb], options);
  const axis = step(x(-1), bottom, x(1), bottom, { stroke: 'dim', width: 3 });
  const limit = step(x(cutoff), cap.point('bottom')[1], x(cutoff), bottom, {
    stroke: 'yellow',
    width: 5,
  });
  const marks = [-1, -0.5, 0, 0.5, 1].map((v) => [
    step(x(v), bottom, x(v), bottom + 13, { stroke: 'dim', width: 3 }),
    mono(v === 0 ? '0' : signed(v), { size: 32, color: v === cutoff ? 'yellow' : 'dim' }).moveTo([
      x(v),
      bottom + 37,
    ]),
  ]);
  const limitName = mono('Limit  +' + cutoff.toFixed(2), { size: 40, color: 'yellow' }).moveTo([
    x(cutoff),
    cap.point('center')[1],
  ]);
  const frame = [
    place(
      label('Grounding failure rate   ·   rewrite minus control   ·   percentage points'),
      unit,
    ),
    axis,
    limit,
    limitName,
    marks,
  ];
  function auditRow(index, failures, { open = false } = {}) {
    const packet = groundingPacket(failures);
    const lane = [first, second][index];
    const y = lane.point('center')[1];
    const names = ids.rows([1, 2, 2, 1], 'tight');
    const color = index ? 'blue' : 'cyan';
    const rowTitle = index ? 'Practice audit' : 'Original audit';
    const name = place(
      column(
        [
          label(open && !packet.passes ? rowTitle + ' · HOLD' : rowTitle, { size: 40, color }),
          note('Control   ' + report.control.groundingFailures + ' / 2,000 failed'),
          note('Rewrite   ' + failures + ' / 2,000 failed'),
        ],
        { gap: 'tight' },
      ),
      names[index + 1],
    );
    const estimate = packet.delta * 100;
    const spread = s.value(open ? 1 : 0);
    const rail = step(x(-1), y, x(1), y, { stroke: 'grid', width: 3 });
    const center = dot(14, color).moveTo([x(estimate), y]);
    const band = dynamic(() => {
      const margin = 100 * 1.96 * packet.se * spread.value;
      const lo = x(estimate - margin);
      const hi = x(estimate + margin);
      return [
        step(lo, y, hi, y, { stroke: color, width: 7 }),
        ...[lo, hi].map((end) => step(end, y - 18, end, y + 18, { stroke: color, width: 5 })),
      ];
    });
    const upper = mono(signed(packet.upper * 100), { size: 42, color });
    const tipX = x(packet.upper * 100);
    const labelX = index ? tipX - upper.bounds().width / 2 + 5 : tipX;
    upper.moveTo([labelX, y - 52]);
    const bound = packet.upper * 100;
    assertEqual(packet.passes, bound < cutoff, 'strict audit budget');
    return {
      packet,
      name,
      center,
      band,
      upper,
      spread,
      rail,
      row: [name, rail, band, center, upper],
    };
  }
  return { frame, auditRow, calculation, footer };
}
