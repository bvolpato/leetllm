import {
  assertEqual,
  boxOf,
  axes,
  column,
  dynamic,
  line,
  place,
  polygon,
  polyline,
  row,
} from 'vizmatic/stage';
import { chip, heading, label, mono, note } from '../../kit-narrated.mjs';
import { FOOT, SIDE, experiment, report } from '../parts.mjs';
import { requiredN } from '../../../films/ab-testing/arithmetic.mjs';
import { planningPower } from '../../../films/ab-testing/model.mjs';
export default function powerDecision(s, c) {
  const b = experiment(s, true);
  const [caption, plotting, details] = SIDE.rows([1, 4, 2], 'normal');
  const targetEffect = 0.02,
    targetPower = 0.8;
  const shortcutN = Math.round(requiredN(report.control.resolved / report.control.n, targetEffect));
  let fullN = shortcutN;
  while (planningPower(fullN).power < targetPower) fullN++;
  assertEqual(shortcutN, 9246, 'shortcut planning sample');
  assertEqual(fullN, 9336, 'fuller planning sample');
  const n = s.value(report.control.n);
  const launch = s.value(0);
  const axis = place(
    axes({
      x: [-5, 7],
      y: [0, 0.65],
      width: plotting.width * 0.85,
      height: plotting.height * 0.64,
      xStep: 2,
      labels: false,
      tips: false,
    }),
    plotting,
  );
  const density = (mean, sd, x) =>
    Math.exp(-0.5 * ((x - mean) / sd) ** 2) / (sd * Math.sqrt(2 * Math.PI));
  const curves = dynamic(() => {
    const p = planningPower(n.value);
    const xs = Array.from({ length: 121 }, (_, i) => -5 + i / 10);
    const points = (mean, sd) => xs.map((x) => axis.world(x, density(mean, sd, x)));
    const critical = p.critical * 100;
    const tails = launch.value
      ? [[targetEffect * 100, 7]]
      : [
          [-5, -critical],
          [critical, 7],
        ];
    const shade = tails.map(([lo, hi]) => {
      const within = [lo, ...xs.filter((x) => x > lo && x < hi), hi];
      return polygon(
        [
          axis.world(lo, 0),
          ...within.map((x) =>
            axis.world(x, density(targetEffect * 100, p.alternativeSe * 100, x)),
          ),
          axis.world(hi, 0),
        ],
        { fill: 'blue', stroke: null },
      ).opacity(0.24);
    });
    return [
      ...shade,
      polyline(points(0, p.nullSe * 100), { stroke: 'dim', width: 4 }),
      polyline(points(targetEffect * 100, p.alternativeSe * 100), { stroke: 'blue', width: 5 }),
    ];
  });
  const critical = axis.marker({
    x: () => planningPower(n.value).critical * 100,
    color: 'yellow',
    width: 4,
    dash: null,
  });
  axis.marker({
    x: () => -planningPower(n.value).critical * 100,
    color: 'yellow',
    width: 4,
    dash: null,
  });
  const gate = line(axis.world(targetEffect * 100, 0), axis.world(targetEffect * 100, 0.65), {
    stroke: 'red',
    width: 4,
    dash: [8, 8],
  });
  const ticks = [-4, -2, 0, 2, 4, 6].map((x) => {
    const p = axis.world(x, 0);
    return mono(String(x), { size: 34, color: 'dim' }).moveTo([p[0], p[1] + 30]);
  });
  const axisTitle = place(note('Estimated lift (percentage points)'), plotting, 'bottom');
  const lineNames = place(
    row([note('critical', { color: 'yellow' }), note('launch ≥ +2 pp', { color: 'red' })], {
      gap: 'wide',
    }),
    details,
  );
  const names = place(
    row(
      [
        label('null', { color: 'dim' }),
        label(`true effect +${targetEffect * 100} pp`, { color: 'blue' }),
      ],
      {
        gap: 'wide',
      },
    ),
    caption,
  );
  const widest = place(
    mono(`${fullN.toLocaleString('en-US')} / arm`, { color: 'yellow' }),
    details,
    'top',
  );
  const shortcut = dynamic(() =>
    mono(`${Math.round(n.value).toLocaleString('en-US')} / arm`, { color: 'yellow' }).moveTo(
      boxOf(widest).point('center'),
    ),
  );
  const fuller = place(
    mono(
      `${(planningPower(shortcutN).power * 100).toFixed(1)}% at ${shortcutN.toLocaleString('en-US')}`,
      { color: 'yellow' },
    ),
    details,
    'bottom',
  );
  const half = place(label('About half reach the +2 pp launch threshold.', { color: 'red' }), FOOT);
  const scale = place(note('Halve the target effect → about four times the enrollment.'), FOOT);
  s.add(
    heading('Detection and launch ask different questions'),
    axis,
    curves,
    critical,
    names,
    ticks,
    axisTitle,
    shortcut,
  );
  c.take(b.standing);
  c.show('scaling', scale);
  c.after('shortcut', () => s.play(n.to(shortcutN, { duration: 2 })));
  c.show('fuller', fuller, { after: true });
  c.after('exact', () => s.play(n.to(fullN, { duration: 1 })));
  c.show('launch', [gate, lineNames]);
  c.on('launch', () => launch.set(1));
  c.hide('launch', scale);
  c.show('different', half, { after: true });
}
