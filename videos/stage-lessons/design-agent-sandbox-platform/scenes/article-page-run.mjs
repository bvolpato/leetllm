import { arrow, assertEqual, boxOf, indicate, place } from 'vizmatic/stage';
import { area, heading, label, mono, namedBox } from '../../kit-narrated.mjs';
import { sandboxPages } from '../parts.mjs';

export default function scene(s, c) {
  const base = [10, 20, 30];
  const writes = [
    { clone: 'A', index: 1, value: 99 },
    { clone: 'B', index: 1, value: 52 },
    { clone: 'A', index: 1, value: 101 },
  ];
  const [start, first, both, again] = [0, 1, 2, 3].map((n) =>
    sandboxPages(base, writes.slice(0, n)),
  );
  assertEqual(first.kib, 16, 'A has one private page');
  assertEqual(both.kib, 20, 'both writers have a private page');
  assertEqual(again.privateCount, 2, 'a replacement reuses the same private entry');
  const [head, a, backing, b, action, foot] = area.rows([0.65, 1.2, 1.2, 1.2, 0.75, 0.6], 'normal');
  const cols = (region) => region.columns([1.35, 1, 1, 1, 1.35], 'normal');
  const headers = ['Owner', 'Page 0', 'Page 1', 'Page 2', 'Read at index 1'].map((v, i) =>
    place(label(v, { size: 33, color: i === 2 ? 'yellow' : 'dim' }), cols(head)[i]),
  );
  const title = (r, name, color) => place(label(name, { color, size: 42 }), cols(r)[0]);
  const cell = (r, i, value, color, empty = false) => {
    const slot = cols(r)[i + 1];
    return place(
      namedBox(String(value), { width: slot.width - 16, height: 86, color, size: 46, dash: empty }),
      slot,
    );
  };
  const read = (r, v, color) => place(mono(String(v), { size: 50, color }), cols(r)[4]);
  const shared = base.map((v, i) => cell(backing, i, v, 'green'));
  const aVacant = base.map((_, i) => cell(a, i, '·', 'dim', true));
  const bVacant = base.map((_, i) => cell(b, i, '·', 'dim', true));
  const aToBase = arrow(boxOf(aVacant[1]).point('bottom'), boxOf(shared[1]).point('top'), {
    stroke: 'cyan',
    pad: 8,
  });
  const bToBase = arrow(boxOf(bVacant[1]).point('top'), boxOf(shared[1]).point('bottom'), {
    stroke: 'blue',
    pad: 8,
  });
  const aStart = read(a, start.a[1], 'cyan'),
    bStart = read(b, start.b[1], 'blue');
  const privateA = cell(a, 1, first.copies.A[1], 'cyan'),
    readA = read(a, first.a[1], 'cyan');
  const privateB = cell(b, 1, both.copies.B[1], 'blue'),
    readB = read(b, both.b[1], 'blue');
  const aAgain = cell(a, 1, again.copies.A[1], 'cyan'),
    readAgain = read(a, again.a[1], 'cyan');
  const tally = (model) =>
    place(
      mono(
        '(' +
          base.length +
          ' shared + ' +
          model.privateCount +
          ' private) × 4 KiB = ' +
          model.kib +
          ' KiB',
        { size: 41, color: 'yellow' },
      ),
      foot,
    );
  const atStart = tally(start),
    atFirst = tally(first),
    atBoth = tally(both);
  const proposed = place(mono('Next   b.write(1, 52)', { size: 40, color: 'blue' }), action);
  const writingB = place(mono('b.write(1, 52)', { size: 40, color: 'blue' }), action);
  const ask = place(
    label('After the write, how many private pages will A and B own?', {
      size: 42,
      color: 'yellow',
    }),
    foot,
  );
  const writingA = place(mono('a.write(1, 101)', { size: 40, color: 'cyan' }), action);

  s.add(
    heading(c.title),
    headers,
    title(a, 'A private', 'cyan'),
    title(backing, 'Shared base', 'green'),
    title(b, 'B private', 'blue'),
    shared,
    aVacant,
    bVacant,
    aToBase,
    bToBase,
    aStart,
    bStart,
    read(backing, base[1], 'green'),
    atStart,
  );
  c.on('middle', () => s.play(indicate(shared[1], { color: 'yellow', scale: 1 })));
  c.swap('first', [aVacant[1], aToBase, aStart], [privateA, readA], { after: true });
  c.hide('first', atStart);
  c.show('sixteen', atFirst, { after: true });
  c.show('b-input', proposed);
  c.swap('ask', atFirst, ask);
  c.swap('second', [bVacant[1], bToBase, bStart, proposed], [privateB, readB, writingB], {
    after: true,
  });
  c.hide('second', ask, { after: true });
  c.show('twenty', atBoth, { after: true });
  c.swap('again', writingB, writingA);
  c.swap('again', [privateA, readA], [aAgain, readAgain], { after: true });
}
