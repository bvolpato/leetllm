// Scene `class-not-position`: an ignored target position does not remove a class.
//
// The picture: three classes with one target. The padding class holds almost all of the
// probability, and the target is not ignored. Only a mask on the class itself drains its bar.
import { stableSoftmax } from 'vizmatic';
import { column, place } from 'vizmatic/stage';
import { completeModel } from '../../../films/softmax/model.mjs';
import { chip, heading, label, mono, note } from '../../kit-narrated.mjs';
import { BOARD, MARK_COLOR, SIDE, pair } from '../parts.mjs';

const CLASSES = ['bug', 'docs', 'padding'];
const COLORS = ['blue', 'green', 'pink'];

export default function classNotPosition(s, c) {
  const model = completeModel();
  const [top, middle, bottom] = BOARD.rows([1, 7, 1], 'normal');
  // The score of the padding class is the one number that the scene moves.
  const included = s.value(1);
  const shares = () =>
    included.value === 0
      ? model.excluded.probabilities
      : stableSoftmax([0, 1, 10 + Math.log(included.value)]);
  const chart = pair(s, middle, { names: CLASSES, colors: COLORS, predict: shares });
  [0, 1, 0].forEach((value, i) => chart.p[i].set(value));
  chart.pOn.set(1);
  chart.qOn.set(1);
  chart.read.set(1);
  const premise = place(
    mono('start [0, 1, 10] · target docs · ignore_index = 2', { size: 34 }),
    top,
    'left',
  );
  s.add(heading(c.title), premise, chart.all);

  // The two results, and what changed between them.
  const kept = [
    note('Before the candidate mask'),
    mono(`loss ${model.pad.loss.toFixed(3)}`, { size: 56, color: MARK_COLOR }),
    mono(`padding gradient ${model.pad.probabilities[2].toFixed(4)}`, { size: 34 }),
  ];
  const masked = [
    note('With the candidate mask'),
    mono(`loss ${model.excluded.loss.toFixed(3)}`, { size: 56, color: MARK_COLOR }),
  ];
  const [upper, lower] = SIDE.rows([1, 1], 'wide');
  place(column(kept, { gap: 'tight' }), upper, 'left');
  place(column(masked, { gap: 'tight' }), lower, 'left');
  c.show('class-not-position-0', kept[0]);
  c.show('class-loss', [kept[1], kept[2]], { after: true });
  const mask = place(mono('score of padding → −inf', { size: 34, color: 'pink' }), bottom, 'left');
  c.show('class-not-position-1', [mask, masked[0]]);
  c.on('class-exclude', () => s.play(included.to(0, { duration: 2.2 })));
  c.show('class-excluded-result', masked[1], { after: true });

  // Three masks, three different objects.
  const masks = [
    ['target mask', 'which positions count in the loss'],
    ['attention mask', 'what an input may read'],
    ['candidate mask', 'which classes share the budget'],
  ].map(([name, role]) => [chip(name), label(role, { size: 34 })]);
  place(
    column(
      masks.map((pair) => column(pair, { gap: 'tight' })),
      { gap: 'wide' },
    ),
    SIDE,
    'left',
  );
  const support = place(
    mono('target mass on a masked class → loss ∞', { size: 34, color: 'red' }),
    bottom,
    'left',
  );
  c.show('class-not-position-2', masks[0]);
  const soft = place(note('soft target · padding excluded'), top, 'left');
  c.swap('class-soft-support', premise, soft);
  c.on('class-soft-support', () =>
    s.play(chart.p[2].to(0.1, { duration: 1.4 }), chart.p[1].to(0.9, { duration: 1.4 })),
  );
  c.hide('class-soft-support', [mask, ...kept, ...masked]);
  c.show('class-support-result', support, { after: true });
  c.show('class-masks', masks[1]);
  c.show('class-candidate-mask', masks[2]);
}
