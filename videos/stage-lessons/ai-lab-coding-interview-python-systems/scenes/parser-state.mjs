import { codeBlock, place, table } from 'vizmatic/stage';
import { heading, label, mono } from '../../kit-narrated.mjs';
import { BOARD, FOOT, parserTrace } from '../parts.mjs';

export default function scene(s, c) {
  const ownerQuestion = heading(c.title);
  const lines = ['12:00|ERROR|GET|slow', ' timeout', 'broken header', ' retry'];
  const trace = parserTrace(lines);
  const [left, right] = BOARD.columns([5, 6], 'wide');
  const input = place(
    codeBlock(lines.join('\n'), { language: 'text', size: 46, leading: 1.9 }),
    left,
  );
  const record = place(
    table(
      [
        { key: 'field', label: 'parser' },
        { key: 'value', label: 'value', sample: trace[1].records[0].message },
      ],
      [
        { id: 'current', field: 'current record', value: 'None' },
        { id: 'message', field: 'saved message', value: null },
      ],
      { size: 38, width: right.width, maxRows: 2, leading: 2.5 },
    ),
    right,
  );
  const skipped = place(label('Skip retry. The saved message still ends in timeout.'), FOOT);
  s.add(ownerQuestion, input, record);
  c.on('ci-parser-state-0-build', () => s.play(input.focus(0, { duration: 0.35 })));
  c.after('parser-header', () =>
    s.play(
      record.setCell('current', 'value', 'record 1', { duration: 0.35 }),
      record.setCell('message', 'value', trace[0].records[0].message, { duration: 0.35 }),
    ),
  );
  c.on('parser-line', () => s.play(input.focus(1, { duration: 0.35 })));
  c.after('parser-tail', () =>
    s.play(record.setCell('message', 'value', trace[1].records[0].message, { duration: 0.35 })),
  );
  c.on('ci-parser-state-1-build', () => s.play(input.focus(2, { color: 'red', duration: 0.35 })));
  c.after('ci-parser-state-clear', () => s.play(record.setCell('current', 'value', 'None')));
  c.on('parser-orphan', () => s.play(input.focus(3, { color: 'yellow', duration: 0.35 })));
  c.show('parser-skip', skipped, { after: true });

  const header = lines[0];
  const split = header.indexOf('|', header.indexOf('|') + 1) + 1;
  const [first, rest] = [header.slice(0, split), header.slice(split)];
  const [chunkTitle, chunkOne, chunkTwo] = left.rows([1, 1.5, 1.5], 'normal');
  const chunkHead = place(label('Incoming chunks'), chunkTitle);
  const firstChunk = place(mono(JSON.stringify(first), { color: 'blue' }), chunkOne);
  const nextChunk = place(mono(JSON.stringify(rest + '\n'), { color: 'cyan' }), chunkTwo);
  const buffer = place(
    table(
      [
        { key: 'field', label: 'streaming parser' },
        { key: 'value', label: 'value', sample: header },
      ],
      [
        { id: 'line', field: 'line buffer', value: 'empty' },
        { id: 'message', field: 'saved message', value: null },
      ],
      { size: 37, width: right.width, maxRows: 2, leading: 2.5 },
    ),
    right,
  );
  c.swap(
    'ci-parser-state-2-build',
    [ownerQuestion, input, record, skipped],
    [heading('What if a chunk ends halfway through the header?'), chunkHead, buffer],
  );
  c.show('parser-first-chunk', firstChunk);
  c.after('parser-stream', () => s.play(buffer.setCell('line', 'value', first)));
  c.show('parser-more', nextChunk);
  c.after('parser-more', () => s.play(buffer.setCell('line', 'value', first + rest)));
  c.after('parser-join', () =>
    s.play(
      buffer.setCell('line', 'value', 'empty'),
      buffer.setCell('message', 'value', trace[0].records[0].message),
    ),
  );
  const expected = place(label('Expected at every split: ' + trace[0].records[0].message), FOOT);
  c.show('parser-splits', expected);
}
