import { arrow, assertEqual, dot, draw, dynamic, polygon, to } from 'vizmatic/stage';
import { at, captions, frame, plot, point, record } from '../parts.mjs';
import { label, note } from '../../kit-narrated.mjs';

export default function sequentialPolicy(s, c) {
  frame(
    s,
    'Follow the weight through two decisions',
    'Example ticket history',
    'Action likelihood ratios',
  );
  const ratios = [2, 0.5];
  const product = ratios.reduce((a, b) => a * b, 1);
  assertEqual(product, 1, 'Two-step importance weight');
  const m1 = s.value(1),
    m2 = s.value(1);
  const stops = [0.13, 0.5, 0.87];
  const x = stops.map((u) => point(plot, u, 0.5)[0]);
  const mid = point(plot, 0, 0.5)[1],
    unit = plot.height * 0.096;
  const ribbon = dynamic(() => {
    const heights = [1, m1.value, m2.value].map((m) => unit * m);
    return [0, 1].map((i) =>
      polygon(
        [
          [x[i], mid - heights[i]],
          [x[i + 1], mid - heights[i + 1]],
          [x[i + 1], mid + heights[i + 1]],
          [x[i], mid + heights[i]],
        ],
        { fill: 'grid', stroke: 'dim', width: 2 },
      ),
    );
  });
  const histories = ['New ticket', 'Reply drafted', 'In staff queue'].map((name, i) =>
    at(label(name, { size: 35 }), plot, stops[i], 0.16),
  );
  const actions = ['Draft reply', 'Escalate'].map((name, i) =>
    at(label(name, { size: 33 }), plot, (stops[i] + stops[i + 1]) / 2, 0.26),
  );
  const onRibbon = (i) => [x[i], mid];
  const active = dot(14, 'yellow').moveTo(onRibbon(0));
  const forward = (i) => arrow(onRibbon(i), onRibbon(i + 1), { stroke: 'ink', pad: 18, width: 4 });
  const links = [forward(0), forward(1)];
  const back = arrow(point(plot, stops[2], 0.77), point(plot, stops[1], 0.77), {
    stroke: 'yellow',
    width: 5,
  });
  const future = at(label('Future value', { color: 'yellow', size: 35 }), plot, 0.685, 0.86);
  const missing = at(note('Terminal reward missing'), plot, 0.8, 0.85);
  s.add(
    ribbon,
    histories[0],
    stops.map((u) => dot(8, 'dim').moveTo(point(plot, u, 0.5))),
    active,
  );
  const [r1, r2, weight] = record(s, [
    ['Decision 1', 'Target / log'],
    ['Decision 2', 'Target / log'],
    ['Trajectory weight', 'r₁ × r₂', 'yellow'],
  ]);
  const advance = (cue, i) => {
    c.show(cue, [actions[i], draw(links[i])]);
    c.on(cue, () =>
      s.play(
        to(active, (n) => n.moveTo(onRibbon(i + 1))),
        { duration: 0.9 },
      ),
    );
    c.show(cue, histories[i + 1], { lead: -0.9 });
  };
  advance('history', 0);
  advance('trajectory', 1);
  c.after('two', () =>
    s.play(
      m1.to(ratios[0]),
      m2.to(ratios[0]),
      to(active, (n) => n.moveTo(onRibbon(1))),
    ),
  );
  r1(c, 'two', '× ' + ratios[0], true);
  r2(c, 'half', '× ' + ratios[1], true);
  c.after('product', () =>
    s.play(
      m2.to(product),
      to(active, (n) => n.moveTo(onRibbon(2))),
    ),
  );
  weight(c, 'product', String(product), true);
  c.after('identical', () => s.play(m1.to(1), m2.to(1)));
  r1(c, 'identical', '× 1', true);
  r2(c, 'identical', '× 1', true);
  c.show('future', [draw(back), future]);
  c.on('future', () =>
    s.play(
      to(active, (n) => n.moveTo(onRibbon(1))),
      { duration: 1.1 },
    ),
  );
  c.swap('missing', [future, back], missing);
  captions(s, c, 'Ribbon thickness tracks weight.', [
    ['history', 'Drafting a reply changes the history available at the next decision.'],
    ['product', 'The first step doubles the weight and the second halves it.', true],
    ['identical', 'Both ratios equal one.', true],
    ['future', 'The correction at the escalation step includes the value of what follows.'],
    ['missing', 'A missing terminal outcome leaves the trajectory return unknown.'],
  ]);
}
