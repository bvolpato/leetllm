import { arrayCells, assertEqual, dot, dynamic, line, place, row } from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import {
  PICTURE,
  FOOT,
  PREFIX_WORDS,
  PREFIX_QUERY,
  buildRadixTree,
  radixPrefixTrace,
} from '../parts.mjs';
export default function prefix(s, c) {
  const [left, right] = PICTURE.columns(2, 'loose');
  const words = left.rows(5, 'normal');
  const scanTitle = place(label('Scan: repeat the prefix'), words[0]);
  const arrays = PREFIX_WORDS.map((word, i) =>
    place(
      arrayCells([...word], { indices: false, cell: 68, gap: 8, size: 40, color: 'cyan' }),
      words[i + 1],
    ),
  );
  const [edgeRegion, branchRegion, leafRegion, read] = right.rows([2, 1, 2, 1], 'normal');
  const lookup = radixPrefixTrace();
  const root = buildRadixTree();
  const selected = root.children.findIndex((child) => child.label[0] === PREFIX_QUERY[0]);
  const branchChecks = selected + 1;
  assertEqual(branchChecks, 1, 'first root edge selected by p');
  assertEqual(lookup.comparisons, 3, 'three character checks on the selected edge');
  const edge = place(
    arrayCells([...root.children[selected].label], {
      indices: false,
      cell: 80,
      gap: 12,
      size: 44,
      color: 'blue',
    }),
    edgeRegion,
    'bottom',
  );
  const joint = place(dot(14, 'blue'), branchRegion);
  const leaves = leafRegion.columns(lookup.branches.length, 'normal');
  const suffix = lookup.branches.map((name, i) => place(mono(name, { color: 'cyan' }), leaves[i]));
  const wires = leaves.map((b) =>
    line(branchRegion.point('center'), b.point('top'), { stroke: 'blue', width: 4 }),
  );
  const stem = line(edgeRegion.point('bottom'), branchRegion.point('center'), {
    stroke: 'blue',
    width: 4,
  });
  const shared = place(label('One compressed edge'), edgeRegion, 'top');
  const [branchSlot, labelSlot, outputSlot] = read.columns([1, 1.2, 1.3], 'tight');
  const branchCount = place(
    label(branchChecks + ' branch check', { size: 34, color: 'cyan' }),
    branchSlot,
  );
  const labelChecks = s.value(0);
  const labelCount = dynamic(() => {
    const n = labelChecks.value;
    if (!n) return [];
    const tally = '+ ' + n + (n === 1 ? ' label check' : ' label checks');
    return [place(label(tally, { size: 34, color: 'yellow' }), labelSlot)];
  });
  const outputCount = place(
    label('→ ' + lookup.completions.length + ' completions', { size: 34, color: 'green' }),
    outputSlot,
  );
  const twelve = place(label('Scan: 4 words × 3 letters = 12 comparisons'), FOOT);
  const output = place(
    label('With expected O(1) child lookup, descent takes expected O(p + 1) work'),
    FOOT,
  );
  const [scanColumn, vectorColumn] = left.columns([1, 3.5], 'normal');
  const quietRows = scanColumn.rows(5, 'normal');
  const quietScan = [
    place(note('Scan'), quietRows[0]),
    ...PREFIX_WORDS.map((word, i) =>
      place(mono(word, { size: 34, color: 'dim' }), quietRows[i + 1]),
    ),
  ];
  const [graphHeader, graphBody] = vectorColumn.rows([1, 4], 'normal');
  const graphName = place(label('HNSW · one graph layer', { size: 38 }), graphHeader);
  const vectorAt = (x, y) => [
    graphBody.left + x * graphBody.width,
    graphBody.top + y * graphBody.height,
  ];
  const vectors = [
    vectorAt(0.09, 0.55),
    vectorAt(0.23, 0.23),
    vectorAt(0.37, 0.62),
    vectorAt(0.42, 0.85),
    vectorAt(0.62, 0.42),
    vectorAt(0.56, 0.14),
    vectorAt(0.81, 0.32),
    vectorAt(0.89, 0.72),
  ];
  const links = [
    [0, 1],
    [0, 2],
    [1, 2],
    [1, 5],
    [2, 3],
    [2, 4],
    [3, 7],
    [4, 5],
    [4, 6],
    [4, 7],
    [5, 6],
    [6, 7],
  ];
  const path = [0, 2, 4, 6];
  const queryPoint = vectorAt(0.86, 0.21);
  const graph = [
    ...links.map(([a, b]) => line(vectors[a], vectors[b], { stroke: 'dim', width: 3 })),
    ...vectors.map((p) => dot(12, 'blue').moveTo(p)),
    dot(13, 'cyan').moveTo(queryPoint),
    note('query', { color: 'cyan' }).moveTo([queryPoint[0], queryPoint[1] - 38]),
    note('entry').moveTo([vectors[0][0], vectors[0][1] + 40]),
  ];
  const hops = s.value(0);
  const trace = dynamic(() => {
    const trail = [];
    let tip = vectors[path[0]];
    for (let i = 0; i < Math.min(hops.value, path.length - 1); i++) {
      const a = vectors[path[i]],
        b = vectors[path[i + 1]];
      const f = Math.min(1, hops.value - i);
      tip = a.map((v, j) => v + f * (b[j] - v));
      trail.push(line(a, tip, { stroke: 'yellow', width: 5 }), dot(12, 'yellow').moveTo(a));
    }
    return [...trail, dot(15, 'yellow').moveTo(tip)];
  });
  const neighbors = place(label('Follow graph links toward the query embedding'), FOOT);
  const title = heading(c.title);
  s.add(title, scanTitle, arrays);
  const [tokenTop, tokenMiddle, gateBand, workBand] = PICTURE.rows([0.7, 4.8, 1, 1], 'normal');
  const tokenTitle = place(label('Where do these requests split?'), tokenTop);
  const two = tokenMiddle.rows(2, 'wide');
  const cachedIds = [11, 42, 17, 99],
    incomingIds = [11, 42, 17, 8];
  assertEqual(
    cachedIds.slice(0, 3).join(),
    incomingIds.slice(0, 3).join(),
    'supplied exact prefix',
  );
  const tokenLanes = two.map((r) => r.columns([1, 2.6], 'wide'));
  const tokenNames = [
    place(note('cached'), tokenLanes[0][0], 'right'),
    place(note('incoming'), tokenLanes[1][0], 'right'),
  ];
  const cached = place(
    arrayCells(cachedIds, { indices: false, cell: 156, gap: 30, size: 63, color: 'blue' }),
    tokenLanes[0][1],
    'left',
  );
  const incoming = place(
    arrayCells(incomingIds, { indices: false, cell: 156, gap: 30, size: 63, color: 'cyan' }),
    tokenLanes[1][1],
    'left',
  );
  const gate = place(
    row(
      [label('same model + adapter'), label('same positions + inputs'), label('same cache scope')],
      { gap: 'wide' },
    ),
    gateBand,
  );
  const cellX = (i) => incoming.get('x') + incoming.slotAt(i)[0];
  const reuse = label('Reuse keys and values', { color: 'green' }).moveTo([cellX(1), workBand.cy]);
  const fresh = label('Compute for 8', { color: 'pink' }).moveTo([cellX(3), workBand.cy]);
  const request = place(mono('prefix   ' + PREFIX_QUERY, { color: 'cyan' }), FOOT);
  c.show('prefix-query', request);
  c.on('prefix-scan', () => {
    for (const a of arrays)
      for (let i = 0; i < PREFIX_QUERY.length; i++) s.play(a.mark(i, 'yellow'), { duration: 0.24 });
  });
  c.swap('prefix-total', request, twelve, { after: true });
  c.show('prefix-edge', [edge, joint, stem, shared]);
  c.on('prefix-select', () => s.play(edge.mark(0, 'cyan'), { duration: 0.25 }));
  c.show('prefix-select', branchCount, { after: true });
  c.on('prefix-walk-p', () => s.add(labelCount));
  for (const [i, step] of lookup.steps.entries()) {
    c.after('prefix-walk-' + PREFIX_QUERY[step.queryIndex], () => {
      labelChecks.set(i + 1);
      s.play(edge.mark(step.edgeIndex, 'yellow'), { duration: 0.18 });
    });
  }
  c.show('prefix-branch', wires);
  c.show('prefix-branch', suffix, { stagger: true });
  c.show('prefix-count', outputCount, { after: true });
  c.swap('prefix-output', twelve, output);
  c.swap(
    'prefix-neighbors',
    [scanTitle, arrays, output],
    [quietScan, graphName, graph, trace, neighbors],
  );
  const search = c.cue('prefix-neighbors');
  c.on(
    'prefix-neighbors',
    () =>
      s.play(hops.to(path.length - 1), {
        duration: search.end - search.start - 0.4,
      }),
    0.4,
  );
  c.swapAll('prefix-token', [tokenTitle, tokenNames, cached, incoming], { keep: [title] });
  c.on('prefix-matches', () => {
    const step = (c.cue('prefix-matches').end - c.cue('prefix-matches').start) / 3;
    for (let i = 0; i < 3; i++)
      s.play(cached.mark(i, 'yellow'), incoming.mark(i, 'yellow'), { duration: step });
  });
  c.on('prefix-diverges', () =>
    s.play(cached.mark(3, 'pink'), incoming.mark(3, 'pink'), { duration: 0.45 }),
  );
  c.show('prefix-compatible', gate);
  c.show('prefix-reuse', reuse);
  c.on('prefix-reuse', () =>
    s.play(...[0, 1, 2].map((i) => incoming.mark(i, 'green')), { duration: 0.4 }),
  );
  c.show('prefix-suffix', fresh);
}
