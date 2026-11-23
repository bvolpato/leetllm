import { dot, dynamic, line, place } from 'vizmatic/stage';
import { at, captions, frame, nfmt, plot, point, record } from '../parts.mjs';
import { label } from '../../kit-narrated.mjs';
import { instrumentFixture } from '../../../films/causality/model.mjs';

export default function weakInstrument(s, c) {
  frame(
    s,
    'A small uptake change magnifies a bypass',
    'Outcome change against uptake change',
    'Separate algebra example',
  );
  const strong = instrumentFixture(0.4, 0.01),
    weak = instrumentFixture(0.04, 0.01);
  const [chart, key] = plot.rows([6, 1]);
  const r = chart.inset('loose'),
    xmax = 0.44,
    ymax = 0.15;
  const xy = (x, y) => point(r, x / xmax, 1 - y / ymax);
  const base = xy(0, 0),
    strength = s.value(strong.firstStage),
    show = s.value(0),
    reported = s.value(0),
    mediated = s.value(0),
    bypass = s.value(0);
  const axis = [
    line(base, xy(xmax, 0), { stroke: 'dim', width: 3 }),
    line(base, xy(0, ymax), { stroke: 'dim', width: 3 }),
  ];
  const ticks = [0.04, 0.2, 0.4].map((v) =>
    label(nfmt(v), { size: 30, color: 'dim' }).moveTo(xy(v, 0)).shift(0, 31),
  );
  const yTicks = [0.05, 0.1].map((v) =>
    label(nfmt(v), { size: 30, color: 'dim' }).moveTo(xy(0, v)).shift(-39, 0),
  );
  s.add(
    ticks,
    yTicks,
    at(label('Δ resolution', { size: 31 }), chart, 0.17, 0.06),
    at(label('Δ uptake', { size: 31 }), chart, 0.83, 0.98),
  );
  const trueSlope = line(base, xy(xmax, strong.tau * xmax), { stroke: 'cyan', width: 5 });
  const diagram = dynamic(() => {
    if (!show.value) return [];
    const m = instrumentFixture(strength.value, bypass.value);
    const y = m.mediated * mediated.value + bypass.value;
    const end = Math.min(xmax, ymax / m.ratio);
    return [
      line(base, xy(end, end * m.ratio), { stroke: 'yellow', width: 5, opacity: reported.value }),
      line(xy(m.firstStage, y - bypass.value), xy(m.firstStage, y), {
        stroke: 'red',
        width: 10,
      }),
      dot(10, 'yellow').at(xy(m.firstStage, y)),
    ];
  });
  const reference = line(base, xy(xmax, xmax * strong.ratio), { stroke: 'dim', width: 3 });
  c.show('weak', reference, { after: true, lead: 0 });
  s.add(
    ...axis,
    trueSlope,
    diagram,
    place(label('Cyan: true slope     Red: bypass     Yellow: reported slope', { size: 33 }), key),
  );
  const [run, rise, ratio] = record(s, [
    ['Uptake change', 'First stage'],
    ['Outcome change', 'Mediated + bypass'],
    ['Reported ratio', 'Slope', 'yellow'],
  ]);
  c.after('strong', () => show.set(1));
  run(c, 'strong', nfmt(strong.firstStage), true);
  c.after('mediated', () => s.play(mediated.to(1), { duration: 0.6 }));
  rise(c, 'mediated', nfmt(strong.mediated) + ' mediated', true);
  c.after('sum', () => s.play(bypass.to(strong.direct), { duration: 0.6 }));
  rise(
    c,
    'sum',
    nfmt(strong.mediated) + ' + ' + nfmt(strong.direct) + ' = ' + nfmt(strong.outcomeDifference),
    true,
  );
  c.after('first', () => s.play(reported.to(1)));
  ratio(c, 'first', nfmt(strong.ratio), true);
  c.after('weak', () => s.play(strength.to(weak.firstStage, { duration: 1.4 })));
  run(c, 'weak', nfmt(weak.firstStage), true);
  rise(c, 'weak', null, true);
  rise(c, 'num', nfmt(weak.outcomeDifference), true);
  ratio(c, 'weak', 'ΔY / ΔA');
  ratio(c, 'second', nfmt(weak.ratio), true);
  captions(
    s,
    c,
    'The slope through the origin is the outcome difference divided by the uptake difference.',
    [
      ['bypass', 'The worksheet fixes a direct flag effect of ' + nfmt(strong.direct) + '.', true],
      ['weak', 'Shrink the horizontal distance and keep the vertical bypass fixed.', true],
      [
        'bias',
        'The bypass adds ' + nfmt(100 * weak.bypassBias) + ' points to the reported effect.',
        true,
      ],
    ],
  );
}
