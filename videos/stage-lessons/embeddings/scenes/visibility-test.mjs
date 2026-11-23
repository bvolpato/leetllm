import { assertEqual, indicate, line, place, rect } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { occurrenceVisibility } from '../../../films/embeddings/arithmetic.mjs';

export default function visibilityTest(s, c) {
  const original = ['charge', 'the', 'phone'];
  const replacement = ['charge', 'the', 'invoice'];
  const [sentence, head, ...lanes] = area.rows([1.1, 0.65, 1, 1, 1, 1.3], 'normal');
  const fields = (r) => r.columns([1.55, 0.9, 0.9, 0.9, 1.25], 'normal');
  const words = (tokens) => place(mono(tokens.join('   '), { size: 55 }), sentence);
  const old = words(original),
    next = words(replacement);
  const labels = [
    'Read this state',
    'Position 0',
    'Position 1',
    'Position 2',
    'After the edit',
  ].map((h, i) => place(note(h), fields(head)[i]));
  const specs = [
    { name: 'Encoder at charge', causal: false, position: 0, cue: 'encoder' },
    { name: 'Causal at charge', causal: true, position: 0, cue: 'first' },
    { name: 'Causal at last word', causal: true, position: 2, cue: 'final' },
  ];
  const rows = specs.map(({ name, causal, position }, i) => {
    const cells = fields(lanes[i]);
    const visible = occurrenceVisibility(causal, position, original);
    const after = occurrenceVisibility(causal, position, replacement);
    const unchanged = visible.join(' ') === after.join(' ');
    assertEqual(unchanged, i === 1, 'visible inputs to ' + name);
    const token = (text, index, color) => place(label(text, { size: 44, color }), cells[index + 1]);
    const admitted = original.map((text, j) =>
      token(visible.includes(text) ? text : '×', j, visible.includes(text) ? 'blue' : 'dim'),
    );
    const focus = rect(cells[3].width - 18, cells[3].height - 18, {
      stroke: 'yellow',
      width: 3,
    }).moveTo(cells[3].point('center'));
    return {
      title: place(label(name, { size: 38 }), cells[0], 'left'),
      line: line(lanes[i].point('bottom left'), lanes[i].point('bottom right'), {
        stroke: 'grid',
        width: 2,
      }),
      admitted,
      focus,
      replacement: token('invoice', 2, 'cyan'),
      answer: place(
        label(unchanged ? 'Stays fixed' : 'May change', {
          size: 38,
          color: unchanged ? 'yellow' : 'ink',
        }),
        cells[4],
      ),
    };
  });
  const foot = lanes[3];
  const legend = place(
    note('Each row shows the tokens available at that position.  ×  blocks a read.'),
    foot,
  );
  const prompt = place(
    label('Which state must stay the same?', { size: 52, color: 'yellow' }),
    foot,
  );
  const condition = place(
    note('Deterministic evaluation  ·  fixed weights, prefix IDs and positions'),
    foot,
  );
  s.add(
    heading(c.title),
    old,
    labels,
    legend,
    rows.map((r) => [r.title, r.line]),
  );
  rows.forEach((r, i) => c.show(specs[i].cue, r.admitted));
  c.swap(
    'replace',
    [old, rows[0].admitted[2], rows[2].admitted[2]],
    [next, rows[0].replacement, rows[2].replacement],
  );
  c.swap('ask', legend, prompt);
  c.show(
    'ask',
    rows.map((r) => r.focus),
  );
  c.swap('fixed', prompt, condition);
  c.show('fixed', rows[1].answer);
  c.show('permitted', [rows[0].answer, rows[2].answer]);
  c.on('choose', () => s.play(indicate(rows[2].title, { color: 'yellow', scale: 1 })));
}
