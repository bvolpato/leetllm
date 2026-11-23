import assert from 'node:assert/strict';
import {
  draw,
  dynamic,
  fadeIn,
  lagged,
  line,
  linear,
  Node,
  rect,
  seq,
  smoother,
  to,
  write,
} from 'vizmatic/stage';
import { chip, sceneHeading } from '../../../stage-lessons/kit.mjs';
import {
  SLOTS,
  TABLE,
  QUERY,
  PAIRS,
  storage,
  attend,
  showPair,
  PAGED_READ,
  PAST_THE_END,
} from '../model.mjs';

/** Resolve this scene's read, including the unused slots owned by A. */
export function kernelReadState(length = PAIRS.length) {
  assert.ok(Number.isInteger(length) && length >= 0 && length <= TABLE.length * SLOTS);
  const reads = Array.from({ length }, (_, position) => {
    const logicalBlock = Math.floor(position / SLOTS);
    const block = TABLE[logicalBlock];
    const slot = position % SLOTS;
    const pair = storage.get(block)[slot].map((vector) => [...vector]);
    const score = pair[0].reduce((sum, value, axis) => sum + QUERY[axis] * value, 0) / Math.SQRT2;
    return { position, logicalBlock, block, slot, valid: position < PAIRS.length, pair, score };
  });
  const top = Math.max(...reads.map((read) => read.score));
  const exponentials = reads.map((read) => Math.exp(read.score - top));
  const total = exponentials.reduce((sum, value) => sum + value, 0);
  return {
    query: [...QUERY],
    validLength: PAIRS.length,
    reads: reads.map((read, index) => ({ ...read, weight: exponentials[index] / total })),
    output: length
      ? attend(
          QUERY,
          reads.map((read) => read.pair),
        )
      : null,
  };
}

/** The kernel has to follow the table. */
export function buildKernel(
  stage,
  narration,
  { T, M, S, place, brief, fadeOut, bar, clearScene, retitle, pulse, arrive, clearFirst, handoff },
  { placeA, placeB, placeC },
) {
  const kernel = narration.scene('kernel');
  retitle(kernel, sceneHeading(stage, kernel, narration.title('kernel')), [
    ['only-answer', 'Another design: vAttention'],
  ]);
  const correct = kernelReadState();
  const overread = kernelReadState(PAIRS.length + 1);
  const badRead = overread.reads.at(-1);
  assert.deepEqual(correct.output, PAGED_READ);
  assert.deepEqual(overread.output, PAST_THE_END);
  assert.equal(badRead.block, TABLE.at(-1));
  assert.equal(badRead.valid, false);

  // The top row stays in address order. The lower row is A's logical history.
  const STRIP = [
    [2, 'A'],
    [4, 'B'],
    [7, 'A'],
    [8, 'free'],
    [9, 'C'],
  ];
  assert.ok(
    placeA.includes(2) &&
      placeA.includes(7) &&
      placeB.includes(4) &&
      placeC.includes(9) &&
      ![...placeA, ...placeB, ...placeC].includes(8),
  );
  const ownerTint = { A: 'blue', B: 'orange', C: 'green', free: 'dim' };
  const K_CELL = 70;
  const K_BLOCK = SLOTS * K_CELL + 30;
  const K_LEFT = -((STRIP.length - 1) * K_BLOCK) / 2;
  const K_Y = -255;
  const TABLE_Y = -15;
  const ROW_LEFT = -800;
  const ROW_CELL = 224;
  const ROW_Y = 155;
  const stripIndex = (block) => STRIP.findIndex(([id]) => id === block);
  const blockX = (block) => K_LEFT + stripIndex(block) * K_BLOCK;
  const slotPoint = (block, slot) => [
    blockX(block) - ((SLOTS - 1) * K_CELL) / 2 + slot * K_CELL,
    K_Y,
  ];
  const rowPoint = (position) => [ROW_LEFT + ROW_CELL / 2 + position * ROW_CELL, ROW_Y];
  const tablePoint = (logical) => [ROW_LEFT + 110 + logical * 240, TABLE_Y];
  const stripBlocks = STRIP.map(([id, owner]) => {
    const node = new Node();
    const tint = ownerTint[owner];
    node.add(
      rect(K_BLOCK - 14, 120, {
        radius: 12,
        fill: 'surface',
        stroke: tint,
        width: owner === 'A' ? 3 : 1.5,
      }).at(blockX(id), K_Y),
      M('block ' + id + (owner === 'free' ? ', free' : ' · ' + owner), {
        size: 32,
        color: tint,
      }).at(blockX(id), K_Y - 88),
    );
    for (let slot = 0; slot < SLOTS; slot++) {
      const position = TABLE.indexOf(id) * SLOTS + slot;
      const valid = owner === 'A' && position < PAIRS.length;
      const other = owner === 'B' || owner === 'C';
      node.add(
        rect(K_CELL - 8, 84, {
          radius: 6,
          fill: valid ? 'blue' : other ? tint : 'bg',
          stroke: valid || other ? null : 'dim',
          width: 1.5,
        })
          .opacity(valid ? 0.92 : other ? 0.4 : 1)
          .at(...slotPoint(id, slot)),
      );
      if (owner === 'A')
        node.add(
          M(valid ? String(position) : '?', { size: 36, color: valid ? 'bg' : 'dim' }).at(
            ...slotPoint(id, slot),
          ),
        );
    }
    return node;
  });
  const addressNote = place(
    M('Physical memory, by address', { size: 34, color: 'dim' }),
    -800,
    -395,
  );
  const tableName = place(M('A table', { size: 34, color: 'yellow' }), ROW_LEFT, -88);
  const tableChips = TABLE.map((block, logical) =>
    chip(logical + ' → ' + block, { w: 220, h: 76, color: 'yellow', size: 42 }).at(
      ...tablePoint(logical),
    ),
  );
  const positionName = place(T('A in logical order', { size: 38, color: 'blue' }), ROW_LEFT, 270);
  const copyName = place(T('Copied buffer', { size: 38, color: 'teal' }), ROW_LEFT, 270);
  const readName = place(T('Logical read order', { size: 38, color: 'blue' }), ROW_LEFT, 270);
  const positionTiles = overread.reads.map((read) =>
    rect(ROW_CELL - 12, 124, {
      radius: 10,
      fill: 'surface',
      stroke: read.valid ? 'blue' : 'dim',
      width: 2,
    }).at(...rowPoint(read.position)),
  );
  const makeReadCell = (read, color) => {
    const node = new Node();
    node.add(
      rect(ROW_CELL - 12, 124, { radius: 10, fill: 'surface', stroke: color, width: 3 }),
      M(String(read.position), { size: 30, color }).at(0, -39),
      M('K ' + read.pair[0].join(','), { size: 28, color }).at(0, 0),
      M('V ' + read.pair[1].join(','), { size: 28, color }).at(0, 37),
    );
    return node;
  };
  const readCells = overread.reads.map((read) =>
    makeReadCell(read, read.valid ? 'blue' : 'red').at(...rowPoint(read.position)),
  );
  const copyCells = correct.reads.map((read) =>
    makeReadCell(read, 'teal').at(...rowPoint(read.position)),
  );
  const setupNote = place(
    T('One history, scattered blocks', { size: 62, color: 'blue' }),
    ROW_LEFT,
    350,
  );
  kernel.at(0.05, () =>
    stage.play(
      lagged(
        stripBlocks.map((node) => fadeIn(node, { scale: 0.92 })),
        { lag: 0.1 },
      ),
      fadeIn([
        addressNote,
        tableName,
        ...tableChips,
        positionName,
        ...positionTiles.slice(0, PAIRS.length),
      ]),
      { duration: 0.45 },
    ),
  );
  kernel.on('easy-miss', () => stage.play(fadeIn(setupNote), { duration: 0.35 }));

  const naiveNote = place(
    T('A continuous kernel walks forward', { size: 54, color: 'yellow' }),
    ROW_LEFT,
    350,
  );
  const copyNote = place(
    T('Copy first: extra work and a second buffer', { size: 50, color: 'teal' }),
    ROW_LEFT,
    430,
  );
  const wrongRead = place(
    T('Next address: block 8 is free, not A', { size: 50, color: 'red' }),
    ROW_LEFT,
    350,
  );
  const pointerAt = stage.value(0);
  const pointer = dynamic(() => {
    const x = slotPoint(TABLE[0], 0)[0] + pointerAt.value * K_CELL;
    return line([x, K_Y + 62], [x, K_Y + 125], {
      stroke: pointerAt.value > SLOTS - 0.5 ? 'red' : 'yellow',
      width: 6,
    });
  });
  kernel.on('must-change', () =>
    handoff([setupNote], () => arrive(fadeIn([pointer, naiveNote]), { duration: 0.3 }), clearFirst),
  );

  // Transfers carry a slot. Its K/V labels appear only once it reaches the ordered row.
  const transfers = [];
  function pullSlot(read, cell, seconds) {
    const source = slotPoint(read.block, read.slot);
    const target = rowPoint(read.position);
    const packet = rect(K_CELL - 8, 84, {
      radius: 6,
      fill: read.valid ? 'blue' : 'red',
      stroke: null,
    })
      .at(...source)
      .zIndex(4);
    transfers.push(packet);
    // Both routes avoid the table and the labels in the other populated cells.
    const path =
      read.logicalBlock === 0
        ? [[source[0], ROW_Y], target]
        : [[source[0], -130], [target[0], -130], target];
    stage.play(fadeIn(packet), { duration: seconds * 0.08 });
    stage.play(seq(...path.map(([x, y]) => to(packet, (node) => node.at(x, y)))), {
      duration: seconds * 0.72,
      ease: smoother,
    });
    stage.play(seq(fadeOut(packet), fadeIn(cell)), { duration: seconds * 0.2 });
  }
  kernel.on('copy-back', () => {
    stage.play(seq(fadeOut(positionName), fadeIn(copyName)), fadeIn(copyNote), {
      duration: 0.3,
    });
    for (const read of correct.reads) pullSlot(read, copyCells[read.position], 0.22);
  });
  kernel.on('cant-point', () => {
    stage.play(seq(fadeOut(naiveNote), fadeIn(wrongRead)), {
      duration: 0.4,
    });
    stage.play(pointerAt.to(SLOTS + 1, { ease: linear }), { duration: 1 });
  });

  const tableRings = TABLE.map((_, logical) =>
    rect(236, 92, { radius: 12, stroke: 'yellow', width: 5 })
      .at(...tablePoint(logical))
      .zIndex(3),
  );
  const slotRings = overread.reads.map((read) =>
    rect(K_CELL + 4, 100, { radius: 10, stroke: 'yellow', width: 5 })
      .at(...slotPoint(read.block, read.slot))
      .zIndex(3),
  );
  const posRings = overread.reads.map((read) =>
    rect(ROW_CELL - 2, 136, { radius: 12, stroke: 'yellow', width: 5 })
      .at(...rowPoint(read.position))
      .zIndex(3),
  );
  const tableLinks = TABLE.map((block, logical) => {
    const [x, y] = tablePoint(logical);
    const elbowX = x + 142;
    const laneY = -145 - logical * 16;
    const node = new Node();
    node.add(
      line([x + 118, y], [elbowX, y], { stroke: 'yellow', width: 4 }),
      line([elbowX, y], [elbowX, laneY], { stroke: 'yellow', width: 4 }),
      line([elbowX, laneY], [blockX(block), laneY], { stroke: 'yellow', width: 4 }),
      line([blockX(block), laneY], [blockX(block), K_Y + 64], { stroke: 'yellow', width: 4 }),
    );
    return node;
  });
  const switchRing = (from, into) => seq(fadeOut(from), fadeIn(into));
  const stepNotes = overread.reads.map((read) =>
    place(
      M('i ' + read.position + ' → ' + read.block + ':' + read.slot, {
        size: 40,
        color: read.valid ? 'yellow' : 'red',
      }),
      ROW_LEFT,
      348,
    ),
  );
  const loadNote = place(
    T('Position → block:slot. Load K and V.', { size: 44, color: 'blue' }),
    ROW_LEFT,
    430,
  );
  kernel.on('finds', () =>
    handoff(
      [naiveNote, wrongRead, copyNote, copyName, pointer, ...copyCells],
      () =>
        arrive(
          fadeIn([readName, tableRings[0], slotRings[0], posRings[0], stepNotes[0]]),
          draw(tableLinks[0]),
          {
            duration: 0.3,
          },
        ),
      clearFirst,
    ),
  );
  kernel.on('load', () => {
    // Use the measured phrase window. The row is complete before the result is revealed.
    const stepSeconds = Math.min(
      0.72,
      (kernel.cue('same').end - kernel.cue('load').start - 0.4) / PAIRS.length,
    );
    assert.ok(stepSeconds >= 0.25, 'The load-to-result window is too short for the table walk.');
    stage.play(fadeIn(loadNote), { duration: 0.15 });
    for (const read of correct.reads) {
      const changes = [];
      if (read.position > 0)
        changes.push(
          switchRing(posRings[read.position - 1], posRings[read.position]),
          switchRing(slotRings[read.position - 1], slotRings[read.position]),
          seq(fadeOut(stepNotes[read.position - 1]), fadeIn(stepNotes[read.position])),
        );
      if (read.position === SLOTS)
        changes.push(
          switchRing(tableRings[0], tableRings[read.logicalBlock]),
          seq(fadeOut(tableLinks[0]), draw(tableLinks[read.logicalBlock])),
        );
      stage.play(...changes, { duration: stepSeconds * 0.2 });
      pullSlot(read, readCells[read.position], stepSeconds * 0.8);
    }
  });
  const formula = place(M('softmax(qK / √2) × V', { size: 42, color: 'ink' }), ROW_LEFT, 330);
  const pagedResult = place(
    M('paged: ' + showPair(correct.output), { size: 52, color: 'green' }),
    ROW_LEFT,
    400,
  );
  const flatResult = place(
    M('continuous: ' + showPair(attend(QUERY, PAIRS)), { size: 46, color: 'green' }),
    0,
    400,
  );
  const madeUp = place(
    S('Made-up K/V for q = (' + QUERY.join(', ') + ')', { size: 32, color: 'dim' }),
    ROW_LEFT,
    480,
  );
  kernel.on('same', () => stage.play(pulse(readName, 1.02), { duration: 0.5 }));
  kernel.after('same', () =>
    handoff(
      [stepNotes[PAIRS.length - 1], loadNote],
      () => arrive(fadeIn([formula, pagedResult, flatResult, madeUp]), { duration: 0.35 }),
      clearFirst,
    ),
  );

  const validBar = bar(ROW_LEFT, ROW_Y - 84, PAIRS.length * ROW_CELL - 12, 10, 'green');
  const validName = place(
    M('valid length: ' + PAIRS.length, { size: 36, color: 'green' }),
    -160,
    -75,
  );
  const emptyRings = Array.from({ length: SLOTS - (PAIRS.length % SLOTS) }, (_, index) =>
    rect(K_CELL + 2, 98, { radius: 10, stroke: 'red', width: 4 })
      .at(...slotPoint(badRead.block, badRead.slot + index))
      .zIndex(3),
  );
  const tailNote = place(
    T('A owns these slots. No history.', { size: 40, color: 'red' }),
    -160,
    -5,
  );
  kernel.on('valid', () => stage.play(fadeIn([validBar, validName]), { duration: 0.4 }));
  kernel.on('empty', () =>
    stage.play(...emptyRings.map((node) => draw(node)), fadeIn(tailNote), { duration: 0.45 }),
  );
  const garbageNote = place(
    M('Garbage weight: ' + (badRead.weight * 100).toFixed(2) + '%', { size: 42, color: 'red' }),
    ROW_LEFT,
    330,
  );
  const pastResult = place(
    M('paged: ' + showPair(overread.output), { size: 52, color: 'red' }),
    ROW_LEFT,
    400,
  );
  kernel.on('garbage', () => {
    stage.play(
      fadeIn(positionTiles[badRead.position]),
      switchRing(posRings[badRead.position - 1], posRings[badRead.position]),
      switchRing(slotRings[badRead.position - 1], slotRings[badRead.position]),
      fadeOut(pagedResult),
      seq(fadeOut(formula), fadeIn(stepNotes[badRead.position])),
      { duration: 0.4 },
    );
    pullSlot(badRead, readCells[badRead.position], 0.75);
  });
  kernel.after('garbage', () =>
    stage.play(seq(fadeOut(stepNotes[badRead.position]), fadeIn(garbageNote)), fadeIn(pastResult), {
      duration: 0.5,
    }),
  );
  const extraName = place(
    T('Two extra inputs: table + valid length', { size: 44, color: 'yellow' }),
    ROW_LEFT,
    480,
  );
  kernel.on('two-inputs', () =>
    stage.play(
      seq(fadeOut(madeUp), fadeIn(extraName)),
      lagged(
        [...tableChips, validName].map((node) => pulse(node, 1.05)),
        { lag: 0.3 },
      ),
      { duration: 0.8 },
    ),
  );
  const walkParts = [
    ...stripBlocks,
    addressNote,
    tableName,
    ...tableChips,
    positionName,
    copyName,
    readName,
    ...positionTiles,
    ...readCells,
    ...copyCells,
    ...transfers,
    ...tableRings,
    ...slotRings,
    ...posRings,
    ...tableLinks,
    ...stepNotes,
    loadNote,
    formula,
    pagedResult,
    flatResult,
    madeUp,
    validBar,
    validName,
    ...emptyRings,
    tailNote,
    garbageNote,
    pastResult,
    extraName,
  ];
  // The two results from the 2023 paper, on two separate scales.
  const COST_X = -800,
    GAIN_X = 90,
    COST_SCALE = 5,
    GAIN_SCALE = 150;
  const costTitle = place(
    T('The kernel, measured alone', {
      size: 60,
      color: 'yellow',
    }),
    COST_X,
    -300,
  );
  const costRows = [
    ['continuous', 100, 'blue'],
    ['paged', 100, 'yellow'],
  ].map(([name, width, color], i) => {
    const y = -170 + i * 150,
      node = new Node();
    node.add(
      place(
        S(name, {
          size: 44,
          color,
        }),
        COST_X,
        y - 62,
      ),
      bar(COST_X, y, width * COST_SCALE, 66, color),
    );
    return node;
  });
  const costExtra = [
    bar(COST_X + 100 * COST_SCALE + 3, -20, 20 * COST_SCALE - 3, 66, 'orange'),
    bar(COST_X + 120 * COST_SCALE + 3, -20, 6 * COST_SCALE - 3, 66, 'orange', 0.5),
  ];
  const costNote = place(
    M('About 20 to 26% longer', {
      size: 58,
      color: 'orange',
    }),
    COST_X,
    100,
  );
  const gainTitle = place(
    T('Throughput, in serving tests', {
      size: 60,
      color: 'green',
    }),
    GAIN_X,
    -300,
  );
  const gainRows = [
    ['rebuilt Orca', 1, 1, 'blue'],
    ['with paging', 2, 4, 'green'],
  ].map(([name, low, high, color], i) => {
    const y = -170 + i * 150,
      node = new Node();
    node.add(
      place(
        S(name, {
          size: 44,
          color,
        }),
        GAIN_X,
        y - 62,
      ),
      bar(GAIN_X, y, low * GAIN_SCALE, 66, color),
    );
    if (high > low)
      node.add(
        bar(GAIN_X + low * GAIN_SCALE + 3, y, (high - low) * GAIN_SCALE - 3, 66, color, 0.5),
      );
    return node;
  });
  const gainNote = place(
    M('about 2 to 4 times', {
      size: 58,
      color: 'green',
    }),
    GAIN_X,
    100,
  );
  const paperNote = S('Original vLLM paper, 2023', {
    size: 42,
    color: 'dim',
  }).at(0, 215);
  const togetherNote = T(
    'The recovered memory fit larger batches.\nMeasure the allocator and the kernel together.',
    {
      size: 62,
      color: 'ink',
      leading: 1.2,
      align: 'center',
    },
  ).at(0, 360);
  kernel.on('not-free', () =>
    handoff(walkParts, () =>
      arrive(
        fadeIn([costTitle, paperNote], {
          shift: [0, 8],
        }),
        lagged(
          costRows.map((node) =>
            fadeIn(node, {
              shift: [-16, 0],
            }),
          ),
          {
            lag: 0.3,
          },
        ),
        {
          duration: 0.7,
        },
      ),
    ),
  );
  kernel.on('slower', () =>
    stage.play(
      lagged(
        costExtra.map((node) =>
          fadeIn(node, {
            shift: [-16, 0],
          }),
        ),
        {
          lag: 0.3,
        },
      ),
      fadeIn(costNote),
      {
        duration: 0.8,
      },
    ),
  );
  kernel.on('throughput', () =>
    stage.play(
      fadeIn(gainTitle),
      lagged(
        gainRows.map((node) =>
          fadeIn(node, {
            shift: [-16, 0],
          }),
        ),
        {
          lag: 0.3,
        },
      ),
      fadeIn(gainNote),
      {
        duration: 0.8,
      },
    ),
  );
  kernel.on('together', () =>
    stage.play(write(togetherNote), {
      duration: 0.9,
    }),
  );
  const costParts = [
    costTitle,
    ...costRows,
    ...costExtra,
    costNote,
    gainTitle,
    ...gainRows,
    gainNote,
    paperNote,
    togetherNote,
  ];
  // vAttention: continuous virtual addresses, with physical pages mapped behind them on demand.
  const V_LEFT = -780,
    V_CELL = 130,
    V_COUNT = 12,
    V_Y = -220,
    F_Y = 130,
    V_USED = 7,
    PHYSICAL = [9, 2, 11, 5, 0, 7, 3];
  assert.ok(
    V_USED === PHYSICAL.length &&
      new Set(PHYSICAL).size === V_USED &&
      Math.max(...PHYSICAL) < V_COUNT,
  );
  const vCells = Array.from(
    {
      length: V_COUNT,
    },
    (_, i) =>
      rect(V_CELL - 8, 100, {
        radius: 8,
        fill: 'surface',
        stroke: 'blue',
        width: 2,
      }).at(V_LEFT + V_CELL / 2 + i * V_CELL, V_Y),
  );
  const vName = place(
    T('Continuous virtual addresses', {
      size: 56,
      color: 'blue',
    }),
    V_LEFT,
    V_Y - 100,
  );
  const vTitle = place(
    T('vAttention', {
      italic: true,
      size: 96,
      color: 'yellow',
    }),
    170,
    V_Y - 112,
  );
  const fCells = Array.from(
    {
      length: V_COUNT,
    },
    (_, i) =>
      rect(V_CELL - 8, 100, {
        radius: 8,
        fill: 'surface',
        stroke: 'dim',
        width: 2,
      }).at(V_LEFT + V_CELL / 2 + i * V_CELL, F_Y),
  );
  const fName = place(
    T('Physical pages, wherever they are free', {
      size: 56,
      color: 'dim',
    }),
    V_LEFT,
    F_Y + 96,
  );
  const mapLinks = PHYSICAL.map((target, i) =>
    line(
      [V_LEFT + V_CELL / 2 + i * V_CELL, V_Y + 54],
      [V_LEFT + V_CELL / 2 + target * V_CELL, F_Y - 54],
      {
        stroke: 'teal',
        width: 3,
      },
    ),
  );
  const fFills = PHYSICAL.map((target) =>
    rect(V_CELL - 8, 100, {
      radius: 8,
      fill: 'teal',
      stroke: null,
    })
      .at(V_LEFT + V_CELL / 2 + target * V_CELL, F_Y)
      .zIndex(1),
  );
  const vFills = PHYSICAL.map((_, i) =>
    rect(V_CELL - 8, 100, {
      radius: 8,
      fill: 'blue',
      stroke: null,
    })
      .at(V_LEFT + V_CELL / 2 + i * V_CELL, V_Y)
      .zIndex(1),
  );
  kernel.on('only-answer', () =>
    handoff(costParts, () =>
      arrive(fadeIn([...vCells, ...fCells]), {
        duration: 0.2,
      }),
    ),
  );
  kernel.on('v-attention', () =>
    stage.play(
      write(vTitle),
      fadeIn([vName, fName], {
        shift: [0, 8],
      }),
      {
        duration: 0.7,
      },
    ),
  );
  kernel.on('on-demand', () =>
    stage.play(
      lagged(mapLinks.map((link, i) => [draw(link), fadeIn(fFills[i]), fadeIn(vFills[i])]).flat(), {
        lag: 0.07,
      }),
      {
        duration: 1.2,
      },
    ),
  );
  const vPointerAt = stage.value(0);
  // A ring walks the virtual row, so the row keeps its name above it.
  const vPointer = dynamic(() =>
    rect(V_CELL + 4, 118, {
      radius: 12,
      stroke: 'yellow',
      width: 6,
    })
      .at(V_LEFT + V_CELL / 2 + vPointerAt.value * V_CELL, V_Y)
      .zIndex(3),
  );
  const existingNote = place(
    T('An existing continuous kernel can read straight along', {
      size: 52,
      color: 'yellow',
    }),
    V_LEFT,
    310,
  );
  kernel.on('existing', () =>
    stage.play(
      brief(fadeIn(vPointer), 0.2),
      brief(fadeIn(existingNote), 0.4),
      vPointerAt.to(V_USED - 1, {
        duration: 1.6,
        ease: linear,
      }),
      {
        duration: 1.6,
      },
    ),
  );
  const compareNote = place(
    T('Neither design wins by definition. Compare on your stack.', {
      size: 52,
      color: 'ink',
    }),
    V_LEFT,
    400,
  );
  kernel.on('compare', () =>
    stage.play(
      fadeIn(compareNote, {
        shift: [0, 8],
      }),
      {
        duration: 0.5,
      },
    ),
  );
  clearScene(kernel, [
    ...vCells,
    ...fCells,
    vName,
    vTitle,
    fName,
    ...mapLinks,
    ...fFills,
    ...vFills,
    vPointer,
    existingNote,
    compareNote,
  ]);
}
