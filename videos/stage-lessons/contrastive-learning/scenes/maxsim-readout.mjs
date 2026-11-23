import {
  assertEqual,
  column,
  heatmap,
  indicate,
  place,
  row,
  arrayCells,
  arrow,
  boxOf,
  barChart,
} from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { tokenMaxSim } from '../../../films/contrastive-learning/arithmetic.mjs';

export default function maxsimReadout(s, c) {
  const [body, foot] = area.rows([6, 1], 'loose');
  const [left, right] = body.columns([3, 2], 'loose');
  const values = [
    [0.12, 0.93, 0.08],
    [0.19, 0.07, 0.91],
  ];
  const r = tokenMaxSim(values);
  const swappedKey = [values[1][0], values[1][2], values[1][1]];
  const reused = tokenMaxSim([values[0], swappedKey]);
  assertEqual(reused.winners[0], reused.winners[1], 'both tokens choose the same column');
  assertEqual(reused.sum, r.sum, 'moving the row maximum preserves its contribution');
  const matrix = place(
    heatmap(values, {
      size: 40,
      cell: 160,
      values: true,
      format: (v) => v.toFixed(2),
      rowLabels: ['API', 'key'],
      columnLabels: ['d₁', 'd₂', 'd₃'],
    }),
    left,
  );
  const sum = place(
    column(
      [
        label('sum row maxima', { color: 'yellow' }),
        mono(`${r.values.join(' + ')}`),
        mono(`= ${r.sum.toFixed(2)}`, { color: 'yellow' }),
      ],
      { gap: 'wide', align: 'center' },
    ),
    right,
  );
  const ratio = (100 * 128) / 768;
  const storage = place(note(`raw coordinates: 100 × 128 / 768 ≈ ${ratio.toFixed(1)}×`), foot);
  const payload = place(
    note('raw payload = token count × vector width × bytes per coordinate'),
    foot,
  );
  const raw = place(
    barChart(
      [
        { label: '100 × 128 token coordinates', value: 100 * 128, color: 'blue' },
        { label: '1 × 768 pooled coordinates', value: 768, color: 'cyan' },
      ],
      {
        width: body.width - 100,
        height: body.height - 100,
        max: 100 * 128,
        labelSize: 34,
        showValues: true,
      },
    ),
    body,
  );
  const [tokenHead, fullRegion, partsRegion, reconstructRegion] = body.rows([1, 2, 2, 1], 'normal');
  const token = place(
    label('Document token d₂ · same token before and after compression', {
      color: 'blue',
      size: 34,
    }),
    tokenHead,
  );
  const full = place(
    column(
      [
        label('full vector · 128 coordinates', { color: 'blue' }),
        arrayCells(['v₁', 'v₂', '…', 'v₁₂₈'], { cell: 100, size: 34, indices: false }),
        note('payload: 128 × full-precision coordinate bits'),
      ],
      { gap: 'tight', align: 'center' },
    ),
    fullRegion,
  );
  const [centroidRegion, residualRegion] = partsRegion.columns([1, 2], 'loose');
  const centroid = place(
    column([label('centroid ID k', { color: 'blue' }), note('nearest codebook vector cₖ')], {
      gap: 'tight',
      align: 'center',
    }),
    centroidRegion,
  );
  const residual = place(
    column(
      [
        label('residual = v − cₖ', { color: 'cyan' }),
        arrayCells(['q₁', 'q₂', '…', 'q₁₂₈'], { cell: 100, size: 34, indices: false }),
        note('qᵢ = Q_b(vᵢ − cₖ,ᵢ) · b ∈ {1, 2} bits'),
      ],
      { gap: 'tight', align: 'center' },
    ),
    residualRegion,
  );
  const reconstruct = place(
    mono('approximate vector = cₖ + decoded residual', { size: 34, color: 'yellow' }),
    reconstructRegion,
  );
  const compressed = place(
    note('stored: centroid ID bits + 128 × b · codebook and index costs are additional'),
    foot,
  );
  const routes = [centroid, residual].map((target) =>
    arrow(boxOf(full).point('bottom'), boxOf(target).point('top'), {
      stroke: 'dim',
      width: 3,
      pad: 18,
    }),
  );
  s.add(heading(c.title), matrix, sum.nodes[0], payload);
  c.on('cl-maxsim-readout-api', () => s.play(matrix.light({ row: 0, col: r.winners[0] })));
  c.on('cl-maxsim-readout-key', () => s.play(matrix.light({ row: 1, col: r.winners[1] })));
  c.show('cl-maxsim-readout-sum', sum.nodes.slice(1), { after: true });
  c.on('cl-maxsim-readout-reuse', () => {
    s.play(matrix.light(null), matrix.setValue({ row: 1 }, swappedKey));
    s.play(matrix.light({ col: reused.winners[0] }));
  });
  c.swap('repair-maxsim-payload', [matrix, sum], [raw]);
  c.swap('cl-maxsim-readout-bytes', payload, storage, { after: true });
  c.swap(
    'cl-maxsim-readout-compress',
    [raw, storage],
    [token, full, centroid, residual, compressed],
  );
  c.show('repair-maxsim-reconstruct', reconstruct);
}
