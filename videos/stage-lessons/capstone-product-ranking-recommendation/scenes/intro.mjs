import { draw, fadeIn, fadeOut, group, line, linear, place, polygon, rect, to } from 'vizmatic/stage';
import { area, heading, label, mono, namedBox, note, tint } from '../../kit-narrated.mjs';
import { catalog, COLOR } from '../parts.mjs';

function catalogPrinter(listing, region) {
  const cx = region.cx, cy = region.cy;
  const policy = mono('Policy   BLOCKED', { size: 33, color: 'bg' }).at(0, -79).opacity(0);
  const stock = mono('Stock   SOLD OUT', { size: 33, color: 'bg' }).at(0, -28).opacity(0);
  const ticket = group(
    rect(408, 254, { radius: 8, fill: 'ink', stroke: null }),
    policy, stock,
    line([-173, 9], [173, 9], { stroke: 'dim', width: 2, dash: [6, 6] }),
    ...[6, 3, 7, 3, 4, 8, 3, 5, 3, 7, 2, 4, 6, 3, 7, 4].map((w, i) =>
      rect(w, 47, { fill: 'bg', stroke: null }).at(-157 + i * 13, 67)),
    mono(listing.id, { size: 42, color: 'bg' }).at(111, 67),
  ).at(cx, cy + 21);

  const body = group(
    polygon([[-278, -80], [-232, -220], [211, -220], [273, -80]], {
      fill: 'surface', stroke: 'cyan', width: 5,
    }),
    line([-215, -135], [204, -135], { stroke: 'dim', width: 4 }),
    rect(564, 160, { radius: 27, fill: 'surface', stroke: 'cyan', width: 5 }).at(0, -24),
    label('Label printer', { size: 41 }).at(-4, -45),
    rect(34, 9, { radius: 4, fill: 'cyan', stroke: null }).at(221, -42),
    rect(435, 18, { radius: 8, fill: 'bg', stroke: 'dim', width: 3 }).at(0, 52),
  ).at(cx, cy);
  // The ticket passes behind the housing and emerges through its lower lip.
  const fed = [cx, cy + 179];
  const underline = offset => line([cx - 145, fed[1] + offset], [cx + 145, fed[1] + offset],
    { stroke: 'bg', width: 3 });
  return { ticket, body, fed, policy, stock, policyRule: underline(-58), stockRule: underline(-7) };
}

export default function intro(s, c) {
  const [printerArea, listingArea] = area.columns([1.05, 1], 'loose');
  const [first] = catalog;
  const { ticket, body, fed, policy, stock, policyRule, stockRule } = catalogPrinter(first, printerArea);
  const [identity, value, detail, decision] = listingArea.rows([1, 1.4, 0.6, 1.1], 'normal');
  const score = [
    place(label('Label printer   ·   ' + first.id, { size: 53 }), identity, 'bottom'),
    place(mono(first.match.toFixed(2), { size: 154, color: 'cyan' }), value),
    place(label('Highest text match'), detail, 'top'),
  ];
  const question = heading(c.title);
  const capacity = place(note('Room to score 3 listings', { size: 37 }), decision);
  const opening = [question, ticket, body, ...score, capacity];
  s.add(opening);
  s.play(fadeIn(opening, { duration: 0 }));
  s.play(to(ticket, node => node.moveTo(fed), { duration: 1.4, ease: linear }));
  s.at(0.84, () => s.play(to(stock, node => node.opacity(1), { duration: 0.13 })));
  s.at(1.29, () => s.play(to(policy, node => node.opacity(1), { duration: 0.13 })));
  c.on('printer-stock', () => s.play(draw(stockRule, { duration: 0.28 })));
  c.on('printer-block', () => s.play(draw(policyRule, { duration: 0.28 })));

  const reason = place(label('Skip P8   ·   policy block', { color: 'red' }), decision);
  c.swap('printer-policy', capacity, reason, { after: true });

  const [heads, board, footer] = area.rows([0.8, 5.5, 1], 'normal');
  const columns = region => region.columns([1.5, 1, 1.4], 'wide');
  const [checks, source, output] = columns(board);
  const inputs = source.rows(catalog.length, 'normal');
  const rules = checks.rows(catalog.length, 'normal');
  const eligible = catalog.filter(p => p.ok);
  const slots = output.rows(eligible.length, 'wide');
  const slips = catalog.map((p, i) => place(namedBox(p.id + '   ' + p.match.toFixed(2), {
    width: 254, height: 76, color: 'ink',
  }), inputs[i]));
  const pass = i => place(label('Eligible', { color: 'green' }), rules[i]);
  const headers = ['Catalog check', 'Listing · match', 'Ranker input'].map((name, i) =>
    place(label(name), columns(heads)[i]));
  const outlines = slots.map(r => place(rect(290, 93, {
    dash: [10, 8], fill: null, stroke: 'dim', radius: 8,
  }), r));
  c.swap('printer-catalog', [question, ticket, body, stockRule, policyRule, ...score, reason], [
    heading('Which printers reach the ranker?'), ...headers, ...slips, ...outlines,
    place(label('Policy block', { color: 'red' }), rules[0]),
  ]);
  c.show('printer-region', place(label('Outside delivery region', { color: 'red' }), rules[1]));
  const laneX = (source.cx + output.cx) / 2;
  for (const [slot, p] of eligible.entries()) {
    const i = catalog.indexOf(p);
    c.after('printer-' + p.id.toLowerCase(), () => {
      s.add(pass(i));
      s.play(to(slips[i], node => node.moveTo([laneX, inputs[i].cy]), { duration: 0.28 }),
        tint(slips[i], COLOR[p.id], { duration: 0.28 }), fadeOut(outlines[slot], { duration: 0.15 }));
      s.add(place(mono(p.id, { color: 'dim', size: 33 }), inputs[i]));
      s.play(to(slips[i], node => node.moveTo([laneX, slots[slot].cy]), { duration: 0.24 }));
      s.play(to(slips[i], node => node.moveTo(slots[slot].point('center')), { duration: 0.28 }));
    });
  }
  c.show('printer-next', label('The ranker orders these three.').moveTo([footer.cx, footer.top]));
}
