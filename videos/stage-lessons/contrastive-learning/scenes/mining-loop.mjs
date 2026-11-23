import { arrow, boxOf, column, dot, grid, indicate, place, row, to } from 'vizmatic/stage';
import { area, heading, label, mono, namedBox, note } from '../../kit-narrated.mjs';
import { MINING_FIXTURE } from '../../../films/contrastive-learning/fixtures.mjs';
import {
  comparisonRow,
  miningCandidates,
} from '../../../films/contrastive-learning/arithmetic.mjs';
export default function miningLoop(s, c) {
  const [top, body, foot] = area.rows([1, 5, 2], 'normal');
  const query = 'How do I rotate an API key?';
  const title = place(label(query, { color: 'cyan' }), top);
  const names = {
    replacement: 'API replacement',
    'service account': 'Service signing key',
    'KMS intent': 'KMS encryption',
    'GPU guide': 'GPU guide',
  };
  const headers = ['Candidate queue', 'Relevance gate', 'Overlap gate', 'Teacher score'].map((w) =>
    note(w),
  );
  const cells = MINING_FIXTURE.flatMap((r, i) => [
    label(names[r.id], { size: 34 }),
    note(r.relevant ? 'relevant → exclude' : 'non-match → pass', {
      color: r.relevant ? 'green' : 'dim',
    }),
    mono(String(miningCandidates(query, [{ ...r, relevant: false }])[0]?.overlap ?? 0), {
      size: 34,
      color: i === 3 ? 'red' : 'cyan',
    }),
    mono(r.teacher.toFixed(2), { size: 34, color: 'yellow' }),
  ]);
  const table = place(grid([...headers, ...cells], { columns: 4, gap: ['normal', 'loose'] }), body);
  const selected = miningCandidates(query);
  const [outHead, outBody, outExits] = body.rows([1, 3, 1], 'normal');
  const sorted = place(
    column(
      [
        note('Teacher score ↓ · after both gates'),
        ...selected.map((r) =>
          row(
            [
              label(names[r.id], { color: 'pink', size: 34 }),
              mono(r.teacher.toFixed(2), { color: 'yellow' }),
            ],
            { gap: 'wide' },
          ),
        ),
      ],
      { gap: 'normal', align: 'center' },
    ),
    outBody,
  );
  const exits = place(
    note('Excluded: relevant API replacement · zero-overlap GPU guide'),
    outExits,
  );
  const gate = place(
    label('non-match AND overlap > 0 → teacher sort', { size: 34, color: 'cyan' }),
    outHead,
  );
  const [inputsRegion, lossRegion] = foot.rows(2, 'normal');
  const inputs = place(
    mono('scores [0.90, 0.20] → [0.90, 0.20, 0.72] · τ = 0.05', { size: 34 }),
    inputsRegion,
  );
  const base = comparisonRow([0.9, 0.2], 0.05).loss,
    mined = comparisonRow([0.9, 0.2, 0.72], 0.05).loss;
  const losses = place(
    mono('loss ' + base.toExponential(2) + ' → ' + mined.toFixed(6), { color: 'yellow' }),
    lossRegion,
  );
  const loopRegions = body.rows(2, 'loose').map((r) => r.columns(3, 'loose'));
  const stages = [
    ['new checkpoint θ', 'cyan', 0, 0],
    ['re-encode corpus', 'blue', 0, 1],
    ['refreshed index θ', 'blue', 0, 2],
    ['train next round', 'green', 1, 0],
    ['audit retrieved pairs', 'yellow', 1, 1],
    ['retrieve confusing items', 'pink', 1, 2],
  ].map(([name, color, r, col]) =>
    place(namedBox(name, { width: 450, height: 96, color }), loopRegions[r][col]),
  );
  const pairs = [
    [0, 1, 'right', 'left'],
    [1, 2, 'right', 'left'],
    [2, 5, 'bottom', 'top'],
    [5, 4, 'left', 'right'],
    [4, 3, 'left', 'right'],
    [3, 0, 'top', 'bottom'],
  ];
  const links = pairs.map(([a, b, from, to]) =>
    arrow(boxOf(stages[a]).point(from), boxOf(stages[b]).point(to), {
      stroke: 'dim',
      width: 3,
      pad: 6,
    }),
  );
  const packet = dot(9, 'cyan').moveTo(boxOf(stages[0]).point('right'));
  const heldout = place(
    column(
      [
        label('Held-out queries + near-duplicate groups', { size: 34, color: 'green' }),
        note('separate evaluation · excluded from training and mining'),
      ],
      { gap: 'tight', align: 'center' },
    ),
    foot,
  );
  cells.filter((_, i) => i % 4 !== 0).forEach((n) => n.set('visible', false));
  s.add(
    heading(c.title),
    title,
    headers,
    cells.filter((_, i) => i % 4 === 0),
  );
  c.show(
    'cl-mining-loop-audit',
    cells.filter((_, i) => i % 4 === 1),
  );
  c.show(
    'cl-mining-loop-lexical',
    cells.filter((_, i) => i % 4 === 2),
  );
  c.show(
    'cl-mining-loop-teacher',
    cells.filter((_, i) => i % 4 === 3),
    { after: true },
  );
  c.swap('repair-mining-sorted', table, [gate, sorted, exits], { after: true });
  c.show('repair-mining-inputs', inputs);
  c.show('cl-mining-loop-mass', losses, { after: true });
  c.swap('cl-mining-loop-round', [gate, sorted, exits, inputs, losses], [stages, links]);
  c.on(
    'cl-mining-loop-round',
    () => {
      for (const [a, b, from, toSide] of pairs) {
        packet.moveTo(boxOf(stages[a]).point(from));
        s.play(to(packet, (n) => n.moveTo(boxOf(stages[b]).point(toSide)), { duration: 0.45 }));
      }
    },
    0.7,
  );
  c.show('cl-mining-loop-holdout', heldout);
}
