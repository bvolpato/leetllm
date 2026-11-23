import { assertEqual, column, dot, dynamic, line, place, rect } from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import { PICTURE, FOOT, comparisonGrid, DEDUP, DOCS } from '../parts.mjs';
export default function pairs(s, c) {
  const [left, right] = PICTURE.columns(2, 'loose');
  const n = s.value(4),
    filled = s.value(0),
    mode = s.value(0);
  const grid = comparisonGrid(s, left, { n, filled, mode });
  const [read, chartRegion, keyBand] = right.rows([2, 5, 1.2], 'normal');
  const totalPairs = (size) => (size * (size - 1)) / 2;
  const revealed = s.value(0);
  const mirror = [grid.cells[1], grid.cells[8]].map((cell) =>
    rect(cell.width, cell.height, { fill: 'surface', stroke: 'yellow', width: 4 }).moveTo(
      cell.point('center'),
    ),
  );
  const counter = dynamic(
    () =>
      place(
        column(
          [
            mono(
              n.value +
                ' notes' +
                (revealed.value === n.value ? ' → ' + totalPairs(n.value) + ' pairs' : ''),
              { color: 'yellow' },
            ),
            mono('Pairs counted: ' + Math.floor(filled.value + 1e-7), { size: 36 }),
          ],
          { gap: 'normal' },
        ),
        read,
      ).nodes,
  );
  const arrivalRows = chartRegion.rows(8, 'tight');
  const increments = dynamic(() =>
    arrivalRows.slice(0, n.value).flatMap((r, i) => {
      const [id, span] = r.columns([1, 4], 'normal');
      const before = totalPairs(i);
      const added = Math.min(i, Math.max(0, Math.floor(filled.value) - before));
      return [
        place(mono(String.fromCharCode(65 + i), { size: 32 }), id, 'right'),
        ...span
          .columns(7, 'tight')
          .slice(0, added)
          .map((b) =>
            rect(b.width, b.height * 0.8, { fill: 'cyan', stroke: null }).moveTo(b.point('center')),
          ),
      ];
    }),
  );
  const key = place(note('One mark for each earlier partner'), keyBand);
  const caption = place(label('Each new note meets every earlier note'), FOOT);
  const rule = place(label('n(n − 1)/2 unordered pairs   ·   Θ(n²) pair checks'), FOOT);
  const title = heading(c.title);
  s.add(title, grid.picture, counter, increments, key, caption);
  const [arrivals, seen] = PICTURE.columns(2, 'loose');
  const sourceRows = arrivals.rows(6, 'normal'),
    setRows = seen.rows(4, 'wide');
  const sourceTitle = place(label('Literal text arrivals'), sourceRows[0]);
  const source = DEDUP.map((d, i) =>
    place(mono(d.value, { size: 34, color: 'cyan' }), sourceRows[i + 1]),
  );
  const setTitle = place(label('Seen keys: keep first occurrences'), setRows[0]);
  const progress = s.value(0);
  const kept = dynamic(() => {
    const count = Math.floor(progress.value),
      keys = count ? DEDUP[count - 1].unique : [];
    return keys.map((key, i) => place(mono(key, { size: 34, color: 'green' }), setRows[i + 1]));
  });
  const decisions = dynamic(() =>
    DEDUP.slice(0, Math.floor(progress.value)).map((d, i) =>
      place(
        note(d.duplicate ? 'skip' : 'keep', { color: d.duplicate ? 'dim' : 'green' }),
        sourceRows[i + 1],
        'right',
      ),
    ),
  );
  const marker = dynamic(() => {
    const i = Math.floor(progress.value),
      f = progress.value - i;
    if (!f || i >= DEDUP.length) return [];
    const a = sourceRows[i + 1].point('right'),
      b = setRows[1].point('left');
    return [
      dot(12, DEDUP[i].duplicate ? 'dim' : 'yellow').moveTo([
        a[0] + (b[0] - a[0]) * f,
        a[1] + (b[1] - a[1]) * f,
      ]),
    ];
  });
  const exact = place(
    label('Expected linear pass + hashing text · semantic similarity uses different keys'),
    FOOT,
  );
  c.show('pairs-ab', mirror[0]);
  c.show('pairs-mirror', mirror[1]);
  c.hide('pairs-first', mirror);
  c.on('pairs-first', () => s.play(filled.to(totalPairs(4)), { duration: 1 }));
  c.after('pairs-six', () => revealed.set(4));
  c.on('pairs-fifth', () => n.set(5));
  c.on('pairs-add', () => {
    const cue = c.cue('pairs-add');
    s.play(filled.to(totalPairs(5)), { duration: cue.end - cue.start });
  });
  c.after('pairs-ten', () => revealed.set(5));
  c.on('pairs-eight', () => {
    n.set(8);
    const cue = c.cue('pairs-eight');
    s.play(filled.to(totalPairs(8)), { duration: cue.end - cue.start });
  });
  c.after('pairs-eight', () => revealed.set(8));
  c.swap('pairs-formula', caption, rule);
  const large = 1000;
  c.swap(
    'pairs-large',
    key,
    place(
      mono('1,000 notes → ' + totalPairs(large).toLocaleString('en-US') + ' pairs', {
        size: 34,
        color: 'yellow',
      }),
      keyBand,
    ),
    { after: true },
  );
  const [vectors, scratch] = PICTURE.columns([1, 1], 'loose');
  const [names, ...slots] = vectors.rows(5, 'wide');
  const [indices, running, cutoff, output] = scratch.rows(4, 'normal');
  const partner = s.value(1),
    coordinates = s.value(0),
    sent = s.value(0);
  const letters = ['A', 'B', 'C', 'D'];
  const vectorCards = dynamic(() =>
    slots.flatMap((slot, i) => {
      const color = i === 0 ? 'blue' : i === partner.value ? 'yellow' : 'dim';
      const [name, values] = slot.columns([1, 4], 'normal');
      return [
        rect(slot.width, slot.height * 0.86, { fill: 'surface', stroke: color, width: 3 }).moveTo(
          slot.point('center'),
        ),
        place(mono(letters[i], { size: 40, color }), name),
        place(
          mono(DOCS[i].vector.map((v) => v.toFixed(1)).join('   '), { size: 38, color }),
          values,
        ),
      ];
    }),
  );
  function sumFor(j, count) {
    let sum = 0;
    for (let k = 0; k < count; k++) sum += (DOCS[0].vector[k] - DOCS[j].vector[k]) ** 2;
    return sum;
  }
  const width = DOCS[0].vector.length,
    threshold = 0.25;
  assertEqual(
    DOCS.slice(1)
      .filter((_, j) => sumFor(j + 1, width) <= threshold)
      .map((d) => d.id)
      .join(),
    'issuer-check',
    'only A and C meet the distance threshold in this row',
  );
  const readout = dynamic(() => {
    const j = partner.value,
      used = Math.floor(coordinates.value);
    const sum = sumFor(j, used);
    return [
      place(mono('i = A      j = ' + letters[j], { size: 44 }), indices),
      ...place(
        column(
          [
            note('Squared differences added   ' + used + ' / ' + width),
            mono('Running sum   ' + sum.toFixed(2), { size: 44, color: 'yellow' }),
          ],
          { gap: 'normal' },
        ),
        running,
      ).nodes,
      place(label('Flag when sum ≤ ' + threshold.toFixed(2), { size: 38 }), cutoff),
    ];
  });
  const track = output.inset('wide');
  const outlet = [
    line(track.point('left'), track.point('right'), { stroke: 'dim', width: 3 }),
    place(note('Output stream'), output, 'bottom'),
  ];
  const flag = dynamic(() => {
    if (sent.value <= 0 || sent.value >= 1) return [];
    const x = track.left + (track.width - 120) * sent.value + 60;
    return [
      rect(120, 64, { fill: 'surface', stroke: 'green', width: 3 }).moveTo([x, track.cy]),
      mono('A, C', { size: 36, color: 'green' }).moveTo([x, track.cy]),
    ];
  });
  const replay = [
    place(note('Same four note vectors'), names),
    vectorCards,
    readout,
    outlet,
    flag,
    place(label('Two note indices   ·   one coordinate index   ·   one running sum'), FOOT),
  ];
  c.swapAll('pairs-replay', replay, { keep: [title] });
  const check = (j) => {
    partner.set(j);
    coordinates.set(0);
    s.play(coordinates.to(width), { duration: 1.15 });
  };
  c.on('pairs-b', () => check(1));
  c.on('pairs-c', () => check(2));
  c.on('pairs-emit', () => s.play(sent.to(1), { duration: 1.2 }));
  c.on('pairs-d', () => check(3));
  c.swapAll('dedup-arrivals', [sourceTitle, source, setTitle, kept, decisions, marker], {
    keep: [title],
  });
  c.on('dedup-arrivals', () => s.play(progress.to(DEDUP.length), { duration: 5 }), 0.5);
  c.show('dedup-meaning', exact);
}
