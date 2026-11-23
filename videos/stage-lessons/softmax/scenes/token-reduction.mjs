// Scene `token-reduction`: an ignored position leaves the sum and the count.
//
// The picture: the batch table gets a third row with extreme scores and an ignored target. Its
// loss is zero, and the mean divides by two. Then two ways to pool, and an empty batch.
import {
  assertEqual,
  boxOf,
  column,
  dynamic,
  fade,
  grid,
  indicate,
  place,
  rect,
  row,
  text,
} from 'vizmatic/stage';
import { area, chip, heading, mono, note } from '../../kit-narrated.mjs';
import { MARK_COLOR } from '../parts.mjs';
import { sequenceBatch } from '../sequence-batch.mjs';

export default function tokenReduction(s, c) {
  const { sequence, foot, rows, kept } = sequenceBatch();
  const sum = mono(`sum ${sequence.numerator.toFixed(3)}`, { size: 44 });
  const right = mono(`÷ ${sequence.count} = ${sequence.mean.toFixed(3)}`, {
    size: 44,
    color: 'green',
  });
  const wrong = mono(`÷ 3 = ${(sequence.numerator / 3).toFixed(3)}`, { size: 44, color: 'red' });
  place(row([sum, right, wrong], { gap: 'loose' }), foot, 'top left');
  s.add(heading(c.title));
  c.take(kept);

  // The third row: stored, and not counted.
  const changed = mono('[7, −7, 3]', { size: 42, color: 'cyan' })
    .moveTo(rows[2].scores)
    .alignTo(rows[2].scores, 'left');
  c.show(
    'token-reduction-0',
    [rows[2].name, rows[2].input, rows[2].scores, rows[2].target, rows[2].meter, rows[2].share],
    { stagger: true },
  );
  c.show('ignore-zero-loss', rows[2].loss, { after: true });
  c.show('ignore-loss-sum', sum, { after: true });
  c.show('ignore-denominator', [right, wrong], { after: true, stagger: true });
  c.swap('ignore-row-change', rows[2].scores, changed);
  c.on('ignore-row-change', () => s.play(indicate(sum, { color: MARK_COLOR })), 0.8);

  // The same four loss rows remain through token pooling, sequence pooling, and the empty case.
  const middle = area.rows([1, 3.3, 1.7], 'normal')[1];
  const losses = [2, 0, 0, 0];
  const numerator = losses.reduce((sum, loss) => sum + loss, 0);
  const sequenceMeans = [
    losses[0],
    losses.slice(1).reduce((sum, loss) => sum + loss, 0) / (losses.length - 1),
  ];
  const pooledMean = numerator / losses.length;
  const meanOfMeans = sequenceMeans.reduce((sum, mean) => sum + mean, 0) / sequenceMeans.length;
  assertEqual(pooledMean, 0.5, 'pooled token mean');
  assertEqual(meanOfMeans, 1, 'mean of sequence means');
  const active = losses.map(() => s.value(1));
  const heads = ['sequence', 'position', 'target', 'loss'].map((words) => note(words));
  const poolRows = losses.map((loss, i) => [
    mono(i === 0 ? 'A' : 'B', { size: 42, color: i === 0 ? 'blue' : 'pink' }),
    mono(String(i === 0 ? 1 : i), { size: 42 }),
    mono('valid', { size: 42, color: 'ink' }),
    mono(String(loss), { size: 42, color: MARK_COLOR }),
  ]);
  middle
    .columns(4, 'loose')
    .forEach((slot, i) =>
      place(
        column([heads[i], ...poolRows.map((cells) => cells[i])], { gap: 'normal', align: 'left' }),
        slot,
        'left',
      ),
    );
  const emptyTargets = poolRows.map((cells) =>
    mono('−100', { size: 42, color: 'dim' }).moveTo(cells[2]).alignTo(cells[2], 'left'),
  );
  const zeroLoss = mono('0', { size: 42, color: 'dim' }).moveTo(poolRows[0][3]);
  const box = (nodes) => {
    const bounds = boxOf(nodes).inset(-16);
    return place(
      rect(bounds.width, bounds.height, { fill: null, stroke: MARK_COLOR, width: 3, radius: 6 }),
      bounds,
    );
  };
  const tokens = box(poolRows.map((cells) => cells[3]));
  const sequences = [box(poolRows[0][3]), box(poolRows.slice(1).map((cells) => cells[3]))];
  const [displayBand, answerBand, decisionBand] = foot.rows([1, 1, 1], 'tight');
  const summary = place(
    dynamic(() => [
      text(
        'numerator ' +
          losses.reduce((sum, loss, i) => sum + loss * active[i].value, 0) +
          '   ÷   count ' +
          active.reduce((sum, v) => sum + v.value, 0),
        { size: 44, font: 'mono', color: MARK_COLOR, anchor: 'left' },
      ),
    ]),
    displayBand,
    'left',
  );
  const pooled = place(
    mono(`${numerator} ÷ ${losses.length} = ${pooledMean}`, { size: 48, color: MARK_COLOR }),
    answerBand,
    'left',
  );
  const means = place(
    mono(`(${sequenceMeans.join(' + ')}) ÷ ${sequenceMeans.length} = ${meanOfMeans}`, {
      size: 48,
      color: 'cyan',
    }),
    answerBand,
    'right',
  );
  const tokenRule = place(note('pool individual target losses'), decisionBand, 'left');
  const sequenceRule = place(note('or average two sequence means'), decisionBand, 'left');
  const seqSummary = place(
    mono('sequence means: A = 2 ÷ 1; B = 0 ÷ 3', { size: 36 }),
    displayBand,
    'left',
  );
  // The voice introduces a new batch here. Cut between the two complete tables on that cue.
  c.on('token-reduction-1', () => {
    s.remove(
      ...kept,
      rows[2].name,
      rows[2].input,
      rows[2].target,
      rows[2].meter,
      rows[2].share,
      rows[2].loss,
      changed,
      sum,
      right,
      wrong,
    );
    s.add(...heads, ...poolRows.flat(), summary, tokenRule);
  });
  c.show('ignore-pooled', [tokens, pooled], { after: true });
  c.swap(
    'ignore-sequence-group',
    [tokens, tokenRule, summary],
    [sequences, sequenceRule, seqSummary],
    { lead: -1.4 },
  );
  c.show('ignore-means', means, { after: true });

  const emptyRule = place(note('check the denominator before the optimizer'), decisionBand, 'left');
  const emptyDecision = place(chip('skip the empty update'), decisionBand, 'left');
  const nan = place(mono('0 ÷ 0 = NaN', { size: 56, color: 'red' }), answerBand, 'left');
  const context = place(
    note('ignored targets can still supply input context'),
    answerBand,
    'right',
  );
  c.swap(
    'token-reduction-2',
    [sequences, sequenceRule, seqSummary, pooled, means],
    [summary, emptyRule],
  );
  poolRows.forEach((cells, i) => {
    c.swap('ignore-empty', cells[2], emptyTargets[i], { lead: -i * 0.25 });
    c.on(
      'ignore-empty',
      () => {
        active[i].set(0);
        s.play(fade(cells[0], 0.3), fade(cells[1], 0.3), fade(cells[3], 0.3), { duration: 0.2 });
      },
      i * 0.25 + 0.35,
    );
  });
  c.swap('ignore-empty', poolRows[0][3], zeroLoss, { lead: -0.8 });
  c.show('ignore-empty-nan', nan, { after: true });
  c.swap('ignore-empty-decision', emptyRule, emptyDecision, { after: true });
  c.show('ignore-input-context', context);
}
