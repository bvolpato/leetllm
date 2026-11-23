import { beside, boxOf, column, dot, grid, group, line, place, rect, row } from 'vizmatic/stage';
import { area, chip, heading, label, mono, namedBox, note, para } from '../kit-narrated.mjs';
import { selectionItems, provenance } from '../../films/active-labeling/fixtures.mjs';

// Cyan is a permitted source or hybrid branch. Blue is an estimate or review measurement.
// Green is acceptable. Pink is reserved evaluation. Yellow is current focus. Red is failure.
export const COLORS = Object.freeze({
  source: 'cyan',
  estimate: 'blue',
  accepted: 'green',
  reserved: 'pink',
  focus: 'yellow',
  failure: 'red',
});
export const STATE = Object.freeze({
  'subject-intro': 'attack-014 serves evaluation and incident review. A separate permitted source enters.',
  'record-types': 'Cleaned trace fields fill training signals. Reserved evidence stays separate.',
  'preference-loss': 'Both chosen and rejected terms produce the relative loss.',
  'redact-and-provenance': 'Email masked. Technical versions retained.',
  'write-rubric': 'A chosen. Both-unsafe and missing evidence remain separate.',
  'reviewer-agreement': '107 matches, 13 disagreements, kappa 0.835.',
  'agreement-models': 'Fleiss 23/47. Degenerate kappa undefined.',
  'uncertainty-selection': 'A and B queued. Probabilities unchanged.',
  'diversity-selection': 'canary-1, handoff, injection, keyboard selected.',
  'selection-score': 'The weighted appeal pick leaves a radius of four. Picking handoff leaves one.',
  'selector-trial': 'Same 400 accepted labels. Supplied validation 64 and 68.',
  'evaluation-boundary': 'Direct-parent overlap and two mapped judge changes.',
  'lineage-audit': 'Bounded checks. No recursive ancestor traversal.',
  'dataset-release': 'Earlier release admitted. New hypothetical missing audit is blocked.',
  'fresh-release': 'The original checkpoint retains exposure to incident-seven after row removal.',
});
export const [sourceBand, picture, footer] = area.rows([1, 8, 1], 'normal');
export function sourceStrip({ reserved = false } = {}) {
  return place(
    row(
      [
        chip(reserved ? 'attack-014' : provenance.trace, { color: reserved ? 'pink' : 'cyan' }),
        note('model-promotion assistant'),
        chip('Teaching fixture', { color: 'dim' }),
      ],
      { gap: 'wide' },
    ),
    sourceBand,
    'left',
  );
}
const batchContext = {
  'agreement-models': 'Supplied independent ratings',
  'uncertainty-selection': 'Four eligible pairs   ·   two review places',
  'selector-trial': 'Selector comparison   ·   supplied validation scores',
  'evaluation-boundary': 'Private test registry and human-reviewed judge calibration cases',
  'lineage-audit': 'Training candidates compared with the frozen test registry',
  'dataset-release': 'Candidate training snapshot   ·   frozen evaluation set promotion-eval-v5',
};
export function open(s, c) {
  s.add(heading(c.title));
  if (batchContext[c.id]) {
    s.add(place(note(batchContext[c.id]), sourceBand, 'left'));
    return;
  }
  const source = sourceStrip();
  c.take(source);
  if (c.id !== 'write-rubric') c.keep(source);
}
export const TRACE_FIELDS = Object.freeze({
  prompt: 'Propose an approval-gated canary.',
  approved: 'Cite approval. Stay within canary scope.',
  unsafe: 'Claims traffic moved. Proposes an unapproved write.',
});
export function traceRecord(region, { reserved = false, cleaned = false } = {}) {
  const frame = place(
    rect(region.width - 8, region.height - 8, { radius: 16, stroke: 'grid', fill: 'surface' }),
    region,
  ).zIndex(-1);
  const slots = region.inset('normal').rows([1.2, 1.5, 1.5, 1.5, 1, 1], 'tight');
  const id = place(
    row([
      chip(reserved ? 'attack-014' : provenance.trace, { color: reserved ? 'pink' : 'cyan' }),
      note(reserved ? 'reserved safety test' : 'permitted training source'),
    ]),
    slots[0],
    'left',
  );
  const prompt = place(
    column([note('PROMPT'), para(TRACE_FIELDS.prompt, slots[1].width)]),
    slots[1],
    'left',
  );
  const a = place(
    column([
      note('ANSWER A', { color: 'green' }),
      para(TRACE_FIELDS.approved, slots[2].width, { color: 'green' }),
    ]),
    slots[2],
    'left',
  );
  const b = place(
    column([
      note('ANSWER B', { color: 'red' }),
      para(TRACE_FIELDS.unsafe, slots[3].width, { color: 'red' }),
    ]),
    slots[3],
    'left',
  );
  const email = place(
    mono(cleaned ? 'Email: [EMAIL]' : 'Email: alex@example.org', {
      size: 31,
      color: cleaned ? 'cyan' : 'ink',
    }),
    slots[4],
    'left',
  );
  const family = place(
    note('family: ' + (reserved ? 'attack-014' : provenance.trace), {
      color: reserved ? 'pink' : 'cyan',
    }),
    slots[5],
    'left',
  );
  return {
    frame,
    id,
    prompt,
    a,
    b,
    email,
    family,
    slots,
    nodes: [frame, id, prompt, a, b, email, family],
  };
}
export function admissionGate(region, { compact = false } = {}) {
  const words = compact ? note : label;
  const [top, lane, foot] = region.rows([1, 3, 1], compact ? 'tight' : 'wide');
  const title = place(words('Training admission', { color: 'dim' }), top);
  const [waiting, door, admitted] = lane.columns([3, 1, 3], 'wide');
  const left = place(
    rect(waiting.width - 8, waiting.height - 8, { radius: 12, stroke: 'grid' }),
    waiting,
  );
  const right = place(
    rect(admitted.width - 8, admitted.height - 8, { radius: 12, stroke: 'grid' }),
    admitted,
  );
  const latch = place(rect(18, door.height * 0.65, { fill: 'red', stroke: 'red' }), door);
  const status = place(words('Closed', { color: 'red' }), foot);
  return {
    title,
    left,
    right,
    latch,
    status,
    waiting,
    admitted,
    door,
    foot,
    nodes: [title, left, right, latch, status],
  };
}
export function reviewerMatrix(region, values, names = ['A', 'B', 'Tie']) {
  const regions = region
    .rows(values.length + 1, 'normal')
    .map((r) => r.columns(values.length + 1, 'normal'));
  const headers = names.flatMap((name, i) => [
    place(note(name, { color: 'blue' }), regions[0][i + 1]),
    place(note(name, { color: 'blue' }), regions[i + 1][0]),
  ]);
  const cells = values.map((r, i) =>
    r.map((v, j) =>
      place(
        namedBox(String(v), {
          width: regions[i + 1][j + 1].width - 6,
          height: regions[i + 1][j + 1].height - 6,
          color: 'dim',
          font: 'mono',
        }),
        regions[i + 1][j + 1],
      ),
    ),
  );
  return { headers, cells, nodes: [...headers, ...cells.flat()], regions };
}
export function embeddingPool(region) {
  const square = Math.min(region.width, region.height) * 1.12;
  const center = region.point('center');
  const pos = ([x, y]) => [center[0] + (x * square) / 12, center[1] - (y * square) / 12];
  const frame = place(
    rect(region.width - 8, region.height - 8, { radius: 12, stroke: 'grid' }),
    region,
  ).zIndex(-1);
  const axes = [];
  const marks = selectionItems.map((item) => dot(12, 'blue').moveTo(pos(item.xy)));
  const labels = marks.map((mark, i) => {
    const n = note(selectionItems[i].id, { color: 'blue' });
    if (i === 1) beside(n, mark, 'above', 'normal', 'left');
    else if (i === 2) beside(n, mark, 'above', 'normal', 'right');
    else beside(n, mark, i === 0 || i === 3 ? 'under' : 'above', 'normal');
    const b = boxOf(n);
    const backing = rect(b.width + 32, b.height + 28, {
      fill: 'surface',
      stroke: 'surface',
    }).moveTo(b.point('center'));
    return group(backing, n).zIndex(2);
  });
  return { frame, axes, marks, labels, pos, nodes: [frame, ...axes, ...marks, ...labels] };
}
