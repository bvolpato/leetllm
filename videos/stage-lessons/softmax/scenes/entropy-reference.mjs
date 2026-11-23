// Scene `entropy-reference`: the uncertainty of a target, and the mismatch of a prediction.
//
// The picture: the target stands as dashed outlines over the three words, and the prediction as
// solid bars in them. Three numbers follow the bars: the entropy of the target stays when the
// prediction matches, and the mismatch grows when the prediction leaves.
import { column, grid, place, tex, write } from 'vizmatic/stage';
import { crossEntropy, entropy } from '../../../films/softmax/arithmetic.mjs';
import { heading, mono, note } from '../../kit-narrated.mjs';
import { BOARD, MARK_COLOR, SIDE, live, pair } from '../parts.mjs';

const HARD = [0, 1, 0],
  SOFT = [0.5, 0.5, 0],
  AWAY = [0.8, 0.2, 0],
  ZERO_SUPPORT = [1, 0, 0];
const submittedWeights = [0.8, 0.8, 0];
const weightSum = submittedWeights.reduce((sum, value) => sum + value, 0);
const normalized = submittedWeights.map((weight) => weight / weightSum);

export default function entropyReference(s, c) {
  const [top, middle, bottom] = BOARD.rows([1, 7, 1], 'normal');
  const chart = pair(s, middle);
  const { p, q } = chart;
  const P = () => p.map((value) => value.value),
    Q = () => q.map((value) => value.value);
  const to =
    (values, target, duration = 1.4) =>
    () =>
      s.play(...values.map((value, i) => value.to(target[i], { duration })));
  HARD.forEach((value, i) => p[i].set(value));
  SOFT.forEach((value, i) => q[i].set(value));
  chart.pOn.set(1);
  const legend = place(note('dashed: the target P · solid: the prediction Q'), top, 'left');
  const [firstVote, secondVote] = bottom.columns(2, 'normal');
  const votes = [
    place(mono('Reader 1   ran', { color: 'blue' }), firstVote, 'left'),
    place(mono('Reader 2   slept', { color: 'green' }), secondVote, 'left'),
  ];
  const title = heading(c.title);
  s.add(title, legend, chart.all);

  // Three numbers that follow the bars.
  const kl = () => crossEntropy(P(), Q()) - entropy(P());
  const names = ['entropy of the target', 'cross-entropy', 'mismatch (KL)'].map((words) =>
    note(words),
  );
  const formulas = [
    'H(P) = -\\sum P \\ln P',
    'H(P, Q) = -\\sum P \\ln Q',
    '\\mathrm{KL} = H(P, Q) - H(P)',
  ].map((source) => tex(source, { size: 40 }));
  const values = [
    live(() => entropy(P()), { size: 56 }),
    live(() => kl() + entropy(P()), { size: 56 }),
    live(kl, { size: 56, color: MARK_COLOR }),
  ];
  place(
    grid(
      names.flatMap((name, i) => [column([name, formulas[i]], { gap: 'tight' }), values[i]]),
      { columns: 2, gap: ['wide', 'loose'], align: 'left' },
    ),
    SIDE,
    'left',
  );
  c.show('entropy-reference-0', [names[0], values[0]]);
  c.show('entropy-reader-one', votes[0]);
  c.show('entropy-reader-two', votes[1]);
  c.hide('entropy-soft-target', values[0], { lead: 0.35, fade: 0.2 });
  c.on('entropy-soft-target', to(p, SOFT));
  c.show('entropy-h', write(formulas[0]));
  c.show('entropy-ce', [names[1], write(formulas[1])]);
  c.show('entropy-identities', [names[2], write(formulas[2])]);

  // A matching prediction: the mismatch is zero, and the entropy of the target stays.
  c.on('entropy-reference-1', () => {
    s.play(chart.qOn.to(1, { duration: 0.6 }));
    chart.read.set(1);
  });
  c.show('entropy-half-cost', [values[0], values[1]], { after: true });
  c.show('entropy-match', values[2], { after: true });
  c.on('entropy-stays', to(q, AWAY, 1.6));
  c.on('entropy-return', to(q, SOFT, 1.6));

  // No share where the target has mass: the loss has no end.
  const zero = place(note('0 · ln 0 counts as 0'), bottom, 'right');
  const scaledGradient = tex('a = \\sum_i y_i, \\qquad \\nabla_z L = a Q - y', {
    size: 40,
    color: 'red',
  });
  const weightsTitle = heading('Turn the two weights into probabilities');
  const weights = place(note('dashed outlines   ·   target weights'), top, 'left');
  const submitted = [note('Submitted float target'), mono(`y = [${submittedWeights.join(', ')}]`)];
  const total = mono(`a = ${submittedWeights.join(' + ')} = ${weightSum}`, { color: 'red' });
  place(column([...submitted, total, scaledGradient], { gap: 'wide', align: 'left' }), SIDE, 'left');
  const division = mono(`${submittedWeights[0]} ÷ ${weightSum}`, { size: 53 });
  const repaired = mono(`y = [${normalized.join(', ')}]`);
  const unitGradient = tex('a = 1, \\qquad \\nabla_z L = Q - y', { size: 40, color: MARK_COLOR });
  place(column([division, repaired, unitGradient], { gap: 'wide', align: 'left' }), SIDE, 'left');
  c.swap('entropy-reference-2', votes, zero);
  c.after('entropy-zero-support', to(q, ZERO_SUPPORT, 1.2));
  c.swap(
    'entropy-malformed',
    [title, legend, zero, names, formulas, values],
    [weightsTitle, weights, submitted],
  );
  c.on(
    'entropy-malformed',
    () => {
      chart.qOn.set(0);
      chart.read.set(0);
    },
    0.6,
  );
  c.on('entropy-malformed', to(p, submittedWeights, 0.9), 0.6);
  c.show('entropy-check', total, { after: true });
  c.show('entropy-scaled-gradient', scaledGradient, { after: true });
  c.after('entropy-normalize', to(p, normalized));
  c.swap('entropy-normalize', [submitted, total, scaledGradient], division);
  c.show('entropy-halves', repaired, { after: true });
  c.show('entropy-unit-gradient', unitGradient, { after: true });
}
