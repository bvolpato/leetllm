// Scene `actual-wasm-host`: what the real host accepts, and what it returns.
//
// The picture: the guest is the box at the left, with one export, no door and one memory. At the
// right, first three gauges with three units. Then the values of an i32 as a ring: add-one is one
// step clockwise, and at the seam the largest value steps to the smallest. Then the three steps of
// the host in the wrong order, and the same strip in the right order.
import {
  assertEqual,
  boxOf,
  circle,
  column,
  commas,
  dot,
  dynamic,
  grid,
  indicate,
  moveTo,
  pictogram,
  place,
  recolor,
  row,
  seq,
} from 'vizmatic/stage';
import { addI32 } from '../../../films/sandbox-execution/arithmetic.mjs';
import { area, chip, heading, label, mono, note } from '../../kit-narrated.mjs';
import { COLOR, tintChip, wall } from '../parts.mjs';

/** The defaults of the embedding that the voice names: fuel units, bytes of guest memory, bytes of text. */
const DEFAULTS = [
  { cue: 'wh-fuel', name: 'Fuel', value: 1000, unit: 'units', applies: 'Metered guest work' },
  {
    cue: 'wh-bytes',
    name: 'Linear memory',
    value: 65536,
    unit: 'bytes',
    applies: 'One guest page',
  },
  {
    cue: 'wh-text',
    name: 'Module text',
    value: 4096,
    unit: 'bytes',
    applies: 'Input to the compiler',
  },
];
const MAX = 2 ** 31 - 1;
/** Where a value is on the ring, in degrees from the right, clockwise. The ring is not to scale. */
const ANGLE = { zero: -90, minusOne: -110, fortyOne: -52, fortyTwo: -32, max: 78, min: 102 };
const signed = (value) => (value < 0 ? `-${commas(-value)}` : commas(value));

export default function actualWasmHost(s, c) {
  assertEqual(addI32(41), 42, 'add-one of 41');
  assertEqual(addI32(-1), 0, 'add-one of -1');
  const wrapped = addI32(MAX);
  assertEqual(wrapped, -(2 ** 31), 'add-one of the largest i32 wraps');

  // The frame: the guest and the oracle at the left, and the work of the host at the right.
  const [leftSide, work] = area.columns([7, 13], 'wide');
  const [guestBox, oracleBox] = leftSide.inset('none', 'tight').rows([7, 3], 'wide');
  const paint = (name, color, options = {}) => chip(name, { color, stroke: color, ...options });

  // The guest: one function, no import, one memory. And two calls that the host checks first.
  const guestWall = wall(guestBox, 'Wasm guest');
  const exported = paint('run: i32 -> i32', COLOR.candidate, { font: 'mono' });
  const validated = pictogram('check', { size: 44, accent: COLOR.pass });
  const facts = [
    [note('imports'), paint('none', COLOR.quiet, { dash: [8, 6] })],
    [note('memory'), paint('at most 1', COLOR.candidate)],
  ];
  const calls = [
    [
      mono('run(41)', { size: 30, color: COLOR.candidate }),
      note('accepted', { color: COLOR.pass }),
    ],
    [
      mono('run(True)', { size: 30, color: COLOR.candidate }),
      note('rejected', { color: COLOR.host }),
    ],
  ];
  const python = note('in Python, True == 1');
  place(
    column(
      [
        row([exported, validated], { gap: 'normal', align: 'center' }),
        grid(facts.flat(), { columns: 2, gap: ['normal', 'tight'] }),
        grid(calls.flat(), { columns: 2, gap: ['normal', 'tight'] }),
        python,
      ],
      { gap: 'normal' },
    ),
    guestBox.inset('normal', 36),
    'top left',
  );
  const oracleWall = wall(oracleBox, 'validator', { color: COLOR.pass });
  const oracle = place(
    paint('oracle: the expected value', COLOR.pass),
    oracleBox.inset('normal', 36),
    'left',
  );

  // Each budget has its own unit and belongs to a different resource.
  const limits = DEFAULTS.map((entry, i) => {
    const band = work.rows(DEFAULTS.length + 1, 'normal')[i];
    const [nameBand, valueBand, refersBand] = band.columns([4, 5, 6], 'normal');
    return {
      ...entry,
      refers: place(note(entry.applies), refersBand, 'left'),
      label: place(label(entry.name, { size: 36 }), nameBand, 'left'),
      size: place(
        mono(`${commas(entry.value)} ${entry.unit}`, { size: 34, color: COLOR.host }),
        valueBand,
        'left',
      ),
    };
  });
  const separate = place(
    label('three resources, three limits', { size: 36, color: COLOR.mark }),
    work.rows(DEFAULTS.length + 1, 'normal')[3],
    'left',
  );

  s.add(
    heading(c.title),
    guestWall,
    exported,
    ...limits.flatMap((entry) => [entry.label, entry.size]),
  );

  c.on('wh-signature', () => s.play(indicate(exported, { color: COLOR.mark, duration: 1.4 })));
  c.show('wh-imports', facts[0]);
  c.show('wh-memory', facts[1]);
  c.show('wh-strict', calls[0]);
  c.show('wh-bool', calls[1]);
  c.show('wh-python', python);
  limits.forEach((entry) => {
    c.show(entry.cue, entry.refers);
    c.on(entry.cue, () =>
      s.play(indicate(entry.size, { color: COLOR.mark, scale: 1, duration: 0.8 })),
    );
  });
  c.show('wh-separate', separate);

  // Beat 1: the ring of i32 values. Add-one is one step clockwise.
  const first = [...limits.flatMap((entry) => [entry.label, entry.refers, entry.size]), separate];
  const [ringBox, readBox] = work.columns([5, 4], 'wide');
  const center = [ringBox.cx, ringBox.cy - 24];
  const radius = Math.min(ringBox.width, ringBox.height) / 2 - 72;
  const on = (degrees, r = radius) => [
    center[0] + r * Math.cos((degrees * Math.PI) / 180),
    center[1] + r * Math.sin((degrees * Math.PI) / 180),
  ];
  const ring = circle(radius, { stroke: COLOR.quiet, width: 4, fill: null }).at(
    center[0],
    center[1],
  );
  const marks = Object.values(ANGLE).map((degrees) => dot(8, COLOR.quiet).moveTo(on(degrees)));
  const out = (words, degrees) => mono(words, { size: 30 }).moveTo(on(degrees, radius + 44));
  const names = {
    zero: out('0', ANGLE.zero),
    minusOne: out('-1', ANGLE.minusOne),
    fortyOne: out('41', ANGLE.fortyOne),
    fortyTwo: out('42', ANGLE.fortyTwo),
    max: mono(signed(MAX), { size: 30 }),
    min: mono(signed(wrapped), { size: 30 }),
  };
  // The two ends of the range are under the ring, at the two sides of the seam.
  names.max.moveTo([center[0] + 20 + boxOf(names.max).width / 2, center[1] + radius + 52]);
  names.min.moveTo([center[0] - 20 - boxOf(names.min).width / 2, center[1] + radius + 52]);
  const ringName = label('the values of an i32', { size: 34, color: COLOR.quiet }).moveTo(center);
  // One runner for each call: it goes from the argument to the result, along the ring.
  const runner = (from, to) => {
    const turn = s.value(from);
    return { turn, to, node: dynamic(() => dot(13, COLOR.mark).moveTo(on(turn.value))) };
  };
  const runs = [
    runner(ANGLE.fortyOne, ANGLE.fortyTwo),
    runner(ANGLE.minusOne, ANGLE.zero),
    runner(ANGLE.max, ANGLE.min),
  ];
  const step = (run) => run.turn.to(run.to, { duration: 0.9 });
  const lines = [
    mono('run(41) = 42', { size: 30 }),
    mono('run(-1) = 0', { size: 30 }),
    mono(`run(${signed(MAX)})`, { size: 30 }),
    mono(`= ${signed(wrapped)}`, { size: 30, color: COLOR.mark }),
  ];
  const contract = paint('the task contract decides', COLOR.host);
  place(column([...lines, contract], { gap: 'normal' }), readBox, 'left');
  c.swap(1, first, [ring, ...marks, ...Object.values(names), ringName]);
  c.show('wh-41', runs[0].node);
  c.on('wh-41', () => s.play(step(runs[0])));
  c.show('wh-41', lines[0], { after: true });
  c.show('wh-minus', runs[1].node);
  c.on('wh-minus', () => s.play(step(runs[1])));
  c.show('wh-minus', lines[1], { after: true });
  c.show('wh-largest', [runs[2].node, lines[2]]);
  c.on('wh-largest', () => s.play(recolor(names.max, COLOR.mark, { duration: 0.4 })));
  c.on('wh-wraps', () =>
    s.play(
      runs[2].turn.to(runs[2].to, { duration: 1.4 }),
      recolor(names.min, COLOR.mark, { duration: 1.4 }),
    ),
  );
  c.show('wh-wraps', lines[3], { after: true });
  c.show('wh-contract', contract);
  c.show('wh-validates', validated);
  c.show('wh-oracle', [oracleWall, oracle]);

  // Beat 2: fuel is set before the module starts.
  const second = [
    ring,
    ...marks,
    ...Object.values(names),
    ringName,
    ...runs.map((run) => run.node),
    ...lines,
    contract,
  ];
  const [orderBand, budgetBand, hostBand] = work.rows([4, 3, 3], 'normal');
  const slots = orderBand.columns(3, 'normal');
  const steps = ['instantiate', 'set fuel', 'call run'].map((name, i) =>
    place(paint(name, i === 1 ? COLOR.host : COLOR.candidate, { font: 'mono' }), slots[i], 'left'),
  );
  const startRuns = place(
    note('a start function runs here', { color: COLOR.fail }),
    slots[0],
    'bottom left',
  );
  const places = steps.map((made) => boxOf(made).point());
  const widthOf = steps.map((made) => boxOf(made).width);
  const leftOf = (i) => boxOf(slots[i]).left;
  const fuel = label(`One store   /   ${commas(DEFAULTS[0].value)} fuel units`, {
    size: 44,
    color: COLOR.host,
  });
  const shared = mono('start()     run(i32)', { size: 38, color: COLOR.candidate });
  place(column([fuel, shared], { gap: 'normal', align: 'left' }), budgetBand, 'left');
  const clock = label('Watchdog   /   elapsed time', { size: 44, color: COLOR.host });
  const costs = note('Host work includes compilation and engine allocations');
  const hostLimits = note('Host limits: CPU and memory', { color: COLOR.host });
  place(column([clock, costs, hostLimits], { gap: 'normal', align: 'left' }), hostBand, 'left');
  c.swap(2, second, [...steps, startRuns]);
  // The repair: the fuel is set first, and the module starts under it. The step goes over the other one.
  const over = [(places[0][0] + places[1][0]) / 2, places[1][1] - 96];
  c.after('wh-before', () =>
    s.play(
      seq(
        moveTo(steps[1], over, { duration: 0.55 }),
        moveTo(steps[1], [leftOf(0) + widthOf[1] / 2, places[1][1]], { duration: 0.55 }),
      ),
      moveTo(steps[0], [leftOf(1) + widthOf[0] / 2, places[0][1]], { duration: 1.1 }),
      moveTo(startRuns, [leftOf(1) + boxOf(startRuns).width / 2, boxOf(startRuns).cy], {
        duration: 1.1,
      }),
    ),
  );
  c.on('wh-start', () =>
    s.play(recolor(startRuns, COLOR.pass, { duration: 0.5 }), ...tintChip(steps[0], COLOR.mark)),
  );
  c.show('wh-work', [fuel, shared]);
  c.show('wh-clock', clock);
  c.show('wh-host', costs);
  c.show('wh-supervision', hostLimits);
}
