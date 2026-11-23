import { assertEqual, column, dot, dynamic, line, place, rect, stateGrid } from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import { PICTURE, FOOT, SCORES, HEAP_TRACE, NAMES, QUERY } from '../parts.mjs';
import { boundedHeapTrace } from '../../../films/algorithm-complexity/fixtures.mjs';
export default function heap(s, c) {
  const [stream, heapArea, memory] = PICTURE.columns([2, 3, 2], 'loose');
  const streamRows = stream.rows(4, 'wide');
  const multiplies = s.value(0);
  const inputs = dynamic(() =>
    SCORES.flatMap((doc, i) => {
      const [name, work] = streamRows[i].rows(2, 'tight');
      const terms = work.columns([1, 1, 1, 2], 'tight');
      const count = Math.max(
        0,
        Math.min(QUERY.length, Math.floor(multiplies.value) - i * QUERY.length),
      );
      return [
        place(
          label(String.fromCharCode(65 + i) + '  ' + NAMES[i], {
            size: 36,
            color: count ? 'cyan' : 'dim',
          }),
          name,
        ),
        ...terms.slice(0, QUERY.length).map((cell, j) =>
          rect(cell.width, 22, {
            fill: count > j ? 'yellow' : 'surface',
            stroke: 'dim',
            width: 1,
          }).moveTo(cell.point('center')),
        ),
        ...(count === QUERY.length
          ? [place(mono(doc.score.toFixed(1), { size: 36 }), terms[3])]
          : []),
      ];
    }),
  );
  const heapRows = heapArea.rows([1, 2, 1, 2], 'wide');
  const root = heapRows[1],
    child = heapRows[3];
  const frames = [root, child].map((b) =>
    rect(b.width * 0.8, b.height * 0.9, { fill: 'surface', stroke: 'green', width: 3 }).moveTo(
      b.point('center'),
    ),
  );
  const edge = line([root.cx, root.bottom], [child.cx, child.top], { stroke: 'blue', width: 4 });
  const name = place(label('min-heap: k = 2', { color: 'green' }), heapRows[0]);
  const progress = s.value(0);
  const heapNow = () =>
    Math.floor(progress.value) > 0
      ? HEAP_TRACE[Math.min(3, Math.floor(progress.value) - 1)].heap
      : [];
  const values = dynamic(() =>
    heapNow().flatMap(
      (d, i) =>
        place(
          column(
            [
              mono(d.score.toFixed(1), { color: 'yellow' }),
              label(NAMES[SCORES.findIndex((x) => x.id === d.id)], { size: 34, color: 'green' }),
            ],
            { gap: 'tight' },
          ),
          [root, child][i],
        ).nodes,
    ),
  );
  const moving = dynamic(() => {
    const done = Math.floor(progress.value),
      fraction = progress.value - done;
    if (!fraction || done >= SCORES.length) return [];
    const from = streamRows[done].point('right'),
      to = root.point('left');
    return [
      dot(13, 'yellow').moveTo([
        from[0] + (to[0] - from[0]) * fraction,
        from[1] + (to[1] - from[1]) * fraction,
      ]),
    ];
  });
  const resident = memory.inset('normal');
  const matrix = place(
    stateGrid({
      columns: 3,
      rows: 4,
      cell: 40,
      states: { present: { color: 'blue', fill: 0.7 } },
      initial: 'present',
    }),
    resident,
  );
  const residentName = place(note('resident: n × d values'), resident, 'top');
  const products = dynamic(() => [
    place(
      mono(Math.floor(multiplies.value) + ' multiplies', { color: 'yellow', size: 36 }),
      resident,
      'bottom',
    ),
  ]);
  const first = place(label('Two citation slots'), FOOT);
  const cutoff = place(label('Can C take the weaker slot?'), FOOT);
  const keepCutoff = place(label('D must beat the new root', { color: 'yellow' }), FOOT);
  const lastCutoff = place(label('D stays outside   ·   C and A remain', { color: 'green' }), FOOT);
  const repairIntro = place(label('Seven winners   ·   compare parent and child'), FOOT);
  const decide = place(label('Does the new root have to move?'), FOOT);
  const stop = place(label('Parent ≤ both children   ·   stop here', { color: 'green' }), FOOT);
  const select = place(label('2 ≤ k ≤ n   ·   O(n log k) selection   ·   Θ(k) heap slots'), FOOT);
  const storage = place(
    label('Extra space for the streaming pass   ·   O(d + k)', { color: 'yellow' }),
    FOOT,
  );
  const title = heading(c.title);
  s.add(title, inputs, frames, edge, name, values, moving, matrix, residentName, products, first);
  const [treeName, treeRegion] = PICTURE.inset('wide').rows([1, 6], 'normal');
  const levels = treeRegion.rows(3, 'wide');
  const points = [
    levels[0].point('center'),
    ...levels[1].columns(2, 'loose').map((b) => b.point('center')),
    ...levels[2].columns(4, 'wide').map((b) => b.point('center')),
  ];
  const base = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7];
  const entries = [...base, 0.8, 0.25].map((score, i) => ({ id: String(i), score }));
  const trials = boundedHeapTrace(entries, base.length).slice(-2);
  assertEqual(
    trials[0].swaps.map((edge) => edge.join('-')).join(),
    '0-1,1-3',
    'two swaps to a leaf',
  );
  assertEqual(trials[1].action, 'replace', 'the next score beats the cutoff');
  assertEqual(trials[1].swaps.length, 0, 'the second replacement already satisfies heap order');

  const trial = s.value(0),
    replaced = s.value(0),
    swaps = s.value(0);
  const compare = s.value(0),
    tracePath = s.value(0);
  const repair = dynamic(() => {
    const event = trials[trial.value];
    const heap = [...event.before];
    const completed = Math.floor(swaps.value);
    let parent = 0;
    if (replaced.value) {
      heap[0] = event.candidate;
      for (const [from, to] of event.swaps.slice(0, completed)) {
        [heap[from], heap[to]] = [heap[to], heap[from]];
        parent = to;
      }
    }
    const next = event.swaps[completed];
    const children = [2 * parent + 1, 2 * parent + 2].filter((i) => i < heap.length);
    const f = swaps.value - completed;
    const labelText = !replaced.value
      ? (trial.value ? 'Next score  ' + event.candidate.score.toFixed(2) + '     ·     ' : '') +
        'Current cutoff  ' +
        heap[0].score.toFixed(2)
      : 'Replacement  ' + event.candidate.score.toFixed(2);
    const nodes = [place(mono(labelText, { color: 'yellow', size: 42 }), treeName)];
    const onPath = (i) => tracePath.value && event.swaps.some(([, child]) => child === i);
    for (let i = 1; i < points.length; i++) {
      const p = points[Math.floor((i - 1) / 2)],
        q = points[i];
      nodes.push(
        line([p[0], p[1] + 40], [q[0], q[1] - 40], {
          stroke: onPath(i) ? 'yellow' : 'blue',
          width: 4,
        }),
      );
    }
    for (const [i, entry] of heap.entries()) {
      const p = points[i];
      let x = p[0],
        y = p[1];
      if (f > 0 && next?.includes(i)) {
        const q = points[next[0] === i ? next[1] : next[0]];
        const dx = q[0] - x,
          dy = q[1] - y;
        const arc = (96 * Math.sin(Math.PI * f)) / Math.hypot(dx, dy);
        x += dx * f + dy * arc;
        y += dy * f - dx * arc;
      }
      const color =
        replaced.value && entry === event.candidate
          ? 'yellow'
          : compare.value && children.includes(i)
            ? 'cyan'
            : 'ink';
      nodes.push(
        rect(178, 80, { fill: 'surface', stroke: color, width: 3 }).moveTo([x, y]),
        mono(entry.score.toFixed(2), { size: 44, color }).moveTo([x, y]),
      );
    }
    return nodes;
  });
  c.on('heap-first', () => {
    for (let i = 1; i <= 2; i++) {
      s.play(multiplies.to(i * QUERY.length), { duration: 0.9 });
      s.play(progress.to(i), { duration: 0.45 });
    }
  });
  c.on('heap-third', () => s.play(multiplies.to(3 * QUERY.length), { duration: 1.2 }));
  c.swap('heap-third', first, cutoff);
  c.on('heap-replace', () => s.play(progress.to(3), { duration: 1.4 }));
  c.swap('heap-fourth', cutoff, keepCutoff);
  c.on('heap-fourth', () => s.play(multiplies.to(4 * QUERY.length), { duration: 1.2 }));
  c.on('heap-reject', () => s.play(progress.to(4), { duration: 0.8 }));
  c.swap('heap-reject', keepCutoff, lastCutoff, { after: true });
  c.swapAll('heap-larger', [repair, repairIntro], { keep: [title] });
  c.after('heap-new-root', () => replaced.set(1));
  c.on('heap-children', () => compare.set(1));
  c.on('heap-swap', () => s.play(swaps.to(1), { duration: 1 }));
  c.on('heap-lower', () => s.play(swaps.to(2), { duration: 1.2 }));
  c.on('heap-path', () => tracePath.set(1));
  c.on('heap-next', () => {
    trial.set(1);
    replaced.set(0);
    swaps.set(0);
    tracePath.set(0);
    compare.set(0);
  });
  c.after('heap-next-root', () => {
    replaced.set(1);
    compare.set(1);
  });
  c.swap('heap-next-root', repairIntro, decide, { after: true });
  c.swap('heap-stays', decide, stop, { after: true });
  c.swap('heap-height', stop, select);
  c.swapAll('heap-bill', [
    frames,
    edge,
    name,
    values,
    matrix,
    residentName,
    products,
    select,
    title,
  ]);
  const [corpus, streamed] = PICTURE.columns([1.15, 1], 'loose');
  const [corpusName, blocks, units] = corpus.rows([1, 5, 1], 'normal');
  const largeN = 50000,
    largeD = 768;
  const blockRows = 1000,
    blockWidth = 128;
  const tiles = blocks
    .rows(largeN / blockRows, 3)
    .flatMap((r) =>
      r
        .columns(largeD / blockWidth, 8)
        .map((b) =>
          rect(b.width, b.height, { fill: 'blue', stroke: null }).moveTo(b.point('center')),
        ),
    );
  const shape = place(mono('50,000 notes × 768 coordinates', { size: 38 }), corpusName);
  const tileKey = place(note('Each tile contains 1,000 rows × 128 coordinates'), units);
  const [bill, winners] = streamed.rows(2, 'wide');
  const count = place(
    column(
      [
        mono((largeN * largeD).toLocaleString('en-US') + ' products', {
          size: 38,
          color: 'yellow',
        }),
        note('Float32 corpus in memory'),
        mono(((largeN * largeD * 4) / 2 ** 20).toFixed(1) + ' MiB', { size: 42, color: 'blue' }),
      ],
      { gap: 'normal' },
    ),
    bill,
  );
  const workspace = place(
    column(
      [
        label('Streaming workspace'),
        mono('query      d coordinates', { size: 36, color: 'cyan' }),
        mono('heap       k winners', { size: 36, color: 'green' }),
        note('plus one sum and loop indices'),
      ],
      { gap: 'normal' },
    ),
    winners,
  );
  c.swapAll('heap-scale', [shape, tiles, tileKey, count, select, title]);
  c.show('heap-workspace', workspace);
  c.swap('heap-extra', select, storage, { after: true });
}
