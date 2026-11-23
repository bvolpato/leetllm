import { boxOf, passage, place, to } from 'vizmatic/stage';
import { C, bench, evidence, field, openBench, records, short } from '../parts.mjs';

export default function sourceEvidence(s, c) {
  openBench(s, c, 'Which wording can the agent put in the reply?');
  const [top, lower, foot] = bench.rows([3, 3.6, 1], 'normal');
  const doc = (slot, title, wording, color) => place(passage(wording, {
    title, color, width: slot.width - 24, size: 41, titleSize: 32, leading: 1.3,
  }), slot);
  const source = doc(top, 'Reviewed source   ·   ' + evidence.policyId, evidence.policy, C.stored);
  const alongsideTable = boxOf(source).point('center');
  source.moveTo(bench.point('center'));
  const title = 'Proposed answer   ·   ' + evidence.policyId;
  const accepted = doc(lower, title, evidence.policy, C.ticket);
  const altered = doc(lower, title, evidence.policy.replace('require manager', 'recommend manager'), C.ticket);
  const draft = doc(lower, 'Cited draft   ·   ' + evidence.policyId, evidence.policy, C.effect);
  const queries = records(lower, [
    ['id', 'Question', 0.55], ['out', 'Fixture response', 0.45],
  ], [{ id: 'Ticket wording' }, { id: 'Private note' }, { id: 'Paraphrase' }], { size: 35 });
  const compare = field(foot, 'Host check   ·   status, answer, citation, question, policy hash', 'dim', 34);
  const ask = field(foot, 'Would you hand this answer to the customer?', C.active);
  const rejected = field(foot, 'Rejected   ·   the answer changed a requirement', C.blocked);
  const hash = field(foot, 'Same policy bytes   ·   SHA-256   ' + short(evidence.policyHash) + '…', C.stored);
  const context = field(foot, 'Host lookup   ·   A300   ·   prod-api', C.stored);
  s.add(source);
  c.on('source-evidence-b1', () => s.play(source.select('identity verification')));
  c.on('privileged-condition', () => s.play(source.select('require manager approval')));
  c.on('exact-question', () => s.play(to(source, (n) => n.moveTo(alongsideTable), { duration: 0.55 })), -0.8);
  c.show('exact-question', queries);
  c.after('exact-question', () => s.play(queries.setCell('Ticket wording', 'out', 'grounded')));
  c.after('both-abstain', () => s.play(queries.setCell('Private note', 'out', 'abstain'),
    queries.setCell('Paraphrase', 'out', 'abstain')));
  c.swap('source-evidence-b2', queries, [accepted, compare]);
  c.swap('edit-word', accepted, altered, { lead: 0, fade: 0.1 });
  c.on('edit-word', () => s.play(altered.select('recommend manager approval')), 0.35);
  c.swap('check-question', compare, ask);
  c.swap('forged-answer', ask, rejected, { after: true });
  c.swap('hash-bytes', rejected, hash);
  c.swap('restore-word', altered, accepted);
  c.swap('admit-context', hash, context);
  c.swap('copy-evidence', accepted, draft, { after: true });
}
