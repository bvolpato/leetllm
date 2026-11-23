import { assertEqual, axes, barChart, dot, dynamic, line, place, polyline } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { AB_VISUAL_FIXTURES as fixture } from '../../../films/ab-testing/fixtures.mjs';

export default function peeking(s, c) {
  const [context, chart, reading, foot] = area.rows([0.65, 4, 0.85, 0.75], 'normal');
  const path = fixture.peeking.path;
  const crossing = path.find((r) => Math.abs(r.z) > 1.96);
  const last = path.at(-1);
  assertEqual(crossing.look, 4, 'first crossing in the example');
  assertEqual(last.z.toFixed(2), '1.61', 'final observed z');
  const scope = place(label('Same policy in both arms   ·   true resolution rate 40%'), context);
  const axis = place(
    axes({
      x: [0, 21],
      y: [-3, 3.25],
      width: chart.width * 0.74,
      height: chart.height * 0.91,
      labels: false,
      ticks: false,
      tips: false,
    }),
    chart,
  );
  const bounds = [-1.96, 1.96].map((z) => [
    line(axis.world(0, z), axis.world(20.5, z), { stroke: 'dim', width: 4, dash: [10, 8] }),
    mono(z > 0 ? '+1.96' : '−1.96', { size: 35 }).moveTo([
      axis.world(0, z)[0] - 84,
      axis.world(0, z)[1],
    ]),
  ]);
  const look = s.value(1);
  const trace = dynamic(() => {
    const count = Math.round(look.value);
    const points = path.slice(0, count).map((r) => axis.world(r.look, r.z));
    return [
      ...(count > 1 ? [polyline(points, { stroke: 'cyan', width: 5 })] : []),
      dot(12, 'cyan').moveTo(points.at(-1)),
    ];
  });
  const readingAt = dynamic(() => {
    const r = path[Math.round(look.value) - 1];
    return place(
      mono(
        'Look ' +
          r.look +
          '   ·   ' +
          r.n.toLocaleString('en-US') +
          ' incidents per arm   ·   z = ' +
          r.z.toFixed(2),
        { size: 41 },
      ),
      reading,
    );
  });
  const saved = dot(16, 'yellow').moveTo(axis.world(crossing.look, crossing.z));
  const savedLabel = note('First crossing', { color: 'yellow' }).moveTo([
    axis.world(crossing.look, crossing.z)[0],
    axis.world(crossing.look, crossing.z)[1] - 48,
  ]);
  const ask = place(label('Does the planned final look also cross?', { color: 'yellow' }), foot);
  const answer = place(label('Look 4 crosses   ·   look 20 finishes inside'), foot);
  s.add(heading(c.title), scope, axis, bounds, trace, readingAt);
  c.on('four', () => s.play(look.to(crossing.look, { duration: 1.2 })));
  c.show('cross', [saved, savedLabel]);
  c.show('ask', ask);
  c.on('finish', () => s.play(look.to(last.look, { duration: 2.6 })));
  c.swap('inside', ask, answer);
  const title = heading('How often does either rule raise an alarm?');
  const countScope = place(label('5,000 simulated experiments   ·   no treatment effect'), context);
  const alarm = place(
    barChart(
      ['Final only', '5 looks', '10 looks', '20 looks'].map((name) => ({
        label: name,
        value: 0,
        color: 'cyan',
      })),
      {
        width: chart.width * 0.86,
        height: chart.height * 0.75,
        max: 1500,
        labelSize: 36,
        showValues: true,
        format: (v) => (v ? String(Math.round(v)) : ''),
      },
    ),
    chart,
    'bottom',
  );
  const measure = place(note('Experiments with a false alarm in either direction'), reading);
  c.swapAll('repeat', [title, countScope, alarm, measure]);
  fixture.peeking.alarms.forEach((_, i) => {
    const cue = ['final', 'five', 'ten', 'twenty'][i];
    c.on(cue, () =>
      s.play(
        alarm.update(
          fixture.peeking.alarms.map((v, j) => (j <= i ? v : 0)),
          { duration: 0.8 },
        ),
      ),
    );
  });
  const percent = (v) => ((100 * v) / 5000).toFixed(1) + '%';
  c.show(
    'rates',
    place(
      mono(
        percent(fixture.peeking.alarms[0]) +
          ' at the final look     ' +
          percent(fixture.peeking.alarms[3]) +
          ' over twenty looks',
        { size: 42, color: 'yellow' },
      ),
      foot,
    ),
  );
}
