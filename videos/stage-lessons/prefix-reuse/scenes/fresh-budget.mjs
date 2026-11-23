import { assertEqual, boxOf, dot, line, place, rect, stateGrid, to } from 'vizmatic/stage';
import { mono, note } from '../../kit-narrated.mjs';
import { guideWork } from '../../../films/prefix-reuse/arithmetic.mjs';
import { board, body, caption, fmt, foot, pointAt } from '../parts.mjs';

export default function freshBudget(s, c) {
  const guide = 4800, question = 64, block = 16, cap = 700;
  const edits = [4176, 4177];
  const [a, b] = edits.map((edit) => guideWork(guide, question, block, edit));
  assertEqual(a.fresh, 704, 'An edit in the last slot invalidates the left block.');
  assertEqual(b.fresh, 688, 'An edit in the next slot preserves one more full block.');
  board(s, c, 'The fresh input budget', block + ' tokens per block · positions counted from 1');
  const [inputs, zoom, measure] = body.rows([0.8, 2.2, 1.65], 'wide');
  const cells = inputs.columns([1.45, 1.15, 1.6], 'normal');
  const fixed = [
    caption('Guide   ' + fmt(guide) + ' tokens', cells[0], { color: 'blue' }),
    caption('Question   ' + question + ' tokens', cells[1], { color: 'pink' }),
    caption('Limit   ' + cap + ' fresh tokens', cells[2], { color: 'yellow' }),
  ];
  s.add(fixed[0]);
  c.on('budget-guide', () => s.play(pointAt(fixed[0])));
  c.show('budget-question', fixed[1]);
  c.show('budget-cap', fixed[2]);

  const ranges = zoom.columns(2, 'wide');
  const grids = ranges.map((band, i) => {
    const grid = place(stateGrid({
      rows: 1, columns: block, cell: 40, gap: 6, initial: 'unknown',
      states: {
        unknown: { color: 'dim', fill: 0.08 },
        reuse: { color: 'green', fill: 0.6 },
        fresh: { color: 'cyan', fill: 0.55 },
      },
    }), band, i ? 'left' : 'right');
    const bounds = boxOf(grid);
    const frame = rect(bounds.width + 18, bounds.height + 18, {
      stroke: 'blue', fill: 'transparent', width: 3,
    }).moveTo(bounds.point('center'));
    const last = edits[0] + i * block;
    const title = note(fmt(last - block + 1) + ' through ' + fmt(last), { size: 34 })
      .moveTo([bounds.cx, bounds.bottom + 44]);
    return { grid, frame, title };
  });
  const [left, right] = grids;
  const lastSlot = boxOf(left.grid.cells.at(-1));
  const nextSlot = boxOf(right.grid.cells[0]);
  const ring = rect(lastSlot.width + 3, lastSlot.height + 3, {
    stroke: 'pink', fill: 'transparent', width: 7,
  }).moveTo(lastSlot.point('center'));
  const labels = [lastSlot, nextSlot].map((slot, i) =>
    mono('Edit ' + fmt(edits[i]), { color: 'pink', size: 37 }).moveTo([slot.cx, slot.top - 57]));
  const stem = (slot) => line([slot.cx, slot.top - 5], [slot.cx, slot.top - 28], {
    stroke: 'pink', width: 4,
  });
  const stems = [stem(lastSlot), stem(nextSlot)];
  s.add(grids.flatMap(({ grid, frame, title }) => [frame, grid, title]));
  c.on('budget-zoom', () => s.play(pointAt(left.grid.cells.at(-1)), pointAt(right.grid.cells[0])));
  c.show('edit-left', [ring, labels[0], stems[0]], { after: true, lead: 0 });

  const [work, scale] = measure.columns([1.35, 2.5], 'wide');
  const [boundary, terms] = work.rows(2, 'tight');
  const edge = (run) => caption(fmt(run.reused) + ' reusable', boundary, { size: 39, color: 'green' });
  const sum = (run) => caption(fmt(guide - run.reused) + ' guide + ' + question + ' question', terms, { size: 37 });
  const edges = [edge(a), edge(b)], sums = [sum(a), sum(b)];
  const min = 672, max = 720;
  const x = (n) => scale.left + 60 + (scale.width - 120) * (n - min) / (max - min);
  const axisY = scale.cy + 10;
  const axis = line([x(min), axisY], [x(max), axisY], { stroke: 'dim', width: 4 });
  const ticks = [min, cap, max].flatMap((n) => [
    line([x(n), axisY - 12], [x(n), axisY + 14], { stroke: n === cap ? 'yellow' : 'dim', width: 4 }),
    mono(n === cap ? n + ' limit' : String(n), { size: 32, color: n === cap ? 'yellow' : 'dim' })
      .moveTo([x(n), axisY + 40]),
  ]);
  const plotted = (run) => {
    const pos = x(run.fresh);
    return [
      dot(11, 'cyan').moveTo([pos, axisY]),
      mono(run.fresh + ' fresh', { size: 36, color: 'cyan' }).moveTo([pos, axisY - 48]),
    ];
  };
  const marks = [plotted(a), plotted(b)];
  const firstTry = [
    dot(9, 'dim').moveTo([x(a.fresh), axisY]),
    mono('First try · ' + a.fresh, { size: 32, color: 'dim' }).moveTo([x(a.fresh), axisY - 48]),
  ];
  c.show('budget-cap', [axis, ticks]);
  const status = (words, color) => caption(words, foot, { size: 42, color });
  const setup = status('This worker holds the compatible guide entry.', 'dim');
  const leftAsk = status('Edit at ' + fmt(edits[0]) + '   ·   does the request fit?', 'yellow');
  const rightAsk = status('Edit at ' + fmt(edits[1]) + '   ·   does the request fit?', 'yellow');
  const verdict = (run) => run.fresh <= cap
    ? status('Admit   ·   ' + (cap - run.fresh) + ' fresh tokens to spare', 'green')
    : status('Defer   ·   ' + (run.fresh - cap) + ' fresh tokens over budget', 'red');
  const firstVerdict = verdict(a), secondVerdict = verdict(b);
  const admit = status('Admit', 'green');
  s.add(setup);
  c.swap('ask-left', setup, leftAsk);
  c.after('left-block', () => s.play(...grids.map(({ grid }) => grid.change(() => true, 'fresh')), { duration: 0.5 }));
  c.show('left-end', edges[0], { after: true, lead: 0 });
  c.show('left-guide', sums[0], { after: true, lead: 0 });
  c.show('left-work', marks[0], { after: true, lead: 0 });
  c.swap('left-verdict', leftAsk, firstVerdict, { after: true, lead: 0 });

  c.hide('budget-reset', [edges[0], sums[0], marks[0], labels[0], stems[0], firstVerdict], { fade: 0.12 });
  c.show('budget-reset', firstTry, { lead: -0.15 });
  c.on('budget-reset', () => s.play(...grids.map(({ grid }) => grid.change(() => true, 'unknown')), { duration: 0.24 }));
  c.on('edit-right', () => s.play(to(ring, (n) => n.moveTo(nextSlot.point('center'))), { duration: 0.55 }));
  c.show('edit-right', [labels[1], stems[1]], { after: true, lead: 0 });
  c.show('ask-right', rightAsk);
  c.show('right-end', edges[1], { after: true, lead: 0 });
  c.on('right-block', () => s.play(left.grid.change(() => true, 'reuse'), right.grid.change(() => true, 'fresh'), { duration: 0.65 }));
  c.show('right-guide', sums[1], { after: true, lead: 0 });
  c.show('right-work', marks[1], { after: true, lead: 0 });
  c.swap('right-verdict', rightAsk, admit, { after: true, lead: 0 });
  c.swap('right-margin', admit, secondVerdict, { after: true, lead: 0 });
}
