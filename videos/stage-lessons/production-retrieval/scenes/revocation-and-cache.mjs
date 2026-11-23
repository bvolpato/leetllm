import { assertEqual, column, connector, indicate, place } from 'vizmatic/stage';
import { heading, label, namedBox, note } from '../../kit-narrated.mjs';
import { answerFromEvidence } from '../../../films/production-retrieval/model.mjs';
import { carryIdentity, evidenceFrame, RULE, RUN } from '../parts.mjs';

export default function revocationAndCache(s, c) {
  const f = evidenceFrame(c, { page: false });
  const [sources, buffer] = f.body.columns([1, 1], 'loose');
  const sourceRows = sources.rows(2, 'wide');
  const cut = RUN.packed.find((item) => item.documentId === 'eu-session');
  // This replay uses a document-level grant. The reference fixture also tests loss of the whole EU role.
  const permittedNow = RUN.packed.filter((item) => item.documentId !== cut.documentId);
  const inputs = { intent: 'rotation_eligibility', staleDays: RULE.requestDays, signalHours: RULE.requestHours };
  const oldDraft = answerFromEvidence(inputs, RUN.packed);
  const newDraft = answerFromEvidence(inputs, permittedNow);
  assertEqual(oldDraft.cited.includes(cut.sourceId), false, 'session was supplied but uncited');
  assertEqual(newDraft.decision, 'eligible', 'the remaining reviewed rule supports a new answer');
  const record = (row, id, source, state, color) => place(column([
    label('[' + id + ']   ' + source, { color, size: 46 }), note(state, { size: 35 }),
  ], { gap: 'tight', align: 'left' }), sourceRows[row], 'left');
  const key = record(0, RUN.packed[0].sourceId, 'EU key rule', 'Permitted', 'cyan');
  const session = record(1, cut.sourceId, 'Session rule', 'Permitted', 'cyan');
  const revoked = record(1, cut.sourceId, 'Session rule', 'Read permission revoked', 'pink');
  const draft = (name, details, color) => place(column([
    note(name, { size: 34 }), namedBox(details, { width: buffer.width - 110, height: 160, size: 53, color }),
  ], { gap: 'normal', align: 'left' }), buffer);
  const buffered = draft('Draft awaiting delivery', oldDraft.decision + '   [E1]', 'blue');
  const discarded = draft('Original draft', 'Discarded', 'dim');
  const rebuilt = draft('Fresh answer from E1 alone', newDraft.decision + '   [' + newDraft.cited[0] + ']', 'blue');
  const keyInput = connector(key, buffered, { color: 'cyan' });
  const sessionInput = connector(session, buffered, { color: 'cyan' });
  const newInput = connector(key, rebuilt, { color: 'cyan' });
  const question = place(label('Can Luna receive this draft?', { color: 'yellow' }), f.foot, 'left');
  const answer = place(label('Rebuild from the sources Luna may read now.'), f.foot, 'left');
  s.add(heading(c.title), f.nodes, key, session);
  carryIdentity(c, f);
  c.show('both-passages', [buffered, keyInput, sessionInput]);
  c.on('both-passages', () => s.play(keyInput.pulse({ duration: 0.8 }), sessionInput.pulse({ duration: 0.8 })), 0.5);
  c.swap('revoke-session', session, revoked);
  c.show('ask-draft', question);
  c.hide('discard', [keyInput, sessionInput, question]);
  c.swap('discard', buffered, discarded, { after: true });
  c.show('rebuild', answer);
  c.swap('new-draft', discarded, rebuilt, { after: true });
  c.show('new-draft', newInput, { after: true });
  c.on('model-inputs', () => s.play(indicate(revoked.nodes, { scale: 1, color: 'pink' })));
  c.clear([keyInput, sessionInput, newInput], 0.7, 0.2);
}
