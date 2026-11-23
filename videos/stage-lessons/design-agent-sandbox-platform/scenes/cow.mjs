import {
  arrow,
  assertEqual,
  boxOf,
  column,
  dot,
  fadeIn,
  fadeOut,
  indicate,
  place,
  to,
} from 'vizmatic/stage';
import { area, heading, label, mono, namedBox } from '../../kit-narrated.mjs';
import { cowSnapshot } from '../parts.mjs';

export default function scene(s, c) {
  const clean = cowSnapshot(0, 0),
    written = cowSnapshot(0, 1),
    index = 2;
  assertEqual(written.a[index], 99, 'the writer follows its private page');
  assertEqual(written.b[index], clean.base[index], 'B keeps the original');
  const [name, backing, , readers, gloss] = area.rows([0.6, 1.1, 0.9, 1.4, 0.7], 'normal');
  const slots = backing.columns(6, 'normal');
  const pages = clean.base.map((v, i) => {
    const value = namedBox(String(v), {
      width: slots[i].width - 12,
      height: 96,
      size: 48,
      color: 'green',
      font: 'mono',
    });
    const entry = place(
      column([mono('page ' + i, { size: 33 }), value], { gap: 'tight', align: 'center' }),
      slots[i],
    );
    return { entry, value };
  });
  const [a, privateSlot, b] = readers.columns(3, 'wide');
  const reader = (region, owner, v, color) =>
    place(
      namedBox(owner + ' reads ' + v, {
        width: region.width - 40,
        height: 102,
        size: 44,
        color,
      }),
      region,
    );
  const readA = reader(a, 'A', clean.a[index], 'cyan');
  const readB = reader(b, 'B', clean.b[index], 'blue');
  const changed = reader(a, 'A', written.a[index], 'cyan');
  const privatePage = (words, color, dash) =>
    place(
      namedBox(words, {
        width: privateSlot.width - 54,
        height: 102,
        color,
        size: 39,
        dash,
      }),
      privateSlot,
    );
  const empty = privatePage('A’s private slot', 'dim', true);
  const copy = privatePage('Private page   ' + clean.base[index], 'cyan');
  const dirty = privatePage('Private page   ' + written.a[index], 'cyan');
  const [aTarget, bTarget] = boxOf(pages[index].value).columns(2, 'none');
  const aWire = arrow(boxOf(readA).point('top'), aTarget.point('bottom'), {
    stroke: 'cyan',
    width: 5,
    pad: 9,
  });
  const bWire = arrow(boxOf(readB).point('top'), bTarget.point('bottom'), {
    stroke: 'blue',
    width: 5,
    pad: 9,
  });
  const privateWire = arrow(boxOf(changed).point('right'), boxOf(dirty).point('left'), {
    stroke: 'cyan',
    width: 5,
    pad: 9,
  });
  const moving = dot(14, 'green').moveTo(boxOf(pages[index].value).point('bottom'));
  const question = place(
    label('Where will B read page 2 after A writes 99?', { color: 'yellow', size: 44 }),
    gloss,
  );
  const answer = place(label('B still reads the shared 30.', { color: 'blue', size: 44 }), gloss);
  s.add(
    heading(c.title),
    place(label('Immutable snapshot backing', { color: 'green', size: 40 }), name),
    pages.map((p) => p.entry),
    readA,
    readB,
    empty,
    aWire,
    bWire,
  );
  c.on('look', () => s.play(indicate(pages[index].value, { color: 'yellow', scale: 1 })));
  c.show('predict', question);
  c.hide('copy', question);
  c.on('copy', () =>
    s.play(
      fadeIn(moving, { duration: 0.1 }),
      to(moving, (n) => n.moveTo(boxOf(empty).point('top')), { duration: 1.2 }),
    ),
  );
  c.swap('copy', empty, copy, { after: true });
  c.after('copy', () => s.play(fadeOut(moving, { duration: 0.15 })));
  c.swap('write', [copy, readA, aWire], [dirty, changed, privateWire], { after: true });
  c.show('redirect', answer, { after: true });
  c.on('backing', () =>
    s.play(...pages.map((p) => indicate(p.value, { color: 'green', scale: 1 }))),
  );
  c.on('physical', () => s.play(indicate(dirty, { color: 'yellow', scale: 1 })));
}
