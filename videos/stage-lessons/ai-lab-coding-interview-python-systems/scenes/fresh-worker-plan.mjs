import { assertEqual, boxOf, indicate, lanes, place, table } from 'vizmatic/stage';
import { heading, label, mono } from '../../kit-narrated.mjs';
import { BOARD, FOOT, mixedWorkSchedule } from '../parts.mjs';
import { bufferedFrontier, frontierBoard } from '../frontier-merge.mjs';

export default function scene(s, c) {
  const timeHeading = heading('When do both pages finish?');
  const wait = 4,
    cpu = 1;
  const plan = mixedWorkSchedule({ jobs: 2, wait, cpu });
  assertEqual(plan.serial, 10, 'serial worksheet');
  assertEqual(plan.overlapped, 6, 'one CPU lane');
  const parents = [
    { path: '/setup', links: ['/help#top', '/help?v=2'] },
    { path: '/cli', links: ['/help#end', '/tips'] },
  ];
  const [budgetArea, serialArea, bothArea] = BOARD.rows([0.65, 1.2, 2.35], 'normal');
  const budget = place(
    mono('Per page: 4 s wait + 1 s CPU     |     1 CPU lane, zero overhead', { size: 38 }),
    budgetArea,
  );
  const question = place(
    label('When do both pages finish?    Serial  ?      Overlapped  ?', { color: 'yellow' }),
    FOOT,
  );
  const spec = {
    width: BOARD.width * 0.75,
    domain: [0, plan.serial],
    ticks: [0, 2, 4, 6, 8, 10],
    size: 31,
    barHeight: 56,
    cursor: false,
    axisLabel: 'seconds',
  };
  const serial = place(
    lanes(
      ['serial'],
      [
        { lane: 0, start: 0, end: wait, label: 'setup wait', color: 'blue' },
        { lane: 0, start: wait, end: wait + cpu, label: 'CPU', color: 'blue' },
        { lane: 0, start: wait + cpu, end: 2 * wait + cpu, label: 'CLI wait', color: 'cyan' },
        { lane: 0, start: 2 * wait + cpu, end: plan.serial, label: 'CPU', color: 'cyan' },
      ],
      spec,
    ),
    serialArea,
  );
  const colors = ['blue', 'cyan'];
  const overlap = place(
    lanes(
      ['setup wait', 'CLI wait', 'CPU'],
      [
        ...plan.waits.map((w, i) => ({
          lane: i,
          start: w.start,
          end: w.end,
          label: 'waiting',
          color: colors[i],
        })),
        ...plan.compute.map((job, i) => ({
          lane: 2,
          start: job.start,
          end: job.end,
          label: i === 0 ? 'CLI' : 'setup',
          color: colors[1 - i],
        })),
      ],
      { ...spec, pitch: 74 },
    ),
    bothArea,
  );
  const shift = overlap.toWorld(overlap.x(0), 0)[0] - serial.toWorld(serial.x(0), 0)[0];
  serial.moveTo([boxOf(serial).cx + shift, boxOf(serial).cy]);
  const totals = (result) => place(mono(result, { size: 43, color: 'yellow' }), FOOT);
  const serialTotal = totals('Serial  ' + plan.serial + ' s      Overlapped  ?');
  const bothTotals = totals(
    'Serial  ' + plan.serial + ' s      Overlapped  ' + plan.overlapped + ' s',
  );
  s.add(timeHeading, budget, serial, overlap);
  c.on('plan-budget', () => s.play(indicate(budget, { duration: 0.55, scale: 1.03 })));
  c.show('plan-question', question);
  c.after('plan-serial', () => s.play(serial.advance(plan.serial, { duration: 1.25 })));
  c.swap('plan-serial', question, serialTotal, { after: true });
  c.on('plan-waits', () => s.play(overlap.advance(wait, { duration: 1.1 })));
  c.on('plan-cli', () => s.play(overlap.advance(plan.compute[0].end, { duration: 0.65 })));
  c.on('plan-setup', () => s.play(overlap.advance(plan.compute[1].end, { duration: 0.65 })));
  c.swap('plan-finish', serialTotal, bothTotals, { after: true });

  const trace = bufferedFrontier(parents, [1, 0]);
  assertEqual(trace.queue.map((x) => x.path).join(' '), '/help /help?v=2 /tips', 'fresh frontier');
  const other = bufferedFrontier(parents, [0, 1]);
  assertEqual(
    other.queue.map((x) => x.path).join(' '),
    '/help /help?v=2 /tips',
    'opposite completion order',
  );
  const board = frontierBoard(parents);
  const [setup, cli] = board.rows;
  const tiles = board.queueTiles(trace);
  const duplicate = board.skip(1, 0);
  const predict = place(
    label('Which three addresses enter the queue, in order?', { color: 'yellow' }),
    FOOT,
  );
  c.swap('plan-slots', [timeHeading, budget, serial, overlap, bothTotals], [
    heading(c.title), ...board.fixed, ...cli.items,
  ]);
  c.on('plan-list-cli', () => s.play(...cli.items.map((node) => indicate(node, { duration: 0.55 }))));
  c.show('plan-list-setup', setup.items);
  c.show('plan-merge-question', predict);
  c.hide('plan-help', predict);
  c.show('plan-help', board.cursor, { after: true });
  c.after('plan-help', () => board.enqueue(s, tiles[0], 0));
  c.after('plan-version', () => board.enqueue(s, tiles[1], 1));
  c.on('plan-dupe', () => s.play(board.nextParent()));
  c.swap('plan-dupe', cli.items[0], duplicate, { after: true });
  c.after('plan-tips', () => board.enqueue(s, tiles[2], 2));
  const [checkArea] = BOARD.columns([1.4, 1], 'wide');
  const test = place(
    table(
      [
        { key: 'order', label: 'callbacks return', sample: '/setup, /cli' },
        { key: 'match', label: 'queue == expected', sample: 'True' },
      ],
      [],
      { width: checkArea.width * 0.94, size: 40, leading: 2.6, maxRows: 2 },
    ),
    checkArea,
  );
  const expected = ['/help', '/help?v=2', '/tips'];
  const match = (run) =>
    run.queue.map((item) => item.path).join(' ') === expected.join(' ') ? 'True' : 'False';
  c.swap('plan-test', [board.inputs, setup.items, cli.items[1], duplicate, board.cursor], test);
  c.after('plan-first-test', () =>
    s.play(test.append([{ id: 'cli', order: '/cli, /setup', match: match(trace) }])),
  );
  c.after('plan-other-test', () =>
    s.play(test.append([{ id: 'setup', order: '/setup, /cli', match: match(other) }])),
  );
  const owner = place(
    label('The coordinator claims each child before scheduling its fetch.'),
    FOOT,
  );
  c.show('plan-owner', owner, { after: true });
  c.on('plan-front', () => s.play(indicate(tiles[0], { color: 'yellow', scale: 1.1, duration: 0.75 })));
}
