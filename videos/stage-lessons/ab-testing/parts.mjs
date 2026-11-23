import {
  assertEqual,
  axes,
  column,
  dot,
  dynamic,
  group,
  line,
  place,
  rect,
  row,
  unitChart,
} from 'vizmatic/stage';
import { area, chip, label, mono, note } from '../kit-narrated.mjs';
import { report } from '../../films/ab-testing/fixtures.mjs';
import { lift, liftInterval, seLift, groundingPacket } from '../../films/ab-testing/model.mjs';

export { report, lift, liftInterval, seLift, groundingPacket };
export const COLOR = {
  control: 'cyan',
  treatment: 'blue',
  resolved: 'green',
  focus: 'yellow',
  failure: 'red',
};
export const [BODY, FOOT] = area.rows([8, 1], 'normal');
export const [BOARD, SIDE] = BODY.columns([2, 3], 'loose');
export const UNIT = 20;
export const ARMS = [report.control, report.treatment];
assertEqual(report.control.n / UNIT, 100, 'control tiles');
assertEqual(report.treatment.n / UNIT, 100, 'treatment tiles');
assertEqual(report.control.resolved / UNIT, 38, 'resolved control tiles');
assertEqual(report.treatment.resolved / UNIT, 42, 'resolved treatment tiles');
export const ORDER = [
  'intro',
  'randomize',
  'unit-and-interference',
  'metric',
  'event-maturity',
  'lift',
  'independent-units',
  'power',
  'power-and-decision',
  'srm',
  'peeking',
  'alpha-spending',
  'mixture-evidence',
  'cuped-adjustment',
  'bandit-routing',
  'paired-prompts',
  'evaluation-stack',
  'guardrails',
  'decision',
  'takeaway',
  'fresh-grounding',
];
export const STATE = Object.fromEntries(ORDER.map((id, i) => [id, { mature: i >= 5 }]));

// These two populations stay in the same places throughout the film.
export function experiment(s, mature = false, heading = 'Incident assistant') {
  const [head, names, fields, counts, path] = BOARD.rows([48, 134, 264, 41, 189], 'normal');
  const title = place(label(heading), head);
  const columns = names.columns(2, 'normal');
  const grids = fields.columns(2, 'normal');
  const readings = counts.columns(2, 'normal');
  const namesOn = [
    place(
      column(
        [label('control', { color: COLOR.control }), chip('raw query', { color: COLOR.control })],
        { gap: 'tight' },
      ),
      columns[0],
    ),
    place(
      column(
        [
          label('treatment', { color: COLOR.treatment }),
          chip('rewrite', { color: COLOR.treatment }),
        ],
        { gap: 'tight' },
      ),
      columns[1],
    ),
  ];
  const tiles = ARMS.map((arm, i) =>
    place(
      unitChart(
        [
          { count: arm.resolved / UNIT, color: 'green' },
          { count: (arm.n - arm.resolved) / UNIT, color: 'dim' },
        ],
        { columns: 10, cell: 21, gap: 6, shape: 'square', plain: !mature, plainColor: 'dim' },
      ),
      grids[i],
    ),
  );
  const pending = ARMS.map((_, i) => place(note('outcomes pending'), readings[i]));
  const rates = ARMS.map((arm, i) =>
    place(
      mono(`${arm.resolved} / ${arm.n}`, { size: 34, color: i ? 'blue' : 'cyan' }),
      readings[i],
    ),
  );
  const route = place(
    column(
      [
        note('One tile represents 20 incidents.'),
        row([chip('same runbook'), chip('same model')], { gap: 'normal' }),
        note('One deliberate change: query policy.'),
      ],
      { gap: 'normal', align: 'center' },
    ),
    path,
  );
  const standing = [title, ...namesOn, ...tiles, ...(mature ? rates : pending), route];
  return { title, tiles, rates, pending, standing, after: [title, ...namesOn, ...tiles, ...rates, route] };
}

// A shared interval picture follows live endpoints on a fixed percentage-point scale.
export function interval(
  s,
  region,
  {
    min = -2,
    max = 10,
    estimate = 4,
    low = 1,
    high = 7,
    budget = 0,
    spread = 0,
    color = 'yellow',
    ticks = 2,
  } = {},
) {
  const [caption, plot, reading] = region.rows([1, 4, 1], 'normal');
  const values = {
    estimate: s.value(estimate),
    low: s.value(low),
    high: s.value(high),
    spread: s.value(spread),
  };
  const axis = place(
    axes({
      x: [min, max],
      y: [0, 1],
      width: plot.width * 0.86,
      height: plot.height * 0.7,
      xStep: ticks,
      labels: false,
      tips: false,
    }),
    plot,
  );
  const ticksOn = [];
  for (let x = Math.ceil(min / ticks) * ticks; x <= max; x += ticks) {
    const point = axis.world(x, 0);
    ticksOn.push(mono(String(x), { size: 34, color: 'dim' }).moveTo([point[0], point[1] + 34]));
  }
  const rule = line(axis.world(budget, 0), axis.world(budget, 1), {
    stroke: 'red',
    width: 3,
    dash: [9, 9],
  });
  const band = dynamic(() => {
    const lo =
      values.estimate.value + (values.low.value - values.estimate.value) * values.spread.value;
    const hi =
      values.estimate.value + (values.high.value - values.estimate.value) * values.spread.value;
    return [
      line(axis.world(lo, 0.5), axis.world(hi, 0.5), { stroke: color, width: 9 }),
      dot(12, color).moveTo(axis.world(values.estimate.value, 0.5)),
      ...[lo, hi].map((x) =>
        line(axis.world(x, 0.43), axis.world(x, 0.57), { stroke: color, width: 4 }),
      ),
    ];
  });
  const unit = place(note('percentage points'), reading);
  const header = place(
    label(budget === 0 ? 'Resolution lift' : 'Grounding failure change'),
    caption,
  );
  return {
    ...values,
    axis,
    rule,
    band,
    frame: [header, axis, ticksOn, rule, unit],
    caption,
    reading,
  };
}

// An incident clock measures the outcome window, rather than a decorative progress bar.
export function deadline(s, region, names = ['usable', 'page at deadline', 'page later']) {
  const [top, plot, foot] = region.rows([1, 5, 1], 'normal');
  const clock = s.value(0);
  const axis = place(
    axes({
      x: [0, 20],
      y: [0, names.length + 1],
      width: plot.width * 0.82,
      height: plot.height * 0.76,
      labels: false,
      tips: false,
    }),
    plot,
  );
  const labels = names.map((name, i) =>
    label(name, { size: 34, color: 'dim' }).moveTo(axis.world(5, names.length - i + 0.35)),
  );
  const tracks = names.map((_, i) =>
    line(axis.world(0, names.length - i), axis.world(20, names.length - i), {
      stroke: 'grid',
      width: 3,
    }),
  );
  const edge = line(axis.world(10, 0), axis.world(10, names.length + 0.1), {
    stroke: 'yellow',
    width: 4,
    dash: [10, 8],
  });
  const marks = [0, 8, 10, 18, 20].map((x) =>
    mono(String(x), { size: 34, color: x === 10 ? 'yellow' : 'dim' }).moveTo([
      axis.world(x, 0)[0],
      axis.world(x, 0)[1] + 40,
    ]),
  );
  const now = dynamic(() =>
    names.map((_, i) =>
      dot(10, clock.value < 10 ? 'dim' : i === 1 ? 'red' : 'green').moveTo(
        axis.world(clock.value, names.length - i),
      ),
    ),
  );
  const title = place(label('Ten-minute outcome window'), top);
  const unit = place(note('minutes after enrollment'), foot);
  return { clock, axis, edge, now, frame: [title, axis, labels, tracks, edge, marks, unit] };
}

export const [GATE_TOP, GATE_PLOT, GATE_BOTTOM] = SIDE.rows([1.5, 4, 1.5], 'wide');
export const BUDGET = { grounding: 0.5, latency: 150, observedLift: 2 };
export function groundingGate(s, visible = false, failures = report.treatment.groundingFailures) {
  const packet = groundingPacket(failures);
  const picture = interval(s, GATE_PLOT, {
    min: -1,
    max: 1.5,
    ticks: 0.5,
    budget: BUDGET.grounding,
    estimate: packet.delta * 100,
    low: packet.low * 100,
    high: packet.upper * 100,
    spread: visible ? 1 : 0,
  });
  const budget = place(note('Upper endpoint must stay below +0.50 pp.'), GATE_BOTTOM, 'top');
  return { ...picture, packet, kept: [...picture.frame, picture.band, budget], budget };
}
