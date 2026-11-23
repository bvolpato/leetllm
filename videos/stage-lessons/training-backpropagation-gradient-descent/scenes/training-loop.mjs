import {
  boxOf,
  column,
  decimal,
  dot,
  dynamic,
  line,
  numberLine,
  place,
  rect,
  steps,
} from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { updated } from '../parts.mjs';
export default function trainingLoop(s, c) {
  const [top, body, foot] = area.rows([1, 4, 2], 'loose');
  const strip = place(
    steps(['clear', 'forward', 'loss', 'backward', 'step'], {
      width: top.width,
      current: 0,
      size: 36,
    }),
    top,
  );
  const cols = body.columns(3, 'loose');
  const w = s.value(1),
    g = s.value(-8),
    saved = s.value(0),
    hasGrad = s.value(1);
  const params = place(
    column(
      [
        label('parameters'),
        decimal(() => w.value, { prefix: 'w = ', digits: 1, size: 58, color: 'blue' }),
        mono('fixed until step', { size: 34 }),
      ],
      { gap: 'wide' },
    ),
    cols[0],
    'top',
  );
  const graph = place(
    column(
      [
        label('saved graph'),
        decimal(() => saved.value, { prefix: 'ready ', digits: 0, size: 58, color: 'cyan' }),
        note('Latest forward: saved tensors'),
      ],
      { gap: 'wide' },
    ),
    cols[1],
    'top',
  );
  const buffer = place(
    column(
      [
        label('gradient buffer'),
        dynamic(() =>
          mono(hasGrad.value ? String(g.value) : 'None', { size: 65, color: 'yellow' }),
        ),
        mono('step leaves it in place', { size: 34 }),
      ],
      { gap: 'wide' },
    ),
    cols[2],
    'top',
  );
  const comparison = foot.columns(2, 'wide');
  const retained = 2,
    momentum = 0.9,
    rate = 0.1,
    initialV = 1;
  const wouldStep = initialV - rate * momentum * retained;
  const none = place(
    column([
      note('Unused v  ·  old momentum 2  ·  gradient None'),
      mono('skip v     1 → 1', { size: 46, color: 'cyan' }),
    ]),
    comparison[0],
  );
  const [condition, calculation, result] = comparison[1].rows(3, 'tight');
  const zero = place(note('Same v  ·  old momentum 2  ·  gradient 0'), condition);
  const settings = place(mono('momentum 0.9   rate 0.1', { size: 36 }), calculation);
  const pending = place(mono('v   1 → ?', { size: 46, color: 'yellow' }), result);
  const carry = place(mono('0.9 × 2 + 0 = 1.8', { size: 36 }), calculation);
  const moved = place(
    mono('v   1 → ' + wouldStep.toFixed(2), { size: 46, color: 'yellow' }),
    result,
  );
  const evaluation = s.value(0),
    recording = s.value(1),
    transit = s.value(0);
  const [controlsRegion, dropoutRegion] = foot.columns([2, 3], 'loose');
  const controls = controlsRegion.rows(2, 'normal');
  const switches = controls.map((region, i) => {
    const [words, trackRegion] = region.columns([3, 1], 'normal');
    const wordsNode = place(note(i === 0 ? 'mode: train / eval' : 'record: off / on'), words);
    const track = place(
      rect(trackRegion.width * 0.8, 36, { fill: 'surface', stroke: 'grid' }),
      trackRegion,
    );
    const knob = dynamic(() => {
      const value = i === 0 ? evaluation.value : recording.value;
      const bounds = boxOf(track);
      return dot(12, i === 0 ? 'green' : 'cyan').moveTo([
        bounds.left + 18 + (bounds.width - 36) * value,
        bounds.point('center')[1],
      ]);
    });
    return [wordsNode, track, knob];
  });
  const [dropoutHead, dropoutBody] = dropoutRegion.rows([1, 3], 'normal');
  const dropoutName = place(note('Same input → dropout paths'), dropoutHead);
  const lanes = dropoutBody.rows(3, 'normal');
  const paths = dynamic(() =>
    lanes.flatMap((region, i) => {
      const open = i !== 1 || evaluation.value > 0.5;
      const a = region.point('left'),
        b = region.point('right');
      const mid = region.point('center');
      const color = open ? 'green' : 'dim';
      return [
        line(a, [mid[0] - 18, mid[1]], { stroke: color, width: 4 }),
        line([mid[0] + 18, mid[1]], b, { stroke: color, width: 4 }).opacity(open ? 1 : 0.15),
        line([mid[0] - 18, mid[1]], [mid[0] + 18, mid[1] - (open ? 0 : 20)], {
          stroke: color,
          width: 4,
        }),
        dot(8, 'cyan')
          .moveTo([a[0] + (b[0] - a[0]) * transit.value, a[1]])
          .opacity(transit.value > 0 && transit.value < 1 && (open || transit.value < 0.5) ? 1 : 0),
      ];
    }),
  );
  const modePicture = [switches, dropoutName, paths];
  const sendRequest = () => {
    transit.set(0);
    s.play(transit.to(1, { duration: 1.2 }));
  };
  const slots = cols.map((r) => r.rows([3, 1], 'wide')[1]);
  const parameterRuler = place(
    numberLine({ range: [0, 2.5], ticks: [0, 1, 2], length: slots[0].width * 0.65, labels: false }),
    slots[0],
  );
  const weightMark = dynamic(() =>
    dot(12, 'blue').moveTo([
      parameterRuler.get('x') + ((w.value - 1.25) / 2.5) * parameterRuler.length,
      parameterRuler.get('y') - 16,
    ]),
  );
  const graphRegions = slots[1].columns(3, 'wide');
  const graphDots = graphRegions.map((r) => r.point('center'));
  const savedGraph = dynamic(() => [
    ...graphDots.map((p) => dot(12, 'cyan').moveTo(p).opacity(saved.value)),
    ...graphDots
      .slice(1)
      .map((p, i) => line(graphDots[i], p, { stroke: 'cyan', width: 4 }).opacity(saved.value)),
  ]);
  const frame = place(
    rect(slots[2].width * 0.65, 48, { stroke: 'grid', fill: 'surface' }),
    slots[2],
  );
  const fill = dynamic(() =>
    rect(Math.max(1, (boxOf(frame).width * Math.abs(g.value) * hasGrad.value) / 8), 36, {
      fill: 'yellow',
      stroke: 'yellow',
    }).moveTo(boxOf(frame).point('center')),
  );
  s.add(
    heading(c.title),
    strip,
    params,
    graph,
    buffer,
    parameterRuler,
    weightMark,
    savedGraph,
    frame,
    fill,
  );
  const clear = () => {
    hasGrad.set(0);
    g.set(0);
  };
  c.on('loop-clear', () => {
    clear();
    s.play(strip.go(0));
  });
  c.on('loop-forward', () => {
    saved.set(1);
    s.play(strip.go(1));
  });
  c.on('loop-loss', () => s.play(strip.go(2)));
  c.on('loop-backward', () => {
    hasGrad.set(1);
    g.set(-8);
    s.play(strip.go(3));
  });
  c.on('loop-release', () => saved.set(0));
  c.on('loop-step', () => {
    w.set(updated.weight);
    s.play(strip.go(4));
  });
  c.show('loop-none', none);
  c.show('loop-zero-question', [zero, settings, pending], { lead: 0 });
  c.swap('loop-momentum', settings, carry);
  c.swap('loop-zero', pending, moved, { after: true });
  c.on('loop-next', () => {
    clear();
    s.play(strip.go(0));
  });
  c.swap('loop-eval', [none, zero, carry, moved], modePicture);
  c.on(
    'loop-eval',
    () => {
      s.play(evaluation.to(1, { duration: 0.5 }));
    },
    0.6,
  );
  c.on('loop-dropout', () => {
    s.play(strip.go(1));
    saved.set(1);
    sendRequest();
  });
  c.on('loop-no-grad', () => {
    recording.set(0);
    saved.set(0);
    sendRequest();
  });
  c.on('loop-return', () => {
    recording.set(1);
    evaluation.set(0);
    saved.set(1);
    sendRequest();
  });
}
