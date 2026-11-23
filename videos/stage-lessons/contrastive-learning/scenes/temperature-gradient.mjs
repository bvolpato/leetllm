import { barChart, boxOf, column, dynamic, indicate, place, rect, row } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';

export default function temperatureGradient(s, c) {
  const [top, body, foot] = area.rows([1, 5, 2], 'loose');
  const gap = 0.9 - 0.2;
  const tau = s.value(1);
  const probability = () => 1 / (1 + Math.exp(-gap / tau.value));
  const gradient = () => Math.exp(-gap / tau.value) / (1 + Math.exp(-gap / tau.value)) / tau.value;
  const input = place(
    row(
      [
        label('positive 0.9', { color: 'green' }),
        label('negative 0.2', { color: 'pink' }),
        mono(`gap = ${gap.toFixed(1)}`),
      ],
      { gap: 'loose' },
    ),
    top,
  );
  const chart = place(
    barChart(
      [
        { label: 'positive share', value: 0, color: 'green' },
        { label: '|score gradient|', value: 0, color: 'yellow' },
      ],
      {
        width: body.width - 180,
        height: body.height - 100,
        max: 1,
        labelSize: 40,
        showValues: false,
      },
    ),
    body,
    'bottom',
  );
  const tracks = [0, 1].map((i) => {
    const b = boxOf(chart.bar(i)),
      bottom = b.point('bottom'),
      h = body.height - 100;
    return rect(b.width, h, { fill: 'surface', stroke: 'dim', width: 1 })
      .moveTo([bottom[0], bottom[1] - h / 2])
      .zIndex(-1);
  });
  const slot = place(mono('τ = 0.01     |g| = 4.000e−29', { color: 'yellow' }), foot);
  const reading = dynamic(() =>
    mono(`τ = ${tau.value.toFixed(2)}     |g| = ${gradient().toExponential(3)}`, {
      color: 'yellow',
    }).moveTo(slot.center),
  );
  const liveBars = [probability, gradient].map((value, i) =>
    dynamic(() => {
      const b = boxOf(chart.bar(i)),
        bottom = b.point('bottom'),
        h = body.height - 100;
      const height = Math.max(0.01, h * value());
      return rect(b.width, height, { fill: i ? 'yellow' : 'green', stroke: null }).moveTo([
        bottom[0],
        bottom[1] - height / 2,
      ]);
    }),
  );
  const ratioInput = place(
    row(
      [
        label('negative 0.72', { color: 'pink' }),
        label('negative 0.20', { color: 'blue' }),
        mono('τ = 0.05'),
      ],
      { gap: 'loose' },
    ),
    top,
  );
  const ratioMechanism = place(
    column(
      [
        mono('g₁ / g₂ = exp((0.72 − 0.20) / 0.05)', { size: 40 }),
        mono('= exp(10.4)', { color: 'yellow' }),
      ],
      { gap: 'loose', align: 'center' },
    ),
    body,
  );
  const rule = place(mono('|g| = (1 − p+) / τ', { color: 'yellow' }), foot);
  const ratio = Math.exp((0.72 - 0.2) / 0.05);
  const result = place(
    label(`negative gradient ratio ≈ ${Math.round(ratio).toLocaleString('en-US')}`, {
      color: 'pink',
    }),
    foot,
  );
  s.add(heading(c.title), input, tracks, chart);
  c.on('cl-temperature-gradient-gap', () => s.play(indicate(input, { scale: 1 })));
  c.show('cl-temperature-gradient-rule', rule);
  c.swap('cl-temperature-gradient-one', rule, [reading, liveBars], { after: true });
  const changes = [
    ['cl-temperature-gradient-one', 1],
    ['cl-temperature-gradient-tenth', 0.1],
    ['cl-temperature-gradient-fifth', 0.05],
    ['cl-temperature-gradient-tiny', 0.01],
  ];
  for (const [cue, value] of changes)
    c.after(cue, () => {
      s.play(tau.to(value, { duration: 1 }));
    });
  c.swap(
    'repair-ratio-inputs',
    [input, chart, tracks, reading, liveBars],
    [ratioInput, ratioMechanism],
  );
  c.show('cl-temperature-gradient-ratio', result, { after: true });
}
