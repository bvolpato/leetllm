// Scene `smoothing-equilibrium`: a smoothed target has a finite best gap.
//
// The picture: one slider is the lead of slept over each competitor. With a hard target, the bars
// never reach the dashed target, however far the slider goes. With a smoothed target, they meet it
// at one gap, and past that gap the correction turns back.
import { column, decimal, dynamic, place, row, tex, write } from 'vizmatic/stage';
import { stableSoftmax } from 'vizmatic';
import { crossEntropy } from '../../../films/softmax/arithmetic.mjs';
import { completeModel } from '../../../films/softmax/model.mjs';
import { chipRow, heading, label, mono, note } from '../../kit-narrated.mjs';
import { BOARD, MARK_COLOR, SIDE, WORDS, WORD_COLOR, live, pair, slider } from '../parts.mjs';

const HARD = [0, 1, 0];
const LEAD = { min: 0, max: 7 };

export default function smoothingEquilibrium(s, c) {
  const model = completeModel();
  const [top, middle, bottom] = BOARD.rows([1, 7, 1], 'normal');
  // The prediction follows one number: the lead of slept over each of the two competitors.
  const lead = s.value(2);
  const offset = s.value(0);
  const included = s.value(1);
  const scores = () => [offset.value, offset.value + lead.value, offset.value];
  const shares = () =>
    included.value === 0 ? [...stableSoftmax(scores().slice(0, 2)), 0] : stableSoftmax(scores());
  const chart = pair(s, middle, { predict: shares });
  const { p } = chart;
  HARD.forEach((value, i) => p[i].set(value));
  chart.pOn.set(1);
  chart.qOn.set(1);
  chart.read.set(1);
  const P = () => p.map((value) => value.value);

  // The slider of the lead, the loss, and the gradient on the score of slept.
  const [dialBand, numbers, lowest] = SIDE.rows([2, 3, 2], 'normal');
  const dial = slider(dialBand.inset('normal', 'none'), () => lead.value, LEAD);
  const reading = place(
    decimal(() => lead.value, { digits: 2, size: 56, prefix: 'lead = ', color: MARK_COLOR }),
    dialBand,
    'top',
  );
  const loss = [note('loss'), live(() => crossEntropy(P(), shares()), { size: 56 })];
  const slope = [
    note('gradient on slept'),
    live(() => shares()[1] - P()[1], { size: 56, color: MARK_COLOR }),
  ];
  place(
    row([column(loss, { gap: 'tight' }), column(slope, { gap: 'tight' })], { gap: 'loose' }),
    numbers,
    'left',
  );
  const legend = place(note('dashed: the target · solid: the prediction'), top, 'left');
  s.add(heading(c.title), legend, chart.all, dial.rail, dial.knob, reading, loss);

  // A hard target: the lead grows and grows, and the loss only approaches zero.
  const move = (value, duration) => () => s.play(lead.to(value, { duration }));
  c.on('smoothing-equilibrium-0', move(6.8, 6));
  const mixture = place(
    tex('\\tilde y = (1 - \\alpha)\\,y + \\frac{\\alpha}{K}', { size: 48 }),
    lowest,
    'left',
  );
  c.show('smooth-mixture', write(mixture));
  c.on('smooth-mixture', () =>
    s.play(...p.map((value, i) => value.to(model.smooth[i], { duration: 1.2 }))),
  );

  // The smoothed target: the bars meet it at one lead, the log of 28.
  const targets = place(
    mono(`target ${model.smooth[1].toFixed(4)} · ${model.smooth[0].toFixed(4)} each`, { size: 34 }),
    bottom,
    'left',
  );
  const best = place(
    mono(`matching gap: ln 28 ≈ ${model.smoothGap.toFixed(3)}`, { size: 36, color: MARK_COLOR }),
    dialBand,
    'bottom',
  );
  c.show('smoothing-equilibrium-1', targets, { after: true });
  c.hide('smoothing-equilibrium-1', [loss, reading]);
  c.on('smooth-match', move(model.smoothGap, 1.5));
  c.show('smooth-match', slope, { after: true });
  c.show('smooth-gap', [reading, best], { after: true });
  c.on('smooth-overshoot', move(5.2, 1.6));
  c.on('smooth-descend', move(model.smoothGap, 1.6));
  const floor = place(
    mono(`least loss ${model.smoothEntropy.toFixed(3)} = target entropy`, {
      size: 34,
      color: MARK_COLOR,
    }),
    lowest,
    'left',
  );
  c.swap('smooth-minimum', mixture, [floor, loss], { after: true });

  const [gapBand, scoreBand] = numbers.rows(2, 'tight');
  const gap = place(label('Same gap, same probabilities', { size: 36 }), gapBand, 'bottom left');
  const scoreRow = scoreBand.columns(3, 'normal').map((slot, i) => [
    place(note(WORDS[i], { color: WORD_COLOR[i] }), slot, 'top left'),
    place(
      dynamic(() => mono(scores()[i].toFixed(2), { size: 40 })),
      slot,
      'bottom left',
    ),
  ]);
  c.swap('smoothing-equilibrium-2', [loss, slope], [gap, scoreRow]);
  c.on('smooth-shift', () => s.play(offset.to(10, { duration: 1.3 })));
  const excluded = place(
    note('ate excluded · dashed target still positive', { color: 'red' }),
    dialBand,
    'top left',
  );
  const infinite = place(mono('loss ∞', { size: 56, color: 'red' }), lowest, 'left');
  // Only prediction support changes. Keep the dashed target and its numeric legend.
  c.on('smooth-support', () => {
    s.remove(floor, best, reading, dial.rail, dial.knob, gap, ...scoreRow.flat());
    included.set(0);
    s.add(excluded);
  });
  c.show('smooth-infinite', infinite, { after: true });
}
