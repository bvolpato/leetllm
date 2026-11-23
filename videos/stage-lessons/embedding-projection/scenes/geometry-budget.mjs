import { column, dynamic, group, indicate, line, place, rect, tex } from 'vizmatic/stage';
import { label, mono, note } from '../../kit-narrated.mjs';
import { begin, FOOT, LEFT, RIGHT, mathPlot, taskHeader, VECTOR_BYTES } from '../parts.mjs';
export default function geometryBudget(s, c) {
  const header = taskHeader(),
    d = s.value(16);
  const chart = mathPlot(LEFT, { x: [0, 2], y: [0, 1.2] });
  const curve = dynamic(() => {
    const nodes = [];
    const mode = 1 - 2 / d.value;
    // The relative squared distance follows a scaled chi-squared density.
    const density = (x) =>
      x <= 0 ? 0 : Math.exp((d.value / 2 - 1) * Math.log(x / mode) - (d.value * (x - mode)) / 2);
    for (let i = 0; i < 80; i++) {
      const x = i / 40,
        y = density(x),
        xn = (i + 1) / 40,
        yn = density(xn);
      nodes.push(line(chart.world(x, y), chart.world(xn, yn), { stroke: 'ink', width: 4 }));
    }
    return group(...nodes);
  });
  const caption = place(note('Squared distance / mean • peak normalized'), LEFT, 'top');
  const rows = RIGHT.rows([1, 1, 1, 2], 'wide');
  const mean = place(tex('E[D^2]=2d\\sigma^2', { size: 44, color: 'ink' }), rows[0]);
  const variance = place(
    tex('\\operatorname{Var}(D^2)=8d\\sigma^4', { size: 44, color: 'ink' }),
    rows[1],
  );
  const ratio = place(
    tex('\\mathrm{sd}/\\mathrm{mean}=\\sqrt{2/d}', { size: 44, color: 'yellow' }),
    rows[2],
  );
  const ledger = place(
    column(
      [
        label('full index'),
        note('vectors + IDs + graph + text'),
        note('allocator + search settings'),
      ],
      { gap: 'normal' },
    ),
    rows[3],
  );
  const limit = place(
    label('Gaussian independence and isotropy are assumptions', { size: 36, color: 'yellow' }),
    FOOT,
  );
  begin(
    s,
    c,
    'geometry-budget',
    'A narrower distribution, a larger ledger',
    [chart, curve, caption, ledger],
    header,
  );
  c.show('gaussian-mean', mean, { after: true });
  c.show('gaussian-var', variance, { after: true });
  c.show('gaussian-ratio', ratio, { after: true });
  c.on('gaussian-ratio', () => s.play(d.to(VECTOR_BYTES.dimensions, { duration: 3 })));
  c.show('index-overhead', limit);
  c.on('index-settings', () => s.play(indicate(ledger, { scale: 1, color: 'yellow' })));
}
