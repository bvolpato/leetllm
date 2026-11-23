import { beside, dot, place, recolor, to } from 'vizmatic/stage';
import { mono } from '../../kit-narrated.mjs';
import { frame, ownedTable, accumulators, BASE_OUTPUT, WORDS, sumRows, mean } from '../parts.mjs';
export default function (s, c) {
  const f = frame(c),
    [left, right] = f.body.columns(2, 'loose');
  const amounts = [s.value(0), s.value(0), s.value(0)],
    divide = s.value(1),
    reordered = s.value(0);
  const order = () => (reordered.value ? [2, 1, 0] : [0, 1, 2]);
  const table = ownedTable(left, {
    title: 'projected word rows',
    rows: WORDS[0],
    columns: ['out 0', 'out 1', 'out 2'],
    values: () => order().map((i) => BASE_OUTPUT[0][i]),
    colors: ['green', 'green', 'cyan'],
    valueColors: () => order().map((i) => ['green', 'green', 'cyan'][i]),
  });
  const total = () =>
    sumRows(BASE_OUTPUT[0].map((r, i) => r.map((v) => v * amounts[i].value))).map(
      (v) => v / divide.value,
    );
  const bars = accumulators(right, {
    title: 'sum → mean',
    names: ['out 0', 'out 1', 'out 2'],
    values: total,
    max: 1.5,
  });
  const [referenceSlot, resultSlot] = f.foot.columns(2, 'loose');
  const summary = '[' + mean(BASE_OUTPUT[0]).join(', ') + ']';
  const result = place(mono('mean = ' + summary, { color: 'yellow', size: 36 }), resultSlot);
  const reference = place(
    mono('first mean = ' + summary, { color: 'yellow', size: 34 }),
    referenceSlot,
  );
  const divisor = beside(mono('÷3', { color: 'yellow' }), bars.nodes[0], 'right', 'wide');
  const owners = table.owners;
  const markers = owners.map((_, i) =>
    dot(12, ['green', 'green', 'cyan'][i]).moveTo(table.bands[i + 2].point('left')),
  );
  const ownerWidth = table.regions[0][0].left - left.left;
  const lanes = markers.map((_, i) => left.left + (ownerWidth * (i + 1)) / 4);
  s.add(f.title, table.nodes, bars.nodes);
  for (const [i, id] of ['pool-reset', 'pool-my', 'pool-password'].entries())
    c.after(id, () => s.play(amounts[i].to(1, { duration: 1 })));
  c.on('pool-sum', () => s.play(divide.to(1, { duration: 0.5 })));
  c.after('pool-result', () => s.play(divide.to(BASE_OUTPUT[0].length, { duration: 0.5 })));
  c.show('pool-result', reference, { after: true, lead: -0.5, fade: 0.15 });
  c.show('pool-result', divisor);
  c.hide('pool-permute', [owners, table.numbers], { lead: 0.1, fade: 0.15 });
  c.on('pool-permute', () => s.play(recolor(reference, 'dim', { duration: 0.15 })));
  c.hide('pool-permute', divisor);
  c.show('pool-permute', markers, { lead: -0.15, fade: 0.1 });
  c.on(
    'pool-permute',
    () => {
      s.play(
        ...markers.map((node, i) =>
          to(node, (n) => n.moveTo([lanes[i], table.bands[i + 2].cy]), { duration: 0.2 }),
        ),
      );
      s.play(
        ...markers.map((node, i) =>
          to(node, (n) => n.moveTo([lanes[i], table.bands[4 - i].cy]), { duration: 0.8 }),
        ),
      );
      s.play(
        ...markers.map((node, i) =>
          to(node, (n) => n.moveTo(table.bands[4 - i].point('left')), { duration: 0.2 }),
        ),
      );
    },
    0.25,
  );
  c.after('pool-permute', () => {
    reordered.set(1);
    for (let i = 0; i < owners.length; i++)
      owners[i].shift(0, table.bands[4 - i].cy - table.bands[i + 2].cy);
  });
  c.hide('pool-permute', markers, { after: true, fade: 0.1 });
  c.show('pool-permute', [owners, table.numbers], { after: true, lead: -0.15, fade: 0.15 });
  c.on(
    'pool-repeat',
    () => {
      amounts.forEach((v) => v.set(0));
      divide.set(1);
      for (const i of [2, 1, 0]) s.play(amounts[i].to(1, { duration: 0.5 }));
    },
    0.3,
  );
  c.show('pool-same', divisor);
  c.after('pool-same', () => s.play(divide.to(BASE_OUTPUT[0].length, { duration: 0.5 })));
  c.show('pool-same', result, { after: true, lead: -0.5, fade: 0.15 });
}
