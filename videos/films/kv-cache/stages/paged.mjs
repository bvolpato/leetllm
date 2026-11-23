import { draw, fade, fadeIn, indicate, lagged, Node, rect, tex, write } from 'vizmatic/stage';
import { sceneHeading } from '../../../stage-lessons/kit.mjs';
import { SLOTS, TABLE } from '../model.mjs';

/** Logical order, scattered storage. */
export function buildPaged(
  stage,
  narration,
  { T, M, place, fadeOut, pulse, arrive, clearFirst, handoff },
  { TILE, poolAt, poolTiles, blockOf, cover, uncover, showPool, hidePool },
) {
  const paged = narration.scene('paged');
  sceneHeading(stage, paged, narration.title('paged'));
  const placeA = TABLE,
    placeB = [12, 4],
    placeC = [0, 9, 14];
  const scatteredA = placeA.map((index, logical) => blockOf(index, 'blue', `A${logical}`));
  const scatteredB = placeB.map((index, logical) => blockOf(index, 'orange', `B${logical}`));
  const scatteredC = placeC.map((index, logical) => blockOf(index, 'green', `C${logical}`));
  const trickName = place(
    T('An old trick from operating systems', {
      size: 92,
      color: 'ink',
    }),
    -790,
    290,
  );
  const blocksName = place(
    T('Small, fixed blocks,\nhanded out as needed', {
      size: 112,
      color: 'blue',
      leading: 1.12,
    }),
    -790,
    290,
  );
  paged.at(0.05, () =>
    stage.play(
      ...showPool(),
      fadeIn(trickName, {
        shift: [0, 10],
      }),
      {
        duration: 0.4,
      },
    ),
  );
  paged.on('small-blocks', () =>
    handoff(
      [trickName],
      () =>
        arrive(
          fadeIn(blocksName),
          lagged(
            poolTiles.map((node) =>
              indicate(node, {
                color: 'blue',
                scale: 1.04,
              }),
            ),
            {
              lag: 0.05,
            },
          ),
          {
            duration: 1.2,
          },
        ),
      clearFirst,
    ),
  );
  paged.on('hand-one', () =>
    stage.play(
      ...cover([placeA[0]]),
      fadeIn(scatteredA[0], {
        scale: 0.6,
      }),
      {
        duration: 0.6,
      },
    ),
  );
  paged.on('anywhere', () =>
    stage.play(
      ...cover([placeB[0], placeA[1], placeB[1]]),
      lagged(
        [scatteredB[0], scatteredA[1], scatteredB[1]].map((node) =>
          fadeIn(node, {
            scale: 0.6,
          }),
        ),
        {
          lag: 0.4,
        },
      ),
      {
        duration: 1.1,
      },
    ),
  );
  const TABLE_Y = 196,
    ROW_STEP = 110,
    TABLE_LEFT = -730,
    TABLE_STEP = 236;
  const tableCell = (entry, logical, color, row) => {
    const node = new Node(),
      x = TABLE_LEFT + logical * TABLE_STEP,
      y = TABLE_Y + row * ROW_STEP;
    node.add(
      rect(204, 94, {
        radius: 10,
        fill: 'surface',
        stroke: color,
        width: 3,
      }).at(x, y),
      M(String(entry), {
        size: 64,
        color,
      }).at(x, y),
    );
    return node;
  };
  const tableRow = (name, places, color, row) => {
    const node = new Node();
    node.add(
      M(name, {
        size: 76,
        color,
      }).moveTo([TABLE_LEFT - 145, TABLE_Y + row * ROW_STEP]),
    );
    places.forEach((entry, logical) => node.add(tableCell(entry, logical, color, row)));
    return node;
  };
  // A's second entry is its own object, because A takes that block only at the fifth token.
  const tableA = tableRow('A', [placeA[0]], 'blue', 0),
    tableA2 = tableCell(placeA[1], 1, 'blue', 0),
    tableB = tableRow('B', placeB, 'orange', 1),
    tableC = tableRow('C', placeC, 'green', 2);
  const tableHead = [0, 1].map((logical) =>
    M(`logical ${logical}`, {
      size: 38,
      color: 'dim',
    }).at(TABLE_LEFT + logical * TABLE_STEP, TABLE_Y - 88),
  );
  const thirdHead = M('logical 2', {
    size: 38,
    color: 'dim',
  }).at(TABLE_LEFT + 2 * TABLE_STEP, TABLE_Y - 88);
  paged.on('table', () =>
    handoff(
      [blocksName],
      () =>
        arrive(
          fadeIn([tableA, tableA2, tableB], {
            shift: [0, 14],
          }),
          {
            duration: 0.5,
          },
        ),
      clearFirst,
    ),
  );
  paged.on('logical', () =>
    stage.play(
      lagged(
        tableHead.map((node) =>
          fadeIn(node, {
            shift: [0, 10],
          }),
        ),
        {
          lag: 0.3,
        },
      ),
      {
        duration: 0.6,
      },
    ),
  );
  const NOTE_LEFT = -110;
  const fourEach = place(
    T('Our example: one block, four positions', {
      size: 56,
      color: 'blue',
    }),
    NOTE_LEFT,
    TABLE_Y - 70,
  );
  const fourSlots = Array.from(
    {
      length: SLOTS,
    },
    (_, i) =>
      rect(224, 170, {
        radius: 14,
        fill: 'surface',
        stroke: 'blue',
        width: 4,
      }).at(NOTE_LEFT + 112 + i * 236, TABLE_Y + 90),
  );
  const fourNames = Array.from(
    {
      length: SLOTS,
    },
    (_, i) =>
      M(`slot ${i}`, {
        size: 46,
        color: 'blue',
      }).at(NOTE_LEFT + 112 + i * 236, TABLE_Y + 90),
  );
  paged.on('four-each', () =>
    stage.play(
      fadeIn(fourEach),
      lagged(
        fourSlots.map((node, i) =>
          fadeIn([node, fourNames[i]], {
            scale: 0.8,
          }),
        ),
        {
          lag: 0.1,
        },
      ),
      {
        duration: 0.7,
      },
    ),
  );
  const sum = place(
    tex('5 = 1 \\times 4 + 1', {
      size: 124,
      color: 'yellow',
    }),
    NOTE_LEFT,
    TABLE_Y + 50,
  );
  const slotNote = place(
    M('logical block 1, slot 1', {
      size: 62,
      color: 'yellow',
    }),
    NOTE_LEFT,
    TABLE_Y + 196,
  );
  paged.on('divide', () => stage.play(pulse(fourEach, 1.02), { duration: 0.7 }));
  paged.after('divide', () =>
    handoff(
      [...fourSlots, ...fourNames],
      () =>
        arrive(write(sum), fadeIn(slotNote), {
          duration: 0.9,
        }),
      clearFirst,
    ),
  );
  // Four slots inside physical block 2. The slot that holds position five lights up.
  const ring = rect(TILE + 20, TILE + 20, {
    radius: 18,
    stroke: 'green',
    width: 7,
  })
    .at(...poolAt(2))
    .glow(14)
    .zIndex(3);
  const cellRing = rect(TABLE_STEP - 2, 110, {
    radius: 12,
    stroke: 'green',
    width: 7,
  })
    .at(TABLE_LEFT + TABLE_STEP, TABLE_Y)
    .glow(14)
    .zIndex(3);
  const slotCells = Array.from(
    {
      length: SLOTS,
    },
    (_, i) =>
      rect(38, 38, {
        radius: 6,
        fill: i === 1 ? 'yellow' : 'bg',
        stroke: 'bg',
        width: 2,
      })
        .at(poolAt(2)[0] - 63 + i * 42, poolAt(2)[1] + 66)
        .zIndex(4),
  );
  paged.after('physical', () =>
    stage.play(
      draw(ring),
      draw(cellRing),
      lagged(
        slotCells.map((node) =>
          fadeIn(node, {
            scale: 0.6,
          }),
        ),
        {
          lag: 0.12,
        },
      ),
      {
        duration: 0.9,
      },
    ),
  );
  // A request grows slot by slot, and it takes a new block only at the fifth token.
  const TRACE_CELL = 150,
    TRACE_X = NOTE_LEFT + 210;
  const traceRow = (block, y) => {
    const node = new Node();
    node.add(
      place(
        M(`block ${block}`, {
          size: 46,
          color: 'blue',
        }),
        NOTE_LEFT,
        y,
      ),
    );
    for (let i = 0; i < SLOTS; i++)
      node.add(
        rect(TRACE_CELL - 8, 92, {
          radius: 8,
          fill: 'surface',
          stroke: 'dim',
          width: 2,
        }).at(TRACE_X + TRACE_CELL / 2 + i * TRACE_CELL, y),
      );
    return node;
  };
  const traceBlocks = [traceRow(TABLE[0], TABLE_Y + 30), traceRow(TABLE[1], TABLE_Y + 150)];
  const traceFill = Array.from(
    {
      length: 5,
    },
    (_, position) => {
      const node = new Node(),
        y = position < 4 ? TABLE_Y + 30 : TABLE_Y + 150;
      node.add(
        rect(TRACE_CELL - 8, 92, {
          radius: 8,
          fill: position < 4 ? 'blue' : 'yellow',
          stroke: null,
        }),
        M(String(position), {
          size: 54,
          color: 'bg',
        }),
      );
      return node.at(TRACE_X + TRACE_CELL / 2 + (position % SLOTS) * TRACE_CELL, y).zIndex(1);
    },
  );
  const traceNote = place(
    M('tokens, by position', {
      size: 40,
      color: 'dim',
    }),
    NOTE_LEFT,
    TABLE_Y - 70,
  );
  paged.on('first-takes', () =>
    handoff(
      [ring, cellRing, ...slotCells, sum, slotNote, fourEach],
      () =>
        arrive(
          fadeIn([traceBlocks[0], traceNote], {
            shift: [0, 10],
          }),
          fade(scatteredA[1], 0),
          fade(tableA2, 0),
          ...uncover([placeA[1]]),
          {
            duration: 0.5,
          },
        ),
      clearFirst,
    ),
  );
  paged.on('say-one', () =>
    stage.play(pulse(scatteredA[0], 1.05), pulse(tableA, 1.02), {
      duration: 0.7,
    }),
  );
  paged.on('next-slot', () =>
    stage.play(
      fadeIn(traceFill[0], {
        scale: 0.7,
      }),
      {
        duration: 0.5,
      },
    ),
  );
  const fillThree = paged.cue('fifth').start - paged.cue('first-four').start - 0.15;
  paged.on('first-four', () =>
    stage.play(
      lagged(
        traceFill.slice(1, 4).map((node) =>
          fadeIn(node, {
            scale: 0.7,
          }),
        ),
        {
          lag: 0.8,
        },
      ),
      {
        duration: fillThree,
      },
    ),
  );
  paged.on('fifth', () =>
    stage.play(
      fadeIn(traceBlocks[1], {
        shift: [0, 10],
      }),
      fadeIn(traceFill[4], {
        scale: 0.6,
      }),
      ...cover([placeA[1]]),
      fade(scatteredA[1], 1),
      fade(tableA2, 1),
      {
        duration: 0.7,
      },
    ),
  );
  paged.on('third-fits', () =>
    handoff(
      [...traceBlocks, ...traceFill, traceNote],
      () =>
        arrive(
          ...cover(placeC),
          lagged(
            scatteredC.map((node) =>
              fadeIn(node, {
                scale: 0.6,
              }),
            ),
            {
              lag: 0.5,
            },
          ),
          fadeIn(tableC, {
            shift: [0, 14],
          }),
          fadeIn(thirdHead),
          {
            duration: 0.9,
          },
        ),
      clearFirst,
    ),
  );
  const pagedName = place(
    T('Paged attention', {
      italic: true,
      size: 150,
      color: 'yellow',
    }),
    NOTE_LEFT,
    TABLE_Y + 106,
  );
  paged.on('paged-name', () =>
    stage.play(write(pagedName), {
      duration: 1,
    }),
  );
  paged.on('any-free', () =>
    stage.play(
      lagged(
        scatteredC.map((node) => pulse(node, 1.05)),
        {
          lag: 0.3,
        },
      ),
      {
        duration: 0.9,
      },
    ),
  );
  // The tail that paging cannot remove: one token in a sixteen slot block, cell by cell.
  const TAIL_LEFT = -130,
    TAIL_CELL = 58,
    TAIL_Y = 160;
  const tailCells = Array.from(
    {
      length: 16,
    },
    (_, i) =>
      rect(TAIL_CELL - 6, 74, {
        radius: 6,
        fill: 'surface',
        stroke: 'dim',
        width: 1.5,
      }).at(TAIL_LEFT + TAIL_CELL / 2 + i * TAIL_CELL, TAIL_Y),
  );
  const tailFill = rect(TAIL_CELL - 6, 74, {
    radius: 6,
    fill: 'green',
    stroke: null,
  })
    .at(TAIL_LEFT + TAIL_CELL / 2, TAIL_Y)
    .zIndex(1);
  const tailNote = place(
    M('1 token, 15 slots unused', {
      size: 46,
      color: 'green',
    }),
    TAIL_LEFT,
    TAIL_Y + 72,
  );
  const tradeoffs = [
    ['Smaller: less waste, finer sharing, bigger tables', 'blue'],
    ['Larger: the reverse', 'orange'],
    ['Speed: either way, depending on the code', 'yellow'],
  ].map(([line2, color], i) =>
    place(
      T(line2, {
        size: 46,
        color,
      }),
      TAIL_LEFT,
      TAIL_Y + 150 + i * 66,
    ),
  );
  paged.on('waste-remains', () =>
    handoff(
      [pagedName],
      () =>
        arrive(
          lagged(
            tailCells.map((node) => fadeIn(node)),
            {
              lag: 0.05,
            },
          ),
          {
            duration: 0.5,
          },
        ),
      clearFirst,
    ),
  );
  paged.on('sixteen', () =>
    stage.play(
      fadeIn(tailFill, {
        scale: 0.6,
      }),
      fadeIn(tailNote),
      {
        duration: 0.6,
      },
    ),
  );
  paged.on('smaller', () =>
    stage.play(
      fadeIn(tradeoffs[0], {
        shift: [12, 0],
      }),
      {
        duration: 0.5,
      },
    ),
  );
  paged.on('larger', () =>
    stage.play(
      fadeIn(tradeoffs[1], {
        shift: [12, 0],
      }),
      {
        duration: 0.5,
      },
    ),
  );
  paged.on('speed', () =>
    stage.play(
      fadeIn(tradeoffs[2], {
        shift: [12, 0],
      }),
      {
        duration: 0.5,
      },
    ),
  );
  paged.on('measure', () =>
    stage.play(
      indicate(tradeoffs[2], {
        color: 'yellow',
        scale: 1.03,
      }),
      {
        duration: 0.7,
      },
    ),
  );
  stage.at(paged.end - 0.45, () =>
    stage.play(
      ...hidePool(),
      fadeOut([
        tableA,
        tableA2,
        tableB,
        tableC,
        ...tableHead,
        thirdHead,
        ...scatteredA,
        ...scatteredB,
        ...scatteredC,
        ...tailCells,
        tailFill,
        tailNote,
        ...tradeoffs,
      ]),
      {
        duration: 0.4,
      },
    ),
  );
  return {
    placeA,
    placeB,
    placeC,
  };
}
