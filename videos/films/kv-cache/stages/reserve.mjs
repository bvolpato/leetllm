import assert from 'node:assert/strict';
import { dynamic, fade, fadeIn, lagged, linear, Node, rect, to, write } from 'vizmatic/stage';
import { chip, sceneHeading } from '../../../stage-lessons/kit.mjs';
import { fmt, RESERVED, USED, TRAPPED, HOLES, NEEDED } from '../model.mjs';

/** A memory pool, shared by several scenes. */
export function buildReserve(
  stage,
  narration,
  {
    T,
    M,
    S,
    place,
    fadeOut,
    bar,
    frameBar,
    growBar,
    clearScene,
    retitle,
    pulse,
    arrive,
    clearFirst,
    handoff,
  },
) {
  const reserve = narration.scene('reserve');
  // The holes in external fragmentation belong to nobody, so the first title cannot stay over them.
  retitle(reserve, sceneHeading(stage, reserve, narration.title('reserve')), [
    ['kinds', 'Three kinds of waste'],
  ]);
  const POOL = 16,
    COLUMNS = 8,
    TILE = 188,
    TILE_GAP = 12,
    POOL_Y = -225;
  const POOL_LEFT = -((COLUMNS - 1) * (TILE + TILE_GAP)) / 2;
  const poolAt = (index) => [
    POOL_LEFT + (index % COLUMNS) * (TILE + TILE_GAP),
    POOL_Y + Math.floor(index / COLUMNS) * (TILE + TILE_GAP),
  ];
  const poolTiles = Array.from(
    {
      length: POOL,
    },
    (_, i) =>
      rect(TILE, TILE, {
        radius: 14,
        fill: 'surface',
        stroke: 'dim',
        width: 2,
      }).at(...poolAt(i)),
  );
  const poolNumbers = Array.from(
    {
      length: POOL,
    },
    (_, i) =>
      M(String(i), {
        size: 38,
        color: 'dim',
      })
        .at(poolAt(i)[0] - TILE / 2 + 34, poolAt(i)[1] - TILE / 2 + 34)
        .zIndex(1),
  );
  const blockOf = (index, color, content, alpha = 0.92, size = 76) => {
    const node = new Node();
    // A filled block covers the pool's number, so it carries its own in a color that reads on the fill.
    node.add(
      rect(TILE, TILE, {
        radius: 14,
        fill: color,
        stroke: null,
      }).opacity(alpha),
      M(String(index), {
        size: 38,
        color: 'bg',
      }).at(-TILE / 2 + 34, -TILE / 2 + 34),
      S(content, {
        size,
        color: 'bg',
        weight: 600,
      }).at(0, 12),
    );
    return node.at(...poolAt(index)).zIndex(2);
  };
  // A filled block carries its own number, so the pool's number under it steps aside.
  const cover = (indices) =>
    indices.map((index) =>
      fade(poolNumbers[index], 0, {
        duration: 0.2,
      }),
    );
  const uncover = (indices) =>
    indices.map((index) =>
      fade(poolNumbers[index], 1, {
        duration: 0.2,
      }),
    );
  const poolParts = [...poolTiles, ...poolNumbers];
  const showPool = (covered = []) => [
    fade(toyPool, 1),
    ...poolTiles.map((node) => fade(node, 1)),
    ...poolNumbers.filter((_, i) => !covered.includes(i)).map((node) => fade(node, 1)),
  ];
  const hidePool = () => [
    fade(toyPool, 0),
    ...poolTiles.map((node) => fade(node, 0)),
    ...poolNumbers.map((node) => fade(node, 0)),
  ];
  const toyPool = place(
    M('A small example pool: 16 blocks', {
      size: 38,
      color: 'dim',
    }),
    190,
    -380,
  );
  const reservation = (first, color) =>
    rect(COLUMNS * (TILE + TILE_GAP) + 2, TILE + 14, {
      radius: 18,
      fill: color,
      stroke: color,
      width: 3,
    })
      .opacity(0.16)
      .at(0, poolAt(first)[1]);
  const reserveA = reservation(0, 'blue'),
    reserveB = reservation(8, 'orange');
  const usedA = [blockOf(0, 'blue', 'A'), blockOf(1, 'blue', 'A')],
    usedB = [blockOf(8, 'orange', 'B'), blockOf(9, 'orange', 'B')];
  reserve.at(0.05, () =>
    stage.play(
      lagged(
        poolTiles.map((node, i) =>
          fadeIn([node, poolNumbers[i]], {
            scale: 0.85,
          }),
        ),
        {
          lag: 0.04,
        },
      ),
      fadeIn(toyPool),
      {
        duration: 0.8,
      },
    ),
  );
  const reserveRow = (name, words, color, y) => {
    const node = new Node();
    node.add(
      M(name, {
        size: 110,
        color,
      }).moveTo([-760, y]),
      place(
        T(words, {
          size: 104,
          color,
        }),
        -640,
        y,
      ),
    );
    return node;
  };
  const claimA = reserveRow('A', 'reserves 8 blocks', 'blue', 190),
    claimB = reserveRow('B', 'reserves 8 blocks', 'orange', 345);
  const usesA = reserveRow('A', 'reserves 8, uses 2', 'blue', 190),
    usesB = reserveRow('B', 'reserves 8, uses 2', 'orange', 345);
  const copyNote = place(
    T('Growing later can mean\na bigger buffer and a copy', {
      size: 50,
      color: 'dim',
      leading: 1.2,
    }),
    280,
    270,
  );
  reserve.on('reserve-max', () =>
    stage.play(
      lagged(
        [reserveA, claimA, reserveB, claimB].map((node) => fadeIn(node)),
        {
          lag: 0.3,
        },
      ),
      {
        duration: 1,
      },
    ),
  );
  reserve.on('copy', () =>
    stage.play(
      fadeIn(copyNote, {
        shift: [0, 10],
      }),
      {
        duration: 0.5,
      },
    ),
  );
  reserve.on('need-two', () =>
    stage.play(
      ...cover([0, 1, 8, 9]),
      fadeOut([claimA, claimB, copyNote], {
        duration: 0.35,
      }),
      fadeIn([usesA, usesB]),
      lagged(
        [...usedA, ...usedB].map((node) =>
          fadeIn(node, {
            scale: 0.7,
          }),
        ),
        {
          lag: 0.35,
        },
      ),
      {
        duration: 1.1,
      },
    ),
  );
  const requestC = chip('C', {
    w: TILE,
    h: TILE,
    color: 'red',
    size: 96,
    font: 'sans',
    fill: 'surface',
    width: 5,
  }).at(-700, 300);
  const noRoom = place(
    T('Twelve blank blocks,\nand no room.', {
      size: 118,
      color: 'red',
      leading: 1.1,
    }),
    -540,
    300,
  );
  reserve.on('third', () =>
    handoff(
      [usesA, usesB],
      () =>
        arrive(
          fadeIn(requestC, {
            shift: [0, 30],
          }),
          {
            duration: 0.5,
          },
        ),
      clearFirst,
    ),
  );
  reserve.on('blank', () =>
    stage.play(write(noRoom), {
      duration: 0.9,
    }),
  );
  // Three kinds of waste, one row each, with each bar drawn to its own scale.
  const WASTE_X = -800,
    WASTE_W = 1600,
    ROW_1 = -250,
    ROW_2 = 20,
    ROW_3 = 300,
    WASTE_H = 70;
  const res1Frame = frameBar(WASTE_X, ROW_1, WASTE_W, WASTE_H);
  const res1Label = place(
    M(`${fmt(RESERVED)} slots reserved, one for each token`, {
      size: 42,
      color: 'dim',
    }),
    WASTE_X,
    ROW_1 - 66,
  );
  const res1Used = growBar(WASTE_X, ROW_1, (WASTE_W * USED) / RESERVED, WASTE_H, 'blue');
  const res1Trap = bar(
    WASTE_X + (WASTE_W * USED) / RESERVED,
    ROW_1,
    (WASTE_W * TRAPPED) / RESERVED,
    WASTE_H,
    'red',
    0.5,
  );
  const res1UsedLabel = M(`${USED} used`, {
    size: 40,
    color: 'blue',
  }).at(WASTE_X + 100, ROW_1 + 66);
  const res1TrapLabel = M(`${fmt(TRAPPED)} never used`, {
    size: 40,
    color: 'red',
  }).at(WASTE_X + 660, ROW_1 + 66);
  const res1Name = T('Internal fragmentation', {
    size: 52,
    color: 'red',
  }).at(WASTE_X + 1320, ROW_1 + 66);
  const stripFrame = frameBar(WASTE_X, ROW_3, WASTE_W, WASTE_H);
  const res2FrameEarly = frameBar(WASTE_X, ROW_2, WASTE_W, WASTE_H);
  const rowNumbers = [ROW_1, ROW_2, ROW_3].map((y, i) =>
    M(String(i + 1), {
      size: 54,
      color: 'dim',
    }).at(WASTE_X - 50, y),
  );
  reserve.on('kinds', () =>
    handoff(
      [reserveA, reserveB, ...usedA, ...usedB, requestC, noRoom],
      () =>
        arrive(fadeIn([res1Frame, res2FrameEarly, stripFrame, ...rowNumbers]), {
          duration: 0.4,
        }),
      {
        also: hidePool(),
      },
    ),
  );
  reserve.on('reserves', () =>
    stage.play(fadeIn(res1Label), {
      duration: 0.5,
    }),
  );
  reserve.on('stops', () =>
    stage.play(
      fadeIn(res1Used.node),
      res1Used.grow({
        duration: 0.6,
      }),
      fadeIn(res1UsedLabel),
      {
        duration: 0.6,
      },
    ),
  );
  reserve.on('trapped', () =>
    stage.play(pulse(res1Frame, 1.02), pulse(res1Used.node, 1.04), { duration: 0.6 }),
  );
  reserve.after('trapped', () =>
    stage.play(fadeIn(res1Trap), fadeIn(res1TrapLabel), {
      duration: 0.6,
    }),
  );
  reserve.on('internal', () =>
    stage.play(write(res1Name), {
      duration: 0.6,
    }),
  );
  // The "now" marker moves through a reservation, and everything ahead of it waits, unusable.
  const nowAt = stage.value(0.03);
  const res2Done = dynamic(() => bar(WASTE_X, ROW_2, WASTE_W * nowAt.value, WASTE_H, 'blue'));
  const res2Idle = dynamic(() =>
    bar(
      WASTE_X + WASTE_W * nowAt.value,
      ROW_2,
      WASTE_W * (1 - nowAt.value),
      WASTE_H,
      'yellow',
      0.5,
    ),
  );
  const res2Label = place(
    M('A request that will use every slot, eventually', {
      size: 42,
      color: 'dim',
    }),
    WASTE_X,
    ROW_2 - 66,
  );
  const res2Now = M('now', {
    size: 40,
    color: 'blue',
  }).at(WASTE_X + 60, ROW_2 + 66);
  const res2IdleLabel = M('idle until their turn', {
    size: 40,
    color: 'yellow',
  }).at(WASTE_X + 560, ROW_2 + 66);
  const res2Name = T('Reservation waste', {
    size: 52,
    color: 'yellow',
  }).at(WASTE_X + 1320, ROW_2 + 66);
  reserve.on('idle', () =>
    stage.play(fadeIn([res2Done, res2Idle, res2Label, res2Now, res2IdleLabel]), {
      duration: 0.5,
    }),
  );
  reserve.on('res-waste', () =>
    stage.play(
      write(res2Name),
      nowAt.to(0.34, {
        duration: 1.2,
        ease: linear,
      }),
      {
        duration: 1.2,
      },
    ),
  );
  // Live buffers with holes between them. Each percent is 16 pixels, and the sizes are made up.
  const PCT = WASTE_W / 100;
  const stripLayout = [
    ['live', 26],
    ['hole', HOLES[0]],
    ['live', 20],
    ['hole', HOLES[1]],
    ['live', 18],
    ['hole', HOLES[2]],
  ];
  assert.equal(
    stripLayout.reduce((sum, [, width]) => sum + width, 0),
    100,
  );
  let stripX = WASTE_X;
  const stripParts = stripLayout.map(([kind, width]) => {
    const node =
      kind === 'live'
        ? bar(stripX + 2, ROW_3, width * PCT - 4, WASTE_H, 'blue')
        : frameBar(stripX + 2, ROW_3, width * PCT - 4, WASTE_H, 'yellow');
    const part = {
      node,
      kind,
      center: stripX + (width * PCT) / 2,
      width,
    };
    stripX += width * PCT;
    return part;
  });
  const stripLabel = place(
    M('Live buffers and the holes between them (made-up sizes)', {
      size: 42,
      color: 'dim',
    }),
    WASTE_X,
    ROW_3 - 66,
  );
  const holeSizes = stripParts
    .filter((part) => part.kind === 'hole')
    .map((part) =>
      M(`${part.width}%`, {
        size: 40,
        color: 'yellow',
      })
        .at(part.center, ROW_3)
        .zIndex(4),
    );
  const freeTotal = M(`free: ${HOLES.reduce((a, b) => a + b)}%`, {
    size: 40,
    color: 'yellow',
  }).at(WASTE_X + 120, ROW_3 + 66);
  const needNote = M(`needs one ${NEEDED}% piece`, {
    size: 40,
    color: 'red',
  }).at(WASTE_X + 600, ROW_3 + 66);
  const res3Name = T('External fragmentation', {
    size: 52,
    color: 'red',
  }).at(WASTE_X + 1320, ROW_3 + 66);
  reserve.on('holes', () =>
    stage.play(
      lagged(
        stripParts.map((part) => fadeIn(part.node)),
        {
          lag: 0.15,
        },
      ),
      fadeIn(stripLabel),
      {
        duration: 0.8,
      },
    ),
  );
  reserve.on('add-up', () =>
    stage.play(
      lagged(
        holeSizes.map((node) =>
          fadeIn(node, {
            scale: 0.8,
          }),
        ),
        {
          lag: 0.2,
        },
      ),
      fadeIn(freeTotal),
      {
        duration: 0.7,
      },
    ),
  );
  // The new reservation tries every hole, and it overflows each one.
  const piece = rect(NEEDED * PCT, WASTE_H + 8, {
    radius: 8,
    fill: 'red',
    stroke: null,
  })
    .opacity(0.62)
    .zIndex(3);
  const holeCenters = stripParts
    .filter((part) => part.kind === 'hole')
    .map((part) => part.center);
  reserve.on('no-hole', () => {
    piece.at(holeCenters[0], ROW_3);
    stage.play(
      fadeIn(needNote, {
        shift: [0, 8],
      }),
      fadeIn(piece),
      {
        duration: 0.4,
      },
    );
    for (const center of holeCenters.slice(1)) {
      stage.wait(0.25);
      stage.play(fade(piece, 0), {
        duration: 0.2,
      });
      stage.play(
        to(piece, (node) => node.at(center, ROW_3)),
        {
          duration: 0.02,
        },
      );
      stage.play(fade(piece, 0.62), {
        duration: 0.38,
      });
    }
  });
  reserve.on('external', () =>
    stage.play(write(res3Name), {
      duration: 0.6,
    }),
  );
  const wasteRows = [
    res1Frame,
    res1Label,
    res1Used.node,
    res1Trap,
    res1UsedLabel,
    res1TrapLabel,
    res1Name,
    res2FrameEarly,
    stripFrame,
    ...rowNumbers,
    res2Done,
    res2Idle,
    res2Label,
    res2Now,
    res2IdleLabel,
    res2Name,
    ...stripParts.map((part) => part.node),
    stripLabel,
    ...holeSizes,
    freeTotal,
    needNote,
    res3Name,
    piece,
  ];
  const reportFrame = frameBar(-800, 150, 1600, 80);
  const reportBand = bar(-800 + 1600 * 0.6, 150, 1600 * 0.2, 80, 'red');
  const reportStat = M('60 to 80%', {
    size: 190,
    color: 'red',
  }).at(0, -110);
  const reportSource = T('waste reported by the vLLM team in 2023, in the systems it studied', {
    size: 50,
    color: 'ink',
  }).at(0, 40);
  const reportEnds = [
    ['0%', -800],
    ['60%', -800 + 960],
    ['80%', -800 + 1280],
    ['100%', 800],
  ].map(([name, x]) =>
    M(name, {
      size: 38,
      color: 'dim',
    }).at(x, 226),
  );
  const reportCaveat = T('A historical result, not a measure of your system.', {
    size: 58,
    color: 'dim',
  }).at(0, 350);
  const howBad = T('How bad can it be?', {
    italic: true,
    size: 150,
    color: 'red',
  }).at(0, -110);
  reserve.on('how-bad', () =>
    handoff(wasteRows, () =>
      arrive(
        fadeIn([reportFrame, ...reportEnds]),
        fadeIn(howBad, {
          shift: [0, 10],
        }),
        {
          duration: 0.4,
        },
      ),
    ),
  );
  reserve.on('sixty', () =>
    handoff(
      [howBad],
      () =>
        arrive(
          fadeIn(reportStat, {
            scale: 0.9,
          }),
          fadeIn(reportBand),
          fadeIn(reportSource),
          {
            duration: 0.5,
          },
        ),
      clearFirst,
    ),
  );
  reserve.on('historical', () =>
    stage.play(
      fadeIn(reportCaveat, {
        shift: [0, 8],
      }),
      {
        duration: 0.5,
      },
    ),
  );
  clearScene(reserve, [
    reportFrame,
    reportBand,
    reportStat,
    reportSource,
    ...reportEnds,
    reportCaveat,
  ]);
  return {
    POOL,
    TILE,
    poolAt,
    poolTiles,
    poolNumbers,
    blockOf,
    cover,
    uncover,
    showPool,
    hidePool,
  };
}
