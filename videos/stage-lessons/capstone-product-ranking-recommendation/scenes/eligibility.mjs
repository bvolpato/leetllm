import { line, place, rect, to } from 'vizmatic/stage';
import { label, mono, namedBox, note } from '../../kit-narrated.mjs';
import { catalog, COLOR, open } from '../parts.mjs';

export default function eligibility(s, c) {
  const [head, raw, first, second, foot] = open(s, c).rows([0.7, 1.25, 1.55, 1.55, 0.85], 'wide');
  const rawSlots = raw.columns(5, 'wide');
  s.add(place(note('Label printer · descending retrieval score'), head, 'left'));
  s.add(catalog.map((p, i) => place(namedBox(p.id + '   ' + p.match.toFixed(2), {
    width: 284, height: 84, color: COLOR[p.id],
  }), rawSlots[i])));
  const lineY = raw.cy + 60;
  const cutoff = line([rawSlots[0].cx - 140, lineY], [rawSlots[2].cx + 140, lineY], { stroke: 'yellow', width: 5 });
  const before = catalog.slice(0, 3);
  const after = catalog.filter(p => p.ok).slice(0, 3);
  function pass(region, name, products) {
    const [caption, ...slots] = region.columns([1.5, 1, 1, 1], 'wide');
    return [
      place(label(name, { size: 39 }), caption, 'left'),
      ...slots.map(slot => place(rect(285, 90, { fill: null, stroke: 'dim', radius: 6, dash: [8, 8] }), slot)),
      ...products.map((p, i) => place(mono(p.id, { color: COLOR[p.id] }), slots[i])),
    ];
  }
  const early = pass(first, 'Take 3, then filter', before);
  c.show('budget-early', [cutoff, ...early]);
  const retained = place(mono('1 of 3 places filled', { color: 'yellow' }), foot);
  c.hide('budget-reject', [early[4], early[5]]);
  c.on('budget-reject', () => s.play(to(early[6], n =>
    n.moveTo(first.columns([1.5, 1, 1, 1], 'wide')[1].point('center')), { duration: 0.7 })), 0.3);
  c.show('budget-reject', retained);
  c.hide('budget-filter', cutoff);
  c.show('budget-filter', pass(second, 'Filter, then take 3', after));
  const next = place(note('Recheck current policy, stock and region when constructing the response.'), foot);
  c.swap('budget-current', retained, next);
}
