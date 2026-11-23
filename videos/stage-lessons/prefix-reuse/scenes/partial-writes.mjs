import { assertEqual, boxOf, line, place, to } from 'vizmatic/stage';
import { mono, note } from '../../kit-narrated.mjs';
import { priceInput } from '../../../films/prefix-reuse/arithmetic.mjs';
import { board, body, caption, fmt, foot, gauge, guide, inputRates, longWriteRate, priceStrip } from '../parts.mjs';

export default function partialWrites(s, c) {
  board(s, c, 'Where should the write stop?', 'Input prices · units per token');
  const shared = 1024, tail = guide - shared;
  const price = (read, write, ordinary) => priceInput([{ read, write, ordinary }], inputRates);
  const first = price(0, guide, 0), later = price(shared, tail, 0);
  const revisedFirst = price(0, shared, tail), revisedLater = price(shared, 0, tail);
  const all = first + 3 * later, repair = revisedFirst + 3 * revisedLater, cold = 4 * guide;
  assertEqual(Math.round(all * 10), 264672, 'Three partial hits still pay write premiums on four changing tails.');
  assertEqual(Math.round(repair * 10), 214912, 'Ordinary tails remove the repeated write premiums.');
  const legend = priceStrip([inputRates.ordinary, longWriteRate, inputRates.read]);
  c.take(legend);
  c.on('partial-rate', () => s.play(legend.setValue('rate', 1, inputRates.write)));

  const rows = body.rows(3, 'wide').slice(1).flatMap((band) => band.rows(2, 'normal'));
  const records = rows.map((band, i) => {
    const [track, receipt] = band.columns([2.25, 1.25], 'wide');
    const g = gauge(track, 'R' + (i + 1), [
      ['read', 0, 'green'], ['write', 0, 'blue'], ['tail', 0, 'pink'], ['ordinary', 0, 'cyan'],
    ], guide, { height: 42 });
    const box = boxOf(g.bar.frame);
    const edge = box.left + box.width * shared / guide;
    const marker = line([box.right, box.top - 12], [box.right, box.bottom + 12], {
      stroke: 'yellow', width: 6,
    });
    const divider = line([edge, box.top - 6], [edge, box.bottom + 6], { stroke: 'dim', width: 3 });
    const readCharge = fmt(price(shared, 0, 0));
    const writeCharge = fmt(price(0, tail, 0));
    const text = (str, color) => place(mono(str, { size: 30, color }), receipt, 'left');
    const readPart = text(readCharge + ' read', 'green');
    const parts = text(readCharge + ' + ' + writeCharge + ' write', 'ink');
    const total = text(i ? fmt(later) + ' units' : fmt(guide) + ' × 1.25 = ' + fmt(first), 'ink');
    const revised = text(fmt(i ? revisedLater : revisedFirst) + ' units', 'ink');
    return { ...g, box, edge, marker, divider, readPart, parts, total, revised };
  });
  const [lead, ...hits] = records;
  const labelY = lead.box.top - 38;
  const amounts = [
    note(fmt(shared) + ' repeat', { size: 32 }).moveTo([(lead.box.left + lead.edge) / 2, labelY]),
    note(fmt(tail) + ' change', { size: 32 }).moveTo([(lead.edge + lead.box.right) / 2, labelY]),
  ];
  s.add(records.map((r) => r.nodes));
  c.on('partial-rows', () => s.play(...records.map((r) => r.bar.resize('tail', guide))));
  c.show('partial-share', [...amounts, ...records.map((r) => r.divider)], { after: true });
  c.show('partial-end', records.map((r) => r.marker));
  c.after('partial-full-write', () => s.play(lead.bar.resize({ write: guide, tail: 0 })));
  c.on('partial-read-front', () => s.play(...hits.map((r) => r.bar.resize({ read: shared, tail }))));
  c.on('partial-tail', () => s.play(...hits.map((r) => r.bar.resize({ write: tail, tail: 0 }))));

  const [counter, balance] = foot.columns([1, 2.6], 'wide');
  const status = (words, color = 'ink') => caption(words, balance, { color, size: 40 });
  const hitCount = caption('3 of 4 requests read', counter, { size: 37, color: 'green' });
  const fixed = status(fmt(shared) + ' shared   /   ' + fmt(tail) + ' changing');
  const baseline = status('Cold bill   ' + fmt(cold) + ' units');
  const ask = status('Will three hits beat ' + fmt(cold) + ' units?', 'yellow');
  const over = status(fmt(all) + ' units   ·   ' + fmt(100 * (all / cold - 1)) + '% over cold', 'red');
  const under = status(fmt(repair) + ' units   <   ' + fmt(cold) + ' cold', 'green');
  c.show('partial-share', fixed, { after: true, lead: 0 });
  c.show('partial-hits', hitCount, { after: true, lead: 0 });
  c.swap('partial-cold', fixed, baseline, { after: true, lead: 0 });
  c.swap('partial-ask', baseline, ask);
  c.show('partial-read', hits[0].readPart, { after: true });
  c.swap('partial-write', hits[0].readPart, hits[0].parts, { after: true, lead: 0 });
  c.swap('partial-later-total', hits[0].parts, hits.map((r) => r.total), { after: true });
  c.show('partial-first', lead.total, { after: true });
  c.swap('partial-increase', ask, over, { after: true, lead: 0 });

  c.hide('partial-repair', [over, ...records.map((r) => r.total)]);
  c.on('partial-repair', () => s.play(...records.map((r) =>
    to(r.marker, (n) => n.moveTo([r.edge, r.box.cy]))), { duration: 0.8 }));
  c.after('partial-ordinary', () => s.play(...records.map((r, i) =>
    r.bar.resize({ write: i ? 0 : shared, ordinary: tail }))));
  c.show('partial-repaired-first', lead.revised, { after: true });
  c.show('partial-repaired-later', hits.map((r) => r.revised), { after: true });
  c.show('partial-repaired-total', under, { after: true, lead: 0 });
}
