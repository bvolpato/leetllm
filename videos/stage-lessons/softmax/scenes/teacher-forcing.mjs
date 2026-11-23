// Scene `teacher-forcing`: each position predicts the next observed token.
//
// The picture: the observed tokens stand in one row. Each target comes down from that row, one
// place later than its input. The batch table then fills with scores, shares and losses, and one
// line reduces them to a mean.
import { boxOf, column, dot, moveTo, place, rect, row } from 'vizmatic/stage';
import { area, chip, heading, label, mono, note } from '../../kit-narrated.mjs';
import { lossTrace } from '../../../films/softmax/arithmetic.mjs';
import { FRESH_LOGITS, LOGITS } from '../../../films/softmax/fixtures.mjs';
import { MARK_COLOR } from '../parts.mjs';
import { sequenceBatch } from '../sequence-batch.mjs';

export default function teacherForcing(s, c) {
  const { sequence, top, foot, supervised: rows, titles, kept } = sequenceBatch();
  const of = (name) => rows.map((cells) => cells[name]);
  // The observed tokens, in their order.
  const tokens = ['bug', 'docs', 'today'].map((word, i) =>
    chip(word, { size: 56, color: ['blue', 'green', 'pink'][i] }),
  );
  const observed = [note('observed tokens'), ...tokens];
  place(row(observed, { gap: 'normal' }), top, 'left');
  // Keep the table's structure visible while its numerical results are withheld.
  const frames = rows.flatMap((cells) =>
    ['scores', 'target', 'meter', 'loss'].map((name) => {
      const box = boxOf(cells[name]);
      return rect(box.width + 16, Math.max(58, box.height + 12), {
        stroke: 'grid',
        fill: null,
        width: 2,
        radius: 6,
      }).moveTo(box.point('center'));
    }),
  );
  const shift = place(
    row(
      [
        chip('Observed prefix', { size: 42 }),
        mono('→'),
        chip('Next observed token', { size: 42, dash: true }),
      ],
      { gap: 'wide' },
    ),
    foot,
    'top left',
  );
  s.add(heading(c.title), Object.values(titles), frames, shift);
  c.show('teacher-forcing-0', observed, { stagger: true });
  c.show('teacher-shift', [...of('name'), ...of('input')]);

  // Each target arrives from its place in the row of tokens: one place after its input.
  const travelers = ['green', 'pink'].map((color, i) =>
    dot(12, color).at(...boxOf(tokens[i + 1]).point('bottom')),
  );
  ['teacher-observed', 'teacher-prefix-target'].forEach((cue, i) => {
    const mark = travelers[i],
      target = rows[i].target;
    c.show(cue, mark);
    const phrase = c.cue(cue);
    const duration = Math.max(0.1, phrase.end - phrase.start - 0.15);
    c.on(cue, () => s.play(moveTo(mark, boxOf(target).point('center'), { duration })), 0.15);
    c.hide(cue, mark, { after: true });
    c.show(cue, target, { after: true });
  });

  // What a position is made of: a score for each token of the vocabulary, and the observed context.
  const facts = [
    chip('one score for each token of the vocabulary'),
    chip('the context is the observed tokens'),
  ];
  place(column(facts, { gap: 'normal' }), foot, 'top left');
  c.swap('teacher-logits', shift, facts[0]);
  c.show('teacher-context', facts[1]);

  // The scores, then the share and the loss of each target, then the mean.
  c.show('teacher-forcing-1', of('scores'), { stagger: true });
  c.show('teacher-token-losses', [...of('meter'), ...of('share'), ...of('loss')], { after: true });
  c.hide('teacher-token-losses', frames, { after: true });
  const current = [LOGITS, FRESH_LOGITS].map((scores, i) => lossTrace(scores, i));
  const currentSum = current.reduce((sum, item) => sum + item.loss, 0);
  if (Math.abs(currentSum - sequence.numerator) > 1e-12)
    throw new Error('The current-word and next-word examples must have the same total loss');
  const mean = place(
    mono('Mean per token   ' + sequence.mean.toFixed(3) + ' nats', {
      size: 48,
      color: MARK_COLOR,
    }),
    foot,
    'top left',
  );
  const [, shareBand] = foot.rows([1, 1], 'tight');
  const width = area.width * 0.5;
  const contribution = (fraction, colors) =>
    place(
      row(
        [
          row(
            [
              rect(width * fraction, 36, { fill: colors[0], stroke: null }),
              rect(width * (1 - fraction), 36, { fill: colors[1], stroke: null }),
            ],
            { gap: 'none' },
          ),
          mono('position 1   ' + (100 * fraction).toFixed(1) + '% of loss', { size: 35 }),
        ],
        { gap: 'normal' },
      ),
      shareBand,
      'left',
    );
  const correctBar = contribution(sequence.losses[0] / sequence.numerator, ['green', 'pink']);
  const wrongBar = contribution(current[0].loss / currentSum, ['blue', 'green']);
  c.hide('teacher-forcing-1', facts);
  c.show('teacher-loss-mean', mean, { after: true });
  c.show('teacher-first-contribution', correctBar, { after: true });

  // Re-read the very same scores under the current words. Their summed loss happens to agree.
  const names = ['bug', 'docs'];
  const picked = ['target', 'meter', 'share', 'loss'];
  const nextCells = rows.flatMap((cells) => picked.map((key) => cells[key]));
  const currentCells = rows.map((cells, i) => {
    const color = ['blue', 'green'][i];
    const share = current[i].probabilities[i];
    const atCell = (value, key, ink) =>
      mono(value, { size: 42, color: ink }).moveTo(cells[key]).alignTo(cells[key], 'left');
    const meter = boxOf(cells.meter);
    const frame = rect(meter.width, meter.height, {
      stroke: 'dim',
      fill: null,
      width: 2,
      radius: 6,
    }).at(meter.cx, meter.cy);
    const fill = rect(meter.width * share, meter.height, {
      fill: color,
      stroke: null,
      opacity: 0.86,
    }).at(meter.left + (meter.width * share) / 2, meter.cy);
    return [
      atCell(names[i], 'target', color),
      frame,
      fill,
      atCell(share.toFixed(3), 'share', 'ink'),
      atCell(current[i].loss.toFixed(3), 'loss', MARK_COLOR),
    ];
  });
  const targetMode = place(
    label('Scoring the current word', { color: 'yellow' }),
    foot,
    'top right',
  );
  c.swap(
    'teacher-current',
    [nextCells, correctBar],
    [currentCells.map((cells) => cells.slice(0, -1)), targetMode],
  );
  c.show('teacher-wrong-result', [currentCells.map((cells) => cells.at(-1)), wrongBar], {
    after: true,
  });
  const repairedMean = place(
    mono('Mean per token   ' + sequence.mean.toFixed(3) + ' nats', {
      size: 48,
      color: MARK_COLOR,
    }),
    foot,
    'top left',
  );
  const nextMode = place(label('Scoring the next word', { color: 'green' }), foot, 'top right');
  c.swap(
    'teacher-realign',
    [currentCells, wrongBar, targetMode, mean],
    [nextCells, correctBar, repairedMean, nextMode],
  );
  const masks = [
    chip('Causal mask    Which tokens can this input see?'),
    chip('Loss mask    Which targets count?'),
  ];
  place(row(masks, { gap: 'normal' }), foot, 'left');
  c.swap('teacher-mask-roles', [correctBar, repairedMean, nextMode], masks);
  c.keep(kept);
}
