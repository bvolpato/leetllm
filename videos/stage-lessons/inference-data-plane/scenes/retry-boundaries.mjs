// Scene `retry-boundaries`: recover the request at its real boundary.
//
// The picture: the board with the state at the decode worker, and under it the tokens that the
// client has. Before any token: an acknowledgement is lost on the link, the commit is unknown, and
// the owner asks. After five tokens: a restart at token one doubles the stream, and a restart at
// the cursor continues it. The retained source copy keeps its charge while the transport reads.
// The final picture pairs the local model's results with the checks each runtime component owns.
import {
  between,
  beside,
  boxOf,
  clamp,
  column,
  dynamic,
  fitted,
  grid,
  indicate,
  lerp,
  line,
  linear,
  place,
  rect,
  row,
  steps,
} from 'vizmatic/stage';
import { area, chip, chipRow, heading, label, note } from '../../kit-narrated.mjs';
import {
  CELL,
  COLOR,
  FIXTURE,
  FOOT,
  RESERVED_DASH,
  block,
  handoff,
  pool,
  slot,
} from '../parts.mjs';

/** The stream of the example: the client has five tokens when the decode worker fails. */
const DELIVERED = 5,
  RETRIED = 3,
  SHOWN = 10;
/** The counts of the narration for the model of the article. */
const CASES = [
  ['model-eight', 8, 'manifest mismatches'],
  ['model-coverage', 2, 'duplicate or missing coverage'],
  ['model-stale', 1, 'stale attempts'],
  ['model-expiry', 1, 'expiry'],
];
const ORDERS = 720;

export default function retryBoundaries(s, c) {
  const { blocks, segmentBlocks } = FIXTURE;
  const board = handoff(s, { made: blocks, reserved: blocks, sent: blocks });
  const panel = { source: boxOf(board.source.panel), dest: boxOf(board.dest.panel) };
  const mid = between(board.source.panel, board.dest.panel);
  const low = mid.rows([3, 1], 'none')[1];
  const [streamBand, stripBand] = FOOT.rows([3, 2], 'normal');

  // The stream to the client: the tokens that it has, and under them the tokens of a restart.
  const got = s.value(0), // the tokens that the client has
    again = s.value(0), // 0 to 1: a restart sends tokens
    from = s.value(0), // the place of the first token of the restart
    cursor = s.value(0), // 0 to 1: the cursor that both sides agree on shows
    broken = s.value(0); // 0 to 1: the stream ends with an explicit error
  const pitch = CELL + 10;
  const streamBed = rect(SHOWN * pitch - 10, 2 * CELL + 14, { fill: null, stroke: null });
  const streamName = note('the client has');
  const needs = chipRow(['deduplication', 'sampling state', 'one owner'], {
    color: COLOR.mark,
    stroke: COLOR.mark,
  });
  place(row([streamName, streamBed, needs], { gap: 'wide', align: 'center' }), streamBand, 'left');
  const stream = dynamic(() => {
    const box = boxOf(streamBed);
    const x = (place) => box.left + CELL / 2 + place * pitch,
      upper = box.top + CELL / 2,
      lower = box.bottom - CELL / 2;
    const nodes = [];
    for (let index = 0; index < SHOWN; index++) {
      const full = clamp(got.value - index, 0, 1);
      nodes.push(
        full > 0
          ? block([x(index), upper], COLOR.valid, { opacity: full })
          : slot([x(index), upper]),
      );
    }
    // A restart at token one sends tokens that the client has already: they are red.
    if (again.value > 0)
      for (let index = 0; index < RETRIED; index++)
        nodes.push(
          block(
            [x(from.value + index), lower],
            from.value < DELIVERED - 0.5 ? COLOR.fail : COLOR.valid,
            { opacity: again.value },
          ),
        );
    if (cursor.value > 0) {
      const at = x(DELIVERED) - pitch / 2;
      nodes.push(
        line([at, box.top - 8], [at, box.bottom + 8], {
          stroke: COLOR.mark,
          width: 4,
          opacity: cursor.value,
        }),
      );
    }
    if (broken.value > 0) {
      const at = [x(DELIVERED), upper];
      nodes.push(
        block(at, COLOR.fail, { opacity: broken.value }),
        line([at[0] - 11, at[1] - 11], [at[0] + 11, at[1] + 11], {
          stroke: 'bg',
          width: 5,
          opacity: broken.value,
        }),
        line([at[0] - 11, at[1] + 11], [at[0] + 11, at[1] - 11], {
          stroke: 'bg',
          width: 5,
          opacity: broken.value,
        }),
      );
    }
    return nodes;
  });

  // The steps before a retry, and the steps of a cancel, at one place.
  const strip = (names, current = null) =>
    place(
      fitted(stripBand.width * 0.8, (width) =>
        steps(names, { width, height: 76, size: 32, color: COLOR.mark, current }),
      ),
      stripBand,
      'left',
    );
  const gates = strip([
    'fence the old owner',
    'keep the semantics',
    'check the budgets',
    'then retry',
  ]);
  const cancel = strip(['stop new work', 'fence the output', 'drain accesses', 'release'], 0);

  // The acknowledgement of the commit: it leaves the decode worker and is lost on the way.
  const ack = s.value(0);
  const ackY = board.source.p(2 * segmentBlocks)[1];
  const ackMark = dynamic(() => {
    if (ack.value <= 0 || ack.value >= 1) return null;
    const x = lerp(panel.dest.left - 20, mid.cx, clamp(ack.value / 0.7, 0, 1));
    const fade = 1 - clamp((ack.value - 0.7) / 0.3, 0, 1);
    return [
      rect(34, 34, { fill: COLOR.control, stroke: null, radius: 17, opacity: fade }).at(x, ackY),
      ack.value > 0.7 && slot([x, ackY], COLOR.fail, { size: 34 + 60 * (1 - fade), opacity: fade }),
    ].filter(Boolean);
  });
  const unknown = place(label('commit: unknown', { color: COLOR.mark }), low);
  const known = place(label('commit: confirmed', { color: COLOR.valid }), low);

  // The copy that the prefill worker keeps: it has a charge of its own, with an expiry.
  const reading = s.value(0),
    failed = s.value(0),
    group = s.value(0);
  const chargeBed = rect(panel.source.width, 26, {
    fill: null,
    stroke: 'gridStrong',
    width: 2,
    radius: 8,
  });
  const chargeName = note('the copy: its own charge, its own expiry', { color: COLOR.control });
  beside(
    column([chargeBed, chargeName], { gap: 'tight' }),
    board.source.panel,
    'under',
    'normal',
    'left',
  );
  const chargeBar = place(
    rect(boxOf(chargeBed).width - 8, 18, { fill: COLOR.control, stroke: null, radius: 5 }),
    boxOf(chargeBed),
  );
  const trouble = dynamic((time) => {
    const nodes = [];
    // The transport still reads the copy: marks run on the rails.
    if (reading.value > 0)
      for (let rail = 0; rail < 6; rail += 2) {
        const u = (time * 0.4 + rail * 0.17) % 1;
        nodes.push(
          rect(26, 8, { fill: COLOR.state, stroke: null, radius: 4, opacity: reading.value }).at(
            lerp(mid.left + 20, mid.right - 20, u),
            board.source.p(rail * segmentBlocks)[1],
          ),
        );
      }
    // Rank 1 of the decode group fails: its rows are red. The whole group must recover.
    if (failed.value > 0)
      for (let index = blocks / 2; index < blocks; index++)
        nodes.push(block(board.dest.p(index), COLOR.fail, { opacity: failed.value }));
    if (group.value > 0) {
      const top = board.dest.p(0)[1] - CELL / 2 - 4,
        bottom = board.dest.p(blocks - 1)[1] + CELL / 2 + 4;
      nodes.push(
        rect(panel.dest.width - 4, bottom - top, {
          fill: null,
          stroke: COLOR.mark,
          width: 4,
          radius: 12,
          dash: [14, 10],
          opacity: group.value,
        }).at(panel.dest.cx, (top + bottom) / 2),
      );
    }
    return nodes;
  });

  s.add(heading(c.title), board.standing, streamName, stream, gates, ackMark, trouble);

  // Beat 0: before any token. Three steps come before a retry, and a lost acknowledgement is not a failure.
  c.on('retry-before', () => s.play(indicate(streamName, { color: COLOR.mark, scale: 1 })));
  c.on('gate-fence', () => s.play(gates.go(0, { duration: 0.3 })));
  c.on('gate-semantics', () => s.play(gates.go(1, { duration: 0.3 })));
  c.on('gate-budgets', () => s.play(gates.go(2, { duration: 0.3 })));
  c.on('ack-lost', () =>
    s.play(gates.go(null, { duration: 0.3 }), ack.to(1, { duration: 1.6, ease: linear })),
  );
  c.show('ack-unknown', unknown);
  c.swap('ack-query', unknown, known, { after: true });
  c.after('ack-query', () => s.play(board.valid.to(1, { duration: 0.6 })));

  // Beat 1: after five tokens. A restart at token one doubles the stream; a restart at the cursor continues it.
  c.on('stream-out', () => s.play(got.to(DELIVERED, { duration: 2.4, ease: linear })));
  c.after('stream-restart', () => s.play(again.to(1, { duration: 0.6 })), 0.04);
  c.on('stream-cursor', () =>
    s.play(cursor.to(1, { duration: 0.3 }), from.to(DELIVERED, { duration: 1 })),
  );
  c.show('stream-needs', needs);
  c.on('stream-error', () =>
    s.play(again.to(0, { duration: 0.4 }), broken.to(1, { duration: 0.4 })),
  );
  c.swap('cancel-stop', gates, cancel);
  c.on('cancel-fence', () => s.play(cancel.go(1, { duration: 0.3 })));
  c.on('cancel-drain', () => s.play(cancel.go(2, { duration: 0.3 })));
  c.on('cancel-release', () => s.play(cancel.go(3, { duration: 0.3 })));

  // Beat 2: the copy at the prefill worker, and a rank that fails.
  c.show('retain', [chargeBed, chargeName, chargeBar]);
  c.on('retain', () =>
    s.play(
      cancel.go(null, { duration: 0.3 }),
      board.kept.to(1, { duration: 0.6 }),
      broken.to(0, { duration: 0.4 }),
      cursor.to(0, { duration: 0.4 }),
    ),
  );
  c.on('retain-charge', () => s.play(indicate(chargeName, { color: COLOR.mark, scale: 1 })));
  c.on('retain-read', () => s.play(reading.to(1, { duration: 0.4 })));
  c.on('rank-fail', () =>
    s.play(reading.to(0, { duration: 0.3 }), failed.to(1, { duration: 0.5 })),
  );
  c.on('rank-group', () => s.play(group.to(1, { duration: 0.5 })));

  // The local model exercises event orders. The coordinator and backend supply runtime evidence.
  const [wallSide, listSide] = area.columns([5, 6], 'wide');
  const orders = pool(ORDERS, { columns: 36, pitch: 21 });
  const ordersName = label(`${ORDERS} tested event orders`);
  const ordersScope = note('six events, once each');
  place(column([ordersName, ordersScope, orders.panel], { gap: 'tight' }), wallSide, 'left');
  const passed = s.value(0);
  const ordersMarks = dynamic(() =>
    Array.from({ length: ORDERS }, (_, index) =>
      passed.value > index
        ? block(orders.p(index), COLOR.valid, { size: orders.cell })
        : slot(orders.p(index), 'gridStrong', { size: orders.cell }),
    ),
  );
  const done = CASES.map(() => s.value(0));
  const caseBeds = CASES.map(([, count]) => rect(count * 38 - 8, 30, { fill: null, stroke: null }));
  const caseNames = CASES.map(([, , words]) => note(words));
  const caseMarks = dynamic(() =>
    CASES.flatMap(([, count], index) => {
      const box = boxOf(caseBeds[index]);
      return Array.from({ length: count }, (_, k) => {
        const at = [box.left + 15 + k * 38, box.cy];
        const full = clamp(done[index].value * count - k, 0, 1);
        return full > 0
          ? block(at, COLOR.valid, { size: 30, opacity: full })
          : slot(at, 'gridStrong', { size: 30 });
      });
    }),
  );
  const signals = chipRow(['completion', 'abort', 'reader stopped'], { dash: RESERVED_DASH });
  const inputs = row([note('trusted inputs'), signals], { gap: 'normal', align: 'center' });
  const checkedName = label('No partial commit or early reuse', { color: COLOR.valid });
  const coordinator = chip('Coordinator   ·   atomic commit and authentication', {
    color: COLOR.control,
  });
  const backend = chip('Backend   ·   cancellation and GPU visibility', { color: COLOR.control });
  place(
    column(
      [
        grid(
          CASES.flatMap((_, index) => [caseBeds[index], caseNames[index]]),
          { columns: 2, gap: ['normal', 'tight'] },
        ),
        checkedName,
        inputs,
        coordinator,
        backend,
      ],
      { gap: 'normal' },
    ),
    listSide,
    'left',
  );

  c.swap(
    3,
    [
      board.standing,
      streamName,
      stream,
      needs,
      ackMark,
      known,
      chargeBed,
      chargeName,
      chargeBar,
      trouble,
    ],
    [ordersName, ordersScope, orders.panel, ordersMarks, caseMarks, caseNames],
  );
  // Keep the cancellation steps until the incoming picture is fully visible.
  c.hide(3, cancel, { lead: -0.4, fade: 0.3 });
  CASES.forEach(([cue], index) => c.on(cue, () => s.play(done[index].to(1, { duration: 0.7 }))));
  const sweep = c.cue('model-720');
  c.on('model-720', () =>
    s.play(passed.to(ORDERS, { duration: sweep.end - sweep.start + 1, ease: linear })),
  );
  c.show('model-proves', checkedName, { after: true });
  c.show('model-assumes', inputs);
  c.show('model-not', coordinator);
  c.show('model-evidence', backend);
}
