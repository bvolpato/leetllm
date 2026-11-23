import assert from 'node:assert/strict';
import {
  arrow,
  concat,
  draw,
  dynamic,
  fade,
  fadeIn,
  indicate,
  lagged,
  Node,
  rect,
  rectPath,
  smoother,
  to,
  write,
} from 'vizmatic/stage';
import { chip, sceneHeading } from '../../../stage-lessons/kit.mjs';
import {
  fmt,
  PROMPT_TOKENS,
  PREFIX_BLOCK,
  REQUESTS,
  FULL_BLOCKS,
  TAIL_TOKENS,
  NO_SHARING,
  WARM,
  hashOf,
} from '../model.mjs';

/** Reusable state depends on the full prefix. */
export function buildPrefix(
  stage,
  narration,
  { T, M, S, place, fadeOut, bar, clearScene, pulse, arrive, clearFirst, handoff },
) {
  const prefix = narration.scene('prefix');
  sceneHeading(stage, prefix, narration.title('prefix'));
  const STORE_LEFT = -780,
    STORE_Y = -300,
    STORE_CELL = 104,
    STORE_COUNT = 6;
  const storeNames = Array.from(
    {
      length: STORE_COUNT,
    },
    (_, i) => `s${i + 1}`,
  );
  const storeCells = storeNames.map((name, i) =>
    chip(name, {
      w: STORE_CELL - 8,
      h: 92,
      color: 'purple',
      size: 40,
      fill: 'bg',
    }).at(STORE_LEFT + STORE_CELL / 2 + i * STORE_CELL, STORE_Y),
  );
  const storeTitle = place(
    M('blocks kept by the engine', {
      size: 38,
      color: 'dim',
    }),
    STORE_LEFT + 680,
    STORE_Y - 26,
  );
  const storeRefs = stage.value(0);
  const storeCount = dynamic(() =>
    M(`refs ${Math.round(storeRefs.value)}`, {
      size: 54,
      color: 'yellow',
    }).at(STORE_LEFT + 800, STORE_Y + 32),
  );
  const REQ_Y = [-130, -34, 62],
    REQ_NAMES = [
      ['R1', 'blue'],
      ['R2', 'orange'],
      ['R3', 'green'],
    ];
  const reqLabels = REQ_NAMES.map(([name, color], i) =>
    M(name, {
      size: 54,
      color,
    }).at(STORE_LEFT - 60, REQ_Y[i]),
  );
  const reqTails = REQ_NAMES.map(([, color], i) =>
    rect(STORE_CELL * 3, 64, {
      radius: 8,
      fill: color,
      stroke: null,
    }).at(STORE_LEFT + (STORE_COUNT + 1.5) * STORE_CELL, REQ_Y[i]),
  );
  const reqBlocks = REQ_NAMES.map((_, row) =>
    storeNames.map((__, i) =>
      rect(STORE_CELL - 8, 64, {
        radius: 8,
        fill: 'purple',
        stroke: null,
      })
        .opacity(0.72)
        .at(STORE_LEFT + STORE_CELL / 2 + i * STORE_CELL, REQ_Y[row])
        .zIndex(2),
    ),
  );
  const reqKey = [
    place(
      S('the same system prompt', {
        size: 40,
        color: 'purple',
      }),
      STORE_LEFT,
      140,
    ),
    place(
      S("each one's own question", {
        size: 40,
        color: 'dim',
      }),
      STORE_LEFT + 640,
      140,
    ),
  ];
  // After sharing, each request keeps only its tail and a table that points up at the shared run.
  const TABLE_XS = [-690, -560, -430];
  const reqTables = REQ_Y.map((y, i) =>
    chip('table', {
      w: 120,
      h: 58,
      color: REQ_NAMES[i][1],
      size: 38,
    })
      .at(TABLE_XS[i], y)
      .zIndex(3),
  );
  const reqLinks = REQ_Y.map((y, i) =>
    arrow([TABLE_XS[i], y - 32], [TABLE_XS[i], STORE_Y + 66], {
      stroke: REQ_NAMES[i][1],
      width: 4,
      tip: 20,
    }).zIndex(1),
  );
  const storeRail = rect(STORE_COUNT * STORE_CELL - 8, 10, {
    radius: 5,
    fill: 'purple',
    stroke: null,
  }).at(STORE_LEFT + (STORE_COUNT * STORE_CELL) / 2, STORE_Y + 58);
  const oneName = place(
    T('One request', {
      size: 72,
      color: 'blue',
    }),
    STORE_LEFT,
    280,
  );
  const sepName = place(
    T('Separate requests, the same start', {
      size: 72,
      color: 'purple',
    }),
    STORE_LEFT,
    280,
  );
  const prefixName = place(
    T('Prefix caching', {
      italic: true,
      size: 100,
      color: 'yellow',
    }),
    STORE_LEFT,
    280,
  );
  prefix.at(0.05, () =>
    stage.play(
      fadeIn([reqLabels[0], reqTails[0], ...reqBlocks[0]], {
        shift: [0, 10],
      }),
      fadeIn(oneName),
      {
        duration: 0.45,
      },
    ),
  );
  prefix.on('branches', () =>
    stage.play(
      lagged(
        reqBlocks[0].map((node) =>
          indicate(node, {
            color: 'purple',
            scale: 1.04,
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
  prefix.on('separate', () =>
    handoff(
      [oneName],
      () =>
        arrive(
          fadeIn(sepName),
          lagged(
            [1, 2].map((row) =>
              fadeIn([reqLabels[row], reqTails[row], ...reqBlocks[row]], {
                shift: [0, 10],
              }),
            ),
            {
              lag: 0.4,
            },
          ),
          {
            duration: 0.8,
          },
        ),
      clearFirst,
    ),
  );
  prefix.on('same-text', () =>
    stage.play(
      fadeIn(reqKey),
      lagged(
        reqBlocks.flat().map((node) =>
          indicate(node, {
            color: 'yellow',
            scale: 1.03,
          }),
        ),
        {
          lag: 0.02,
        },
      ),
      {
        duration: 0.9,
      },
    ),
  );
  prefix.on('prefix-name', () =>
    handoff(
      [sepName],
      () =>
        arrive(write(prefixName), {
          duration: 0.7,
        }),
      clearFirst,
    ),
  );
  // Fly one request's blocks up onto the shared run. They arrive, and they merge into it.
  const mergeRow = (row, count) => {
    const flights = reqBlocks[row].map((node, i) =>
      to(node, (moved) => moved.at(STORE_LEFT + STORE_CELL / 2 + i * STORE_CELL, STORE_Y)),
    );
    stage.play(
      lagged(flights, {
        lag: 0.06,
      }),
      {
        duration: 0.65,
        ease: smoother,
      },
    );
    stage.play(
      ...reqBlocks[row].map((node) =>
        fadeOut(node, {
          duration: 0.2,
        }),
      ),
      fadeIn(reqTables[row], {
        scale: 0.85,
      }),
      draw(reqLinks[row]),
      storeRefs.to(count),
      {
        duration: 0.35,
      },
    );
  };
  prefix.on('keeps', () => {
    stage.play(fadeIn(storeCells), fadeIn(storeRail), fadeIn(storeTitle), fadeIn(storeCount), {
      duration: 0.2,
    });
    mergeRow(0, 1);
  });
  const lookupMark = M('look up', {
    size: 46,
    color: 'yellow',
  }).at(310, REQ_Y[1]);
  prefix.on('looks-up', () =>
    stage.play(
      fadeIn(lookupMark),
      lagged(
        reqBlocks[1].map((node) =>
          indicate(node, {
            color: 'yellow',
            scale: 1.06,
          }),
        ),
        {
          lag: 0.1,
        },
      ),
      {
        duration: 1,
      },
    ),
  );
  prefix.on('points', () => {
    stage.play(
      fadeOut(lookupMark, {
        duration: 0.2,
      }),
      {
        duration: 0.2,
      },
    );
    mergeRow(1, 2);
    mergeRow(2, 3);
  });
  const prefixParts1 = [
    ...reqLabels,
    ...reqTails,
    ...reqKey,
    ...reqTables,
    ...reqLinks,
    ...storeCells,
    storeRail,
    storeTitle,
    storeCount,
    prefixName,
  ];
  // The lookup covers everything before a block. The same sentence after different text gets a different key.
  const CHAIN_LEFT = -800,
    CHAIN_Y = [-230, -60];
  const chainContexts = ['Contract A.', 'Contract B.'],
    SENTENCE = 'Summarize this.';
  const chainRows = chainContexts.map((context, i) => {
    const node = new Node(),
      y = CHAIN_Y[i];
    node.add(
      chip(context, {
        w: 370,
        h: 110,
        color: i ? 'orange' : 'blue',
        size: 46,
      }).at(CHAIN_LEFT + 185, y),
      chip(SENTENCE, {
        w: 440,
        h: 110,
        color: 'yellow',
        size: 46,
      }).at(CHAIN_LEFT + 620, y),
    );
    return node;
  });
  const keyOf = (context, extra = '') => `#${hashOf(`${context}|${SENTENCE}|${extra}`)}`;
  assert.notEqual(keyOf(chainContexts[0]), keyOf(chainContexts[1]));
  assert.notEqual(keyOf(chainContexts[0], 'model'), keyOf(chainContexts[0]));
  assert.notEqual(keyOf(chainContexts[0], 'model|customer'), keyOf(chainContexts[0], 'model'));
  const chainKeys = chainContexts.map((context, i) =>
    place(
      M(`hash ${keyOf(context)}`, {
        size: 56,
        color: i ? 'orange' : 'blue',
      }),
      CHAIN_LEFT + 900,
      CHAIN_Y[i],
    ),
  );
  const chainBlank = chainContexts.map((_, i) =>
    place(
      M('hash ????', {
        size: 56,
        color: 'dim',
      }),
      CHAIN_LEFT + 900,
      CHAIN_Y[i],
    ),
  );
  const sameNote = place(
    T('Same sentence. A different hash, because the past differs.', {
      size: 50,
      color: 'ink',
    }),
    CHAIN_LEFT,
    60,
  );
  const toyHash = place(
    S('Toy hash, for illustration', {
      size: 38,
      color: 'dim',
    }),
    CHAIN_LEFT,
    120,
  );
  const notEnough = place(
    T("One sentence on its own\nisn't enough", {
      size: 110,
      color: 'red',
      leading: 1.12,
    }),
    CHAIN_LEFT,
    210,
  );
  prefix.on('sentence', () =>
    handoff(prefixParts1, () =>
      arrive(
        lagged(
          chainRows.map((node) =>
            fadeIn(node, {
              shift: [0, 10],
            }),
          ),
          {
            lag: 0.3,
          },
        ),
        fadeIn(chainBlank),
        fadeIn(notEnough),
        {
          duration: 0.6,
        },
      ),
    ),
  );
  prefix.on('before', () =>
    stage.play(pulse(chainRows[0], 1.02), pulse(chainRows[1], 1.02), {
      duration: 0.7,
    }),
  );
  prefix.on('lookup', () =>
    stage.play(
      fadeOut([...chainBlank, notEnough], {
        duration: 0.15,
      }),
      lagged(
        chainKeys.map((node) =>
          fadeIn(node, {
            shift: [14, 0],
          }),
        ),
        {
          lag: 0.3,
        },
      ),
      fadeIn([sameNote, toyHash]),
      {
        duration: 0.7,
      },
    ),
  );
  const inputChips = [
    ['+ the model', 'teal'],
    ['+ a value for each customer', 'red'],
  ].map(([name, color], i) =>
    chip(name, {
      w: i ? 800 : 360,
      h: 96,
      color,
      size: 46,
    }).at(CHAIN_LEFT + (i ? 830 : 180), 230),
  );
  const modelKey = place(
    M(`hash ${keyOf(chainContexts[0], 'model')}`, {
      size: 46,
      color: 'teal',
    }),
    CHAIN_LEFT,
    330,
  );
  const customerKey = place(
    M(`hash ${keyOf(chainContexts[0], 'model|customer')}`, {
      size: 46,
      color: 'red',
    }),
    CHAIN_LEFT + 430,
    330,
  );
  const customerNote = place(
    T("With a value per customer, they can't match each other's blocks", {
      size: 50,
      color: 'dim',
    }),
    CHAIN_LEFT,
    420,
  );
  prefix.on('model', () =>
    stage.play(
      fadeIn(inputChips[0], {
        scale: 0.9,
      }),
      fadeIn(modelKey),
      {
        duration: 0.5,
      },
    ),
  );
  prefix.on('customer', () =>
    stage.play(
      fadeIn(inputChips[1], {
        scale: 0.9,
      }),
      fadeIn(customerKey),
      fadeIn(customerNote),
      {
        duration: 0.6,
      },
    ),
  );
  const prefixParts2 = [
    ...chainRows,
    ...chainKeys,
    sameNote,
    toyHash,
    ...inputChips,
    modelKey,
    customerKey,
    customerNote,
  ];
  // Occupied blocks to one scale, one small square for every block.
  const DOT = 8,
    cellPath = (x, y) => rectPath(x, y, DOT - 2, DOT - 2, 1);
  const NONE_COLS = 80,
    NONE_LEFT = -850,
    GRID_TOP = -235;
  assert.equal(NONE_COLS * NONE_COLS, NO_SHARING);
  const noneCells = Array.from(
    {
      length: NO_SHARING,
    },
    (_, i) =>
      cellPath(NONE_LEFT + (i % NONE_COLS) * DOT, GRID_TOP + Math.floor(i / NONE_COLS) * DOT),
  );
  const noneGrid = new Node(concat(...noneCells)).fill('red', 0.85);
  const WARM_LEFT = 110;
  const sharedCells = Array.from(
    {
      length: FULL_BLOCKS,
    },
    (_, i) => cellPath(WARM_LEFT + i * DOT, GRID_TOP),
  );
  const privateCells = Array.from(
    {
      length: REQUESTS,
    },
    (_, i) =>
      cellPath(
        WARM_LEFT + (i % FULL_BLOCKS) * DOT,
        GRID_TOP + 16 + Math.floor(i / FULL_BLOCKS) * DOT,
      ),
  );
  const warmGrid = new Node();
  warmGrid.add(
    new Node(concat(...sharedCells)).fill('purple', 1),
    new Node(concat(...privateCells)).fill('green', 0.95),
  );
  // One request's prompt as blocks, repeated, before the same blocks are counted to scale.
  const STRIP_LEFT = -800,
    STRIP_CELL = 44,
    STRIP_ROWS = 7;
  const stripY = (row) => -215 + row * 52;
  const stripCell = (x, y, width = STRIP_CELL - 4) =>
    rectPath(STRIP_LEFT + x * STRIP_CELL, y - 18, width, 36, 3);
  const stripFrames = new Node(
    concat(
      ...Array.from(
        {
          length: STRIP_ROWS,
        },
        (_, row) =>
          concat(
            ...Array.from(
              {
                length: FULL_BLOCKS + 1,
              },
              (_, i) => stripCell(i, stripY(row)),
            ),
          ),
      ),
    ),
  ).stroke('dim', 1.5);
  const stripFull = new Node(
    concat(
      ...Array.from(
        {
          length: STRIP_ROWS,
        },
        (_, row) =>
          concat(
            ...Array.from(
              {
                length: FULL_BLOCKS,
              },
              (_, i) => stripCell(i, stripY(row)),
            ),
          ),
      ),
    ),
  ).fill('purple', 0.9);
  const stripTail = new Node(
    concat(
      ...Array.from(
        {
          length: STRIP_ROWS,
        },
        (_, row) =>
          stripCell(FULL_BLOCKS, stripY(row), ((STRIP_CELL - 4) * TAIL_TOKENS) / PREFIX_BLOCK),
      ),
    ),
  ).fill('green', 0.95);
  const stripCount = M(`× ${REQUESTS}`, {
    size: 84,
    color: 'ink',
  }).at(775, stripY(3));
  const completeName = place(
    T('In our example, only complete blocks are shared', {
      size: 60,
      color: 'yellow',
    }),
    -850,
    -350,
  );
  const requestLine = place(
    M(`${REQUESTS} requests, ${PROMPT_TOKENS} token prompt, ${PREFIX_BLOCK} token blocks`, {
      size: 40,
      color: 'dim',
    }),
    -850,
    -285,
  );
  const oneRequest = place(
    M(`${FULL_BLOCKS} full blocks hold ${FULL_BLOCKS * PREFIX_BLOCK} tokens`, {
      size: 54,
      color: 'purple',
    }),
    STRIP_LEFT,
    215,
  );
  const tailLine = place(
    M(`The last ${TAIL_TOKENS} tokens: 1 private partial block per request`, {
      size: 50,
      color: 'green',
    }),
    STRIP_LEFT,
    300,
  );
  const noneStat = place(
    M(`no sharing: ${fmt(NO_SHARING)}`, {
      size: 56,
      color: 'red',
    }),
    NONE_LEFT,
    460,
  );
  const warmStat = place(
    M(`warm cache: ${FULL_BLOCKS} + ${REQUESTS} = ${WARM}`, {
      size: 48,
      color: 'green',
    }),
    WARM_LEFT,
    -40,
  );
  const warmKey = place(
    S(`${FULL_BLOCKS} shared, ${REQUESTS} private partial blocks`, {
      size: 42,
      color: 'dim',
    }),
    WARM_LEFT,
    30,
  );
  const fewerStat = place(
    M(`about ${Math.round(100 * (1 - WARM / NO_SHARING))}% fewer`, {
      size: 84,
      color: 'yellow',
    }),
    WARM_LEFT,
    170,
  );
  const snapshotNote = place(
    S('In this snapshot. Each square is one block.', {
      size: 38,
      color: 'dim',
    }),
    WARM_LEFT,
    280,
  );
  prefix.on('complete', () =>
    handoff(prefixParts2, () =>
      arrive(fadeIn([completeName, stripFrames]), {
        duration: 0.45,
      }),
    ),
  );
  prefix.on('two-hundred', () =>
    stage.play(
      fadeIn(requestLine),
      fadeIn(stripCount, {
        scale: 0.85,
      }),
      {
        duration: 0.4,
      },
    ),
  );
  prefix.on('full', () => stage.play(pulse(requestLine, 1.02), { duration: 0.6 }));
  prefix.after('full', () =>
    stage.play(fadeIn(stripFull), fadeIn(oneRequest), {
      duration: 0.5,
    }),
  );
  prefix.after('tail', () =>
    stage.play(fadeIn(stripTail), fadeIn(tailLine), {
      duration: 0.5,
    }),
  );
  prefix.on('none', () => stage.play(pulse(stripCount, 1.04), { duration: 0.5 }));
  prefix.after('none', () =>
    handoff(
      [stripFrames, stripFull, stripTail, stripCount, oneRequest, tailLine, completeName],
      () =>
        arrive(
          fadeIn(noneGrid, {
            scale: 0.96,
          }),
          fadeIn(noneStat),
          {
            duration: 0.5,
          },
        ),
    ),
  );
  prefix.after('warm', () =>
    stage.play(
      fadeIn(warmGrid, {
        scale: 0.96,
      }),
      fadeIn(warmStat),
      fadeIn(warmKey),
      {
        duration: 0.6,
      },
    ),
  );
  prefix.after('fewer', () =>
    stage.play(
      fadeIn(fewerStat, {
        shift: [0, 10],
      }),
      fadeIn(snapshotNote),
      {
        duration: 0.6,
      },
    ),
  );
  const prefixParts3 = [
    noneGrid,
    warmGrid,
    requestLine,
    noneStat,
    warmStat,
    warmKey,
    fewerStat,
    snapshotNote,
  ];
  // What a hit skips, drawn along one prompt.
  const HIT_LEFT = -800,
    HIT_W = 1600,
    HIT_Y = -120,
    HIT_MATCH = 0.68,
    HIT_LAST = 0.03;
  const hitMatch = bar(HIT_LEFT, HIT_Y, HIT_W * HIT_MATCH - 4, 120, 'purple');
  const hitRest = bar(
    HIT_LEFT + HIT_W * HIT_MATCH,
    HIT_Y,
    HIT_W * (1 - HIT_MATCH - HIT_LAST) - 4,
    120,
    'yellow',
  );
  const hitLast = bar(HIT_LEFT + HIT_W * (1 - HIT_LAST), HIT_Y, HIT_W * HIT_LAST, 120, 'red');
  const hitNames = [
    M('match: prefill skipped', {
      size: 46,
      color: 'bg',
    }).at(HIT_LEFT + (HIT_W * HIT_MATCH) / 2, HIT_Y),
    M('still runs', {
      size: 46,
      color: 'bg',
    }).at(HIT_LEFT + HIT_W * (HIT_MATCH + (1 - HIT_MATCH - HIT_LAST) / 2), HIT_Y),
  ];
  const hitLastName = place(
    T('Typically at least the last token runs too, for its scores', {
      size: 50,
      color: 'red',
    }),
    HIT_LEFT,
    HIT_Y + 110,
  );
  const hitTitle = place(
    M('one prompt', {
      size: 38,
      color: 'dim',
    }),
    HIT_LEFT,
    HIT_Y - 98,
  );
  const evictCells = Array.from(
    {
      length: 12,
    },
    (_, i) =>
      rect(120, 90, {
        radius: 8,
        fill: 'purple',
        stroke: null,
      })
        .opacity(0.9)
        .at(HIT_LEFT + 64 + i * 133, 200),
  );
  const evictNote = place(
    T('Evict some, and a cold cache changes the numbers', {
      size: 54,
      color: 'dim',
    }),
    HIT_LEFT,
    310,
  );
  const evictName = place(
    M('blocks kept in the pool (example)', {
      size: 38,
      color: 'dim',
    }),
    HIT_LEFT,
    130,
  );
  prefix.on('hit', () =>
    handoff(prefixParts3, () =>
      arrive(
        fadeIn(hitMatch, {
          shift: [-20, 0],
        }),
        fadeIn(hitNames[0]),
        fadeIn(hitTitle),
        lagged(
          evictCells.map((node) => fadeIn(node)),
          {
            lag: 0.03,
          },
        ),
        fadeIn(evictName),
        {
          duration: 0.55,
        },
      ),
    ),
  );
  prefix.on('rest', () =>
    stage.play(
      fadeIn(hitRest, {
        shift: [-20, 0],
      }),
      fadeIn(hitNames[1]),
      {
        duration: 0.5,
      },
    ),
  );
  prefix.on('last', () =>
    stage.play(fadeIn(hitLast), fadeIn(hitLastName), {
      duration: 0.5,
    }),
  );
  prefix.on('evict', () =>
    stage.play(fadeIn(evictNote), {
      duration: 0.5,
    }),
  );
  prefix.after('evict', () =>
    stage.play(
      lagged(
        evictCells.filter((_, i) => i % 3 !== 1).map((node) => fade(node, 0.12)),
        {
          lag: 0.08,
        },
      ),
      {
        duration: 0.8,
      },
    ),
  );
  clearScene(prefix, [
    hitMatch,
    hitRest,
    hitLast,
    ...hitNames,
    hitLastName,
    hitTitle,
    ...evictCells,
    evictName,
    evictNote,
  ]);
}
