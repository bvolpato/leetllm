import { assertEqual, axes, dot, dynamic, line, place, tex } from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import { BODY, FOOT } from '../parts.mjs';
import { cupedVariance } from '../../../films/ab-testing/model.mjs';
import { AB_VISUAL_FIXTURES as fixture } from '../../../films/ab-testing/fixtures.mjs';
export default function cuped(s, c) {
  const [caption, plot, math] = BODY.rows([1, 4, 2], 'normal');
  const title = place(label('First 24 simulated incidents   ·   height = outcome score'), caption);
  const amount = s.value(0);
  const axis = place(
    axes({
      x: [0, 25],
      y: [-0.5, 1.5],
      width: plot.width * 0.8,
      height: plot.height * 0.76,
      xStep: 5,
      yStep: 0.5,
      labels: false,
      labelSize: 34,
      tips: false,
    }),
    plot,
  );
  const ticks = [0, 5, 10, 15, 20, 25].map((x) => {
    const p = axis.world(x, -0.5);
    return mono(String(x), { size: 34, color: 'dim' }).moveTo([p[0], p[1] + 38]);
  });
  const yTicks = [-0.5, 0, 0.5, 1, 1.5].map((y) => {
    const p = axis.world(0, y);
    return mono(String(y), { size: 34, color: 'dim' }).moveTo([p[0] - 56, p[1]]);
  });
  const sample = fixture.cuped.sampleRows;
  const marks = dynamic(() =>
    sample.flatMap((r, i) => {
      const adjusted = r.y - amount.value * fixture.cuped.theta * (r.x - fixture.cuped.center);
      return [
        line(axis.world(i + 1, r.y), axis.world(i + 1, adjusted), { stroke: 'dim', width: 2 }),
        dot(i ? 9 : 14, i ? (r.arm ? 'blue' : 'cyan') : 'yellow').moveTo(
          axis.world(i + 1, adjusted),
        ),
      ];
    }),
  );
  const formula = place(tex('Y_{adj}=Y-\\theta(X-\\mu_X)', { size: 44 }), math, 'top');
  const first = sample[0];
  const firstInputs = place(
    mono('Incident 1     outcome ' + first.y + '     history flag ' + first.x, {
      size: 44,
      color: 'yellow',
    }),
    FOOT,
  );
  const firstScore = place(
    mono(
      '1 − ' +
        fixture.cuped.theta.toFixed(3) +
        ' × (1 − ' +
        fixture.cuped.center.toFixed(3) +
        ') ≈ ' +
        first.adjusted.toFixed(3),
      { size: 44, color: 'yellow' },
    ),
    FOOT,
  );
  const varianceY = 9,
    varianceX = 4,
    covariance = 3;
  const theta = covariance / varianceX;
  const residual = cupedVariance(varianceY, varianceX, covariance);
  assertEqual(residual, 6.75, 'CUPED numerical residual variance');
  const example = place(note('Separate example: variance Y 9, X 4, covariance 3.'), math);
  const coefficient = place(mono(`θ = ${theta}`, { color: 'yellow' }), math, 'bottom');
  const result = place(
    mono(`variance ${varianceY} → ${residual}`, { color: 'yellow' }),
    math,
    'bottom',
  );
  const labAxis = place(
    axes({
      x: [0, 8],
      y: [0, 3],
      width: plot.width * 0.82,
      height: plot.height * 0.56,
      labels: false,
      tips: false,
    }),
    plot,
  );
  const labTitle = place(note('Executed simulation: approximate 95% lift intervals'), caption);
  const labTicks = [0, 2, 4, 6, 8].map((x) => {
    const p = labAxis.world(x, 0);
    return mono(String(x), { size: 34, color: 'dim' }).moveTo([p[0], p[1] + 36]);
  });
  const labUnit = place(note('Lift in percentage points'), plot, 'bottom');
  const labRows = ['raw', 'adjusted'].map((name, i) => {
    const estimate = fixture.cuped[i ? 'adjustedLift' : 'rawLift'] * 100;
    const se = fixture.cuped[i ? 'adjustedSe' : 'rawSe'] * 100;
    const y = i ? 0.8 : 2.1;
    const color = i ? 'yellow' : 'cyan';
    const reading = mono(`${name} ${estimate.toFixed(2)} pp`, { size: 36, color }).moveTo(
      labAxis.world(4, y + 0.55),
    );
    return [
      reading,
      line(labAxis.world(estimate - 1.96 * se, y), labAxis.world(estimate + 1.96 * se, y), {
        stroke: color,
        width: 8,
      }),
      dot(10, color).moveTo(labAxis.world(estimate, y)),
      ...[-1, 1].map((sign) =>
        line(
          labAxis.world(estimate + sign * 1.96 * se, y - 0.12),
          labAxis.world(estimate + sign * 1.96 * se, y + 0.12),
          { stroke: color, width: 4 },
        ),
      ),
    ];
  });
  const reduction = place(
    mono(`Pooled outcome variance −${(fixture.cuped.varianceReduction * 100).toFixed(1)}%`, {
      color: 'yellow',
      size: 38,
    }),
    FOOT,
  );
  const margin = (se) => (1.96 * se * 100).toFixed(2);
  const margins = place(
    mono(
      '95% margin   ±' +
        margin(fixture.cuped.rawSe) +
        ' pp   →   ±' +
        margin(fixture.cuped.adjustedSe) +
        ' pp',
      { size: 38 },
    ),
    FOOT,
  );
  s.add(heading('Remove predictable variation'), title, axis, ticks, yTicks, marks, formula);
  c.show('incident', firstInputs);
  c.on('common', () => s.play(amount.to(1, { duration: 2.2 })));
  c.swap('adjusted', firstInputs, firstScore, { after: true });
  c.hide('example', firstScore);
  c.show('example', example);
  c.show('theta', coefficient, { after: true });
  c.swap('variance', coefficient, result, { after: true });
  c.swap(
    'simulation',
    [axis, ticks, yTicks, marks, title, formula, example, result],
    [labAxis, labTicks, labUnit, labTitle],
  );
  c.show('reduction', reduction, { after: true });
  c.show('raw-lift', labRows[0], { after: true });
  c.show('lab', labRows[1], { after: true });
  c.swap('margins', reduction, margins);
}
