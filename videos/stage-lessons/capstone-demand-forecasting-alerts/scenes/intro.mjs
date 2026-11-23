import { draw, dynamic, group, linear, rect } from 'vizmatic/stage';
import { heading } from '../../kit-narrated.mjs';
import { actual, area, candidate, capacity, FRIDAY, number, parcelRuler, residual, stroke, TOLERANCE, words } from '../parts.mjs';

function parcelStrip(s, c, point, limit) {
  const [readouts, diagram, legend] = area.rows([3, 3, 1.5], 'normal');
  const readout = (region, name, value, color) => {
    const [label, amount] = region.rows([1, 2], 'tight');
    return [words(label, name, color, 48), number(amount, value, color, 108)];
  };
  const [crew, forecast] = readouts.columns(2, 'normal');
  const [rack, bracketLabel] = diagram.rows([2, 1], 'normal');
  const perBox = 10;
  const slots = Math.ceil(point / perBox);
  const pitch = (rack.width - 120) / slots;
  const left = rack.left + 60;
  const stop = left + limit / perBox * pitch;
  const y = rack.cy;
  const initialParcels = limit - perBox;
  const visibleParcels = s.value(initialParcels);

  // A full carton represents ten requests. Clip the last carton to the forecast's fraction.
  function carton(i, total) {
    const fraction = Math.min(1, Math.max(0, total / perBox - i));
    const w = (pitch - 8) * fraction;
    if (w < 1) return [];
    const x = left + i * pitch + 4;
    const face = rect(w, 83, { fill: 'cyan', stroke: null }).moveTo([x + w / 2, y]);
    const seam = stroke(x, y - 18, x + w, y - 18, 'bg', 3);
    const tape = Math.min(w - pitch * 0.35, pitch * 0.18);
    return tape <= 0 ? [face, seam] : [face, seam,
      rect(tape, 38, { fill: 'surface', stroke: null }).moveTo([x + pitch * 0.35 + tape / 2, y - 23]),
    ];
  }
  const filled = Math.floor(initialParcels / perBox);
  const strip = group(
    ...Array.from({ length: filled }, (_, i) => carton(i, initialParcels)).flat(),
    dynamic(() => Array.from({ length: slots - filled }, (_, i) => carton(filled + i, visibleParcels.value)).flat()),
  );
  const guide = group(stroke(left, y + 63, stop, y + 63, 'pink', 5),
    stroke(left, y + 46, left, y + 63, 'pink', 5),
    stroke(stop, y - 68, stop, y + 63, 'pink', 5));
  const picture = [
    heading(c.title),
    ...readout(crew, 'Crew capacity', limit, 'pink'),
    ...readout(forecast, 'Sunday’s forecast', '≈' + Math.round(point), 'cyan'),
    strip, guide, words(bracketLabel, 'Room for ' + limit / perBox + ' boxes', 'pink', 38).shift((left + stop) / 2 - bracketLabel.cx, 0),
    words(legend, 'Each full box stands for 10 parcels', 'ink', 40),
  ];
  s.add(picture);
  for (const node of picture) node.opacity(1);
  s.play(visibleParcels.to(point), { duration: 1.4, ease: linear });
  return picture;
}

export default function intro(s, c) {
  const point = candidate[FRIDAY], limit = capacity[FRIDAY];
  const opening = parcelStrip(s, c, point, limit);
  const [when, plot, status, decision] = area.rows([1, 5, 1, 2], 'normal');
  const r = parcelRuler(plot, 130, 185);
  const issue = words(when, 'Sun Feb 1  ·  08:00 UTC     →     Fri Feb 6', 'dim', 38);
  const pending = words(status, 'Friday’s final count is pending', 'dim', 34);
  const review = words(decision, 'Review Friday staffing', 'yellow', 54);
  const surplus = words(status, (point - limit).toFixed(3) + ' parcels above scheduled capacity', 'cyan', 37);
  const lead = r.gap(limit, point, 'pink');
  c.swap('review', opening, [heading('Friday at the parcel dock'), issue, r.rail, pending, review,
    r.pin(limit, 'Capacity  ' + limit, 'pink', 'below'),
    r.pin(point, 'Forecast  ' + point.toFixed(3), 'cyan', 'above'),
  ], { lead: 0 });
  c.show('margin', draw(lead));
  c.swap('margin', pending, surplus);
  const band = r.band(point, TOLERANCE);
  c.swap('saturday', [issue, surplus, review, lead], [
    words(when, 'Sat Feb 7  ·  06:00 UTC     /     Friday count verified', 'green', 38),
    band, words(status, 'Tolerance around the issued point   ·   ±6 parcels', 'cyan', 37),
  ]);
  c.show('actual', r.pin(actual[FRIDAY], 'Actual  ' + actual[FRIDAY], 'green', 'above'));
  c.show('error', draw(r.gap(point, actual[FRIDAY], 'green')));
  const miss = words(decision, '+' + residual(FRIDAY).toFixed(3) + ' parcels above forecast', 'green', 46);
  c.show('difference', miss, { after: true });
  c.swap('outside', miss, words(decision, '+' + residual(FRIDAY).toFixed(3) + ' parcels above forecast   ·   review the miss', 'yellow', 45), { after: true });
}
