import { arrow, beside, boxOf, dynamic, line, place, stateGrid, tokens, to } from 'vizmatic/stage';
import { mono, note } from '../../kit-narrated.mjs';
import { fullBlockPrefix } from '../../../films/prefix-reuse/arithmetic.mjs';
import { sampleModel } from '../../../films/prefix-reuse/model.mjs';
import { board, body, caption, fmt, pointAt, readings } from '../parts.mjs';

export default function radixSplit(s, c) {
  board(s, c, 'One ancestor, two continuations', 'Index · compressed radix edge');
  const [history, tree, zoom] = body.rows([1.05, 2.55, 1.35], 'normal');
  const original = sampleModel('causal-keys', { beat: 0, beatP: 0.9 });
  const [keyName, ...keySlots] = history.columns([1, 1.15, 1.15, 1.15], 'normal');
  const keyLabels = original.oldBlocks.map((name, i) =>
    caption(name + ' · ' + original.oldKeys[i].slice(0, 7), keySlots[i], {
      size: 32,
      color: 'dim',
    }),
  );
  const keyLinks = keyLabels.slice(1).map((item, i) =>
    arrow(boxOf(keyLabels[i]).point('right'), boxOf(item).point('left'), {
      pad: 16,
      stroke: 'dim',
      width: 3,
    }),
  );
  const [left, right] = tree.columns(2, 'loose');
  const [root, input] = left.rows(2, 'normal');
  const [upper, lower] = right.rows(2, 'normal');
  const strip = (values, color, region) =>
    place(tokens(values, { size: 43, minWidth: 100, color }), region);
  const prefix = strip([11, 12], 'blue', root);
  const stored = strip([13, 14], 'blue', upper);
  const query = strip([11, 12], 'blue', input);
  const suffix = strip([99], 'pink', lower);
  const rootEdge = boxOf(prefix).point('right');
  const storedEdge = boxOf(stored).point('left'),
    suffixEdge = boxOf(suffix).point('left');
  beside(stored, prefix, 'right', 'tight');
  const source = input.point('left');
  query.moveTo([root.cx - boxOf(query).width * 0.7, input.cy]);
  beside(suffix, query, 'right', 'tight');
  const queryName = note('Input', { size: 32 }).moveTo([source[0] + 60, input.cy]);
  const phase = s.value(0);
  const branch = (end, tint) =>
    dynamic(() => {
      if (phase.value < 0.02) return [];
      const x = rootEdge[0] + 14,
        y = rootEdge[1];
      return arrow([x, y], [x + (end[0] - 12 - x) * phase.value, y + (end[1] - y) * phase.value], {
        stroke: tint,
        pad: 0,
        width: 4,
      });
    });
  const topLink = branch(storedEdge, 'blue'),
    lowLink = branch(suffixEdge, 'pink');
  const match = 6005,
    block = 16,
    whole = fullBlockPrefix(match, block),
    rest = match - whole;
  const [zoomName, positions] = zoom.columns([1, 4.5], 'wide');
  const grid = place(
    stateGrid({
      rows: 1,
      columns: block + rest,
      cell: 43,
      gap: 12,
      states: {
        quiet: { color: 'dim', fill: 0.08 },
        full: { color: 'green', fill: 0.65 },
        tail: { color: 'pink', fill: 0.65 },
      },
      initial: 'quiet',
    }),
    positions,
  );
  const endpoint = boxOf(grid.cells[block - 1]);
  const x = (endpoint.right + boxOf(grid.cells[block]).left) / 2;
  const boundary = line([x, endpoint.top - 9], [x, endpoint.bottom + 9], {
    stroke: 'yellow',
    width: 5,
  });
  const position = (i, n) =>
    beside(mono(fmt(n), { size: 31, color: 'dim' }), grid.cells[i], 'under', 'normal');
  const ticks = [
    position(0, whole - block + 1),
    position(block - 1, whole),
    position(block + rest - 1, match),
  ];
  const zoomLabel = caption('Boundary zoom', zoomName, { size: 35, align: 'left' });
  s.add(
    caption('Stored chain', keyName, { size: 35, align: 'left' }),
    keyLabels,
    keyLinks,
    prefix,
    stored,
    zoomLabel,
    grid,
  );
  c.show('radix-query', [queryName, query, suffix]);
  c.after('radix-match', () => s.play(prefix.window(0, 1, { color: 'green' })));
  c.show('radix-branch', [topLink, lowLink]);
  c.on('radix-branch', () =>
    s.play(
      to(stored, (n) => place(n, upper)),
      to(suffix, (n) => place(n, lower)),
      to(query, (n) => n.moveTo([root.cx, input.cy])),
      { duration: 0.8 },
    ),
  );
  c.on('radix-branch', () => s.play(phase.to(1), { duration: 0.65 }), 0.8);
  c.hide('radix-branch', [queryName, query], { lead: -1.45 });
  c.on('radix-protect', () => s.play(stored.window(0, 1, { color: 'green' })));
  c.hide('radix-evict', [lowLink, suffix], { after: true });
  c.show('radix-scale', ticks, { after: true });
  c.on('radix-scale', () => s.play(pointAt(zoomLabel)));
  c.after('radix-round', () => s.play(grid.change((i) => i < block, 'full')));
  c.show('radix-round', boundary, { after: true });
  c.on('radix-remainder', () => s.play(grid.change((i) => i >= block, 'tail')));
  readings(s, c, 'Stored edge · 11, 12, 13, 14', [
    ['radix-branch', 'Shared path · 11, 12'],
    ['radix-protect', 'Active references protect the upper path.', 'green'],
    ['radix-evict', 'The idle leaf leaves first.'],
    ['radix-scale', 'Final ' + (block + rest) + ' positions of a ' + fmt(match) + '-token match'],
    ['radix-round', 'Last complete block ends at ' + fmt(whole) + '.', 'green'],
    ['radix-remainder', fmt(rest) + ' shared positions beyond the boundary', 'pink'],
  ]);
}
