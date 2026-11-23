import { assertEqual, dynamic, place, stateGrid } from 'vizmatic/stage';
import { ownershipAfter } from '../../../films/prefix-reuse/arithmetic.mjs';
import { board, body, caption, foot, fmt, gauge, pointAt, readings } from '../parts.mjs';

export default function poolHeadroom(s, c) {
  const starting = { total: 1000, referenced: 450, cached: 400, free: 150 };
  const demand = 200,
    unit = 50,
    next = ownershipAfter(starting, demand);
  assertEqual(next.available, 350, 'Headroom excludes the blocks just allocated.');
  board(
    s,
    c,
    'How much room can the next request use?',
    'KV pool · one cell = ' + unit + ' blocks',
  );
  const [main, scale] = body.rows([3, 1], 'normal');
  const count = starting.total / unit,
    startRef = starting.referenced / unit,
    startFree = (starting.referenced + starting.cached) / unit;
  const pool = place(
    stateGrid({
      columns: count / 2,
      rows: 2,
      cell: 112,
      gap: 24,
      states: {
        quiet: { color: 'dim', fill: 0.1 },
        referenced: { color: 'blue', fill: 0.45 },
        cached: { color: 'green', fill: 0.35 },
        free: { color: 'dim', dash: true, fill: 0.05 },
        held: { color: 'cyan', fill: 0.55 },
      },
      initial: 'quiet',
    }),
    main,
  );
  const headroom = gauge(
    scale,
    'Available',
    [
      ['idle', 0, 'green'],
      ['free', 0, 'dim'],
    ],
    starting.total,
  );
  s.add(pool, headroom.nodes);
  c.after('headroom-ref', () => s.play(pool.change((i) => i < startRef, 'referenced')));
  c.after('headroom-cached', () =>
    s.play(pool.change((i) => i >= startRef && i < startFree, 'cached')),
  );
  c.after('headroom-free', () => s.play(pool.change((i) => i >= startFree, 'free')));
  c.after('headroom-total', () =>
    s.play(headroom.bar.resize({ idle: starting.cached, free: starting.free })),
  );
  const freeCells = pool.cells.map((_, i) => i).slice(startFree);
  const evictions = next.evicted / unit;
  const taken = [
    ...freeCells,
    ...pool.cells.map((_, i) => i).slice(startRef, startRef + evictions),
  ];
  const allocated = s.value(0);
  const allocationCount = dynamic(() =>
    caption(fmt(Math.round(allocated.value) * unit) + ' blocks allocated', foot, { color: 'cyan' }),
  );
  c.show('headroom-allocate', allocationCount, { lead: -0.18 });
  c.hide('headroom-remain', allocationCount, { fade: 0.12 });
  taken.forEach((cell, i) => {
    const fromFree = i < freeCells.length;
    const amount = fromFree
      ? starting.free - (i + 1) * unit
      : starting.cached - (i + 1 - freeCells.length) * unit;
    const cue = fromFree ? 'headroom-allocate' : 'headroom-evict';
    c.on(
      cue,
      () =>
        s.play(
          pool.change(cell, 'held'),
          headroom.bar.resize(fromFree ? 'free' : 'idle', amount),
          allocated.to(i + 1),
          { duration: 0.26 },
        ),
      0.2 + (fromFree ? i * 0.58 : 0),
    );
  });
  c.on('headroom-protect', () =>
    s.play(...pool.cells.slice(0, startRef).map((cell) => pointAt(cell))),
  );
  c.on('headroom-touch', () =>
    s.play(
      pool.change(startRef + 1, 'referenced'),
      headroom.bar.resize('idle', next.cached - unit),
    ),
  );
  readings(s, c, fmt(starting.total) + ' resident blocks', [
    ['headroom-ref', fmt(starting.referenced) + ' referenced blocks', 'blue'],
    ['headroom-cached', fmt(starting.cached) + ' cached and unreferenced', 'green'],
    ['headroom-free', fmt(starting.free) + ' uncached free blocks'],
    [
      'headroom-total',
      fmt(starting.cached) +
        ' + ' +
        fmt(starting.free) +
        ' = ' +
        fmt(starting.cached + starting.free) +
        ' available',
      'yellow',
      'headroom-allocate',
    ],
    [
      'headroom-remain',
      fmt(next.referenced) +
        ' referenced   /   ' +
        fmt(next.available) +
        ' available   /   ' +
        fmt(next.evicted) +
        ' evicted',
    ],
    ['headroom-protect', 'Active requests and pending device work hold their references.'],
    [
      'headroom-touch',
      'Touch this group of 50 cached blocks and take it off the free queue.',
      'blue',
    ],
  ]);
}
