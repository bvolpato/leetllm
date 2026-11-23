import { assertEqual, axes, column, dynamic, line, place, rect } from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import { PICTURE, FOOT, budgetFor } from '../parts.mjs';
export default function budget(s, c) {
  const [left, right] = PICTURE.columns([3, 2], 'loose');
  const [auth, plotRegion] = left.rows([1, 6], 'normal');
  const permission = place(
    label('project + principal → eligible rows', { size: 36, color: 'cyan' }),
    auth,
  );
  const a = budgetFor(2500, 384, 2),
    b = budgetFor(4000, a.d, 1, a.budget);
  const plot = place(
    axes({
      x: [0, a.d],
      y: [0, b.n],
      width: plotRegion.width - 200,
      height: plotRegion.height - 100,
      labels: false,
      grid: false,
    }),
    plotRegion,
  );
  const n = s.value(a.n),
    k = s.value(a.k),
    count = s.value(0),
    run = s.value(0);
  const countedProducts = () => Math.floor(n.value * a.d * count.value);
  const shape = dynamic(() => {
    const bottom = plot.world(0, 0),
      top = plot.world(a.d, n.value),
      height = bottom[1] - top[1],
      width = top[0] - bottom[0],
      counted = countedProducts(),
      within = Math.min(counted, a.budget),
      withinHeight = bottom[1] - plot.world(0, within / a.d)[1],
      excessHeight = bottom[1] - plot.world(0, counted / a.d)[1] - withinHeight;
    return [
      rect(width, height, { fill: 'surface', stroke: 'cyan', width: 2 }).moveTo([
        bottom[0] + width / 2,
        bottom[1] - height / 2,
      ]),
      ...(withinHeight > 0
        ? [
            rect(width, withinHeight, { fill: 'blue', stroke: null, opacity: 0.7 }).moveTo([
              bottom[0] + width / 2,
              bottom[1] - withinHeight / 2,
            ]),
          ]
        : []),
      ...(excessHeight > 0
        ? [
            rect(width, excessHeight, { fill: 'red', stroke: null, opacity: 0.7 }).moveTo([
              bottom[0] + width / 2,
              bottom[1] - withinHeight - excessHeight / 2,
            ]),
          ]
        : []),
    ];
  });
  const guard = line(plot.world(0, a.budget / a.d), plot.world(a.d, a.budget / a.d), {
    stroke: 'yellow',
    width: 5,
  });
  const axisNames = [
    ...[0, a.n, b.n].map((v) =>
      mono(String(v), { size: 34, color: 'dim' }).moveTo([
        plot.world(0, v)[0] - 60,
        plot.world(0, v)[1],
      ]),
    ),
    mono('n eligible', { size: 34, color: 'cyan' }).moveTo([
      plot.world(0, b.n)[0] + 120,
      plot.world(0, b.n)[1] - 35,
    ]),
    mono('d = ' + a.d, { size: 34, color: 'cyan' }).moveTo([
      plot.world(a.d / 2, 0)[0],
      plot.world(a.d / 2, 0)[1] + 40,
    ]),
  ];
  const [limit, inputs, winners] = right.rows([1, 2, 2], 'normal');
  const budgetName = place(
    column(
      [
        note('score-stage budget'),
        mono(a.budget.toLocaleString('en-US') + ' products', { size: 36, color: 'yellow' }),
      ],
      { gap: 'tight' },
    ),
    limit,
  );
  const [factors, tally] = inputs.rows(2, 'normal');
  const arithmetic = dynamic(() => [
    place(mono(n.value + ' × ' + a.d, { color: 'cyan' }), factors),
    place(
      mono(
        count.value > 0
          ? countedProducts().toLocaleString('en-US') +
              (count.value < 1 ? ' tallied' : ' products required')
          : '?',
        { size: 36, color: 'yellow' },
      ),
      tally,
    ),
  ]);
  const winnerSlots = winners.rows([1, 3], 'normal')[1].columns(2, 'wide');
  const winnerPicture = dynamic(() =>
    winnerSlots.map((b, i) =>
      rect(b.width, b.height * 0.6, {
        fill: i < Math.round(k.value) ? 'surface' : 'bg',
        stroke: i < k.value ? 'green' : 'faint',
        width: 3,
      }).moveTo(b.point('center')),
    ),
  );
  const winnerName = dynamic(() => [
    place(
      label('winner slots: ' + Math.round(k.value), { size: 34, color: 'green' }),
      winners,
      'top',
    ),
  ]);
  const cursor = dynamic(() => {
    if (run.value <= 0 || run.value >= 1) return [];
    const bottom = plot.world(0, 0),
      top = plot.world(a.d, n.value),
      x = bottom[0] + (top[0] - bottom[0]) * run.value;
    return [line([x, bottom[1]], [x, top[1]], { stroke: 'yellow', width: 5 })];
  });
  const fit = place(label('Fits: release exact scoring', { color: 'green' }), FOOT);
  const predict = place(label('Does exact scoring fit the product budget?'), FOOT);
  const stop = place(label('Over budget: reroute before scoring', { color: 'red' }), FOOT);
  const title = heading(c.title);
  const rows = [
    ['fixture', 'auth', 'u3'],
    ['CI timeout', 'auth', 'u3'],
    ['CLI flag', 'auth', 'u3'],
    ['private note', 'auth', 'u1'],
    ['billing fixture', 'billing', 'u3'],
  ];
  const [table, ledger] = PICTURE.columns([3, 2], 'loose');
  const tableRows = table.rows(6, 'normal');
  const checked = s.value(0);
  const allowed = (row) => row[1] === 'auth' && row[2] === 'u3';
  const allowedCount = () => rows.slice(0, Math.floor(checked.value)).filter(allowed).length;
  const headers = tableRows[0].columns([2, 1, 1, 1.3], 'normal');
  const tableTitle = ['Note', 'Project', 'Reader', 'Score?'].map((h, j) =>
    place(note(h), headers[j], 'left'),
  );
  const entries = dynamic(() =>
    rows.flatMap((row, i) => {
      const cols = tableRows[i + 1].columns([2, 1, 1, 1.3], 'normal');
      const seen = checked.value >= i + 1;
      return [
        ...row.map((v, j) =>
          place(
            label(v, { size: 36, color: seen && !allowed(row) ? 'dim' : 'ink' }),
            cols[j],
            'left',
          ),
        ),
        ...(seen
          ? [
              place(
                mono(allowed(row) ? 'pass' : 'skip', {
                  size: 34,
                  color: allowed(row) ? 'green' : 'dim',
                }),
                cols[3],
                'left',
              ),
            ]
          : []),
      ];
    }),
  );
  const [request, slots, receipt] = ledger.rows([1.2, 2, 1.2], 'wide');
  const requestName = place(
    column([note('Permission filter'), mono('auth   /   u3', { color: 'cyan' })], { gap: 'tight' }),
    request,
  );
  const cells = dynamic(() =>
    slots
      .rows(3, 'normal')
      .slice(0, allowedCount())
      .flatMap((row) =>
        row
          .columns(3, 'normal')
          .map((box) =>
            rect(box.width, box.height, { fill: 'surface', stroke: 'blue', width: 3 }).moveTo(
              box.point('center'),
            ),
          ),
      ),
  );
  const products = rows.filter(allowed).length * 3;
  assertEqual(products, 9, 'filtered lab work');
  assertEqual(a.products, 960000, 'admitted workload');
  assertEqual(b.products, 1536000, 'over-budget workload');
  const tinyBill = place(
    mono('3 × 3 = ' + products + ' products', { size: 38, color: 'yellow' }),
    receipt,
  );
  s.add(title, tableTitle, entries, requestName, cells);
  const filter = c.cue('budget-filter');
  c.on('budget-filter', () => s.play(checked.to(3), { duration: filter.end - filter.start }));
  c.after('budget-reader', () => checked.set(4));
  c.after('budget-project', () => checked.set(rows.length));
  c.show('budget-nine', tinyBill, { after: true });
  c.swapAll(
    'budget-scale',
    [
      permission,
      plot,
      shape,
      guard,
      axisNames,
      budgetName,
      arithmetic,
      winnerPicture,
      winnerName,
      cursor,
      predict,
    ],
    { keep: [title] },
  );
  c.on('budget-count', () => s.play(count.to(1), { duration: 2 }));
  c.swap('budget-check', predict, fit, { after: true });
  c.on('budget-run', () => s.play(run.to(1), { duration: 2 }));
  c.on('budget-next', () => {
    n.set(b.n);
    count.set(0);
    run.set(0);
  });
  c.hide('budget-next', fit);
  c.on('budget-k', () => s.play(k.to(b.k), { duration: 0.8 }));
  c.on('budget-over', () => s.play(count.to(1), { duration: 1.5 }));
  c.show('budget-stop', stop, { after: true });
}
