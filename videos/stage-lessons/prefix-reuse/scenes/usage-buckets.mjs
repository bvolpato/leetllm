import { assertEqual, place, table } from 'vizmatic/stage';
import { board, body, fmt, gauge, readings } from '../parts.mjs';

export default function usageBuckets(s, c) {
  const read = 2000,
    write = 400,
    ordinary = 200,
    total = 2600;
  assertEqual(read + write + ordinary, total, 'The buckets cover the input.');
  board(s, c, 'One input, two usage schemas', 'Accounting · input tokens');
  const [top, lower] = body.rows([1, 2], 'normal');
  const input = gauge(
    top,
    'Input tokens',
    [
      ['read', 0, 'green'],
      ['write', 0, 'blue'],
      ['ordinary', 0, 'cyan'],
    ],
    total,
  );
  const difference = fmt(total) + ' − ' + fmt(read) + ' − ' + fmt(write) + ' = ' + fmt(ordinary);
  const sum = fmt(read) + ' + ' + fmt(write) + ' + ' + fmt(ordinary) + ' = ' + fmt(total);
  const field = (name, count) => name + ' = ' + fmt(count);
  const rows = ['Read', 'Write', 'Ordinary', 'Total'].map((id) => ({ id, open: '', claude: '' }));
  const ledger = place(
    table(
      [
        { key: 'id', label: 'Bucket' },
        { key: 'open', label: 'OpenAI Responses', sample: field('cache_write_tokens', write) },
        { key: 'claude', label: 'Claude', sample: field('cache_creation_input_tokens', write) },
      ],
      rows,
      { width: lower.width * 0.95, size: 36 },
    ),
    lower,
  );
  s.add(input.nodes, ledger);
  for (const [key, n] of Object.entries({ read, write, ordinary }))
    c.after('usage-' + key, () => s.play(input.bar.resize(key, n)));
  const values = [
    ['usage-openai', 'Total', 'open', 'input_tokens', total],
    ['usage-cached', 'Read', 'open', 'cached_tokens', read],
    ['usage-cache-write', 'Write', 'open', 'cache_write_tokens', write],
    ['usage-claude-read', 'Read', 'claude', 'cache_read_input_tokens', read],
    ['usage-claude-write', 'Write', 'claude', 'cache_creation_input_tokens', write],
    ['usage-fields', 'Ordinary', 'claude', 'input_tokens', ordinary],
  ];
  for (const [cue, row, provider, name, count] of values) {
    c.after(cue, () => s.play(ledger.setCell(row, provider, field(name, count))));
  }
  c.after('usage-subtract', () => s.play(ledger.setCell('Ordinary', 'open', difference)));
  c.after('usage-claude', () => s.play(ledger.setCell('Total', 'claude', sum)));
  readings(s, c, 'Read, written, and ordinary input occupy separate portions.', [
    [
      'usage-total',
      fmt(read) +
        ' read + ' +
        fmt(write) +
        ' written + ' +
        fmt(ordinary) +
        ' ordinary = ' +
        fmt(total),
    ],
    ['usage-cached', 'Responses reports reads and writes in input_tokens_details.'],
    ['usage-subtract', 'Responses input_tokens counts the complete prompt.'],
    ['usage-claude', 'Claude input_tokens counts the ordinary portion.'],
  ]);
}
