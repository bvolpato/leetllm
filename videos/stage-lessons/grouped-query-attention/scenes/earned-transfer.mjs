import { dot, line } from 'vizmatic/stage';
import { heading } from '../../kit-narrated.mjs';
import {
  C,
  assertEqual,
  block,
  body,
  cacheBytes,
  change,
  foot,
  kvGroupForQuery,
  label,
  mono,
  note,
  place,
  point,
  range,
  rankCopies,
  readout,
} from '../parts.mjs';
import { physicalHeads } from '../../../films/grouped-query-attention/model.mjs';

export default function earnedTransfer(s, c) {
  const queries = 48,
    heads = 6,
    ranks = 12,
    which = 19;
  const layout = physicalHeads(queries, heads, ranks);
  const owner = kvGroupForQuery(which, queries, heads);
  const perRank = (tokens) =>
    cacheBytes({
      layers: 32,
      batch: 1,
      tokens,
      kvHeads: layout.kvPerRank,
      width: 64,
      bytes: 2,
    }) /
    2 ** 20;
  const full = perRank(1024),
    short = perRank(512),
    limit = 12;
  const free = limit - full;
  assertEqual(
    [full, short, full <= free, short <= free],
    [8, 4, false, true],
    'per-rank admission',
  );
  const mha = queries * full,
    aggregate = ranks * full;
  assertEqual(mha / aggregate, 4, 'aggregate saving');
  const title = heading('Which history serves query 19?');
  s.add(title);
  const [picture, ledger] = body.columns([5, 4], 'loose');
  const [queryBand, storage, rankNames] = picture.rows([2, 5, 1], 'tight');
  const [dots, ranges] = queryBand.rows(2, 'tight');
  for (const i of range(queries)) {
    const xy = point(dots, (i + 0.5) / queries, 0.5);
    s.add(dot(5, C.query).at(...xy));
    if (i === which) c.show('ask-group', dot(10, C.result).at(...xy));
  }
  const groups = ranges.columns(heads, 'none');
  for (const [i, r] of groups.entries()) {
    const size = queries / heads,
      start = i * size;
    const words = start + '–' + (start + size - 1);
    const entries = [['size', words, 'ink', true]];
    if (i === owner) entries.push(['group', words, C.result, true]);
    readout(s, c, r, entries, { size: 34, align: 'center' });
  }
  const map = rankCopies(s, storage, heads, { replicas: 0 });
  change(s, c, 'group', map.active, owner, true, 0.4);
  change(s, c, 'partition', map.copies, 1, true, 0.55);
  change(s, c, 'replicas', map.copies, layout.replicas, true, 0.55);
  for (const [i, slot] of rankNames.columns(heads, 'none').entries()) {
    c.show(
      'replicas',
      place(
        mono('r' + 2 * i + ' / ' + (2 * i + 1), {
          size: 26,
          color: i === owner ? C.result : 'dim',
        }),
        slot,
      ),
      { after: true },
    );
  }
  const [spec, calculation, unit, totals] = ledger.rows([1, 2, 2, 2], 'normal');
  s.add(place(note('48 queries · 6 logical KV heads · 12 ranks'), spec, 'left'));
  readout(
    s,
    c,
    calculation,
    [
      [null, 'Q19  →  which group?'],
      ['group', '⌊19 / 8⌋  =  KV' + owner, C.result, true],
      ['partition', '4 query heads per rank', 'ink', true],
      ['replicas', 'KV2: ranks 4 and 5', C.result, true],
      ['copies', '6 identities × 2 copies = 12', C.key, true],
    ],
    { size: 42 },
  );
  readout(s, c, unit, [['unit', '1 physical head = ' + full + ' MiB', C.key, true]], { size: 42 });
  readout(
    s,
    c,
    totals,
    [
      ['logical', 'Logical: 6 × 8 = ' + heads * full + ' MiB', 'ink', true],
      ['aggregate', 'Physical: 12 × 8 = ' + aggregate + ' MiB', C.result, true],
      ['mha', 'MHA: ' + mha + ' MiB     GQA: ' + aggregate + ' MiB', 'ink', true],
    ],
    { size: 37 },
  );
  readout(
    s,
    c,
    foot,
    [['dimensions', '2 arrays × 32 layers × 1,024 positions × width 64 × 2 B per number']],
    { size: 37, align: 'center' },
  );

  const [rank, occupancy, gauge, longer, shorter] = body.rows([1, 1, 2, 2, 2], 'tight');
  const [residentLabel, residentSpace] = occupancy.columns([2, 5], 'loose');
  const [axis, bar] = gauge.columns([2, 5], 'loose');
  const xy = bar.point('center'),
    unitWidth = bar.width / limit;
  const amount = (from, n, color) =>
    block(n * unitWidth, 74, bar.left + (from + n / 2) * unitWidth, xy[1], color, { radius: 3 });
  const end = line([bar.right, xy[1] - 56], [bar.right, xy[1] + 56], {
    stroke: C.result,
    width: 5,
  });
  const board = [
    place(note('Representative rank · 12 identical ranks · raw K/V only'), rank, 'left'),
    place(mono('Resident A', { size: 42 }), residentLabel, 'left'),
    place(
      mono('1,024 positions    ·    ' + full + ' MiB', { size: 43, color: C.key }),
      residentSpace,
      'left',
    ),
    place(mono(limit + ' MiB limit', { size: 43, color: C.result }), axis, 'left'),
    amount(0, limit, 'grid'),
    amount(0, full, C.key),
    end,
  ];
  const queue = [
    [longer, 'B', 1024, full, 'wait'],
    [shorter, 'C', 512, short, 'fit'],
  ];
  for (const [row, id, positions, cost, cue] of queue) {
    const [name, space] = row.columns([2, 5], 'loose');
    const waiting = place(mono('Waiting ' + id, { size: 42 }), name, 'left');
    const length = positions.toLocaleString('en-US') + ' positions';
    const startLength = place(label(length, { size: 41 }), space, 'left');
    board.push(waiting, startLength);
    if (id === 'C')
      c.swap(
        'fill',
        waiting,
        place(mono('Resident C', { size: 42, color: C.value }), name, 'left'),
        { after: true },
      );
    const fits = cost <= free;
    const verdict = length + '    ·    ' + cost + ' MiB    ·    ' + (fits ? 'fits' : 'waits');
    c.swap(
      cue,
      startLength,
      place(label(verdict, { size: 41, color: fits ? C.value : C.position }), space, 'left'),
      { after: true },
    );
  }
  c.swapAll('rack', [heading(c.title), ...board]);
  c.show('fill', amount(full, short, C.value), { after: true });
  readout(
    s,
    c,
    foot,
    [
      ['waiting', 'Per-rank limit: ' + limit + ' MiB     ·     ' + full + ' MiB already in use'],
      ['ask', 'B or C?  Use the same bytes per position as A.', C.result],
      ['fit', free + ' MiB free per rank. C uses ' + short + ' MiB.', C.value, true],
      ['fill', 'A uses 8 MiB. C uses the last 4 MiB on every rank.', C.value, true],
      [
        'growth',
        'Next token: ' + full + ' MiB ÷ 1,024 = ' + perRank(1) * 1024 + ' KiB more per rank',
        'ink',
        true,
      ],
    ],
    { size: 39, align: 'center' },
  );
}
