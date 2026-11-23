import { group, place, rect } from 'vizmatic/stage';
import { area, heading, label, mono } from '../../kit-narrated.mjs';
import { ARM, COLORS, captions, diff, pct, rate, tally } from '../parts.mjs';
import { freshAuditFixture } from '../../../films/causality/model.mjs';

export default function freshAudit(s, c) {
  const full = freshAuditFixture(0).arms.map((arm) => arm.full);
  const first = full.map((arm, i) => arm.filter((t) => i === 0 || !t.resolved));
  const reversed = freshAuditFixture(1).arms.map((arm) => arm.selected);
  const difference = (arms) => rate(arms[0]) - rate(arms[1]);
  const fraction = (arm) => tally(arm) + '/' + arm.length + ' = ' + pct(rate(arm));
  const [body] = area.rows([8, 1], 'normal');
  const columns = body.columns(2, 'wide');
  const selectedTiles = [[], []];
  const selectedFields = [];
  const headings = [];
  const verdicts = [];
  s.add(heading(c.title));

  columns.forEach((column, side) => {
    const [head, ...bands] = column.rows([0.8, 2.3, 2.3, 0.8], 'normal');
    headings.push((words) => place(label(words, { size: 42 }), head));
    verdicts.push((words) => place(label(words, { size: 41, color: 'yellow' }), bands[2]));
    full.forEach((arm, i) => {
      const [armLabel, top, bottom] = bands[i].rows([0.9, 1, 1], 'tight');
      s.add(place(label(ARM[i], { size: 37, color: COLORS[i] }), armLabel, 'left'));
      const count = (words) => place(mono(words, { size: 36 }), armLabel, 'right');
      if (side) selectedFields.push(count);
      else s.add(count(fraction(arm)));
      const slots = [top, bottom].flatMap((row) => row.columns(10, 'tight'));
      arm.forEach((ticket, j) => {
        const slot = slots[j];
        const w = slot.width - 3;
        const h = slot.height - 4;
        const tile = rect(w, h, { fill: ticket.resolved ? 'green' : 'red', stroke: null, radius: 6 });
        const node = group(tile, mono(ticket.id, { size: 30, color: 'bg' })).moveTo(slot.point());
        if (side) {
          s.add(rect(w, h, { fill: null, stroke: 'dim', width: 2, radius: 6 }).moveTo(slot.point()));
          selectedTiles[i].push(node);
        }
        s.add(node);
      });
    });
  });

  const both = (arms) => selectedFields.map((field, i) => field(fraction(arms[i])));
  const successes = full.map((arm, i) =>
    arm.flatMap((t, j) => t.resolved ? [selectedTiles[i][j]] : []));
  const stage = ['Copy of all tickets', 'Keep assistant or failure', 'Keep control or failure', 'Reconcile with all tickets']
    .map(headings[1]);
  s.add(headings[0]('Original 24-hour outcomes'), stage[0]);
  const initial = both(full);
  c.show('equal', initial, { after: true, lead: 0 });
  c.show('equal', verdicts[0]('Full difference   ' + diff(difference(full))), { after: true, lead: 0 });
  c.swap('first-rule', stage[0], stage[1]);
  c.after('drop-control', () => s.remove(initial, successes[1]));
  const firstResult = [...both(first), verdicts[1]('Audit difference   ' + diff(difference(first)))];
  c.show('first-gap', firstResult, { after: true, lead: 0 });
  // Put every original record back before asking about the second rule.
  c.hide('rewind', firstResult);
  c.swap('rewind', stage[1], stage[0]);
  c.show('rewind', successes[1]);
  c.swap('reverse', stage[0], stage[2]);
  c.hide('filter', successes[0], { fade: 0.6, lead: 0 });
  const secondRates = both(reversed);
  c.show('control', secondRates[1], { after: true, lead: 0 });
  c.show('assistant', secondRates[0], { after: true, lead: 0 });
  const secondGap = verdicts[1]('Audit difference   ' + diff(difference(reversed)));
  c.show('gap', secondGap, { after: true, lead: 0 });

  c.swap('recover', stage[2], stage[3]);
  c.hide('recover', [secondRates[0], secondGap]);
  c.show('recover', successes[0], { after: true, stagger: 0.21, fade: 0.22, lead: 0 });
  c.show('recount', selectedFields[0](fraction(full[0])), { after: true, lead: 0 });
  c.show('recount', verdicts[1]('Reconciled difference   ' + diff(difference(full))), { after: true, lead: 0 });
  captions(s, c, 'Green tickets resolved. Every copy keeps its original ID and 24-hour outcome.', [
    ['first-rule', 'Keep every assistant ticket and every failure. Which successes drop out?'],
    ['drop-control', 'The filter dropped the eight control successes.', true],
    ['rewind', 'Restore the complete log before changing the rule.'],
    ['reverse', 'Keep every control ticket and every failure. What is assistant minus control?'],
    ['recover-question', 'Which missing ticket IDs would you request before acting on the audit?'],
    ['recover', 'Match the missing assistant successes to their original IDs.'],
    ['decision', 'Recover the eligible tickets and compare both workflows at the same horizon.'],
  ]);
}
