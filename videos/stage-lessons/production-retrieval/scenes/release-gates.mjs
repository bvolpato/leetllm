import { assertEqual, column, indicate, passage, place, seq } from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import { releaseCases } from '../../../films/production-retrieval/model.mjs';
import { carryIdentity, evidenceFrame, RULE } from '../parts.mjs';

export default function releaseGates(s, c) {
  const f = evidenceFrame(c, { page: false });
  const [docs, testRoom] = f.body.rows([3, 1], 'wide');
  const [left, right] = docs.columns(2, 'loose');
  const cases = releaseCases();
  const control = cases.find((entry) => entry.id === 'current-rule').result;
  const altered = cases.find((entry) => entry.id === 'wrong-limit-mutation').result;
  const test = (candidate) => candidate.decision === control.decision &&
    candidate.cited.join() === control.cited.join() && candidate.text === control.text;
  assertEqual(test(control), true, 'frozen reply passes');
  assertEqual(test(altered), false, 'altered limit blocks the same case');
  const articleReply = (answer) => answer.text.replace(', signal age ', ', risk-signal age ');
  const document = (room, title, color) => place(passage(articleReply(control), {
    width: room.width, title, titleSize: 34, size: 42, leading: 1.4, color,
    kinds: { limit: { color: 'yellow', sign: 'underline' }, failed: { color: 'pink', sign: 'wavy' } },
  }), room, 'top left');
  const expected = document(left, 'Frozen expectation', 'cyan');
  const candidate = document(right, 'Candidate reply', 'blue');
  const runner = (call) => place(column([
    note('Article fixture  ·  same question, caller and policy'),
    mono(call, { size: 38 }),
  ], { gap: 'tight', align: 'left' }), testRoom, 'left');
  const normalRun = runner('run_case(CASES[0])');
  const candidateRun = place(note('Same frozen case   ·   candidate answerer', { size: 35 }), testRoom, 'left');
  const mutantRun = runner('run_case(CASES[0], answerer=wrong_limit)');
  const output = (words, color) => place(label(words, { color, size: 47 }), f.foot, 'left');
  const pass = output('PASS   ·   expected answer reproduced', 'green');
  const question = output('Should this candidate pass the same case?', 'yellow');
  const block = output('BLOCK   ·   stated limit differs from the policy', 'pink');
  s.add(heading(c.title), f.nodes, expected);
  carryIdentity(c, f);
  c.show('control', [candidate, normalRun]);
  c.show('control-result', pass, { after: true });
  c.hide('mutation', pass);
  c.swap('mutation', normalRun, candidateRun);
  c.on('mutation', () => s.play(seq(
    candidate.diff(articleReply(altered), { duration: 0.7 }),
    candidate.accept({ duration: 0.5 }),
  )));
  c.on('same-fields', () => s.play(candidate.select('[E1]'), expected.select('[E1]')));
  c.show('ask-gate', question);
  c.swap('blocked', question, block, { after: true });
  c.swap('blocked', candidateRun, mutantRun, { after: true });
  c.on('different-limit', () => s.play(expected.mark('limit ' + RULE.days, 'limit')));
  c.on('candidate-limit', () => s.play(candidate.mark('limit 30', 'failed')));
  c.on('investigate', () => s.play(indicate(expected, { scale: 1, color: 'cyan' })));
}
