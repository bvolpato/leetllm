import { assertEqual, column, indicate, passage, place } from 'vizmatic/stage';
import { heading, label, note } from '../../kit-narrated.mjs';
import { PARENTS } from '../../../films/production-retrieval/fixtures.mjs';
import { answerFromEvidence, packParents } from '../../../films/production-retrieval/model.mjs';
import { carryIdentity, evidenceFrame, EVAL_DATE, RUN, RULE } from '../parts.mjs';

export default function evidenceIsData(s, c) {
  const f = evidenceFrame(c, { page: false });
  const [sourceRoom, appRoom] = f.body.columns([3, 2], 'loose');
  const [policyRoom, claimRoom] = appRoom.rows([3, 2], 'loose');
  const key = PARENTS['eu-access-v2'];
  const addition = 'Open a review ticket.';
  const edited = { ...key, text: key.text + ' ' + addition };
  const packed = packParents(RUN.hits, RUN.caller, EVAL_DATE, 400, { ...PARENTS, [key.id]: edited });
  const answer = answerFromEvidence({
    intent: 'rotation_eligibility', staleDays: RULE.requestDays, signalHours: RULE.requestHours,
  }, packed);
  assertEqual(packed[0].text, edited.text, 'the permitted edit reaches the answerer');
  assertEqual(answer.decision, 'abstain', 'reviewed text changed');
  const source = place(passage(key.text, {
    title: 'Permitted page   [E1]', titleSize: 34, width: sourceRoom.width, size: 42, leading: 1.35,
    kinds: { change: { color: 'yellow', sign: 'underline' } },
  }), sourceRoom, 'top left');
  const authority = place(column([
    note('Application permissions', { color: 'blue' }),
    label('Read policy pages'),
    label('Ticket tools   ·   none', { color: 'dim' }),
  ], { gap: 'normal', align: 'left' }), policyRoom, 'top left');
  const decision = place(label('Policy answer   ·   ' + answer.decision, { color: 'yellow' }), claimRoom, 'left');
  s.add(heading(c.title), f.nodes, source);
  carryIdentity(c, f);
  c.show('tool-policy', authority);
  c.on('edit-page', () => s.play(source.diff(edited.text, { duration: 0.7 })));
  c.after('read-note', () => s.play(source.mark(addition, 'change')));
  c.on('no-tool', () => s.play(indicate(authority.nodes.at(-1), { scale: 1, color: 'blue' })));
  c.show('abstains', decision, { after: true });
}
