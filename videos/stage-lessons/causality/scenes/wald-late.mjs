import { place, to, unitChart } from 'vizmatic/stage';
import { captions, frame, pct, plot, record } from '../parts.mjs';
import { label } from '../../kit-narrated.mjs';
import { instrumentFixture, monotoneCompliance } from '../../../films/causality/model.mjs';

export default function waldLate(s, c) {
  frame(
    s,
    'Whose workflow does a flag change?',
    'Hypothetical hundred-person population',
    'Flag-group comparison',
  );
  const iv = instrumentFixture(),
    types = monotoneCompliance();
  const n = 100,
    counts = [types.always, types.compliers, types.never].map((p) => Math.round(n * p));
  const [gridBand, legendBand] = plot.rows([6, 1]);
  const grid = place(
    unitChart(
      counts.map((count) => ({ count, color: 'dim' })),
      { rows: 10, cell: 45, gap: 8, shape: 'square' },
    ),
    gridBand,
  );
  const legend = place(
    label('Cyan uses the assistant. Pink uses control.', { size: 34 }),
    legendBand,
  );
  const [uptake, resolution, ratio] = record(s, [
    ['Assistant uptake', 'Without / with flag', 'cyan'],
    ['Resolution', 'Without / with flag', 'green'],
    ['Wald ratio', 'Δ resolution / Δ uptake', 'yellow'],
  ]);
  s.add(grid, legend);
  const noFlag = 0.68;
  uptake(
    c,
    'uptake',
    pct(types.always) +
      ' → ' +
      pct(types.always + types.compliers) +
      '   Δ = ' +
      Math.round(iv.firstStage * 100) +
      ' pp',
    true,
  );
  resolution(
    c,
    'outcome',
    pct(noFlag) +
      ' → ' +
      pct(noFlag + iv.outcomeDifference) +
      '   Δ = ' +
      Math.round(iv.outcomeDifference * 100) +
      ' pp',
    true,
  );
  ratio(
    c,
    'quotient',
    Math.round(iv.outcomeDifference * 100) +
      ' pp / ' +
      Math.round(iv.firstStage * 100) +
      ' pp = ' +
      iv.ratio.toFixed(2),
    true,
  );
  function setFlag(on) {
    s.play(
      ...grid.marks.map((m, i) =>
        to(m, (v) => v.fill(i < counts[0] + (on ? counts[1] : 0) ? 'cyan' : 'pink')),
      ),
      { duration: 0.95 },
    );
  }
  c.after('uptake', () => setFlag(true));
  c.on('monotone', () => setFlag(false));
  c.after('compliers', () => setFlag(true));
  c.on('without', () => setFlag(false));
  captions(
    s,
    c,
    'Compare a flag that encourages assistant use with the same policy without the flag.',
    [
      ['uptake', 'Compare the change in resolution with the change in workflow uptake.'],
      [
        'ratio',
        'A ratio of ' +
          iv.ratio.toFixed(2) +
          ' corresponds to ' +
          Math.round(iv.ratio * 100) +
          ' percentage points of resolution.',
        true,
      ],
      [
        'interpret',
        'Under the instrument assumptions and monotonicity, the ' +
          Math.round(iv.ratio * 100) +
          ' pp resolution effect is the average for compliers.',
        true,
      ],
      [
        'compliers',
        counts[1] +
          ' compliers switch from control to assistant. Everyone else keeps the same action.',
        true,
      ],
      ['without', 'Without the flag, the always-takers still use the assistant.'],
    ],
  );
}
