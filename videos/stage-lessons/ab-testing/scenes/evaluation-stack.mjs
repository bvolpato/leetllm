import { assertEqual, place } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { receiptMismatches } from '../../../films/ab-testing/model.mjs';

export default function evaluation(s, c) {
  const [columns, first, second, score, foot] = area.rows([1, 1.5, 1.5, 1.1, 1], 'normal');
  function calibrationRow(region, words, color = 'ink') {
    const slots = region.columns([2.15, 1, 1, 0.85], 'normal');
    return words.map((word, i) =>
      place(label(word, { size: 37, color: i === 3 ? color : 'ink' }), slots[i]),
    );
  }
  const heads = calibrationRow(columns, [
    'Practice answer',
    'Human label',
    'Judge label',
    'Agreement',
  ]);
  const samples = [
    { answer: '“Acknowledgement is required.”', human: 'Supported', judge: 'Supported' },
    { answer: '“Acknowledgement alone is enough.”', human: 'Unsupported', judge: 'Supported' },
  ];
  const matches = samples.map((r) => r.human === r.judge);
  const rows = samples.map((r, i) =>
    calibrationRow(
      i ? second : first,
      [r.answer, r.human, r.judge, matches[i] ? 'Match' : 'Disagree'],
      matches[i] ? 'green' : 'yellow',
    ),
  );
  const agreement = place(
    mono(matches.filter(Boolean).length + ' of 2 labels agree', { size: 53 }),
    score,
  );
  const question = place(
    label('How many judge labels agree with the human reviewer?', { color: 'yellow' }),
    score,
  );
  const runbook = place(note('Cited runbook   ·   rollback requires owner acknowledgement'), foot);
  s.add(
    heading(c.title),
    heads,
    runbook,
    rows.map((r) => r[0]),
  );
  c.show(
    'human',
    rows.map((r) => r[1]),
  );
  c.show(
    'judge',
    rows.map((r) => r[2]),
  );
  c.show('ask', question);
  c.swap('compare', question, [rows.map((r) => r[3]), agreement], { after: true });

  const control = {
    index: 'runbooks-2026-05-01',
    generator: 'incident-generator-v7',
    prompt: 'incident-generator-prompt-v3',
    decoder: { selection: 'greedy', schema: 'incident-answer-v2' },
  };
  const changed = { ...control, decoder: { ...control.decoder, schema: 'incident-answer-v3' } };
  assertEqual(receiptMismatches(control, { ...control }).length, 0, 'matched receipt');
  const mismatch = receiptMismatches(control, changed);
  assertEqual(mismatch.join(', '), 'decoder', 'changed decoder receipt');
  const [table, result] = area.rows([5, 1], 'wide');
  const lines = table.rows(5, 'normal');
  function receiptLine(region, texts, header = false) {
    const cols = region.columns([0.75, 1.7, 1.7], 'normal');
    return texts.map((txt, i) =>
      place(
        header || !i
          ? label(txt, { size: 37 })
          : mono(txt, { size: 34, color: i === 1 ? 'cyan' : 'blue' }),
        cols[i],
      ),
    );
  }
  const keys = Object.keys(control);
  const receipts = [
    receiptLine(lines[0], ['Pinned field', 'Control', 'Rewrite'], true),
    ...keys.map((key, i) => {
      const value =
        key === 'decoder'
          ? control.decoder.selection + ' / ' + control.decoder.schema
          : control[key];
      return receiptLine(lines[i + 1], [key, value, value]);
    }),
  ];
  const bad = place(
    mono('greedy / ' + changed.decoder.schema, { size: 34, color: 'yellow' }),
    lines[4].columns([0.75, 1.7, 1.7], 'normal')[2],
  );
  const ok = place(label('Declared fields match', { color: 'cyan' }), result);
  const reject = place(
    mono("ValueError: unplanned changes: ['" + mismatch[0] + "']", { size: 43, color: 'yellow' }),
    result,
  );
  c.swapAll('config', [heading('Did both arms get the promised system?'), receipts, ok]);
  c.hide('schema', ok);
  c.swap('schema', receipts[4][2], bad);
  c.show('reject', reject, { after: true });
}
