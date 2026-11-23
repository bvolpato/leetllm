import { assertEqual, column, passage, place } from 'vizmatic/stage';
import { heading, label, note } from '../../kit-narrated.mjs';
import { unknownSourceLabels } from '../../../films/production-retrieval/arithmetic.mjs';
import { answerFromEvidence, packParents } from '../../../films/production-retrieval/model.mjs';
import { carryIdentity, CORPUS, evidenceFrame, RULE, RUN } from '../parts.mjs';

export default function recordedModelFailure(s, c) {
  const f = evidenceFrame(c, { page: false });
  const [inputRoom, documents] = f.body.rows([1, 5], 'normal');
  const [left, right] = documents.columns([1, 1], 'loose');
  const record = (id) => CORPUS.find((item) => item.id === id);
  const keyRule = record('eu-key-v2').text, sessionRule = record('eu-session-v1').text;
  const sessionOnly = packParents(RUN.hits.filter((hit) => hit.record.documentId === 'eu-session'), RUN.caller);
  const source = (title, words, color) => passage(words, {
    width: left.width, title, titleSize: 32, size: 35, leading: 1.35, color,
  });
  const both = place(column([
    source('E1   ·   Key policy', keyRule, 'cyan'),
    source('E2   ·   Session policy', sessionRule, 'pink'),
  ], { gap: 'normal' }), left, 'top left');
  const one = place(source('E1   ·   Session policy', sessionRule, 'pink'), left, 'top left');
  const replay = (days, evidence, quote, expected) => {
    const unknown = unknownSourceLabels(quote, evidence.map((item) => item.sourceId));
    const checked = answerFromEvidence({
      intent: 'rotation_eligibility', staleDays: days, signalHours: RULE.requestHours,
    }, evidence);
    assertEqual(unknown.length, 0, 'all quoted labels exist');
    assertEqual(checked.decision, expected, 'checked decision for the supplied sources');
    return {
      input: place(label(days + ' days stale   /   ' + RULE.requestHours + '-hour signal', { color: 'yellow' }), inputRoom, 'left'),
      reply: place(passage(quote, { title: 'Recorded Qwen3-1.7B reply · excerpt', width: right.width,
        titleSize: 32, size: 37, leading: 1.35, color: 'blue' }), right, 'top left'),
      check: place(label('Unknown labels: ' + unknown.length + '      Checked answer: ' + checked.decision +
        (checked.cited.length ? '   [' + checked.cited[0] + ']' : ''), { size: 42 }), f.foot, 'left'),
    };
  };
  const ten = replay(RULE.requestDays, RUN.packed, 'Yes, it may rotate automatically [E1].', 'eligible');
  const fifteen = replay(RULE.outsideDays, RUN.packed,
    'The service-account key may rotate automatically because it is stale for less than 14 days and the risk signal is at most 48 hours old [E1].', 'ineligible');
  const sessions = replay(RULE.requestDays, sessionOnly,
    "The service-account key's risk signal is 48 hours old, which is less than the 30-day expiration for idle browser sessions [E1]. Therefore, it may rotate automatically.", 'abstain');
  const question = place(note('What key-rotation claim does this source support?', { size: 42, color: 'yellow' }), f.foot, 'left');
  s.add(heading(c.title), f.nodes, both, ten.input);
  carryIdentity(c, f);
  c.show('ten-reply', ten.reply);
  c.show('ten-check', ten.check, { after: true });
  c.swap('fifteen-input', ten.input, fifteen.input);
  c.hide('fifteen-input', [ten.reply, ten.check]);
  c.show('fifteen-reply', fifteen.reply);
  c.on('bad-comparison', () => s.play(fifteen.reply.select('less than 14 days')));
  c.show('fifteen-check', fifteen.check, { after: true });
  c.swap('back-to-ten', fifteen.input, sessions.input);
  c.hide('back-to-ten', [fifteen.reply, fifteen.check]);
  c.swap('session-only', both, one);
  c.show('ask-source', question);
  c.hide('last-reply', question);
  c.show('last-reply', sessions.reply);
  c.on('wrong-clock', () => s.play(sessions.reply.select('30-day expiration for idle browser sessions')));
  c.show('abstention', sessions.check, { after: true });
}
