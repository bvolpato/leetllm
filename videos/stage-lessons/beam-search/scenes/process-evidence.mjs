import { barChart, column, indicate, place, row, to, tokens } from 'vizmatic/stage';
import { heading, area, label, mono, note } from '../../kit-narrated.mjs';
import { OUTCOME_CANDIDATES } from '../../../films/beam-search/fixtures.mjs';

export default function processEvidence(s, c) {
  const [header, body, footer] = area.rows([1, 4.5, 1.1], 'wide');
  const lanes = body.rows(2, 'loose');
  const steps = [
    ['create', 'deploy', 'revoke'],
    ['revoke', 'create', 'deploy'],
  ];
  const scores = [
    [0.95, 0.92, 0.98],
    [0.05, 0.9, 0.92],
  ];
  const base = lanes.map((region, i) =>
    place(
      tokens(steps[i], {
        size: 40,
        minWidth: 210,
        label: i === 0 ? 'A' : 'B',
        colors: steps[i].map((word) =>
          word === 'create' ? 'cyan' : word === 'revoke' ? 'blue' : 'dim',
        ),
        rows: { process: ['', '', ''] },
        rowSize: 34,
      }),
      region,
      'left',
    ),
  );
  const chart = place(
    barChart(
      [
        { label: 'A min', value: 0, color: 'cyan' },
        { label: 'B min', value: 0, color: 'blue' },
      ],
      {
        width: 690,
        height: 320,
        max: 1,
        ticks: [0, 0.5, 1],
        labelSize: 40,
        showValues: true,
        format: (v) => v.toFixed(2),
      },
    ),
    body,
    'bottom right',
  );
  chart.readouts.forEach((node) => node.opacity(0));
  const title = place(
    note(
      `A: outcome ${OUTCOME_CANDIDATES[0].score.toFixed(2)}       B: outcome ${OUTCOME_CANDIDATES[1].score.toFixed(2)}       Guide: create first`,
    ),
    header,
  );
  const judgment = place(
    label('A remains selected · B’s first-step score is wrong', { color: 'yellow', size: 34 }),
    footer,
  );
  s.add(heading(c.title), [title, base, chart]);
  c.on('process-evidence-build-0', () => s.play(indicate(base, { scale: 1, color: 'yellow' })));
  c.after('process-evidence-build-1', () =>
    s.play(
      ...base.flatMap((strip, i) =>
        scores[i].map((v, j) => strip.setValue('process', j, v.toFixed(2), { duration: 0.7 })),
      ),
    ),
  );
  c.after('process-evidence-build-1', () =>
    s.play(
      ...chart.readouts.map((node) => to(node, (n) => n.opacity(1), { duration: 0.3 })),
      chart.update(
        scores.map((row) => Math.min(...row)),
        { duration: 1.2 },
      ),
    ),
  );
  c.after('process-evidence-build-2', () =>
    s.play(base[1].setValue('process', 0, '.99', { duration: 0.8 })),
  );
  c.after('process-evidence-build-2', () =>
    s.play(chart.update([Math.min(...scores[0]), 0.9], { duration: 1.2 })),
  );
  c.show('process-evidence-build-2', judgment, { after: true });
}
