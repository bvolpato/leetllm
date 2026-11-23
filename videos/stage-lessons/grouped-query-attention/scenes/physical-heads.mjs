import { group, line, to } from 'vizmatic/stage';
import { heading } from '../../kit-narrated.mjs';
import {
  C,
  assertEqual,
  block,
  body,
  change,
  foot,
  mono,
  note,
  place,
  point,
  rankCopies,
  readout,
  start,
} from '../parts.mjs';
import { physicalHeads } from '../../../films/grouped-query-attention/model.mjs';

export default function physicalHeadsScene(s, c) {
  start(s, c.title);
  const queries = 64,
    heads = 8,
    first = physicalHeads(queries, heads, 4),
    second = physicalHeads(queries, heads, 16);
  const [diagram, ledger] = body.columns([5, 4], 'loose');
  const [storage, names] = diagram.rows([6, 1], 'tight');
  const ranks = rankCopies(s, storage, heads);
  change(s, c, 'trace', ranks.active, 3);
  change(s, c, 'copies', ranks.copies, second.replicas, true);
  for (const [i, r] of names.columns(heads, 'none').entries()) {
    const opts = { size: 26, color: i === 3 ? C.result : 'dim' };
    const rank = place(mono('r' + Math.floor(i / first.kvPerRank), opts), r);
    const pair = place(mono('r' + 2 * i + '/' + (2 * i + 1), opts), r);
    c.show('four', rank, { after: true });
    c.hide('sixteen', rank);
    c.show('copies', pair, { after: true });
  }
  const [a, b, d, e] = ledger.rows(4, 'normal');
  readout(
    s,
    c,
    a,
    [
      [null, '64 query heads · 8 KV heads'],
      ['sixteen', 'Same checkpoint · 16 ranks'],
    ],
    { size: 39 },
  );
  readout(
    s,
    c,
    b,
    [
      ['four', first.queriesPerRank + ' queries + 2 KV per rank', 'ink', true],
      ['sixteen', '64 query heads / 16 ranks'],
      ['perrank', second.queriesPerRank + ' queries per rank', 'ink', true],
    ],
    { size: 38 },
  );
  readout(
    s,
    c,
    d,
    [
      ['trace', 'KV3  →  rank 1', C.result],
      ['sixteen', 'Which ranks need KV3?', C.result],
      ['copies', 'KV3  →  ranks 6 and 7', C.result, true],
    ],
    { size: 39 },
  );
  readout(
    s,
    c,
    e,
    [
      ['first-total', first.copies + ' physical copies', C.key, true],
      ['sixteen', 'Physical copies at 16 ranks = ?', C.result],
      ['double', second.copies + ' copies · 1 KV per rank', C.key, true],
      ['saving', '64 / 16 = 4× aggregate saving', C.result, true],
    ],
    { size: 37 },
  );
  readout(
    s,
    c,
    foot,
    [
      ['trace', 'KV3 serves Q24 through Q31.'],
      ['copies', 'Rank 6: Q24–27     ·     Rank 7: Q28–31     ·     each stores KV3', 'ink', true],
    ],
    { size: 37, align: 'center' },
  );

  const queryCount = 24,
    kvCount = 6,
    rankCount = 4;
  assertEqual(physicalHeads(queryCount, kvCount, rankCount), null, 'uneven KV split');
  const [spec, supply, destinations, captions] = body.rows([1, 2, 3, 1], 'tight');
  const board = [
    heading('Can four ranks split six KV heads evenly?'),
    place(
      note(queryCount + ' query heads  ·  ' + kvCount + ' KV heads  ·  vLLM Llama layout'),
      spec,
      'left',
    ),
  ];
  const slots = destinations.columns(rankCount, 'wide');
  const rankLabels = captions.columns(rankCount, 'wide');
  for (const [i, slot] of slots.entries()) {
    const rim = { stroke: 'dim', width: 4 };
    const bottomLeft = point(slot, 0.03, 0.9),
      bottomRight = point(slot, 0.97, 0.9);
    board.push(
      line(point(slot, 0.03, 0.5), bottomLeft, rim),
      line(bottomLeft, bottomRight, rim),
      line(bottomRight, point(slot, 0.97, 0.5), rim),
      place(
        mono('Rank ' + i + ' · ' + queryCount / rankCount + ' queries', { size: 34 }),
        rankLabels[i],
      ),
    );
  }
  const cards = supply.columns(kvCount, 'wide').map((slot, i) => {
    const card = group(
      mono('KV' + i, { size: 50 }).moveTo([0, -32]),
      block(120, 18, 0, 16, C.key),
      block(120, 18, 0, 40, C.value),
    );
    return place(card, slot);
  });
  c.swapAll('invalid', [...board, ...cards]);
  c.on('deal', () =>
    s.play(...slots.map((slot, i) => to(cards[i], (card) => card.moveTo(point(slot, 0.5, 0.64)))), {
      duration: 0.9,
    }),
  );
  readout(
    s,
    c,
    foot,
    [
      [
        'fails',
        kvCount + ' KV heads = ' + rankCount + ' placed + ' + (kvCount % rankCount) + ' left over',
        C.result,
        true,
      ],
    ],
    { size: 42, align: 'center' },
  );
}
