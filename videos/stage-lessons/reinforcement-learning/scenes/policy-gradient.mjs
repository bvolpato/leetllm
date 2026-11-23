import { assertEqual, column, graph, indicate, place, table } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import {
  ACTIONS,
  gamma,
  openingBaseline,
  openingGradient,
  openingPolicyValues,
  probabilityStrip,
  updatedPolicy,
} from '../parts.mjs';

export default function policyGradient(s, c) {
  const [left, right] = area.columns([3, 2], 'loose');
  const [formula, accounting] = right.rows([1, 1], 'wide');
  const tree = place(
    graph(
      [
        { id: 'start', label: 'Start', width: 140, height: 98 },
        { id: 'toss', label: 'Choose', width: 155, height: 98 },
        { id: 'tails', label: 'Tails', value: 'Reward 0', width: 210, height: 115 },
        { id: 'heads', label: 'Heads', value: 'Reward 1', width: 210, height: 115 },
      ],
      [
        { from: 'start', to: 'toss' },
        { from: 'toss', to: 'tails' },
        { from: 'toss', to: 'heads' },
      ],
      {
        width: left.width - 85,
        height: left.height - 140,
        direction: 'LR',
        fit: true,
        token: 'start',
        tokenColor: 'yellow',
        labelSize: 41,
        valueSize: 34,
      },
    ),
    left,
  );
  const prompt = place(
    column(
      [label('From the chosen action', { color: 'cyan' }), note('Weight by its reward-to-go.')],
      { gap: 'normal' },
    ),
    formula,
  );
  const fromStart = place(
    column([label('From the start', { color: 'yellow' }), mono('Time weight  γᵗ')], {
      gap: 'normal',
    }),
    accounting,
  );
  const fair = place(
    column(
      [label('Fair coin at logit zero'), mono('P(heads) = 0.5'), note('Slope of P(heads) = 0.25')],
      { gap: 'normal' },
    ),
    formula,
  );
  const local = gamma * 0.5 * (1 - 0.5);
  assertEqual(local, 0.225, 'time-discounted derivative at a fair logit');
  const weighted = place(
    column(
      [note('Reward on the second step'), mono('0.9 × 0.25 = ' + local, { color: 'yellow' })],
      { gap: 'normal' },
    ),
    accounting,
  );
  const omitted = place(
    column(
      [
        mono('From start   ' + local, { color: 'yellow' }),
        mono('At toss      0.25', { color: 'cyan' }),
      ],
      { gap: 'normal' },
    ),
    accounting,
  );

  const [titleArea, sampleArea, summaryArea] = area.rows([1, 4.5, 1.4], 'wide');
  const baselineTitle = place(label('One fair toss  ·  reward paid now'), titleArea);
  const names = ['zero', 'half', 'ten'];
  const samples = [0, 0.5, 10].map((baseline) => {
    const [tails, heads] = [0, 1].map((action) => (action - 0.5) * (action - baseline));
    const mean = (tails + heads) / 2;
    return {
      baseline,
      Tails: tails,
      Heads: heads,
      Mean: mean,
      Variance: ((tails - mean) ** 2 + (heads - mean) ** 2) / 2,
    };
  });
  assertEqual(samples.map((x) => x.Variance).join(','), '0.0625,0,22.5625', 'gradient variances');
  assertEqual(
    samples.every((x) => x.Mean === 0.25),
    true,
    'baseline-independent mean',
  );
  const estimates = place(
    table(
      [
        { key: 'Baseline', sample: 'Baseline' },
        { key: 'Tails', sample: '−4.50' },
        { key: 'Heads', sample: '−4.50' },
        { key: 'Mean', sample: '0.25' },
        { key: 'Variance', sample: '22.5625' },
      ],
      samples.map((x, i) => ({
        id: names[i],
        Baseline: String(x.baseline),
        Tails: '…',
        Heads: '…',
        Mean: '…',
        Variance: '…',
      })),
      { width: sampleArea.width - 100, size: 44, maxRows: 3 },
    ),
    sampleArea,
  );
  const sampleRule = place(
    mono('Sample gradient = (action − 0.5) × (reward − baseline)'),
    summaryArea,
  );
  const equalMean = place(
    label('Same mean gradient. At baseline 0.5, the two samples coincide.', { color: 'cyan' }),
    summaryArea,
  );

  const [stripArea, work, foot] = area.rows([3, 5, 1], 'loose');
  const strip = probabilityStrip(s, stripArea);
  const odds = place(
    table(
      [
        { key: 'Action', sample: 'Evidence' },
        { key: 'Return', sample: '−120' },
        { key: 'Advantage', sample: '−108.25' },
        { key: 'Return slope', sample: '−36.08' },
        { key: 'Probability step', sample: '⅓ → 0.508' },
      ],
      ACTIONS.map((action, i) => ({
        id: action,
        Action: action,
        Return: String(openingPolicyValues[i]),
        Advantage: (openingPolicyValues[i] - openingBaseline).toFixed(2),
        'Return slope': openingGradient[i].toFixed(2),
        'Probability step': '⅓ → ?',
      })),
      { width: work.width - 90, size: 40, maxRows: 3 },
    ),
    work,
  );
  const average = place(
    label('Initial mean return  ' + openingBaseline + '    ·    Downstream decisions fixed'),
    foot,
  );
  const scope = place(label('One opening-logit update  ·  step size 0.03'), foot);
  const newLogits = openingGradient.map((g) => Math.exp(0.03 * g));
  assertEqual(
    newLogits.map((z) => (z / newLogits.reduce((a, b) => a + b, 0)).toFixed(3)).join(','),
    updatedPolicy.map((v) => v.toFixed(3)).join(','),
    'normalized opening probabilities',
  );

  s.add(heading(c.title), tree, prompt);
  c.show('reinforce', fromStart);
  c.swap('bernoulli', prompt, fair);
  c.on('bernoulli', () => s.play(tree.go('toss', { duration: 0.8 })));
  c.swap('derivative', fromStart, weighted, { after: true });
  c.swap('wrong', weighted, omitted, { after: true });
  c.swap('baseline', [tree, fair, omitted], [baselineTitle, estimates, sampleRule]);
  for (const [i, cue] of ['zero-row', 'half-row', 'ten-row'].entries()) {
    c.after(cue, () =>
      s.play(
        estimates.light(names[i]),
        ...['Tails', 'Heads', 'Mean', 'Variance'].map((key) =>
          estimates.setCell(names[i], key, String(samples[i][key])),
        ),
      ),
    );
  }
  c.swap('variance', sampleRule, equalMean, { after: true });
  c.on('baseline-fixed', () => s.play(indicate(estimates.header('Baseline'), { scale: 1 })));
  c.on('true-value', () => s.play(estimates.light('half')));
  c.swap('router', [baselineTitle, estimates, equalMean], [strip.nodes, odds, average]);
  c.on('row-review', () => s.play(odds.light('Review')));
  c.after('update', () => s.play(strip.update(updatedPolicy, { duration: 0.85 })));
  c.after(
    'update',
    () =>
      s.play(
        ...ACTIONS.map((name, i) =>
          odds.setCell(name, 'Probability step', '⅓ → ' + updatedPolicy[i].toFixed(3)),
        ),
      ),
    0.85,
  );
  c.swap('scope', average, scope);
  c.keep(strip.nodes);
}
