import { assertEqual, column, dynamic, place, rect, row } from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import { DOCS, FOOT, PICTURE, TERMS, growthChart } from '../parts.mjs';
import { boardRegion, desk, noteBoard, noteId } from '../note-board.mjs';

export default function scan(s, c) {
  const full = DOCS.length * TERMS.length;
  const marks = s.value(full),
    more = s.value(0);
  const first = noteBoard(marks),
    copy = noteBoard(more, desk, true);
  const title = heading(c.title);
  const count = dynamic(() => [
    place(
      mono('Visited   ' + Math.floor((marks.value + more.value) / TERMS.length) + ' notes', {
        color: 'yellow',
      }),
      FOOT,
    ),
  ]);
  s.add(title, first.nodes, count);
  c.show('scan-double', copy.nodes);
  c.on('scan-visits', () => {
    marks.set(0);
    s.play(marks.to(full), { duration: 1.6 });
    s.play(more.to(full), { duration: 1.6 });
  });
  const visits = place(mono('4 → 8 notes       4 → 8 visits', { color: 'yellow' }), FOOT);
  c.swap('scan-linear', count, visits, { after: true });
  const input = s.value(8);
  const [plot, keyArea] = desk.rows([5, 1], 'normal');
  const graph = growthChart(s, plot, input);
  const legend = place(
    column(
      [
        row(
          [
            ['log n', 'blue'],
            ['n', 'cyan'],
            ['n log n', 'pink'],
            ['n²', 'ink'],
          ].map(([v, color]) => mono(v, { color, size: 34 })),
          { gap: 'normal' },
        ),
        note('Reference counts at input n'),
      ],
      { gap: 'tight' },
    ),
    keyArea,
  );
  const height = 8;
  const strips = boardRegion.rows(height, 'tight').map((r) => r.columns([1, 1, 1, 1], 'normal'));
  const fixed = strips.flatMap((cells, i) => [
    place(mono(noteId(i % DOCS.length) + (i >= DOCS.length ? '′' : ''), { size: 34 }), cells[0]),
    ...cells
      .slice(1)
      .map((cell) =>
        rect(cell.width, cell.height * 0.55, { fill: 'blue', stroke: null }).moveTo(
          cell.point('center'),
        ),
      ),
  ]);
  const tight = place(label('Complete bounded-length scan   ·   Θ(n)'), FOOT);
  const inner = place(label('3 checks per note   ·   3n word tests'), FOOT);
  c.swap('scan-notation', [copy.nodes, visits], [graph.plot, graph.markers, legend, tight]);
  c.on('scan-growth16', () => s.play(input.to(16), { duration: 1.4 }));
  c.on('scan-growth32', () => s.play(input.to(32), { duration: 1.4 }));
  c.swap('scan-inner', [first.nodes, tight], [fixed, inner]);

  const matches = [...DOCS, ...DOCS].flatMap((doc, i) =>
    doc.cheap > 0
      ? [{ ...doc, letter: noteId(i % DOCS.length) + (i >= DOCS.length ? '′' : '') }]
      : [],
  );
  function merge(left, right) {
    const events = [];
    let i = 0,
      j = 0;
    while (i < left.length || j < right.length) {
      const heads = [left[i], right[j]].filter(Boolean);
      const takeLeft = j === right.length || (i < left.length && left[i].cheap >= right[j].cheap);
      events.push({ heads, chosen: takeLeft ? left[i++] : right[j++] });
    }
    return events;
  }
  const pairMerges = [
    merge(matches.slice(0, 1), matches.slice(1, 2)),
    merge(matches.slice(2, 3), matches.slice(3, 4)),
  ];
  const runs = pairMerges.map((events) => events.map((event) => event.chosen));
  const events = merge(...runs);
  const comparisons = (events) => events.filter((event) => event.heads.length === 2).length;
  const pairChecks = pairMerges.reduce((sum, events) => sum + comparisons(events), 0);
  assertEqual(events.map((e) => e.chosen.letter).join(' '), 'A A′ B B′', 'stable score order');
  assertEqual(pairChecks + comparisons(events), 5, 'score comparisons in both merge levels');

  const [inputNames, inputRow, , outputRow, outputName] = PICTURE.inset('normal').rows(
    [1, 2, 1.2, 2, 1],
    'normal',
  );
  const inputSlots = inputRow.columns(2, 'loose').flatMap((r) => r.columns(2, 'normal'));
  const outputSlots = outputRow.columns(4, 'wide');
  const runNames = inputNames.columns(2, 'loose');
  const pairNames = [
    place(label('First pair'), runNames[0]),
    place(label('Second pair'), runNames[1]),
  ];
  const base = [
    pairNames,
    ...outputSlots.map((b) =>
      rect(b.width * 0.85, b.height * 0.82, { fill: 'surface', stroke: 'dim', width: 2 }).moveTo(
        b.point('center'),
      ),
    ),
    place(note('Merged order  ·  highest score first'), outputName),
  ];
  const ready = s.value(0),
    progress = s.value(0);
  const tiles = dynamic(() => {
    const done = Math.floor(progress.value);
    const event = events[done];
    return runs.flat().flatMap((doc, i) => {
      const index = events.findIndex((event) => event.chosen === doc);
      const f = Math.max(0, Math.min(1, progress.value - index));
      const from = inputSlots[i],
        to = outputSlots[index];
      const point = [from.cx + f * (to.cx - from.cx), from.cy + f * (to.cy - from.cy)];
      const color =
        f === 1 ? 'green' : ready.value && event?.heads.includes(doc) ? 'yellow' : 'cyan';
      const hits = Math.round(doc.cheap * TERMS.length);
      return [
        rect(from.width * 0.82, from.height * 0.76, {
          fill: 'surface',
          stroke: color,
          width: 3,
        }).moveTo(point),
        mono(doc.letter, { size: 46, color }).moveTo([point[0], point[1] - 27]),
        label(hits + (hits === 1 ? ' hit' : ' hits'), { size: 34 }).moveTo([
          point[0],
          point[1] + 28,
        ]),
      ];
    });
  });
  const countChecks = dynamic(() => [
    place(
      mono(
        (ready.value ? pairChecks : 0) +
          comparisons(events.slice(0, Math.floor(progress.value))) +
          ' score comparisons',
        { size: 38, color: 'yellow' },
      ),
      FOOT,
    ),
  ]);
  const sortBound = place(label('Bounded-length scan Θ(n)   +   merge sort O(r log r)'), FOOT);
  const topLevels = [matches.map((doc) => [doc]), runs].flatMap((groups, level) => {
    const band = [inputNames, inputRow][level];
    return band
      .columns(groups.length, 'wide')
      .flatMap((slot, i) => [
        rect(slot.width * 0.9, 70, { fill: 'surface', stroke: 'blue', width: 2 }).moveTo(
          slot.point('center'),
        ),
        place(mono(groups[i].map((doc) => doc.letter).join('       '), { size: 38 }), slot),
      ]);
  });
  c.swapAll('scan-sort', [base, tiles, countChecks], { keep: [title] });
  c.after('scan-runs', () => ready.set(1));
  c.after('scan-first-winner', () => s.play(progress.to(1), { duration: 0.8 }));
  c.after('scan-next-winner', () => s.play(progress.to(2), { duration: 0.8 }));
  c.on('scan-finish-merge', () => s.play(progress.to(events.length), { duration: 1.7 }));
  c.swap('scan-levels', pairNames, topLevels);
  c.swap('scan-sort-bound', countChecks, sortBound, { after: true });
}
