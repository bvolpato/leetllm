import { column, indicate, place, row, codeBlock } from 'vizmatic/stage';
import { area, heading, label, note } from '../../kit-narrated.mjs';
import { probes, checkProbe } from '../parts.mjs';

export default function checker(s, c) {
  const [rule, answer, work, foot] = area.rows([1, 1.4, 3.4, 0.8], 'normal');
  const [literal, reading] = work.columns([1.25, 1], 'normal');
  const [codeSlot, literalSlot] = literal.rows([2, 1], 'normal');
  const [meaningHead, meaningSlot] = reading.rows([2, 1], 'normal');
  const source = place(
    label('Library rule   ·   Borrowed books are due on Friday.', { color: 'cyan', size: 44 }),
    rule,
  );
  const answers = probes.map((p, i) => {
    const word = ['on', 'after', 'Fri.'][i];
    const index = p.answer.lastIndexOf(word);
    const words = [
      p.answer.slice(0, index).trim(),
      word,
      p.answer.slice(index + word.length).trim(),
    ];
    return place(
      row(
        words.map((part, j) =>
          part ? label(part, { size: 56, color: j === 1 ? 'yellow' : 'ink' }) : null,
        ),
        { gap: 12 },
      ),
      answer,
    );
  });
  const code = place(
    codeBlock('("books" in answer.lower()\n and "friday" in answer.lower())', {
      language: 'python',
      size: 41,
      panel: true,
    }),
    codeSlot,
  );
  const human = place(label('Reviewed deadline', { size: 36 }), meaningHead);
  const outputs = probes.map((p, i) => {
    const result = checkProbe(i);
    return {
      literal: place(
        column(
          [
            note(result.words.map((w) => w.word + (w.present ? ' ✓' : ' ×')).join('     ')),
            label(result.literal ? 'PASS' : 'FAIL', { color: result.literal ? 'green' : 'red' }),
          ],
          { gap: 'tight' },
        ),
        literalSlot,
      ),
      meaning: place(
        label(p.reviewed ? 'PASS' : 'FAIL', { color: p.reviewed ? 'green' : 'red' }),
        meaningSlot,
      ),
    };
  });
  const ask = place(
    label('Will the checker accept this answer?', { color: 'yellow', size: 43 }),
    foot,
  );
  const review = place(note('Compare each verdict with the reviewed answer'), foot);
  s.add(heading('Which deadline does this answer give?'), source, answers[0], human);
  c.show('checker-test', code);
  c.show('literal-first', outputs[0].literal, { after: true });
  c.show('review-first', outputs[0].meaning, { after: true });
  c.swap('later-answer', answers[0], answers[1]);
  c.hide('later-answer', [outputs[0].literal, outputs[0].meaning]);
  c.show('later-ask', ask);
  c.hide('later-literal', ask);
  c.show('later-literal', outputs[1].literal, { after: true });
  c.show('later-meaning', outputs[1].meaning, { after: true });
  c.swap('short-answer', answers[1], answers[2]);
  c.hide('short-answer', [outputs[1].literal, outputs[1].meaning]);
  c.show('short-meaning', outputs[2].meaning, { after: true });
  c.show('short-ask', ask);
  c.hide('short-literal', ask);
  c.show('short-literal', outputs[2].literal, { after: true });
  c.show('compare-probes', review);
  c.on('compare-probes', () =>
    s.play(indicate([outputs[2].literal, outputs[2].meaning], { scale: 1, color: 'yellow' })),
  );
}
