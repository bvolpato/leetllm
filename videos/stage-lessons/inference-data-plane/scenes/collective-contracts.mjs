// Scene `collective-contracts`: what combines inside a group, and what moves between groups.
//
// The picture, first beat: the board. Each verb of the control plane changes it, and then the data
// plane moves the blocks. The picture, other beats: the two ranks of one tensor-parallel group.
// Their numbers fly to the outputs and add there. Rank 1 swaps the order of its layers, and the
// same flight gives wrong sums. A strip of four boundaries then moves over outputs that stay
// hollow until the GPU is done.
import {
  arrow,
  beside,
  between,
  boxOf,
  brace,
  circumscribe,
  clamp,
  column,
  draw,
  dynamic,
  fitted,
  grid,
  indicate,
  lerp,
  linear,
  place,
  rect,
  row,
  shake,
  smoothstep,
  steps,
  text,
  to,
} from 'vizmatic/stage';
import { area, chip, chipRow, heading, label, note } from '../../kit-narrated.mjs';
import { BOARD, CELL, COLOR, FIXTURE, FOOT, cellRow, handoff } from '../parts.mjs';

/** The inputs of the narration: rank 0 holds 1 and 2, and rank 1 holds 10 and 20. */
const INPUT = [
  [1, 2],
  [10, 20],
];
const RANK = [COLOR.state, COLOR.other];
/** The side of a cell of a rank, the side of a number in flight, and the room between two cells. */
const SIDE = 116;
const MINI = 54;
const ROOM = 14;
/** The room between the two ranks, and between a name and the cells: a swap turns a cell into it. */
const LANE_GAP = 60;
const NAME_GAP = 160;
/** The room that a number crosses, from the cells of a rank to its outputs. */
const FLIGHT = 240;
const OP = { none: 0, allReduce: 1, allGather: 2, reduceScatter: 3, allGatherReduced: 4 };

export default function collectiveContracts(s, c) {
  const { blocks } = FIXTURE;

  // ---- Beat 0: the board. The control plane decides, and the data plane carries.
  const board = handoff(s, { made: blocks });
  const [outBand, laneBand] = FOOT.rows([1, 2], 'normal');
  const tokens = s.value(0);
  const output = cellRow(8, () => tokens.value, {
    width: boxOf(board.dest.panel).width,
    height: CELL,
  });
  const outputName = note('output tokens');
  place(column([output.bed, outputName], { gap: 'tight' }), outBand, 'top right');
  const dataName = place(label('data plane', { color: COLOR.state }), BOARD, 'top');
  const controlName = label('control plane', { color: COLOR.control });
  const verbs = fitted(laneBand.width * 0.72, (width) =>
    steps(['authorize', 'place', 'reserve', 'assign one owner'], {
      width,
      height: 84,
      size: 34,
      color: COLOR.control,
    }),
  );
  place(row([controlName, verbs], { gap: 'wide', align: 'center' }), laneBand, 'left');
  const mid = between(board.source.panel, board.dest.panel);
  const owner = place(
    chip(`owner of ${FIXTURE.request}`, { color: COLOR.control, stroke: COLOR.control }),
    mid.rows([3, 1], 'none')[1],
  );

  // The ranks of the decode group, at the left of its pool, and the two kinds of movement.
  const panel = boxOf(board.dest.panel);
  const rowY = (index) => board.dest.p(index * 8)[1];
  const braces = [0, 1].map((rank) =>
    brace(
      [panel.left - 14, rowY(rank * 3 + 2) + CELL / 2],
      [panel.left - 14, rowY(rank * 3) - CELL / 2],
      {
        stroke: RANK[rank],
        width: 3,
        depth: 20,
      },
    ),
  );
  const rankNames = braces.map((mark, rank) =>
    beside(label(`rank ${rank}`, { color: RANK[rank] }), mark, 'left', 'tight'),
  );
  const joinX = boxOf(rankNames[0]).cx;
  const join = arrow([joinX, boxOf(rankNames[0]).bottom], [joinX, boxOf(rankNames[1]).top], {
    stroke: COLOR.mark,
    width: 4,
    pad: 6,
    both: true,
  });
  const joinName = beside(label('collective', { color: COLOR.mark }), join, 'left', 'normal');
  const moveY = boxOf(joinName).cy;
  const move = arrow([boxOf(board.source.panel).right, moveY], [boxOf(joinName).left, moveY], {
    stroke: COLOR.state,
    width: 4,
    pad: 24,
  });
  const moveName = beside(label('transfer', { color: COLOR.state }), move, 'above', 'tight');

  s.add(heading(c.title), board.standing, dataName, controlName, verbs, output.marks, outputName);
  c.on('control-authorizes', () =>
    s.play(
      verbs.go(0, { duration: 0.3 }),
      circumscribe(board.source.panel, { color: COLOR.control, pad: 6 }),
    ),
  );
  c.on('control-places', () =>
    s.play(
      verbs.go(1, { duration: 0.3 }),
      circumscribe(board.dest.panel, { color: COLOR.control, pad: 6 }),
    ),
  );
  c.on('control-reserves', () =>
    s.play(verbs.go(2, { duration: 0.3 }), board.reserved.to(blocks, { duration: 0.7 })),
  );
  c.on('control-assigns', () => s.play(verbs.go(3, { duration: 0.3 })));
  c.show('control-assigns', owner);
  const carry = c.cue('data-carries');
  c.on('data-carries', () =>
    s.play(
      verbs.go(null, { duration: 0.3 }),
      indicate(dataName, { color: COLOR.state }),
      board.sent.to(blocks, { duration: carry.end - carry.start - 0.6 }),
    ),
  );
  c.after(
    'data-carries',
    () => s.play(board.valid.to(1, { duration: 0.5 }), tokens.to(1, { duration: 0.6 })),
    -0.5,
  );
  c.on('data-responsibilities', () =>
    s.play(
      indicate(controlName, { color: COLOR.control }),
      indicate(dataName, { color: COLOR.state }),
    ),
  );
  c.hide('collective-inside', [board.rails, owner]);
  c.show('collective-inside', [draw(braces[0]), draw(braces[1]), rankNames, draw(join), joinName]);
  c.show('collective-between', [draw(move), moveName]);
  const boardNodes = [
    board.standing.filter((node) => node !== board.rails),
    dataName,
    controlName,
    verbs,
    output.marks,
    outputName,
    braces,
    rankNames,
    join,
    joinName,
    move,
  ];

  // ---- Beats 1 to 3: the two ranks of one group. Each rank holds two numbers, one over the other.
  const [head, lanes, foot] = area.rows([1, 6, 2], 'normal');
  const names = [0, 1].map((rank) => label(`rank ${rank}`, { color: RANK[rank] }));
  const inBeds = [0, 1].map(() => rect(SIDE, 2 * SIDE + ROOM, { fill: null, stroke: null }));
  const outBeds = [0, 1].map(() => rect(4 * SIDE + 3 * ROOM, SIDE, { fill: null, stroke: null }));
  // One table for the two ranks: the name, the inputs, the room that the numbers cross, the outputs.
  const crossing = [0, 1].map(() => rect(FLIGHT, 1, { fill: null, stroke: null }));
  place(
    grid(
      [0, 1].flatMap((rank) => [names[rank], inBeds[rank], crossing[rank], outBeds[rank]]),
      { columns: 4, gap: [NAME_GAP, LANE_GAP] },
    ),
    lanes,
  );
  const inAt = (rank, index) => {
    const box = boxOf(inBeds[rank]);
    return [box.cx, box.top + SIDE / 2 + index * (SIDE + ROOM)];
  };
  const outAt = (rank, index) => {
    const box = boxOf(outBeds[rank]);
    return [box.left + SIDE / 2 + index * (SIDE + ROOM), box.cy];
  };

  const swapped = s.value(0), // 0 to 1: rank 1 turns its two cells around their middle
    tags = s.value(0), // 0 to 1: each input shows the layer that it belongs to
    skip = s.value(0), // 0 to 1: rank 1 leaves the call
    op = s.value(OP.none), // the collective that runs
    run = s.value(1), // 0 to 1: how far the collective is
    blank = s.value(1), // 0 to 1: no collective ran yet, and the outputs are empty frames
    pending = s.value(0), // 0 to 1: the outputs are issued, and the GPU has not made them
    ready = s.value(0); // 0 to 1: a consumer may read the outputs

  const number = (value, [x, y], color, { size = 48, opacity = 1 } = {}) =>
    text(String(value), { font: 'mono', size, color }).at(x, y).opacity(opacity);
  const frame = ([x, y], color, { side = SIDE, opacity = 1, dash = null } = {}) =>
    rect(side, side, {
      fill: 'surface',
      stroke: color,
      width: 3,
      radius: 12,
      opacity,
      ...(dash ? { dash } : {}),
    }).at(x, y);
  const HOLLOW = [10, 8];
  /** True when rank 1 has its two layers in the other order. */
  const turned = () => swapped.value > 0.5;
  /** The number at a place of a rank now. */
  const valueOf = (rank, index) =>
    rank === 1 && turned() ? INPUT[1][1 - index] : INPUT[rank][index];
  const layer = ['A', 'B'];

  const inputs = [0, 1].map((rank) =>
    dynamic(() => {
      const lit = rank === 1 ? 1 - 0.7 * skip.value : 1;
      return [0, 1].flatMap((index) => {
        // Rank 1 turns its two cells around their middle: one passes at the right, the other at the left.
        const [ax, ay] = inAt(rank, index),
          middle = (inAt(rank, 0)[1] + inAt(rank, 1)[1]) / 2,
          angle = rank === 1 ? Math.PI * swapped.value : 0;
        // The turn is wide, so that the corners of the two cells stay clear of each other.
        const at = [
          ax - 2 * (ay - middle) * Math.sin(angle),
          middle + (ay - middle) * Math.cos(angle),
        ];
        return [
          frame(at, RANK[rank], { opacity: lit }),
          number(INPUT[rank][index], [at[0], at[1] - tags.value * 12], RANK[rank], {
            opacity: lit,
          }),
          tags.value > 0 &&
            text(`layer ${layer[index]}`, { size: 28, color: 'dim' })
              .at(at[0], at[1] + SIDE / 2 - 27)
              .opacity(tags.value * lit),
        ].filter(Boolean);
      });
    }),
  );

  /** Where a number leaves its cell: at the right of the cell. Two copies leave one over the other. */
  const leave = (rank, index, lane) => {
    const [x, y] = inAt(rank, index);
    return [x + SIDE / 2 + 10 + MINI / 2, y + lane * (MINI / 2 + 2)];
  };
  /** Where an addend lands in the cell of a sum. Rank 0 arrives first and takes the far half. */
  const addend = (rank, [x, y]) => [x + (rank ? -1 : 1) * (MINI / 2 + 1), y];
  /**
   * The numbers that fly for a collective. Each cell sends in its turn, and the cell with the
   * farthest place sends first, so no number passes over a number that has landed.
   */
  const flights = (kind) => {
    const list = [];
    for (const rank of [0, 1])
      for (const index of [0, 1]) {
        const value = valueOf(rank, index),
          turn = (1 - index) * 2 + rank;
        if (kind === OP.allReduce)
          for (const to of [0, 1])
            list.push({
              from: leave(rank, index, to ? 1 : -1),
              to: addend(rank, outAt(to, index)),
              value,
              rank,
              turn,
            });
        if (kind === OP.allGather)
          for (const to of [0, 1])
            list.push({
              from: leave(rank, index, to ? 1 : -1),
              to: outAt(to, rank * 2 + index),
              value,
              rank,
              turn: 3 - (rank * 2 + index),
            });
        if (kind === OP.reduceScatter)
          list.push({
            from: leave(rank, index, 0),
            to: addend(rank, outAt(index, index)),
            value,
            rank,
            turn,
          });
      }
    return list;
  };
  const sums = () => [0, 1].map((index) => valueOf(0, index) + valueOf(1, index));
  /** The outputs of a collective: a place, a value, the rank that has it, and the rank that gave it. */
  const results = (kind) => {
    if (kind === OP.allReduce || kind === OP.allGatherReduced)
      return [0, 1].flatMap((to) =>
        [0, 1].map((index) => ({ at: outAt(to, index), value: sums()[index], to })),
      );
    if (kind === OP.allGather)
      return [0, 1].flatMap((to) =>
        [0, 1].flatMap((rank) =>
          [0, 1].map((index) => ({
            at: outAt(to, rank * 2 + index),
            value: valueOf(rank, index),
            rank,
            to,
          })),
        ),
      );
    // Each rank keeps the chunk of its own index.
    if (kind === OP.reduceScatter)
      return [0, 1].map((to) => ({ at: outAt(to, to), value: sums()[to], to }));
    return [];
  };
  const drawResult = (result, opacity) => {
    const here = opacity * (result.to === 1 ? 1 - skip.value : 1);
    if (here <= 0) return [];
    // A sum is wrong when rank 1 gave its layers in the other order.
    const color =
      result.rank !== undefined
        ? RANK[result.rank]
        : turned()
          ? COLOR.fail
          : ready.value > 0.5
            ? COLOR.valid
            : 'ink';
    const hollow = Math.max(pending.value, result.to === 0 ? skip.value : 0);
    return [
      frame(result.at, hollow > 0.5 ? 'dim' : color, {
        opacity: here,
        dash: hollow > 0.5 ? HOLLOW : null,
      }),
      hollow < 1 && number(result.value, result.at, color, { opacity: here * (1 - hollow) }),
    ].filter(Boolean);
  };
  const outputs = dynamic(() => {
    const kind = Math.round(op.value),
      t = run.value;
    const marks = [];
    if (blank.value > 0)
      for (const to of [0, 1])
        for (const index of [0, 1])
          marks.push(frame(outAt(to, index), 'dim', { opacity: blank.value, dash: HOLLOW }));
    if (kind === OP.none) {
      // The outputs of the last all-reduce leave.
      if (t < 1 && blank.value <= 0)
        for (const result of results(OP.allReduce)) marks.push(...drawResult(result, 1 - t));
      return marks;
    }
    if (kind === OP.allGatherReduced) {
      // Each chunk goes to the other rank as a copy, and it shows when it is clear of its cell.
      if (t >= 1) for (const result of results(kind)) marks.push(...drawResult(result, 1));
      else {
        for (const result of results(OP.reduceScatter)) marks.push(...drawResult(result, 1));
        const e = smoothstep(clamp(t / 0.85, 0, 1));
        for (const [from, to, value] of [
          [outAt(0, 0), outAt(1, 0), sums()[0]],
          [outAt(1, 1), outAt(0, 1), sums()[1]],
        ]) {
          const at = [lerp(from[0], to[0], e), lerp(from[1], to[1], e)];
          const clear = clamp((Math.abs(at[1] - from[1]) - SIDE - 4) / 24, 0, 1);
          if (clear > 0)
            marks.push(
              frame(at, 'ink', { opacity: clear }),
              number(value, at, 'ink', { opacity: clear }),
            );
        }
      }
      return marks;
    }
    // The outputs of the collective before this one leave as this one starts.
    if (kind > OP.allReduce && t < 0.2)
      for (const result of results(kind - 1)) marks.push(...drawResult(result, 1 - t / 0.2));
    for (const flight of flights(kind)) {
      const local = clamp((t - 0.14 * flight.turn) / 0.42, 0, 1);
      const fade = Math.min(clamp(local / 0.12, 0, 1), 1 - clamp((t - 0.86) / 0.05, 0, 1));
      if (local <= 0 || fade <= 0) continue;
      const e = smoothstep(local);
      const at = [lerp(flight.from[0], flight.to[0], e), lerp(flight.from[1], flight.to[1], e)];
      marks.push(
        frame(at, RANK[flight.rank], { side: MINI, opacity: fade }),
        number(flight.value, at, RANK[flight.rank], { size: 30, opacity: fade }),
      );
    }
    const settled = clamp((t - 0.93) / 0.07, 0, 1);
    if (settled > 0) for (const result of results(kind)) marks.push(...drawResult(result, settled));
    return marks;
  });
  const play = (kind, duration) => {
    op.set(kind);
    run.set(0);
    return run.to(1, { duration, ease: linear });
  };

  const ops = place(
    fitted(foot, (width) =>
      steps(
        [
          { label: 'all-reduce', note: 'the sum, to all' },
          { label: 'all-gather', note: 'every part, in rank order' },
          { label: 'reduce-scatter', note: 'the sum, one chunk each' },
          { label: 'all-gather', note: 'reduced chunks, to all' },
        ],
        { width, height: 84, size: 34, noteSize: 29, color: COLOR.mark },
      ),
    ),
    foot,
    'top',
  );
  const bounds = place(
    fitted(foot, (width) =>
      steps(['host returned', 'group ended', 'work issued', 'GPU complete', 'consumer may read'], {
        width,
        height: 84,
        size: 34,
        color: COLOR.mark,
        current: 0,
      }),
    ),
    foot,
    'top',
  );
  const agree = chipRow(['operation', 'count', 'dtype', 'sequence']);
  const agreeName = note('both ranks agree on');
  place(row([agreeName, agree], { gap: 'normal', align: 'center' }), head);

  // Beat 1: the board leaves, and the ranks arrive. Each collective sends the numbers to the outputs.
  c.swap('collective-inputs-0', boardNodes, [names, inputs[0], outputs, ops]);
  c.hide('collective-inputs-0', moveName, { lead: -0.4, fade: 0.25 });
  c.show('collective-inputs-1', inputs[1]);
  const reduce = c.cue('collective-all-reduce');
  c.on('collective-all-reduce', () => {
    op.set(OP.allReduce);
    run.set(0);
    s.play(
      ops.go(0, { duration: 0.3 }),
      blank.to(0, { duration: 1.6 }),
      run.to(0.86, { duration: reduce.end - reduce.start, ease: linear }),
    );
  });
  // Hold the contributing pairs until the complete result clause has ended.
  c.after('collective-all-reduce', () => s.play(run.to(1, { duration: 0.2, ease: linear })), 0.04);
  const concatenate = c.cue('collective-all-gather');
  c.on('collective-all-gather', () => {
    op.set(OP.allGather);
    run.set(0);
    s.play(
      ops.go(1, { duration: 0.3 }),
      run.to(0.425, { duration: concatenate.end - concatenate.start, ease: linear }),
    );
  });
  c.after('collective-all-gather', () => s.play(run.to(1, { duration: 0.2, ease: linear })), 0.04);
  const scatter = c.cue('collective-reduce-scatter');
  c.on('collective-reduce-scatter', () => {
    op.set(OP.reduceScatter);
    run.set(0);
    s.play(
      ops.go(2, { duration: 0.3 }),
      run.to(0.86, { duration: scatter.end - scatter.start, ease: linear }),
    );
  });
  c.after(
    'collective-reduce-scatter',
    () => s.play(run.to(1, { duration: 0.2, ease: linear })),
    0.04,
  );
  const gather = c.cue('collective-gather-reduced');
  c.on('collective-gather-reduced', () => {
    op.set(OP.allGatherReduced);
    run.set(0);
    s.play(
      ops.go(3, { duration: 0.3 }),
      run.to(0.425, { duration: gather.end - gather.start, ease: linear }),
    );
  });
  // Keep the copied chunks between ranks until the complete result clause has ended.
  c.after(
    'collective-gather-reduced',
    () => s.play(run.to(1, { duration: 0.35, ease: linear })),
    0.04,
  );

  // Beat 2: rank 1 gives its layers in the other order. The shapes still match, and the sums are wrong.
  c.show('collective-agree', [agreeName, agree]);
  c.on('collective-agree', () =>
    s.play(ops.go(0, { duration: 0.3 }), tags.to(1, { duration: 0.5 })),
  );
  c.on('collective-swapped', () => {
    op.set(OP.none);
    run.set(0);
    s.play(
      run.to(1, { duration: 0.4 }),
      swapped.to(1, { duration: 1.4 }),
      to(agree.chips[3].text, (n) => n.color(COLOR.fail), { duration: 0.5 }),
      to(agree.chips[3].frame, (n) => n.stroke(COLOR.fail), { duration: 0.5 }),
    );
  });
  c.after('collective-swapped', () => {
    op.set(OP.allReduce);
    run.set(0);
    s.play(
      run.to(0.86, {
        duration: c.cue('collective-wrong').end - c.cue('collective-swapped').end,
        ease: linear,
      }),
    );
  });
  c.after(
    'collective-wrong',
    () => s.play(run.to(1, { duration: 0.2, ease: linear }), shake(outputs)),
    0.04,
  );
  c.on('collective-cancel', () => s.play(skip.to(1, { duration: 0.6 })));
  c.on('collective-repaired', () => {
    op.set(OP.none);
    run.set(0);
    s.play(
      run.to(1, { duration: 0.4 }),
      skip.to(0, { duration: 0.5 }),
      swapped.to(0, { duration: 1.2 }),
      to(agree.chips[3].text, (n) => n.color('ink'), { duration: 0.5 }),
      to(agree.chips[3].frame, (n) => n.stroke('gridStrong'), { duration: 0.5 }),
    );
    s.play(play(OP.allReduce, 2));
  });

  // Beat 3: four boundaries of one call. The outputs are hollow until the GPU has made them.
  c.swap(3, [ops, agreeName, agree], bounds);
  c.on('boundary-host', () =>
    s.play(pending.to(1, { duration: 0.5 }), tags.to(0, { duration: 0.5 })),
  );
  c.on('boundary-group', () => s.play(bounds.go(1, { duration: 0.3 })));
  c.after('boundary-issued', () => s.play(bounds.go(2, { duration: 0.3 })));
  c.after('boundary-gpu', () =>
    s.play(bounds.go(3, { duration: 0.3 }), pending.to(0, { duration: 0.6 })),
  );
  c.after('boundary-consumer', () =>
    s.play(bounds.go(4, { duration: 0.3 }), ready.to(1, { duration: 0.5 })),
  );
}
