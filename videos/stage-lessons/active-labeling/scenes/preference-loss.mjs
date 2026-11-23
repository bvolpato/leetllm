import {
  appear,
  vanish,
  assertEqual,
  boxOf,
  barChart,
  column,
  fade,
  fitted,
  grid,
  place,
  rect,
  row,
  tex,
} from 'vizmatic/stage';
import { chip, label, mono, namedBox, note } from '../../kit-narrated.mjs';
import { preferenceFixture } from '../../../films/active-labeling/model.mjs';
import { footer, open, picture } from '../parts.mjs';
export default function preferenceLoss(s, c) {
  open(s, c);
  const f = preferenceFixture();
  const ranking = ['approval + citation', 'approval only', 'vague policy', 'unsupported claim'];
  const pairs = ranking.flatMap((_, i) => ranking.flatMap((__, j) => (j > i ? [[i, j]] : [])));
  assertEqual(pairs.length, 6, 'four answers supply six comparisons');
  const reward = { winner: 2, loser: 0, shift: 5 };
  const probability = 1 / (1 + Math.exp(-(reward.winner - reward.loser)));
  assertEqual(
    reward.winner + reward.shift - (reward.loser + reward.shift),
    2,
    'common shift preserves reward difference',
  );
  const [left, right] = picture.columns([4, 5], 'loose');
  const ranks = place(
    column(
      [
        note('Separate ranking set · R1–R4'),
        ...ranking.map((a, i) =>
          chip('R' + (i + 1) + ' · ' + a, { color: i === 0 ? 'green' : 'dim' }),
        ),
      ],
      { gap: 'wide' },
    ),
    left,
  );
  const [pairRegion, rewardRegion] = right.rows([2, 3], 'wide');
  const outlines = pairs.map(() => rect(190, 80, { stroke: 'grid', radius: 10 }));
  place(grid(outlines, { columns: 3, gap: 'normal' }), pairRegion);
  const comparisons = pairs.map(([i, j], k) =>
    place(label('R' + (i + 1) + ' > R' + (j + 1), { color: 'cyan' }), boxOf(outlines[k])),
  );
  const [barsRegion, readouts] = rewardRegion.columns([2, 1], 'wide');
  const bars = place(
    fitted(barsRegion, (w) =>
      barChart(
        [
          { label: 'winner', value: 0, color: 'green' },
          { label: 'loser', value: 0, color: 'blue' },
        ],
        {
          width: w,
          height: barsRegion.height * 0.65,
          max: 8,
          ticks: [0, 2, 5, 7],
          labelSize: 34,
          showValues: false,
        },
      ),
    ),
    barsRegion,
  );
  const diff = place(
    column(
      [
        tex('r_w-r_l=2', { size: 40, color: 'yellow' }),
        mono('P = ' + probability.toFixed(3), { color: 'yellow' }),
      ],
      { gap: 'wide' },
    ),
    readouts,
  );
  const probabilityReadout = diff.nodes.at(-1);
  const diffFormula = diff.nodes[0];
  const bt = place(tex('P(w>l)=\\sigma(r_w-r_l)', { size: 42 }), footer);
  const phase1 = [ranks, ...outlines, ...comparisons, bars, diff, bt];

  const rows = picture.rows([1, 2, 2, 2], 'wide');
  const premise = place(label('Same prompt x · corresponding optimal policy'), rows[0]);
  const eqSlots = rows
    .slice(1)
    .map((r) =>
      place(rect(r.width - 8, r.height - 8, { stroke: 'dim', width: 4, radius: 12 }), r).zIndex(-1),
    );
  const eqs = ['w', 'l'].map((a, i) =>
    place(
      tex(
        'r_' +
          a +
          '=\\beta\\log\\frac{\\pi_r^*(y_' +
          a +
          '\\mid x)}{\\pi_{ref}(y_' +
          a +
          '\\mid x)}+\\beta\\log Z(x)',
        { size: 42, color: i ? 'blue' : 'green' },
      ),
      rows[i + 1],
    ),
  );
  const trainable = place(
    tex(
      '\\Delta_\\theta=\\beta\\left[\\log\\frac{\\pi_\\theta(y_w\\mid x)}{\\pi_{ref}(y_w\\mid x)}-\\log\\frac{\\pi_\\theta(y_l\\mid x)}{\\pi_{ref}(y_l\\mid x)}\\right]',
      { size: 45, color: 'cyan' },
    ),
    rows[3],
  );
  const condition = place(note('β > 0 · reference probability > 0 for both completions'), footer);
  const phase2 = [premise, ...eqSlots, ...eqs, trainable, condition];
  const policyContext = ['Winner completion', 'Loser completion'].map((name, i) =>
    place(
      column([
        label(name, { color: i ? 'blue' : 'green' }),
        note('policy probability / reference probability'),
      ], { gap: 'wide' }),
      rows[i + 1],
    ),
  );


  const [tableRegion, computeRegion] = picture.rows([3, 2], 'wide');
  const tableCells = [
    note('completion'),
    note('policy'),
    note('reference'),
    note('log ratio'),
    label('winner', { color: 'green' }),
    mono(String(f.policy[0])),
    mono(String(f.reference[0])),
    mono('log 2', { color: 'green' }),
    label('loser', { color: 'blue' }),
    mono(String(f.policy[1])),
    mono(String(f.reference[1])),
    mono('log ½', { color: 'blue' }),
  ];
  const table = place(grid(tableCells, { columns: 4, gap: ['loose', 'loose'] }), tableRegion);
  const [marginRegion, lossRegion] = computeRegion.columns(2, 'wide');
  const calcSlots = [...tableRegion.rows(3, 'normal'), marginRegion, lossRegion].map((r) =>
    place(rect(r.width - 8, r.height - 8, { stroke: 'dim', width: 4, radius: 12 }), r).zIndex(-1),
  );
  const margin = place(
    column([
      tex('\\Delta_\\theta=0.5(\\log2-\\log\\tfrac12)', { size: 40 }),
      tex('=\\log2', { size: 48, color: 'yellow' }),
    ]),
    marginRegion,
  );
  const loss = place(
    column([
      tex('\\ell=-\\log\\sigma(\\Delta_\\theta)=-\\log\\tfrac23', { size: 38 }),
      mono('loss = ' + f.loss.toFixed(3), { color: 'yellow' }),
    ]),
    lossRegion,
  );
  const safety = place(
    note('Both unsafe → incident review     ·     Acceptable winner → keep the pair', {
      color: 'red',
    }),
    footer,
  );
  const headers = tableCells.slice(0, 4);
  const inputNodes = tableCells.filter((_, i) => i >= 4 && i !== 7 && i !== 11);
  s.add(ranks, outlines, bars, bt);
  c.show('six-pairs', comparisons, { after: true, stagger: true });
  c.on('assign-rewards', () => s.play(bars.update([reward.winner, reward.loser], { duration: 1 })));
  c.show('reward-difference', diffFormula, { after: true });
  c.show('reward-probability', probabilityReadout, { after: true });
  c.on('shift-rewards', () =>
    s.play(
      bars.update([reward.winner + reward.shift, reward.loser + reward.shift], { duration: 1.3 }),
    ),
  );
  c.onBeat(1, () =>
    s.play(vanish(phase1), appear([premise, ...eqSlots, condition, ...policyContext])),
  );
  c.on('policy-ratios', () => s.play(vanish(policyContext)), -0.1);
  c.show('policy-ratios', eqs);
  c.on('cancel-partition', () =>
    s.play(...eqs.flatMap((eq) => eq.part('\\beta\\log Z(x)').map((g) => fade(g, 0.18))), {
      duration: 0.7,
    }),
  );
  c.show('trainable-policy', trainable);
  c.onBeat(2, () => s.play(vanish(phase2), appear([headers, ...calcSlots])));
  c.show('loss-inputs', inputNodes);
  c.show('loss-ratios', [tableCells[7], tableCells[11]], { after: true });
  c.show('loss-margin', margin, { after: true });
  c.show('loss-result', loss, { after: true });
  c.show('relative-limit', safety);
}
