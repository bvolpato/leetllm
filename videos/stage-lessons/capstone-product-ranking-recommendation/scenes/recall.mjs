import { place, rect, to } from 'vizmatic/stage';
import { label, mono, namedBox, note } from '../../kit-narrated.mjs';
import { relevantRecall } from '../../../films/capstone-product-ranking-recommendation/model.mjs';
import { COLOR, dcg, open, ORDERING_PRODUCTS } from '../parts.mjs';

export default function recall(s, c) {
  const [rule, original, result, question, measure, arithmetic] = open(s, c).rows([0.7, 1.3, 1.6, 0.85, 0.6, 1.1], 'wide');
  const cols = r => r.columns([1.25, 1, 1, 1], 'wide');
  const [, ...idealSlots] = cols(original);
  const [returnedTitle, ...slots] = cols(result);
  const fixed = [...ORDERING_PRODUCTS].sort((a, b) => b.grade - a.grade);
  const card = (item, i, row) => place(namedBox(item.id + '   grade ' + item.grade, {
    width: 295, height: 84, color: COLOR[item.id],
  }), row[i]);
  s.add(place(note('Label printer · NDCG at 3 · recall counts eligible grades 2 and 3'), rule, 'left'),
    place(label('Ideal order', { size: 40 }), cols(original)[0], 'left'),
    place(label('Returned order', { size: 40 }), returnedTitle, 'left'),
    fixed.map((p, i) => card(p, i, idealSlots)),
    slots.map(r => place(rect(310, 96, { stroke: 'dim', fill: null, dash: [8, 7], radius: 6 }), r)));
  const initial = fixed.map((p, i) => card(p, i, slots));
  s.add(initial);
  const survivorRows = fixed.filter(p => p.id !== 'P6');
  const ideal = dcg(fixed.map(p => p.grade));
  const returned = dcg(survivorRows.map(p => p.grade));
  const coverage = rows => {
    const { numerator, denominator } = relevantRecall(rows.map(p => p.id));
    return numerator + ' / ' + denominator;
  };
  const [recHead, scoreHead] = measure.columns([1, 2], 'wide');
  const [recLine, scoreLine] = arithmetic.columns([1, 2], 'wide');
  const missing = place(label('P6 is absent. Could any scoring weights bring it back?', { color: 'yellow' }), question);
  c.hide('drop-printer', initial[1], { fade: 0.18 });
  c.on('drop-printer', () => s.play(to(initial[2], n => n.moveTo(slots[1].point('center')), { duration: 0.6 })), 0.22);
  c.show('drop-question', missing);
  const repair = place(label('Restore P6 to the candidate set.', { color: 'cyan' }), question);
  c.swap('drop-repair', missing, repair, { after: true });
  c.show('drop-count', place(note('Relevant products retrieved'), recHead));
  const half = place(mono(coverage(survivorRows), { size: 58, color: 'yellow' }), recLine);
  c.show('drop-count', half, { after: true });
  const localHead = place(note('Returned gain ÷ best gain among survivors'), scoreHead);
  const terms = scoreLine.columns([1, 0.3, 1, 0.3, 1], 'normal');
  const term = (i, text, color = 'ink') => place(mono(text, { size: 48, color }), terms[i]);
  const numerator = term(0, returned.toFixed(3));
  const localIdeal = term(2, returned.toFixed(3)), perfect = term(4, '1.000');
  c.show('drop-survivors', localHead);
  c.show('drop-survivors', [numerator, term(1, '÷'), localIdeal, term(3, '=')]);
  c.show('drop-perfect', perfect, { after: true });
  const fixedHead = place(note('Returned gain ÷ best gain among all eligible judgments'), scoreHead);
  const unknownIdeal = term(2, '?', 'yellow');
  const full = term(4, (returned / ideal).toFixed(3), 'yellow');
  c.swap('drop-reference', [localHead, localIdeal, perfect], [fixedHead, unknownIdeal]);
  c.swap('drop-ideal', unknownIdeal, term(2, ideal.toFixed(3), 'yellow'), { after: true });
  c.show('drop-fixed', full, { after: true });

  const ready = place(label('P6 retrieved again'), question);
  const changedScore = place(mono('Rank scores    P5  0.96      P6  0.20      P4  0.45', { size: 38 }), question);
  const restored = card(fixed[1], 1, slots);
  const unknownRecall = place(mono('? / 2', { size: 58, color: 'dim' }), recLine);
  const unknownGain = term(0, '?', 'dim');
  c.swap('restore-printer', [repair, half, numerator, full], [ready, unknownRecall, unknownGain]);
  c.on('restore-printer', () => s.play(to(initial[2], n => n.moveTo(slots[2].point('center')), { duration: 0.45 })));
  c.show('restore-printer', restored, { lead: -0.48 });
  c.swap('demote-input', ready, changedScore);
  const promotion = (node, slot, lift) => to(node, n => n.moveTo([slot.cx, slot.cy + lift]), { duration: 0.32 });
  c.on('demote-printer', () => {
    s.play(promotion(restored, slots[1], -53), promotion(initial[2], slots[2], 53));
    s.play(promotion(restored, slots[2], -53), promotion(initial[2], slots[1], 53));
    s.play(promotion(restored, slots[2], 0), promotion(initial[2], slots[1], 0));
  });
  const challenge = place(label('P6 is third. Repair retrieval or repair the order?', { color: 'yellow' }), question);
  c.swap('demote-question', changedScore, challenge);
  const reordered = [fixed[0], fixed[2], fixed[1]];
  c.swap('demote-count', unknownRecall, place(mono(coverage(reordered), { size: 58, color: 'green' }), recLine), { after: true });
  const newGain = dcg(reordered.map(p => p.grade));
  c.swap('demote-score', unknownGain, [term(0, newGain.toFixed(3)), term(4, (newGain / ideal).toFixed(3))], { after: true });
  c.swap('demote-answer', challenge, place(label('Restore P6’s ranking score to move it above P4.', { color: 'cyan' }), question), { after: true });
}
