import { requiredPacking } from '../arithmetic.mjs';
import { caseClock, casePage } from '../case-file.mjs';
import { sources } from '../fixtures.mjs';

const trace = sources['trace-17'];
const routes = { [trace.path]: 'Identity' };
const owners = { Identity: 'Access team' };
const service = routes[trace.path];
const capacity = 600;
const log = { id: 'Error log', units: 600, priority: 2, required: false };
const map = { id: 'Route map', units: 300, priority: 1, required: false };
const directory = { id: 'Service directory', units: 300, priority: 1, required: false };
const greedy = requiredPacking([log, map, directory], capacity);
const bundle = requiredPacking([map, directory], capacity);

function allocation(page, packet, x, progress, colors) {
  const { text, box, C } = page;
  const width = 720;
  box(x, 370, width, 96, C.panel, C.muted);
  for (const item of packet.events.filter((event) => event.fits)) {
    const start = (item.before / packet.budget) * width;
    const filled = Math.min(item.units, Math.max(0, progress * packet.used - item.before));
    if (filled === 0) continue;
    box(x + start, 370, (filled / packet.budget) * width, 96, colors[item.id]);
    if (filled === item.units)
      text(
        String(item.units),
        x + start + ((item.units / packet.budget) * width) / 2,
        436,
        45,
        C.bg,
        'center',
        'mono',
      );
  }
}

export function drawPackerLimits(ctx, scene, state, api) {
  const page = casePage(ctx, api);
  const { text, box, rule, focus, C } = page;
  const clock = caseClock(scene, state);
  const colors = { [log.id]: C.blue, [map.id]: C.yellow, [directory.id]: C.green };
  focus('ce-packer-limits-mechanism', () => {
    if (state.beat === 2) {
      const smallerBudget = 500;
      text('Required together', 150, 325, 41);
      text(map.id + ' + ' + directory.id, 150, 440, 55, C.ink, 'left', 'serif');
      const x = 150,
        y = 545,
        scale = 2.3;
      box(x, y, bundle.used * scale, 102, C.panel);
      box(x, y, map.units * scale - 2, 102, C.yellow);
      box(x + map.units * scale, y, directory.units * scale, 102, C.green);
      const limit = x + smallerBudget * scale;
      rule(limit, y - 39, limit, y + 125, C.pink, 5);
      text('Budget  ' + smallerBudget, limit, y - 57, 33, C.pink, 'center');
      text('Pair  ' + bundle.used, x + bundle.used * scale, y + 171, 38, C.ink, 'right');
      if (clock.done('ce-packer-limits-3') && bundle.used > smallerBudget)
        text('Request held. Keep both links when extracting shorter entries.', x, 904, 42, C.pink);
      return;
    }

    const single = clock.progress('ce-packer-single');
    const pair = clock.progress('ce-packer-pair');
    const answered = clock.done('ce-packer-limits-2');
    text('First by priority', 150, 317, 41, C.blue);
    text('Two records for the same ' + capacity + ' units', 1040, 317, 40, C.ink);
    allocation(page, greedy, 150, single, colors);
    allocation(page, bundle, 1040, pair, colors);

    if (single === 1) {
      text(log.id, 150, 558, 34, C.blue);
      text(trace.path + '   HTTP ' + trace.status, 150, 630, 49, C.ink, 'left', 'mono');
    }
    if (pair > 0.5) {
      text(map.id, 1040, 558, 34, C.yellow);
      text(trace.path + '   →   ' + service, 1040, 630, 44);
    }
    if (pair === 1) {
      text(directory.id, 1040, 710, 34, C.green);
      text(service + '   →   ' + owners[service], 1040, 782, 44);
      const result = answered ? 'Page the ' + owners[service] + '.' : 'Which team gets the page?';
      text(result, 150, 900, 61, answered ? C.green : C.ink, 'left', 'serif');
    }
    if (clock.done('ce-packer-bundle')) {
      rule(1001, 529, 1001, 790, C.green, 4);
      rule(1001, 529, 1020, 529, C.green, 4);
      rule(1001, 790, 1020, 790, C.green, 4);
      text('Keep both links together', 1040, 896, 34, C.green);
    }
  });
}
export default {
  id: 'packer-limits',
  draw: drawPackerLimits,
  cues: [
    'ce-packer-limits-1',
    'ce-packer-single',
    'ce-packer-pair',
    'ce-packer-limits-2',
    'ce-packer-bundle',
    'ce-packer-limits-3',
  ],
};
