import { column, dynamic, line, place, rect, row } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import {
  microbatchGradients,
  tokenMeanTrace,
} from '../../../films/training-backpropagation-gradient-descent/model.mjs';

export default function batches(s, c) {
  const m = microbatchGradients(),
    tokens = tokenMeanTrace();
  const title = heading(c.title);
  const [requests, chunkRow, strip, foot] = area.rows([3, 1, 2, 2], 'wide');
  const ids = ['A', 'B', 'C'],
    colors = ['blue', 'cyan', 'pink'];
  const cards = requests
    .columns(3, 'normal')
    .map((region, i) =>
      place(
        column(
          [
            label('Request ' + ids[i], { color: colors[i] }),
            mono('x ' + m.rows[i][0] + '   target ' + m.rows[i][1], { size: 39 }),
            mono('∂L/∂w = ' + m.rowGradients[i].weight, { size: 44 }),
          ],
          { gap: 'normal' },
        ),
        region,
      ),
    );
  const shareC = s.value(1 / 3);
  const shares = dynamic(() => {
    const fractions = [(1 - shareC.value) / 2, (1 - shareC.value) / 2, shareC.value];
    let start = strip.left;
    return fractions.flatMap((share, i) => {
      const width = strip.width * share;
      const [x, y] = [start + width / 2, strip.point('center')[1]];
      start += width;
      const pct =
        Math.abs(share - 1 / 3) < 1e-6
          ? '⅓'
          : Math.abs(share - 0.25) < 1e-6
            ? '¼'
            : Math.abs(share - 0.5) < 1e-6
              ? '½'
              : Math.round(share * 100) + '%';
      return [
        rect(width - 8, 110, { fill: 'surface', stroke: colors[i], width: 5 }).moveTo([x, y]),
        mono(ids[i] + '   ' + pct, { size: 50, color: colors[i] }).moveTo([x, y]),
      ];
    });
  });
  const groups = dynamic(() => {
    const boundary = strip.right - strip.width * shareC.value;
    const y = chunkRow.point('bottom')[1];
    return [
      [strip.left, boundary, 'chunk A + B'],
      [boundary, strip.right, 'chunk C'],
    ].flatMap(([a, b, name]) => [
      line([a + 4, y], [b - 4, y], { stroke: 'dim', width: 4 }),
      ...[a + 4, b - 4].map((x) => line([x, y], [x, y + 14], { stroke: 'dim', width: 4 })),
      note(name).moveTo([(a + b) / 2, y - 36]),
    ]);
  });
  const reset = place(label('Starting parameters   w = 0, b = 0'), foot);
  const full = place(
    mono('Full mean gradient   (−3 − 10 − 21) / 3 = ' + m.full.weight.toFixed(3) + '…', {
      size: 44,
    }),
    foot,
  );
  const wrong = place(
    mono('½ × (−6.5) + ½ × (−21) = ' + m.equal.weight, { size: 44, color: 'yellow' }),
    foot,
  );
  const repair = place(
    mono('⅔ × (−6.5) + ⅓ × (−21) = ' + m.weighted.weight.toFixed(3) + '…', {
      size: 44,
      color: 'yellow',
    }),
    foot,
  );
  const [tokHead, first, second, answer] = area.rows([1, 2, 2, 2], 'wide');
  const tokenHeader = place(label('Loss at each valid target token'), tokHead);
  const chunks = tokens.chunks.map((items, i) => {
    const [name, cells, mean] = [first, second][i].columns([1, 4, 1], 'normal');
    const slots = cells.columns(Math.max(...tokens.counts), 'tight');
    return [
      place(label('Chunk ' + ids[i]), name),
      slots.map((slot, j) => [
        place(
          rect(
            slot.width,
            106,
            j < items.length
              ? { fill: 'surface', stroke: colors[i], width: 4 }
              : { stroke: 'dim', dash: [10, 9], width: 2 },
          ),
          slot,
        ),
        place(
          j < items.length ? mono(String(items[j]), { size: 52, color: colors[i] }) : note('pad'),
          slot,
        ),
      ]),
      place(mono('mean ' + tokens.means[i], { size: 39 }), mean),
    ];
  });
  const tally = place(
    mono(tokens.counts.join(' + ') + ' = ' + tokens.total + ' valid targets', { size: 43 }),
    answer,
  );
  const countQuestion = place(label('How many targets?', { color: 'yellow' }), answer);
  const terms = tokens.counts
    .map((count, i) => count + '/' + tokens.total + ' × ' + tokens.means[i])
    .join(' + ');
  const weighted = place(mono(terms, { size: 50 }), answer);
  const mean = place(mono(terms + ' = ' + tokens.mean, { size: 50, color: 'yellow' }), answer);
  const [sampleHead, ...regimeRows] = area.rows([1, 2, 2, 2], 'wide');
  const sample = place(label('Six requests per pass  ·  ten passes'), sampleHead);
  const regimes = [6, 2, 1].map((size, i) => {
    const [name, sequence, count] = regimeRows[i].columns([2, 5, 2], 'wide');
    const slots = sequence.columns(6 / size, 'normal');
    return [
      place(label(['Full batch', 'Mini-batch', 'Online'][i]), name),
      slots.map((r, j) =>
        place(
          row(
            Array.from({ length: size }, (_, k) =>
              mono(String(j * size + k + 1), { size: 40, color: colors[i] }),
            ),
            { gap: 'normal' },
          ),
          r,
        ),
      ),
      slots.map((r) =>
        line(r.point('bottom left'), r.point('bottom right'), { stroke: colors[i], width: 6 }),
      ),
      place(mono(60 / size + ' steps', { size: 42 }), count),
    ];
  });
  s.add(title, cards, reset);
  c.show('batch-rows', shares);
  c.swap('batch-full', reset, full);
  c.show('batch-group', groups);
  c.on('batch-wrong', () => s.play(shareC.to(0.5, { duration: 1.35 })));
  c.swap('batch-wrong-result', full, wrong);
  c.on('batch-repair', () => s.play(shareC.to(1 / 3, { duration: 1.2 })));
  c.swap('batch-weight', wrong, repair);
  c.swapAll('token-mean', [tokenHeader, chunks], { keep: [title] });
  c.show('token-question', countQuestion);
  c.swap('token-count', countQuestion, tally, { after: true });
  c.swap('token-weight', tally, weighted);
  c.swap('token-result', weighted, mean, { after: true });
  c.swapAll('batch-regimes', [sample, regimes[0]], { keep: [title] });
  c.show('batch-mini', regimes[1]);
  c.show('batch-online', regimes[2]);
}
