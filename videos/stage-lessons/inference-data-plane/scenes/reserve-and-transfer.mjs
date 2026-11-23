// Scene `reserve-and-transfer`: reserve before moving the cache.
//
// The picture: the board, with the state at the prefill worker and a free pool at the decode
// worker. 48 slots turn into a reservation. The 24 slots that request R4220 asks for rise to the
// 16 that are free, do not fit, and go back to wait. Then the blocks of R4219 cross the link, and
// the traffic of other requests takes rails beside them.
import { allocate } from '../../../films/inference-data-plane/arithmetic.mjs';
import {
  between,
  boxOf,
  clamp,
  column,
  dynamic,
  grid,
  lerp,
  linear,
  place,
  rect,
  row,
  smoothstep,
} from 'vizmatic/stage';
import { chip, chipRow, heading, mono, note } from '../../kit-narrated.mjs';
import {
  CELL,
  COLOR,
  FIXTURE,
  FOOT,
  PITCH,
  RESERVED_DASH,
  block,
  handoff,
  slot,
} from '../parts.mjs';

/** The second request of the model: it asks for 24 slots, and `allocate(64, [48, 24])` refuses it. */
const SECOND = { request: 'R4220', blocks: 24 };
if (allocate(FIXTURE.slots, [FIXTURE.blocks, SECOND.blocks]).join() !== 'true,false')
  throw new Error(
    'reserve-and-transfer: the model must admit the first request and refuse the second',
  );

export default function reserveAndTransfer(s, c) {
  const { blocks, slots, segmentBlocks } = FIXTURE;
  const board = handoff(s, { made: blocks });
  const panel = boxOf(board.dest.panel);
  const mid = between(board.source.panel, board.dest.panel);
  const [counts, measures, queue] = FOOT.columns([5, 6, 5], 'wide');

  // Inset marks show candidate slots. The pool stays free until it grants the whole request.
  const candidates = s.value(0);
  const candidateMarks = dynamic(() => {
    if (board.reserved.value > 0) return null;
    return Array.from({ length: Math.ceil(candidates.value) }, (_, index) =>
      slot(board.dest.p(index), COLOR.mark, {
        size: CELL * 0.7,
        opacity: clamp(candidates.value - index, 0, 1),
      }),
    );
  });

  // The slots that R4220 asks for: a group of outlines under the pool, in the columns of the pool.
  const attempt = s.value(0), // 0 to 1: the group is at the free slots of the pool
    asked = s.value(0); // 0 to 1: the group shows
  const queueBed = rect(panel.width, 3 * PITCH, { fill: null, stroke: null });
  const queueName = note(`${SECOND.request} asks for ${SECOND.blocks}`, { color: COLOR.other });
  place(column([queueBed, queueName], { gap: 'tight' }), queue, 'top right');
  const second = dynamic(() => {
    if (asked.value <= 0) return null;
    const rest = boxOf(queueBed);
    const rise = smoothstep(attempt.value);
    return Array.from({ length: SECOND.blocks }, (_, index) => {
      const free = board.dest.p(blocks + (index % (slots - blocks)));
      // The group keeps its shape: the slots past the 16 free ones hang under the pool.
      const target = [
        board.dest.p(index % 8)[0],
        board.dest.p(blocks)[1] + Math.floor(index / 8) * PITCH,
      ];
      const wait = [
        board.dest.p(index % 8)[0],
        rest.top + CELL / 2 + Math.floor(index / 8) * PITCH,
      ];
      const fits = index < slots - blocks;
      return slot(
        [lerp(wait[0], target[0], rise), lerp(wait[1], target[1], rise)],
        fits || rise < 0.5 ? COLOR.other : COLOR.fail,
        {
          opacity: asked.value,
          dash: RESERVED_DASH,
        },
      );
    });
  });

  // The counts of the pool, and the state of the handoff as its owner sees it.
  const requestSize = mono(String(blocks), { color: COLOR.mark });
  const requested = note(`requested by ${FIXTURE.request}`);
  const reserved = note(`reserved for ${FIXTURE.request}`);
  const freeName = [mono(String(slots - blocks)), note('free')];
  const verdict = [
    mono(`${SECOND.blocks} > ${slots - blocks}`, { color: COLOR.fail }),
    note(`${SECOND.request} waits`, { color: COLOR.other }),
  ];
  const owner = chip('the owner: not ready yet', { color: COLOR.mark, stroke: COLOR.mark });
  place(
    column(
      [
        grid([requestSize, requested, ...freeName, ...verdict], {
          columns: 2,
          gap: ['normal', 'tight'],
        }),
        owner,
      ],
      { gap: 'normal' },
    ),
    counts,
    'top left',
  );
  place(reserved, boxOf(requested), 'left');

  // The path of the link, and what to compare when transfers share it.
  const path = place(
    row([note('the path'), chipRow(['GPU interconnect', 'RDMA'])], {
      gap: 'normal',
      align: 'center',
    }),
    mid.rows([3, 1], 'none')[1],
  );
  const compareName = note('compare');
  const compare = chipRow(['model shape', 'payload size', 'network path'], {
    maxWidth: measures.width,
  });
  const times = chipRow(['queue time', 'transfer duration'], {
    color: COLOR.mark,
    stroke: COLOR.mark,
  });
  place(column([compareName, compare, times], { gap: 'tight' }), measures, 'top');

  // The traffic of other requests: blocks that pass on the rails of the segments that are done.
  const traffic = s.value(0);
  const others = dynamic((time) => {
    if (traffic.value <= 0) return null;
    const nodes = [];
    for (let rail = 0; rail < 3; rail++)
      for (let index = 0; index < 3; index++) {
        const u = (time * 0.22 + index / 3 + rail * 0.13) % 1;
        const edge = Math.min(clamp(u / 0.08, 0, 1), clamp((1 - u) / 0.08, 0, 1));
        nodes.push(
          block(
            [
              lerp(mid.left + CELL / 2, mid.right - CELL / 2, u),
              board.source.p(rail * segmentBlocks)[1],
            ],
            COLOR.other,
            {
              opacity: traffic.value * edge,
            },
          ),
        );
      }
    return nodes;
  });

  s.add(heading(c.title), board.standing, candidateMarks, others);

  // Beat 0: the reservation first. The second request does not fit.
  c.on('reserve-first', () => s.play(candidates.to(blocks - 1, { duration: 1.8 })));
  c.show('reserve-before', [requestSize, requested]);
  c.after(
    'reserve-fits',
    () => {
      s.play(candidates.to(blocks, { duration: 0.2, ease: linear }));
      board.reserved.set(blocks);
      s.remove(requested);
      s.add(reserved, freeName);
      requestSize.color(COLOR.valid);
    },
    0.04,
  );
  c.show('reserve-second', [queueName, second]);
  c.on('reserve-second', () => s.play(asked.to(1, { duration: 0.3 })));
  c.on('reserve-second', () => s.play(attempt.to(0.35, { duration: 1.2 })), 0.5);
  c.after('reserve-second', () => s.play(attempt.to(1, { duration: 0.25, ease: linear })), 0.04);
  c.after('reservation-second-verdict', () => s.play(attempt.to(0, { duration: 1 })), 0.04);
  c.show('reservation-second-verdict', verdict, { after: true, lead: -0.04 });

  // Beat 1: the blocks cross the link. Bytes that arrive do not make the handoff ready.
  const cross = c.cue('transfer-owner');
  c.on('transfer-engine', () =>
    s.play(
      board.sent.to(blocks / 2, {
        duration: cross.end - c.cue('transfer-engine').start,
        ease: linear,
      }),
    ),
  );
  c.show('transfer-path', path);
  c.show('transfer-owner', owner);

  // Beat 2: other requests use the same link, and the rest of the state crosses beside them.
  const share = c.cue('transfer-times');
  c.on('transfer-overlap', () =>
    s.play(
      traffic.to(1, { duration: 0.4 }),
      board.sent.to(blocks, {
        duration: share.end - c.cue('transfer-overlap').start,
        ease: linear,
      }),
    ),
  );
  c.show('transfer-compare', [compareName, compare]);
  c.show('transfer-times', times);
}
