import {
  assertEqual,
  circle,
  dot,
  line,
  place,
  rect,
  column,
  pipeline,
  segmentedBar,
  table,
  to,
} from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../kit-narrated.mjs';
import {
  SERVICE_CHECK,
  PAIRED,
  INCIDENT_RATES,
} from '../../films/ai-lab-technical-presentation/model.mjs';
import { TALK_BUDGET, PAIR_FIXTURE } from '../../films/ai-lab-technical-presentation/fixtures.mjs';

// The connector is cyan, the reference path is blue, hits are green and lost hits are pink.
// Yellow marks the current decision. Red marks a rejected input or a failed gate.
export const work = area;
export const CASE = {
  sources: 8,
  daysBefore: 20,
  daysAfter: 6,
  oldP95: 720,
  service: SERVICE_CHECK,
  request: 'req-42',
};
assertEqual(CASE.daysBefore - CASE.daysAfter, 14, 'observed difference in onboarding days');
assertEqual(CASE.oldP95 - SERVICE_CHECK.successfulP95Ms, 40, 'observed difference in p95');

export function addTitle(s, c) {
  s.add(heading(c.title));
}
export function caption(region, words, color = 'ink', size = 40) {
  return place(label(words, { color, size }), region);
}
export function readout(region, number, unit, color = 'yellow') {
  return place(
    column([mono(number, { color, size: 62 }), note(unit)], { gap: 'normal', align: 'center' }),
    region,
  );
}
export function track(region, name, max, parts, limit = false) {
  return place(
    segmentedBar(parts, {
      width: region.width * 0.92,
      height: 72,
      size: 34,
      title: name,
      max,
      ...(limit ? { capacity: max } : {}),
      readout: false,
      labels: false,
    }),
    region,
  );
}
export function route(region, stages, options = {}) {
  return place(
    pipeline(stages, { width: region.width * 0.95, size: 36, color: 'cyan', ...options }),
    region,
  );
}
export function ledger(region, columns, rows, options = {}) {
  const room = (region.width * 0.94) / columns.length - 56;
  const fields = columns.map((col) => (typeof col === 'string' ? { key: col, width: room } : col));
  return place(
    table(fields, rows, { width: region.width * 0.96, size: 34, leading: 2.25, ...options }),
    region,
  );
}
export const budgetNames = ['Context', 'Path', 'Decision', 'Evidence', 'Limit', 'Questions'];
export const budget = TALK_BUDGET.map((item, i) => ({
  name: budgetNames[i],
  value: item.value,
  color: i === 5 ? 'yellow' : 'dim',
}));
export const totalMinutes = budget.reduce((sum, part) => sum + part.value, 0);

// Both rehearsals use this ruler. The extra minute makes a late ending visible.
export function rehearsalClock() {
  const [ruler, lower] = work.rows([1.9, 1]);
  const axis = ruler.inset('wide');
  const minute = axis.width / (totalMinutes + 1);
  const y = axis.point('center')[1];
  const height = 90;
  const x = (m) => axis.left + m * minute;
  const at = (m, dy = 0) => [x(m), y + dy];
  const ticks = [0, budget[0].value + budget[1].value, totalMinutes].flatMap((m) => [
    line(at(m, height / 2), at(m, height / 2 + 32), { stroke: 'dim', width: 3 }),
    label(m === totalMinutes ? m + ' min deadline' : m + ' min', { size: 34, color: 'dim' }).moveTo(
      at(m, height / 2 + 70),
    ),
  ]);
  const axisLine = line(at(0, height / 2), at(totalMinutes + 1, height / 2), {
    stroke: 'dim',
    width: 3,
  });
  let elapsed = 0;
  const blocks = budget.map((part) => {
    const center = elapsed + part.value / 2;
    elapsed += part.value;
    const bar = rect(part.value * minute - 5, height - 4, {
      fill: 'surface',
      stroke: part.color,
      width: 3,
      radius: 8,
    }).moveTo(at(center));
    const title = label(part.name, { size: 34, color: part.color }).moveTo(at(center, -19));
    const amount = (value) =>
      label(value + ' min', { size: 32, color: 'ink' }).moveTo(at(center, 21));
    const duration = amount(part.value);
    return { bar, title, duration, nodes: [bar, title, duration] };
  });
  return { lower, at, minute, blocks, ruler: [axisLine, ticks] };
}

export { PAIRED, PAIR_FIXTURE };
export const DNS_QUERY = {
  id: 'query-141',
  runbook: 'DNS',
  baseline: ['TLS', 'Queue', 'Cache', 'Disk', 'DNS', 'Health'],
  candidate: ['TLS', 'Queue', 'Cache', 'Disk', 'Health', 'DNS'],
};
export const outcomes = ['Both hit', 'Lost hit', 'New hit', 'Neither hit'];
export const outcomeColors = ['green', 'pink', 'cyan', 'dim'];
export const outcomeOf = (r) => (r.baseline ? (r.candidate ? 0 : 1) : r.candidate ? 2 : 3);

function dotPosition(region, index, columns, rows, pitch) {
  const [cx, cy] = region.point('center');
  return [
    cx + ((index % columns) - (columns - 1) / 2) * pitch,
    cy + (Math.floor(index / columns) - (rows - 1) / 2) * pitch,
  ];
}

// Each mark represents one frozen query throughout the comparison.
export function pairedBench(region) {
  const [input, matrix] = region.columns([1, 1.65], 'loose');
  const cells = matrix.rows(2, 'normal').flatMap((r) => r.columns(2, 'normal'));
  const halves = cells.map((cell) => cell.rows([1, 4], 'none'));
  const piles = outcomes.map((_, k) =>
    PAIR_FIXTURE.filter((record) => outcomeOf(record) === k).map((record, i) => ({
      record,
      mark: dot(6.5, outcomeColors[k]).moveTo(dotPosition(halves[k][1], i, 14, 10, 18)),
    })),
  );
  const labels = halves.map(([head], k) => caption(head, outcomes[k], 'dim', 32));
  const counted = (k) =>
    caption(halves[k][0], outcomes[k] + '   ' + piles[k].length, outcomeColors[k], 32);
  const frames = cells.map((cell) =>
    place(
      rect(cell.width, cell.height, { radius: 16, stroke: 'gridStrong', fill: null, width: 2 }),
      cell,
    ),
  );
  return {
    input,
    cells,
    labels,
    counted,
    frames,
    piles,
    marks: piles.flat().map(({ mark }) => mark),
  };
}

export const incidents = [
  { count: 5, requests: 5_000_000, rate: INCIDENT_RATES.prior },
  { count: 1, requests: 500_000, rate: INCIDENT_RATES.candidate },
];
for (const d of incidents)
  assertEqual((d.count * 1_000_000) / d.requests, d.rate, 'incidents per million requests');
export function routingDiagram(region) {
  const [labels, old, candidate] = region.rows([1, 1.6, 1.6], 'normal');
  const names = ['Input', 'Execution', 'Destination'];
  const positions = (r) => r.columns(3, 'wide');
  const titles = positions(labels).map((slot, i) => caption(slot, names[i], 'dim', 32));
  const wires = [],
    descriptions = [];
  const lanes = [old, candidate].map((r, i) => {
    const [words, wire] = r.rows([1, 1], 'tight');
    const slots = positions(wire).map((slot) => slot.point('center'));
    wires.push(
      line(slots[0], slots[2], { stroke: 'gridStrong', width: 4 }),
      ...slots.map((p) =>
        circle(12, { stroke: i ? 'cyan' : 'blue', fill: 'surface', width: 3 }).moveTo(p),
      ),
    );
    const names = positions(words);
    descriptions.push(
      caption(names[1], i ? 'Candidate path' : 'Old path', i ? 'cyan' : 'blue', 38),
    );
    return { slots, names };
  });
  const packet = (lane, station = 0, color) =>
    dot(15, color ?? (lane ? 'cyan' : 'blue')).moveTo(lanes[lane].slots[station]);
  const travel = (token, lane, station) =>
    to(token, (n) => n.moveTo(lanes[lane].slots[station]), { duration: 0.85 });
  return { nodes: [titles, wires, descriptions], lanes, packet, travel };
}
