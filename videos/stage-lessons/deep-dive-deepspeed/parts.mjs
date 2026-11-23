import { assertEqual, boxOf, dynamic, fade, line, place, rect } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../kit-narrated.mjs';
import { stateLedger } from '../../films/deep-dive-deepspeed/arithmetic.mjs';

// Blue is parameters, cyan is gradients, pink is Adam state, and green is valid progress.
// Yellow marks the current operation. Red marks a failed condition. Dim marks structure.
export const COLORS = ['blue', 'cyan', 'pink'];
export const [WORK, MEMORY] = area.rows([5, 3], 'wide');
export const ORDER = [
  'intro',
  'ownership',
  'dtype-ledger',
  'reduce',
  'token-objective',
  'accumulation',
  'managed-unmanaged',
  'bucket-units',
  'gather',
  'padded-gather',
  'parameter-coordination',
  'ring-volume',
  'coalesced-reduction',
  'offload',
  'offload-domains',
  'engine-source',
  'checkpoint',
  'checkpoint-contract',
  'topology-conversion',
  'project-context',
  'synthesis',
  'late-gradient',
  'fresh-plan',
];
const GRADIENT_BYTES = 4;
const PARAMS_BILLION = 1.5;
const RANKS = 4;
export const WIDE_LEDGER = [
  (PARAMS_BILLION * 2) / RANKS,
  (PARAMS_BILLION * GRADIENT_BYTES) / RANKS,
  (PARAMS_BILLION * 12) / RANKS,
];
assertEqual(
  WIDE_LEDGER.reduce((a, b) => a + b, 0),
  6.75,
  'FP32 gradient stage-three ledger',
);
const fullFrame = new Set([
  'intro',
  'ownership',
  'reduce',
  'gather',
  'padded-gather',
  'ring-volume',
  'offload',
  'late-gradient',
  'fresh-plan',
]);

// This segmented ledger is a lesson drawing because the linked head has no segmented-bar API.
export function ledger(s, from, original = false) {
  const values = from.map((v) => s.value(v));
  const [scope, key, ...ranks] = MEMORY.rows([0.75, 0.75, 1, 1, 1, 1], 'tight');
  const names = ['weights', 'gradients', 'Adam + master'];
  const keys = key.columns([1, 1, 1, 1], 'normal');
  const nodes = names.map((name, i) => place(note(name, { color: COLORS[i] }), keys[i], 'left'));
  nodes.push(place(note('16 GB · no offload'), keys[3], 'right'));
  nodes.push(place(note('Reference model · persistent GB per rank · 4 data ranks'), scope));
  ranks.forEach((region, rank) => {
    const [name, bar, total] = region.columns([1, 14, 2], 'normal');
    nodes.push(place(mono(`R${rank}`, { size: 30 }), name, 'left'));
    const frame = place(rect(bar.width, 30, { fill: 'surface', stroke: 'grid' }), bar);
    const scale = bar.width / 30;
    const mid = bar.point('center');
    nodes.push(frame);
    nodes.push(
      dynamic(() => {
        let used = 0;
        return values.map((value, i) => {
          const width = Math.max(0.001, value.value * scale);
          const node = rect(width, 30, { fill: COLORS[i], stroke: COLORS[i] }).moveTo([
            bar.left + used * scale + width / 2,
            mid[1],
          ]);
          used += value.value;
          return node;
        });
      }),
    );
    nodes.push(
      dynamic(() => {
        const optimizerStart = bar.left + (values[0].value + values[1].value) * scale;
        const arrayWidth = (values[2].value * scale) / 3;
        return [1, 2].map((index) => {
          const x = optimizerStart + index * arrayWidth;
          return line([x, mid[1] - 15], [x, mid[1] + 15], { stroke: 'surface', width: 3 }).opacity(
            arrayWidth > 2 ? 1 : 0,
          );
        });
      }),
    );
    const capacity = bar.left + 16 * scale;
    nodes.push(line([capacity, mid[1] - 21], [capacity, mid[1] + 21], { stroke: 'ink', width: 3 }));
    const anchor = place(mono('00.00 GB', { size: 30 }), total, 'right');
    nodes.push(
      dynamic(() =>
        mono(`${values.reduce((a, v) => a + v.value, 0).toFixed(2)} GB`, {
          size: 30,
          color: values.reduce((a, v) => a + v.value, 0) > 16 ? 'red' : 'ink',
        }).moveTo(boxOf(anchor).point('center')),
      ),
    );
  });
  if (original) nodes.forEach((node) => node.opacity(0.4));
  return { nodes, values };
}

export function open(s, c, id) {
  const index = ORDER.indexOf(id);
  const originalScenes = new Set(['offload', 'offload-domains']);
  const previous = index ? ORDER[index - 1] : 'start';
  const startingState = id === 'dtype-ledger' ? stateLedger(3).parts : WIDE_LEDGER;
  const b = ledger(s, startingState, originalScenes.has(previous));
  s.add(heading(c.title));
  if (index && !fullFrame.has(previous)) c.take(b.nodes);
  else s.add(b.nodes);
  const original = originalScenes.has(id);
  if (original || originalScenes.has(previous))
    c.onBeat(0, () => {
      s.play(fade(b.nodes, original ? 0.4 : 1), { duration: 0.3 });
    });
  return b;
}
export function finish(c, b, id) {
  const next = ORDER[ORDER.indexOf(id) + 1];
  if (next && !fullFrame.has(next)) c.keep(b.nodes);
}

// The same W0 accumulation window appears in the clock and readiness scenes.
export function windowPicture(s, region, name, initial = 0, unit = 'microsteps') {
  const count = s.value(initial),
    updates = s.value(0),
    buffer = s.value(initial);
  const [head, ticks, storage, read] = region.rows([1, 1, 1, 1], 'normal');
  const title = place(label(name), head, 'left');
  const slots = ticks.columns(8, 'normal');
  const frame = slots.map((slot) =>
    place(rect(slot.width, 42, { fill: 'surface', stroke: 'grid' }), slot),
  );
  const fill = dynamic(() =>
    slots.map((slot, i) =>
      rect(slot.width, 42, {
        fill: i < Math.round(count.value) ? 'green' : 'surface',
        stroke: 'grid',
      }).moveTo(slot.point('center')),
    ),
  );
  const rail = place(rect(storage.width, 34, { fill: 'surface', stroke: 'grid' }), storage);
  const contents = dynamic(() =>
    rect(Math.max(0.001, (storage.width * buffer.value) / 8), 34, {
      fill: 'cyan',
      stroke: 'cyan',
    }).moveTo([storage.left + (storage.width * buffer.value) / 16, storage.cy]),
  );
  const numbers = dynamic(() =>
    mono(`${unit} ${Math.round(count.value)} / 8      Adam updates ${Math.round(updates.value)}`, {
      size: 34,
    }).moveTo(read.point('center')),
  );
  return { nodes: [title, frame, fill, rail, contents, numbers], count, updates, buffer };
}

// Each row is a separate live allocation. Resident shards never disappear during a gather.
export function parameterStorage(s, region, specs) {
  const units = Math.max(...specs.map((spec) => spec.ids.length));
  const rows = region.rows(specs.length, 'wide'),
    nodes = [],
    fills = [];
  specs.forEach((spec, index) => {
    const [name, cells] = rows[index].columns([2, 8], 'wide');
    nodes.push(place(note(spec.name), name, 'left'));
    const slots = cells
      .columns(spec.wholeRow ? spec.ids.length : units, 'tight')
      .slice(0, spec.ids.length);
    const fill = s.value(spec.initial ?? 0);
    fills.push(fill);
    if (spec.conceal) {
      nodes.push(
        dynamic(() =>
          fill.value > 0
            ? slots.map((slot) =>
                rect(slot.width, 58, { fill: 'surface', stroke: 'grid' }).moveTo(
                  slot.point('center'),
                ),
              )
            : rect(cells.width, 58, { fill: 'surface', stroke: 'grid' }).moveTo(
                cells.point('center'),
              ),
        ),
      );
    } else {
      nodes.push(
        ...slots.map((slot) =>
          place(rect(slot.width, 58, { fill: 'surface', stroke: 'grid' }), slot),
        ),
      );
    }
    nodes.push(
      dynamic(() =>
        slots.flatMap((slot, i) =>
          i < fill.value
            ? [
                rect(slot.width, 58, {
                  fill: spec.color ?? 'blue',
                  stroke: spec.color ?? 'blue',
                }).moveTo(slot.point('center')),
                mono(spec.ids[i], { size: 30, color: 'surface' }).moveTo(slot.point('center')),
              ]
            : [],
        ),
      ),
    );
  });
  return { nodes, fills };
}
