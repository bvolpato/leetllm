import { boxOf, segmentedBar, place, tokens } from 'vizmatic/stage';
import { mono } from '../../kit-narrated.mjs';
import { chain } from '../../../films/prefix-reuse/arithmetic.mjs';
import { sampleModel } from '../../../films/prefix-reuse/model.mjs';
import { board, body, caption, readings } from '../parts.mjs';

export default function blockBoundaries(s, c) {
  const [old, edit] = [0, 2].map((beat) => sampleModel('block-boundaries', { beat, beatP: 0.9 }));
  board(s, c, 'How far can this request reuse?', 'Blocks of four · SHA-256 below each block');
  const [a, b, measure] = body.rows(3, 'normal');
  const options = {
    size: 39,
    minWidth: 88,
    even: true,
    color: 'blue',
    rowSize: 34,
    states: { kept: {}, fresh: { color: 'cyan', mark: 'bar' } },
  };
  const ref = place(tokens(old.stored, { ...options, label: 'Stored' }), a);
  const ask = place(tokens(old.tokens, { ...options, label: 'Input' }), b);
  const changed = place(
    tokens(edit.tokens, {
      ...options,
      label: 'Input',
      colors: edit.tokens.map((_, i) => (i === 2 ? 'pink' : 'blue')),
    }),
    b,
  );
  const left = boxOf(ask.token(0)).left;
  const right = boxOf(ask.token(old.tokens.length - 1)).right;
  const end = boxOf(ask.token(old.reused - 1)).right;
  const boundary = segmentedBar(
    [
      { name: 'match', value: 0, color: 'green' },
      { name: 'previous', value: 0, color: 'dim' },
    ],
    { width: right - left, max: right - left, labels: false, height: 38 },
  ).moveTo([(left + right) / 2, measure.cy]);
  const current = caption('Reuse boundary', measure, { align: 'left', size: 34 });
  const previous = caption('Previous match', measure, { align: 'left', size: 34, color: 'dim' });
  const digests = (strip, values) => {
    const blocks = Array.from({ length: values.length / old.blockSize }, (_, i) =>
      values.slice(i * old.blockSize, (i + 1) * old.blockSize),
    );
    return chain(blocks).map((hash, i) => {
      const first = boxOf(strip.token(i * old.blockSize));
      const last = boxOf(strip.token((i + 1) * old.blockSize - 1));
      return mono(hash.slice(0, 7), { size: 30, color: 'dim' }).moveTo([
        (first.left + last.right) / 2,
        last.bottom + 34,
      ]);
    });
  };
  const originalKeys = digests(ask, old.tokens),
    nextKeys = digests(changed, edit.tokens);
  s.add(ref, ask, digests(ref, old.stored), originalKeys, current, boundary);
  originalKeys.forEach((key, i) =>
    c.swap('early-edit', key, nextKeys[i], { after: true, lead: -i * 0.28 }),
  );
  c.on('four-token-block', () =>
    s.play(
      ...Array.from({ length: 3 }, (_, i) =>
        ref.span('b' + i, i * old.blockSize, (i + 1) * old.blockSize - 1, { color: 'blue' }),
      ),
    ),
  );
  c.after('ninth-match', () => s.play(ask.window(old.reused, old.exact - 1, { color: 'yellow' })));
  c.on('complete-boundaries', () => s.play(ask.window(null), { duration: 0.18 }));
  c.after('complete-boundaries', () =>
    s.play(boundary.resize('match', end - left), ask.window(0, old.reused - 1, { color: 'green' })),
  );
  c.on('matched-boundary', () => s.play(ref.window(0, old.reused - 1, { color: 'green' })));
  c.on('fresh-input', () => s.play(ask.mark((v, i) => i >= old.reused, 'fresh')));
  c.swap('early-edit', ask, changed);
  c.swap('early-edit', current, previous);
  c.on('early-edit', () =>
    s.play(ref.window(null), boundary.resize({ match: 0, previous: end - left }), {
      duration: 0.18,
    }),
  );
  c.swap('miss-chain', previous, current, { after: true });
  c.on('early-edit', () => s.play(changed.window(2, 2, { color: 'pink' })), 0.65);
  c.after('miss-chain', () => s.play(boundary.resize('previous', edit.reused)));
  readings(s, c, 'Which matching token still needs fresh computation?', [
    ['ninth-match', '9 matches, but its block differs.', 'yellow'],
    [
      'complete-boundaries',
      old.exact + ' matching token IDs   ·   ' + old.reused + ' reusable positions',
      'green',
      'early-edit',
    ],
    ['early-edit', 'Compare the first block again.', 'pink'],
    [
      'miss-chain',
      edit.exact + ' matching token IDs   ·   ' + edit.reused + ' reusable positions',
      'red',
    ],
  ]);
}
