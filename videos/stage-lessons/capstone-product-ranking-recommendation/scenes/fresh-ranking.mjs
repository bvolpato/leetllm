import { assertEqual, dot, place, rect, to } from 'vizmatic/stage';
import { label, mono, namedBox, note } from '../../kit-narrated.mjs';
import { buildCurrentSlate } from '../../../films/capstone-product-ranking-recommendation/model.mjs';
import { COLOR, open } from '../parts.mjs';

export default function freshRanking(s, c) {
  const [lead, header, board, situation, question] = open(s, c).rows([0.85, 0.65, 4.3, 0.65, 0.95], 'wide');
  const split = r => r.columns([1.5, 0.83, 0.83], 'loose');
  const [catalog, proposed, issued] = split(board);
  const lamps = [
    ['J1', 0.8, 0.2, 'B'], ['J2', 0.7, 0.9, 'A'], ['J3', 0.6, 0.6, 'A'], ['J5', 0.5, 0.3, 'A'],
  ].map(([id, match, quality, seller]) => ({
    id, match, quality, seller, stock: true, allowed: true, score: -0.1 * match + 1.2 * quality,
  }));
  const before = buildCurrentSlate(lamps);
  const current = lamps.map(p => ({ ...p, stock: p.id !== 'J3' }));
  const after = buildCurrentSlate(current);
  assertEqual(before.map(p => p.id).join(','), 'J2,J3,J1', 'Lamp proposal under the seller cap');
  assertEqual(after.map(p => p.id).join(','), 'J2,J5,J1', 'Lamp response after the stock update');

  const columns = r => r.columns([0.85, 0.95, 1.05, 0.9, 1.05], 'normal');
  const [tableHead, proposalHead, responseHead] = split(header);
  const fieldHeads = ['Lamp', 'Match', 'Quality', 'Seller', 'Score'].map((name, i) => place(note(name), columns(tableHead)[i]));
  const table = [], scores = [];
  const itemRows = catalog.rows(lamps.length, 'wide');
  for (const [i, p] of lamps.entries()) {
    const [id, match, quality, seller, score] = columns(itemRows[i]);
    table.push(place(mono(p.id, { color: COLOR[p.id] }), id), place(mono(p.match.toFixed(1)), match),
      place(mono(p.quality.toFixed(1)), quality), place(mono(p.seller), seller));
    scores.push(place(mono(p.score.toFixed(2), { color: COLOR[p.id] }), score));
  }
  const toSlots = region => region.rows(3, 'wide').map(r => {
    const [rank, box] = r.columns([0.6, 2.5], 'normal');
    return { rank, box };
  });
  const proposalSlots = toSlots(proposed), issuedSlots = toSlots(issued);
  const frames = slots => slots.map(({ rank, box }, i) => [
    place(mono(String(i + 1), { size: 33, color: 'dim' }), rank),
    place(rect(box.width - 10, 90, { fill: null, stroke: 'dim', dash: [8, 7], radius: 8 }), box),
  ]);
  const formula = place(mono('Lamp score = −0.1 × match + 1.2 × quality', { size: 42 }), lead, 'left');
  const cap = place(label('3 places    ·    At most 2 lamps per seller', { size: 39 }), situation);
  const pending = place(note('Awaiting recheck'), responseHead);
  s.add(formula, fieldHeads, table, place(label('Proposed', { size: 38 }), proposalHead), frames(proposalSlots), pending, frames(issuedSlots), cap);
  c.show('lamp-scores', scores);
  const slotQuestion = place(label('Which lamp takes the third place?', { color: 'yellow' }), question);
  const token = (p, slot) => place(namedBox(p.id + '    ' + p.seller, {
    width: slot.width - 28, height: 74, color: COLOR[p.id],
  }), slot);
  const proposedCards = before.map((p, i) => token(p, proposalSlots[i].box));
  c.show('lamp-two', proposedCards.slice(0, 2));
  c.show('lamp-third-question', slotQuestion);
  const skipped = place(note('Seller A already has both places.'), question);
  c.swap('lamp-skip', slotQuestion, skipped);
  c.show('lamp-third', proposedCards[2], { after: true });
  const sold = place(mono('J3 sold out   ·   score still ' + lamps[2].score.toFixed(2), { color: 'red', size: 41 }), lead, 'left');
  const rebuild = place(label('Which lamp can take place two now?', { color: 'yellow' }), question);
  const liveHeading = place(label('Rebuild', { size: 38 }), responseHead);
  c.swap('lamp-stock', [formula, skipped, pending], [sold, rebuild, liveHeading]);
  const responseCards = after.map((p, i) => token(p, issuedSlots[i].box));
  for (const [i, cue] of [[0, 'lamp-hold'], [2, 'lamp-hold-third']]) {
    const from = proposalSlots[i].box, into = issuedSlots[i].box;
    const y = from.cy - 31;
    const mark = dot(8, COLOR[after[i].id]).at(from.right - 28, y);
    c.on(cue, () => {
      s.add(mark);
      s.play(to(mark, n => n.moveTo([into.cx, y]), { duration: 0.6 }));
      s.remove(mark);
      s.add(responseCards[i]);
    });
  }
  c.show('lamp-substitute', responseCards[1], { after: true });
  const stamp = place(note('L17 · 12:00 UTC · catalog v2 · seller cap 2 · lamp ranker v1'), situation);
  c.swap('lamp-serve', [cap, rebuild, liveHeading], [stamp, place(label('L17 · returned', { size: 38 }), responseHead)]);

  const ids = new Map(after.map((p, i) => [p.id, i + 1]));
  const events = [
    { id: 'E31', time: '12:01', request: 'L17', product: 'J3' },
    { id: 'E32', time: '12:02', request: 'L17', product: 'J5' },
  ];
  const letters = catalog.rows(2, 'wide');
  const eventCols = r => r.columns([1, 1.2, 1, 1], 'normal');
  const eventHead = ['Event', 'UTC', 'Request', 'Lamp'].map((v, i) => place(note(v), eventCols(tableHead)[i]));
  const packets = events.flatMap((e, i) => [e.id, e.time, e.request, e.product].map((v, j) =>
    place(mono(v, { size: 35 }), eventCols(letters[i])[j], 'top')));
  const ask = place(label('Which click matches the returned order?', { color: 'yellow' }), question);
  c.swap('lamp-events', [sold, ...fieldHeads, ...table, ...scores], [
    place(label('Two click receipts for L17'), lead, 'left'), eventHead, ...packets, ask,
  ]);
  events.forEach((e, i) => {
    const position = e.request === 'L17' ? ids.get(e.product) : undefined;
    const verdict = position ? 'Matches position ' + position : 'Absent from L17';
    c.show(i ? 'lamp-valid' : 'lamp-absent', place(label(verdict, { color: position ? 'green' : 'red' }), letters[i]));
  });
  const matched = issuedSlots[ids.get('J5') - 1].box;
  c.show('lamp-valid', place(rect(matched.width, 102, { fill: null, stroke: 'yellow', radius: 8 }), matched));
  const display = place(note('Client render receipt → what appeared on screen'), question);
  c.swap('lamp-valid', ask, display, { after: true });
  const click = events[1];
  const joined = [click.id, click.request, click.product, 'position ' + ids.get(click.product)].join('   ·   ');
  c.swap('lamp-file', [display, stamp], place(mono(joined, { color: 'green', size: 40 }), situation));
}
