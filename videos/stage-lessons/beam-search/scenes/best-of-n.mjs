import { barChart, column, indicate, place, row, to, tokens } from 'vizmatic/stage';
import { heading, area, label, mono, note } from '../../kit-narrated.mjs';
import { OUTCOME_CANDIDATES } from '../../../films/beam-search/fixtures.mjs';
import { COLORS } from '../parts.mjs';

export default function bestOfN(s, c) {
  const [header, body, footer] = area.rows([2.2, 3.5, 1], 'wide');
  const trajectories = header
    .rows(3, 'tight')
    .map((region, i) =>
      place(
        row(
          [
            label(OUTCOME_CANDIDATES[i].id, { color: COLORS[i] }),
            tokens(OUTCOME_CANDIDATES[i].text.split(' → '), { size: 34 }),
          ],
          { gap: 'wide' },
        ),
        region,
      ),
    );
  const regions = body.columns(2, 'loose');
  const order = [1, 2, 0];
  const generator = place(
    barChart(
      order.map((i) => ({
        label: OUTCOME_CANDIDATES[i].id,
        value: Math.exp(OUTCOME_CANDIDATES[i].log),
        color: COLORS[i],
      })),
      {
        width: regions[0].width * 0.8,
        height: regions[0].height * 0.6,
        max: 1,
        labelSize: 40,
        showValues: true,
        format: (v) => v.toFixed(3),
      },
    ),
    regions[0],
    'bottom',
  );
  const evaluator = place(
    barChart(
      order.map((i) => ({ label: OUTCOME_CANDIDATES[i].id, value: 0, color: COLORS[i] })),
      {
        width: regions[1].width * 0.8,
        height: regions[1].height * 0.6,
        max: 1,
        labelSize: 40,
        showValues: true,
        format: (v) => v.toFixed(2),
      },
    ),
    regions[1],
    'bottom',
  );
  evaluator.readouts.forEach((node) => node.opacity(0));
  const headings = regions.map((region, i) =>
    place(note(i ? 'Supplied outcome evaluator' : 'Generator probability'), region, 'top'),
  );
  const warning = place(
    note('Candidate identity · scoring source · complete task judgment'),
    footer,
  );
  s.add(heading(c.title), [trajectories, generator, evaluator, headings]);
  c.after('best-of-n-build-0', () => {
    s.play(
      ...evaluator.readouts.map((node) => to(node, (n) => n.opacity(1), { duration: 0.3 })),
      evaluator.update(
        order.map((i) => OUTCOME_CANDIDATES[i].score),
        { duration: 1.2 },
      ),
    );
    s.play(evaluator.sort('descending', { duration: 1.2 }));
  });
  c.show('best-of-n-build-1', warning);
}
