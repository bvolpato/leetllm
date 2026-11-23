// Scene `progress-budget`: count the evidence, and keep a hard limit on the calls.
//
// The picture: the hard budget is a row of eight places, and each call fills one. Under it,
// the evidence that the task has, and a counter of the calls with no progress. A page that the
// task has already fills the counter, and a new page empties it. Then the line of the operation
// comes back, with three faults at three stations, each with its own route.
import {
  appear,
  assertEqual,
  beside,
  column,
  fadeIn,
  fadeOut,
  indicate,
  moveTo,
  par,
  place,
  rect,
  row,
  seq,
  shake,
  vanish,
} from 'vizmatic/stage';
import { progressSequence } from '../../../films/agent-recovery/model.mjs';
import { area, chip, heading, label, mono, note } from '../../kit-narrated.mjs';
import { COLOR, OP, board, cross, docked, places, record, token, travel, wall } from '../parts.mjs';

/** The hard limit of calls of the fixture, and the calls with no progress that stop the loop. */
const HARD_LIMIT = 8;

export default function progressBudget(s, c) {
  const calls = progressSequence();
  const repeatLast = progressSequence([calls[0].page, calls[1].page, calls[1].page]).at(-1);
  assertEqual(
    [repeatLast.noProgress, repeatLast.remaining],
    [2, 5],
    'two stalls stop the alternative',
  );
  assertEqual(
    calls.map((call) => [call.noProgress, call.remaining]),
    [
      [0, 7],
      [1, 6],
      [0, 5],
    ],
    'the counter and the budget after each call',
  );

  // The frame: the budget over the two counts.
  const [top, bottom] = area.rows([11, 9], 'wide');
  const [budgetHead, budgetRow] = top.rows([2, 7], 'tight');
  const [evidenceSide, progressSide] = bottom.columns(2, 'loose');

  // The hard budget: eight places, and one tile for each call. A tile says if the page was new.
  const budgetName = place(label('hard call budget'), budgetHead, 'left');
  const left = [HARD_LIMIT, ...calls.map((call) => call.remaining)].map((count) =>
    place(mono(`${count} left`), budgetHead, 'right'),
  );
  const slots = budgetRow.columns(HARD_LIMIT, 'tight');
  const frames = slots.map((slot) =>
    rect(slot.width, slot.height, {
      radius: 12,
      stroke: 'dim',
      fill: null,
      width: 2.5,
      dash: [10, 8],
    }).moveTo(slot.point()),
  );
  const tile = (call, index) => {
    const color = call.gainedEvidence ? COLOR.sure : 'dim';
    const plate = rect(slots[index].width, slots[index].height, {
      radius: 12,
      stroke: color,
      fill: 'surface',
      width: 3,
    }).moveTo(slots[index].point());
    const words = place(
      column(
        [
          note(`call ${call.call}`),
          mono(call.page, { size: 36 }),
          note(call.gainedEvidence ? 'new page' : 'same page', {
            color: call.gainedEvidence ? COLOR.sure : COLOR.mark,
          }),
        ],
        { gap: 'normal', align: 'center' },
      ),
      slots[index],
    );
    return [plate, words];
  };
  const tiles = calls.map(tile);
  const otherTile = tile(repeatLast, 2);

  // The evidence that the task has: one chip for each page, whatever the number of reads.
  const pages = [...new Set(calls.map((call) => call.page))];
  const known = pages.map((page) => token(page, COLOR.sure, { size: 40 }));
  const evidenceName = note('evidence that the task has');
  // The name is under the chips: a read comes down from its tile and passes no text.
  place(column([row(known), evidenceName], { gap: 'normal' }), evidenceSide, 'left');
  // A read brings its page down to the evidence. It starts under its tile.
  const reads = calls.map((call, index) => {
    const read = token(call.page, COLOR.attempt, { size: 40 });
    const target = known[pages.indexOf(call.page)];
    return {
      node: read.moveTo([slots[index].cx, slots[index].bottom + read.height]),
      // A new page takes its place. A page that is there already stops at the next place, and leaves.
      to: (call.gainedEvidence ? target : known[pages.indexOf(call.page) + 1]).center,
      chipOf: target,
    };
  });

  // The calls with no progress: two places, and the loop stops when both are full.
  const idle = places(s, calls[0].allowance, { color: COLOR.mark, size: 84 });
  const idleName = note('calls with no progress');
  const idleLimit = note(`stop at ${calls[0].allowance}`);
  place(
    column([row([row(idle.frames, { gap: 'tight' }), idleLimit]), idleName], { gap: 'normal' }),
    progressSide,
    'left',
  );

  const fourth = place(label('Admit call 4?', { color: COLOR.mark, size: 32 }), slots[3]);
  const blocked = place(chip('Stopped', { color: COLOR.fail }), slots[3]);

  // The second picture: the line of the operation, with a fault at each of three stations.
  const b = board();
  const laneY = b.out[1];
  const at = [b.out[0] + (b.door[0] - b.out[0]) * 0.4, laneY];
  const gate = wall(s, { at, top: b.region.top, bottom: laneY + 110 });
  const ledger = record(
    [
      [OP.key, COLOR.op],
      ['→', 'dim'],
      [OP.job, COLOR.sure],
    ],
    b.recordWidth(0),
  ).moveTo(b.durableAt(0));
  const job = record(
    [
      [OP.job, COLOR.sure],
      [OP.state, 'ink'],
    ],
    b.recordWidth(1),
  ).moveTo(b.durableAt(1));
  const answer = token(OP.job, COLOR.sure);
  const broken = cross().moveTo(b.crossAt(answer));
  const unknown = label('timeout', { color: COLOR.fail }).moveTo(b.viewBox.point());
  const route = (fault, way) =>
    column(
      [note(fault, { color: COLOR.fail }), chip(way, { color: COLOR.mark, stroke: COLOR.mark })],
      { gap: 'tight', align: 'center' },
    );
  const routes = [
    beside(
      route('schema problem', 'repair the proposal'),
      [at[0] - 24, laneY],
      'above',
      'loose',
      'right',
    ),
    beside(
      route('transient read', 'bounded retry'),
      [(at[0] + b.door[0]) / 2, laneY],
      'under',
      'loose',
    ),
    place(
      route('write, outcome unknown', 'reconcile by its key'),
      b.store.rows(2, 'none')[0].inset('normal'),
      'bottom right',
    ),
  ];
  const bad = token('get_status(??)');
  const read = token('status?');
  const lookup = token([[OP.key, COLOR.op]], COLOR.attempt, { tag: 'trace-a2' });
  for (const node of [bad, read, lookup]) node.moveTo(docked(node, b.out, 'right'));
  answer.moveTo(docked(answer, b.exit));
  const lostRead = cross(36).moveTo([(at[0] + b.door[0]) / 2 + 60, laneY]);

  const loop = [
    budgetName,
    left[0],
    ...frames,
    evidenceName,
    idleName,
    idleLimit,
    ...idle.frames,
    idle.fills,
  ];
  s.add(heading(c.title), loop);

  // Call 1 brings a new page. Call 2 brings the same page again: one more call, and no evidence.
  const call = (index, after) => {
    const { node, to, chipOf } = reads[index];
    return seq(
      fadeIn(tiles[index], { duration: 0.3, shift: [0, 16] }),
      travel(node, to, { duration: 0.8 }),
      calls[index].gainedEvidence
        ? par(vanish(node), fadeIn(chipOf, { duration: 0.3 }), after)
        : par(
            shake(node, { duration: 0.4 }),
            fadeOut(node, { duration: 0.4 }),
            indicate(chipOf, { color: COLOR.mark }),
            after,
          ),
    );
  };
  const noProgress = (index) => idle.filled.to(calls[index].noProgress, { duration: 0.5 });
  c.on('useful-evidence', () => s.play(call(0, noProgress(0))));
  c.swap('useful-evidence', left[0], left[1]);
  c.on('repeated-page', () => s.play(call(1, noProgress(1))));
  c.swap('repeated-page', left[1], left[2]);
  c.on('no-change', () => s.play(indicate(known[0], { color: COLOR.mark })));

  // Call 3 brings a new page: the counter is empty again. The budget went down each time.
  c.on('new-page', () => s.play(call(2, noProgress(2))));
  c.swap('new-page', left[2], left[3]);
  c.on('other-page', () =>
    s.play(
      vanish([...tiles[2], known[1]]),
      appear(otherTile),
      idle.filled.to(repeatLast.noProgress, { duration: 0.5 }),
    ),
  );
  c.show('admit-four', fourth);
  c.swap('second-stall', fourth, blocked);
  c.on('finite-calls', () =>
    s.play(
      indicate(left[3], { color: COLOR.mark }),
      ...frames
        .slice(calls.length)
        .map((frame) => indicate(frame, { color: COLOR.mark, scale: 1 })),
    ),
  );

  // Three kinds of fault, at three stations of the line, each with its own route.
  c.onBeat(4, () =>
    s.play(
      vanish([
        ...loop.filter((node) => node !== left[0]),
        left[3],
        ...tiles.flat(),
        ...known,
        ...otherTile,
        blocked,
      ]),
      appear([b.base, gate.nodes, ledger, job, broken, unknown]),
    ),
  );
  b.close(c);
  c.show('schema-route', routes[0]);
  c.on('schema-route', () =>
    s.play(
      seq(
        travel(bad, gate.before(bad), { duration: 0.7 }),
        shake(bad, { duration: 0.3 }),
        moveTo(bad, docked(bad, b.out, 'right'), { duration: 0.6 }),
        vanish(bad),
      ),
    ),
  );
  c.show('retry-route', routes[1]);
  c.on('retry-route', () =>
    s.play(
      seq(
        par(gate.open.to(1, { duration: 0.3 }), travel(read, gate.after(read), { duration: 0.9 })),
        fadeIn(lostRead, { duration: 0.2 }),
        shake(read, { duration: 0.3 }),
        fadeOut(lostRead, { duration: 0.3 }),
        moveTo(read, docked(read, b.door), { duration: 0.6 }),
        b.absorb(read),
        gate.open.to(0, { duration: 0.3 }),
      ),
    ),
  );
  c.show('unknown-write-route', routes[2]);
  c.hide('unknown-write-route', unknown);
  c.on('unknown-write-route', () =>
    s.play(
      seq(
        par(
          gate.open.to(1, { duration: 0.3 }),
          travel(lookup, docked(lookup, b.door), { duration: 0.9 }),
        ),
        b.absorb(lookup),
        indicate(ledger, { color: COLOR.mark }),
        b.arrive(answer, { duration: 1.1 }),
      ),
    ),
  );
  c.on('separate-routes', () =>
    s.play(...routes.map((made) => indicate(made.nodes[1], { color: COLOR.mark, scale: 1.08 }))),
  );
}
