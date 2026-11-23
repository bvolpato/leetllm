import { dot, dynamic, group, line, place, rect, to } from 'vizmatic/stage';
import { label, mono, note } from '../../kit-narrated.mjs';
import { frame, ownedTable, fmt, H, BASE_OUTPUT, transformBatch } from '../parts.mjs';
export default function (s, c) {
  const f = frame(c),
    [top, bottom] = f.body.rows([2, 5], 'loose');
  const regions = top.columns(5, 'wide');
  const gates = ['numeric', 'rank 3 / 2', 'width 2', 'nonempty', 'multiply'];
  const skeleton = gates.flatMap((name, i) => [
    place(
      rect(regions[i].width, regions[i].height * 0.7, { stroke: 'grid', fill: 'surface' }),
      regions[i],
    ),
    place(note(name), regions[i]),
  ]);
  const good = dot(15, 'green').moveTo(regions[0].point('bottom'));
  const probes = gates.slice(0, 4).map((_, i) => dot(13, 'red').moveTo(regions[0].point('bottom')));
  const edit = s.value(0),
    run = s.value(0),
    probe = s.value(0),
    [left, right] = bottom.columns(2, 'loose');
  const [inputHead, inputBody, inputKey] = left.rows([1, 5, 1], 'normal');
  const rowBands = inputBody.inset('wide').rows(3, 'normal');
  const bracket = (region, color) => {
    const a = region.point('top left'),
      b = region.point('bottom left');
    const d = region.width * 0.025;
    const x = region.right;
    return [
      line([a[0] + d, a[1]], a, { stroke: color, width: 3 }),
      line(a, b, { stroke: color, width: 3 }),
      line(b, [b[0] + d, b[1]], { stroke: color, width: 3 }),
      line([x - d, a[1]], [x, a[1]], { stroke: color, width: 3 }),
      line([x, a[1]], [x, b[1]], { stroke: color, width: 3 }),
      line([x, b[1]], [x - d, b[1]], { stroke: color, width: 3 }),
    ];
  };
  const input = {
    nodes: [
      dynamic(() => {
        const kind = probe.value;
        const shape =
          kind === 1
            ? 'ragged: no rectangular shape'
            : kind === 2
              ? 'H shape (3, 2)'
              : kind === 3
                ? 'H shape (1, 3, 3)'
                : kind === 4
                  ? 'H shape (1, 0, 2)'
                  : 'H shape (1, 3, 2)';
        const nodes = [place(label(shape, { size: 34, color: kind ? 'red' : 'cyan' }), inputHead)];
        if (kind !== 2) nodes.push(...bracket(inputBody, 'cyan'));
        if (kind === 4) nodes.push(place(mono('[]', { size: 48, color: 'red' }), inputBody));
        else {
          nodes.push(...bracket(inputBody.inset('normal'), 'green'));
          H[0].forEach((r, i) => {
            const [owner, coordinates] = rowBands[i].columns([1.5, 2], 'normal');
            const values =
              kind === 1 && i === 1
                ? [r[0]]
                : kind === 3
                  ? [...r, H[0][0][0]]
                  : [r[0] + (i === 2 ? edit.value : 0), r[1]];
            nodes.push(
              place(
                label(['reset', 'my', 'password'][i], {
                  size: 34,
                  color: i === 2 ? 'cyan' : 'green',
                }),
                owner,
              ),
            );
            nodes.push(
              place(
                mono('[' + values.map(fmt).join(', ') + ']', {
                  size: 36,
                  color: kind === 1 && i === 1 ? 'red' : 'ink',
                }),
                coordinates,
              ),
            );
          });
        }
        nodes.push(
          place(
            note(kind === 2 ? 'token × feature; batch is missing' : 'batch [ token [ feature ] ]'),
            inputKey,
          ),
        );
        return group(...nodes);
      }),
    ],
  };
  const output = ownedTable(right, {
    title: 'validated token outputs',
    rows: ['reset', 'my', 'password'],
    columns: ['out 0', 'out 1', 'out 2'],
    values: () =>
      run.value < 0.5
        ? BASE_OUTPUT[0].map((r) => r.map(() => '?'))
        : transformBatch([H[0].map((r, i) => (i === 2 ? [r[0] + edit.value, r[1]] : r))])[0],
    colors: ['green', 'green', 'cyan'],
  });
  const fixture = place(mono('ragged: [[1, 0], [0]]', { color: 'red' }), f.foot);
  const ranks = place(mono('rank-2 input has no batch axis', { color: 'yellow' }), f.foot);
  const widths = place(
    mono('3 supplied features ≠ 2 projection rows', { color: 'yellow' }),
    f.foot,
  );
  const nonempty = place(
    mono('Empty token axis: no row can reach multiply.', { size: 34, color: 'yellow' }),
    f.foot,
  );
  const accepted = place(
    mono('Valid tensor passes. Every token keeps its owner.', { size: 34, color: 'green' }),
    f.foot,
  );
  s.add(f.title, skeleton, input.nodes, output.nodes);
  const ids = ['guard-convert', 'guard-rank', 'guard-feature', 'guard-nonempty'];
  ids.forEach((id, i) => {
    c.show(id, probes[i]);
    c.on(id, () => {
      probe.set(i + 1);
      s.play(to(probes[i], (n) => n.moveTo(regions[i].point('top')), { duration: 1.2 }));
    });
  });
  c.show('guard-convert', fixture);
  c.swap('guard-rank', fixture, ranks);
  c.swap('guard-feature', ranks, widths);
  c.swap('guard-nonempty', widths, nonempty);
  c.show('guard-product', good, { after: true });
  c.after('guard-product', () => {
    probe.set(0);
    for (let i = 1; i < regions.length; i++)
      s.play(to(good, (n) => n.moveTo(regions[i].point('bottom')), { duration: 0.4 }));
    s.play(run.to(1, { duration: 0.4 }));
  });
  c.swap('guard-product', nonempty, accepted, { after: true });
  c.on('guard-locality', () => s.play(edit.to(1, { duration: 3 })));
}
