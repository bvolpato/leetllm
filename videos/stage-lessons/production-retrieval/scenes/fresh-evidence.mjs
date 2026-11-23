import { assertEqual, indicate, place } from 'vizmatic/stage';
import { heading, label, note } from '../../kit-narrated.mjs';
import { answerFromEvidence } from '../../../films/production-retrieval/model.mjs';
import { eligibilityMap } from '../eligibility-map.mjs';
import { carryIdentity, evidenceFrame, RULE, RUN } from '../parts.mjs';

export default function freshEvidence(s, c) {
  const f = evidenceFrame(c, { page: false });
  const [plotRoom, recordRoom] = f.body.columns([3, 2], 'loose');
  const rows = recordRoom.rows([1, 1.5, 1.5, 1.5, 1.5], 'tight');
  const days = RULE.days - 1, hours = RULE.hours - 1, olderSignal = RULE.hours + 1;
  const map = eligibilityMap(plotRoom, days, hours);
  const source = RUN.packed.find((item) => item.documentId === 'eu-access');
  const checked = (signalHours, tombstone) => answerFromEvidence({
    intent: 'rotation_eligibility', staleDays: days, signalHours,
  }, RUN.packed.filter((item) => item.documentId !== tombstone));
  const original = checked(hours, null);
  const deleted = checked(hours, source.documentId);
  const changed = checked(olderSignal, null);
  assertEqual(original.decision, 'eligible', 'original draft');
  assertEqual(deleted.decision, 'abstain', 'current deletion with old bytes');
  assertEqual(changed.decision, 'ineligible', 'only the signal age crosses');
  const field = (row, words, color = 'ink') => place(label(words, { size: 40, color }), rows[row], 'left');
  const pointerC = field(1, 'Serving bundle   C');
  const pointerB = field(1, 'Serving bundle   B');
  const current = field(2, '[E1]   Key policy   ·   current', 'cyan');
  const tombstone = field(2, 'Key policy   ·   deleted', 'pink');
  const ages = field(3, days + ' days   /   ' + hours + ' hours', 'yellow');
  const changedAges = field(3, days + ' days   /   ' + olderSignal + ' hours', 'yellow');
  const draft = field(4, 'Draft from C   ·   ' + original.decision + '   [' + original.cited[0] + ']', 'blue');
  const discarded = field(4, 'Cached draft discarded', 'dim');
  const newRequest = field(4, 'Recheck both ages', 'blue');
  const footer = (words) => place(label(words, { size: 44 }), f.foot, 'left');
  const askCache = footer('Can Luna receive the cached answer?');
  const abstain = footer('Current response   ·   ' + deleted.decision);
  const askSignal = footer('What decision can Luna receive, and which source supports it?');
  const deny = footer('Current response   ·   ' + changed.decision + '   [' + changed.cited[0] + ']');
  const register = place(note('Serving record', { color: 'dim' }), rows[0], 'left');

  s.add(heading(c.title), f.nodes, map.axes, map.limits, register, pointerC, current);
  carryIdentity(c, f);
  c.show('fresh-ages', [map.point, ages]);
  c.show('cached-draft', draft);
  c.swap('tombstone', current, tombstone);
  c.hide('tombstone', map.limits);
  c.swap('roll-back', pointerC, pointerB);
  c.show('ask-cache', askCache);
  c.swap('discard-draft', draft, discarded, { after: true });
  c.hide('discard-draft', askCache);
  c.on('no-longer-applies', () => s.play(indicate(tombstone, { scale: 1, color: 'pink' })));
  c.show('no-answer', abstain, { after: true });
  c.hide('rewind', abstain);
  c.swap('rewind', [pointerB, tombstone, discarded], [pointerC, current, draft]);
  c.show('rewind', map.limits);
  c.on('older-signal', () => s.play(map.move(days, olderSignal)));
  c.swap('older-signal', [ages, draft], [changedAges, newRequest]);
  c.show('ask-signal', askSignal);
  c.swap('fresh-denial', askSignal, deny, { after: true });
  c.hide('fresh-denial', newRequest, { after: true });
}
