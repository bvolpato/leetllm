import { assertEqual, boxOf, indicate, place, rect, to } from 'vizmatic/stage';
import { area, heading, label, mono, note, chip } from '../../kit-narrated.mjs';
import { PAIRS, PROGRAMS, subsetCoverage } from '../parts.mjs';

export default function candidates(s, c) {
  const [pool, body, footer] = area.rows([1, 6.9, 0.8], 'normal');
  const [map, detail] = body.columns([1.55, 1], 'loose');
  const rows = map.rows(8, 'tight').map((r) => r.columns(8, 'tight'));
  const program = (id) => PROGRAMS.find((item) => item.id === id);
  const indexes = PROGRAMS.map((p, i) => {
    const slot = pool.columns(PROGRAMS.length, 'normal')[i];
    return {
      number: place(mono('#' + p.id, { size: 40 }), slot),
      tested: place(
        chip('#' + p.id + (p.pass ? ' ✓' : ' ×'), { size: 36, color: p.pass ? 'green' : 'dim' }),
        slot,
      ),
    };
  });
  const headers = PROGRAMS.slice(1).flatMap((p, i) => [
    place(mono(String(p.id), { size: 36 }), rows[0][i + 1]),
    place(mono(String(i + 1), { size: 36 }), rows[i + 1][0]),
  ]);
  const legend = place(note('Row = lower index     Column = higher index'), footer, 'left');
  const cells = PAIRS.map((pair) => {
    const slot = rows[pair.a][pair.b - 1];
    const frame = place(
      rect(slot.width - 6, slot.height - 4, { fill: 'surface', stroke: 'grid', width: 2 }),
      slot,
    );
    const mark = place(
      label(pair.pass ? '✓' : '×', { color: pair.pass ? 'green' : 'dim', size: 42 }),
      slot,
    );
    const returned = program(pair.a);
    const miss = place(label('×', { color: 'red', size: 42 }), slot);
    return { pair, frame, mark, returned, miss };
  });
  const covered = cells.filter((v) => v.pair.pass);
  const missed = cells.filter((v) => !v.pair.pass);
  const lost = covered.filter((v) => !v.returned.pass);
  const delivered = cells.filter((v) => v.returned.pass);
  assertEqual(
    covered.length,
    Math.round(cells.length * subsetCoverage(PROGRAMS.length, 2, 2)),
    'pair availability',
  );
  assertEqual(delivered.length, 8, 'passing lower index');
  const [question, count, drawSlot, outSlot, resultSlot] = detail.rows(
    [1, 1, 1.2, 1.2, 1],
    'normal',
  );
  const prompt = place(label('Does either program pass?', { size: 38 }), question);
  const total = place(label(`${cells.length} possible pairs`), count);
  const missing = place(label(`${missed.length} all-failing pairs`, { color: 'dim' }), count);
  const numerator = place(
    label(`${covered.length} / ${cells.length} contain a pass`, { color: 'green', size: 36 }),
    count,
  );
  const rule = place(label('Return the lower index', { color: 'yellow' }), question);
  const [slotA, slotB] = drawSlot.columns(2, 'normal');
  const output = place(
    rect(outSlot.width - 70, 100, { fill: 'surface', stroke: 'dim', width: 2 }),
    outSlot,
  );
  const resultName = place(note('Returned'), outSlot.columns(2, 'none')[0]);
  const choose = place(
    label('Which program reaches the user?', { color: 'yellow', size: 37 }),
    resultSlot,
  );
  const outputPoint = outSlot.columns([1, 1], 'none')[1].point('center');
  function draw(a, b) {
    const pair = cells.find((v) => v.pair.a === a && v.pair.b === b);
    const token = (id) => chip('#' + id, { color: program(id).pass ? 'green' : 'dim', size: 39 });
    const first = place(token(a), slotA);
    const second = place(token(b), slotB);
    const cell = boxOf(pair.frame);
    const outline = rect(cell.width + 4, cell.height + 4, {
      stroke: 'yellow',
      fill: null,
      width: 3,
    }).moveTo(cell.point('center'));
    const verdict = place(
      label(pair.returned.pass ? 'Pass' : 'Fail', {
        color: pair.returned.pass ? 'green' : 'red',
        size: 38,
      }),
      resultSlot,
    );
    return { pair, first, second, verdict, outline };
  }
  const first = draw(1, 2),
    second = draw(2, 3);
  const run = (cue, chosen) => {
    c.after(cue, () => s.play(to(chosen.first, (n) => n.moveTo(outputPoint), { duration: 0.62 })));
  };
  const focusPair = (cue, item) =>
    c.on(cue, () => s.play(indicate(item.pair.frame, { scale: 1.06, color: 'yellow' })));
  const countSelection = place(
    label(`${delivered.length} / ${cells.length} return a pass`, { color: 'blue', size: 40 }),
    outSlot,
  );
  s.add(
    heading('One problem, eight generated programs'),
    indexes.map((v) => v.number),
  );
  c.swap(
    'passing-programs',
    indexes.map((v) => v.number),
    indexes.map((v) => v.tested),
    { after: true },
  );
  c.show('pair-draw', prompt);
  c.show('pair-map', [headers, legend, cells.map((v) => v.frame)]);
  focusPair('first-square', first);
  c.show('total-pairs', total, { after: true });
  c.show(
    'miss-map',
    missed.map((v) => v.mark),
  );
  c.swap('miss-count', total, missing, { after: true });
  c.show(
    'covered-map',
    covered.map((v) => v.mark),
    { after: true },
  );
  c.swap('availability', missing, numerator, { after: true });
  c.swap('selector-rule', prompt, rule);
  c.show('draw-first', [output, resultName, first.outline, first.first, first.second]);
  c.show('pick-ask', choose);
  c.hide('return-first', choose);
  run('return-first', first);
  c.show('fail-first', first.verdict, { after: true });
  c.swap(
    'draw-second',
    [first.first, first.second, first.verdict, first.outline],
    [second.first, second.second, second.outline],
  );
  run('return-second', second);
  c.show('pass-second', second.verdict, { after: true });
  c.hide('selected-map', [
    second.first,
    second.second,
    second.verdict,
    second.outline,
    resultName,
    output,
  ]);
  c.swap(
    'selected-map',
    lost.map((v) => v.mark),
    lost.map((v) => v.miss),
  );
  c.show('selected-score', countSelection, { after: true });
}
