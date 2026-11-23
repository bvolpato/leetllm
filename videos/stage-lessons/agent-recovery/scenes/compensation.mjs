// Scene `compensation`: an undo is a new action on the state of now.
//
// The picture: three nodes with pods at the top, and the record of the steps under them. The
// first node is cordoned, its original pods terminate, and the new image fails. Controllers
// may create distinct replacement pods elsewhere. Uncordon leaves those replacements in place.
// The record fills as the steps happen, and then one compensation fails.
import {
  column,
  fadeOut,
  grid,
  group,
  indicate,
  lagged,
  place,
  recolor,
  rect,
} from 'vizmatic/stage';
import { area, chip, heading, label, note } from '../../kit-narrated.mjs';
import { COLOR, OP } from '../parts.mjs';

/** The side of a pod, and the cells of each node that hold a pod at the start. */
const POD = 58;
const START = [[0, 1, 3, 4], [0], [0]];
/** The illustrative destinations of new replacement pods, not the original instances. */
const REPLACE = [
  [1, 1],
  [1, 2],
  [2, 1],
  [2, 2],
];

export default function compensation(s, c) {
  const [top, bottom] = area.rows([5, 4], 'normal');

  // Three nodes. Each has a name, six cells for pods, and one line at its foot.
  const nodes = top.columns(3, 'wide').map((box, index) => {
    const inner = box.inset('normal');
    const [head, upper, lower, foot] = inner.rows([3, 3, 3, 2], 'tight');
    return {
      box,
      frame: rect(box.width, box.height, {
        radius: 16,
        stroke: 'dim',
        fill: 'surface',
        width: 3,
      }).moveTo(box.point()),
      name: place(label(`node ${'ABC'[index]}`), head, 'left'),
      head,
      foot,
      cells: [...upper.columns(3, 'tight'), ...lower.columns(3, 'tight')],
    };
  });
  const pod = (identity, color = COLOR.attempt) =>
    group(
      rect(POD, POD, { radius: 10, fill: 'surface', stroke: color, width: 3 }),
      label(identity, { size: 30, color }),
    );
  const pods = START.map((cells, index) =>
    cells.map((cell, item) =>
      pod(`${'ABC'[index]}${item + 1}`).moveTo(nodes[index].cells[cell].point()),
    ),
  );
  const replacements = REPLACE.map(([node, cell], index) =>
    pod(`R${index + 1}`, COLOR.sure).moveTo(nodes[node].cells[cell].point()),
  );
  const terminated = place(
    note('original pods terminated', { color: COLOR.fail }),
    nodes[0].foot,
    'left',
  );
  const replacementNames = [1, 2].map((index) =>
    place(note('R: new Pod identities', { color: COLOR.sure }), nodes[index].foot, 'left'),
  );
  const empty = START[0].map((cell) =>
    rect(POD, POD, { radius: 10, stroke: 'dim', fill: null, width: 2.5, dash: [8, 8] }).moveTo(
      nodes[0].cells[cell].point(),
    ),
  );
  const first = nodes[0];
  const cordon = rect(first.box.width, first.box.height, {
    radius: 16,
    stroke: COLOR.mark,
    fill: null,
    width: 5,
    dash: [14, 10],
  }).moveTo(first.box.point());
  const cordoned = place(
    chip('cordoned', { color: COLOR.mark, stroke: COLOR.mark }),
    first.head,
    'right',
  );
  const open = place(
    chip('schedulable', { color: COLOR.sure, stroke: COLOR.sure }),
    first.head,
    'right',
  );
  const image = place(
    note('the new image: not available', { color: COLOR.fail }),
    first.foot,
    'left',
  );
  const health = place(note('Check node health', { color: COLOR.mark }), first.foot, 'left');

  // The record of the flow: each confirmed step, and the compensation that was chosen for it.
  const [tableSide, noteSide] = bottom.columns([3, 2], 'wide');
  const cell = (words, color = 'ink') => label(words, { size: 34, color });
  const heads = [note('confirmed step'), note('its compensation')];
  const rows = [
    [cell('1  cordon the node', 'dim'), cell('uncordon: done', COLOR.sure)],
    [cell('2  evict the pods', 'dim'), cell('repair workload placement')],
    [cell('3  pull the new image: failed', COLOR.fail), null],
  ];
  const otherEffects = [
    [cell(`${OP.job} queued`), cell('cancel the job')],
    [cell('rollout completed'), cell('new deployment', COLOR.mark)],
    [cell('notification sent'), cell('retract: people still know', COLOR.mark)],
  ];
  const otherHead = note('Other effects: separate cases');
  const late = cell('placement repair: timed out', COLOR.fail);
  place(
    column(
      [
        grid([...heads, ...rows.flat()], { columns: 2, gap: ['loose', 'none'] }),
        otherHead,
        grid(otherEffects.flat(), { columns: 2, gap: ['loose', 'none'] }),
      ],
      { gap: 'tight' },
    ),
    tableSide,
    'top left',
  );
  late.moveTo(rows[1][1].center).alignTo(rows[1][1], 'left');
  // The steps of the flow are on screen from the start, and each one lights when it happens.
  const planned = cell('3  pull the new image', 'dim');
  planned.moveTo(rows[2][0].center).alignTo(rows[2][0], 'left');
  const choices = ['forward repair', 'compensation', 'human review'].map((words) =>
    chip(words, { color: COLOR.mark, stroke: COLOR.mark }),
  );
  const choose = note('look at the real state first, then choose:');
  const order = chip('the order comes from the domain', { color: COLOR.mark, stroke: COLOR.mark });
  const safe = chip('saved progress + destination repeat safety', {
    color: COLOR.mark,
    stroke: COLOR.mark,
  });
  place(
    column([choose, grid(choices, { columns: 2, gap: 'tight' }), order, safe], { gap: 'tight' }),
    noteSide,
    'top left',
  );

  s.add(
    heading(c.title),
    nodes.flatMap((node) => [node.frame, node.name]),
    pods,
    heads,
    rows[0][0],
    rows[1][0],
    planned,
  );

  // Original Pod instances terminate at their original positions. No Pod moves between nodes.
  c.show('pods-evicted', [cordon, cordoned]);
  c.on('pods-evicted', () => s.play(recolor(rows[0][0], 'ink', { duration: 0.3 })));
  c.on(
    'pods-evicted',
    () =>
      s.play(
        lagged(
          pods[0].map((made) => fadeOut(made, { duration: 0.9 })),
          { lag: 0.3 },
        ),
        recolor(rows[1][0], 'ink', { duration: 0.3 }),
      ),
    0.8,
  );
  c.show('image-unavailable', image);
  c.swap('image-unavailable', planned, rows[2][0]);
  c.swap('replacement-pods', image, terminated);
  c.show('replacement-pods', [replacements, replacementNames]);
  // Uncordon changes admission. The distinct replacement Pods remain on the other nodes.
  c.hide('uncordon', cordon);
  c.swap('uncordon', cordoned, open);
  c.show('uncordon', rows[0][1], { after: true });
  c.show('not-restore', empty);
  c.on(
    'not-restore',
    () =>
      s.play(
        lagged(
          replacements.map((made) => indicate(made, { color: COLOR.mark, scale: 1.2 })),
          { lag: 0.2 },
        ),
      ),
    1,
  );
  c.swap('not-healthy', terminated, health);
  c.show('inspect', [choose, choices], { lead: 1.2 });

  // A saga keeps this record. A compensation can fail too, so it needs what the first send needed.
  c.on('saga-records', () =>
    s.play(...heads.map((head) => indicate(head, { color: COLOR.mark, scale: 1 }))),
  );
  c.show('saga-records', rows[1][1], { lead: -1 });
  c.show('order', order);
  c.swap('saga-progress', rows[1][1], late);
  c.show('durable-progress', safe);
  c.show('queued-vs-done', otherHead);
  c.show('queued-vs-done', [otherEffects[0], otherEffects[1]], { stagger: true });
  c.show('notification', otherEffects[2]);
}
