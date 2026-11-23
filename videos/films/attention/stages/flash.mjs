import {
  Node,
  arrow,
  draw,
  fadeIn,
  group,
  indicate,
  lagged,
  line,
  linear,
  morph,
  rect,
  smoother,
  text,
  to,
} from 'vizmatic/stage';
import { gridNode, sceneHeading } from '../../../stage-lessons/kit.mjs';
import {
  LINEAR,
  brief,
  fadeOut,
  fade,
  f2,
  num,
  LEFT,
  prose,
  midProse,
  lineProse,
  midMono,
  math,
  midMath,
  block,
  waiting,
  dimIn,
  lit,
} from '../defaults.mjs';
import { TRACE } from '../model.mjs';

/** Exact attention, without storing the grid. */
export function buildFlash(stage, narration, { show, leave, handOver }) {
  const flashScene = narration.scene('flash');
  sceneHeading(stage, flashScene, narration.title('flash'));
  const HBM_X = -440,
    HBM_Y = 70,
    CHIP_X = 620,
    CHIP_Y = 70,
    GRID_SIZE = 360;
  const hbm = rect(760, 640, {
    radius: 18,
    fill: 'surface',
    stroke: 'dim',
    width: 3,
  }).at(HBM_X, HBM_Y);
  const hbmLabel = midProse('main memory (HBM)', HBM_X, -300, 50, 'dim');
  const onChip = rect(280, 280, {
    radius: 18,
    fill: 'surface',
    stroke: null,
  }).at(CHIP_X, CHIP_Y);
  // The outline paints over the grid, so the viewer sees the grid spill past the chip.
  const chipEdge = rect(280, 280, {
    radius: 18,
    stroke: 'yellow',
    width: 4,
  })
    .at(CHIP_X, CHIP_Y)
    .zIndex(3);
  const chipLabel = midProse('on the chip', CHIP_X, -150, 50, 'yellow');
  // One grid, the same size on every trip, and too large for the chip. It makes each trip on the verb that names it.
  const TRIP_Y = [-65, 25, 115, 205],
    WIRE_FROM = -40,
    WIRE_TO = 440,
    WIRE_X = (WIRE_FROM + WIRE_TO) / 2;
  const trips = ['write scores', 'read for softmax', 'write shares', 'read to mix'].map(
    (name, i) => ({
      wire: arrow(
        i % 2 ? [WIRE_FROM, TRIP_Y[i]] : [WIRE_TO, TRIP_Y[i]],
        i % 2 ? [WIRE_TO, TRIP_Y[i]] : [WIRE_FROM, TRIP_Y[i]],
        {
          stroke: i % 2 ? 'yellow' : 'red',
          width: 5,
          tip: 22,
        },
      ).zIndex(2),
      name: midProse(name, WIRE_X, TRIP_Y[i] - 34, 44, i % 2 ? 'yellow' : 'red').zIndex(3),
      plate: rect(
        text(name, {
          font: 'text-serif',
          size: 44,
        }).width + 28,
        54,
        {
          radius: 8,
          fill: 'bg',
          stroke: null,
        },
      )
        .at(WIRE_X, TRIP_Y[i] - 34)
        .zIndex(2),
    }),
  );
  const tripParts = trips.flatMap((trip) => [trip.wire, trip.plate, trip.name]);
  const scoreGrid = gridNode(8, GRID_SIZE, 'red').at(CHIP_X, CHIP_Y),
    shareGrid = gridNode(8, GRID_SIZE, 'yellow').at(CHIP_X, CHIP_Y);
  const tooBigTag = midProse(
    "At real sizes, the whole grid won't fit here.",
    CHIP_X - 110,
    310,
    44,
    'dim',
  );
  const naiveTag = midProse('A naive kernel:', CHIP_X, -300, 50, 'red');
  const tripsTag = midProse(
    'Those trips can take more time than the arithmetic.',
    0,
    450,
    54,
    'red',
  );
  const takeTrip = (node, i, x, cue) =>
    stage.play(
      brief(fadeIn([trips[i].wire, trips[i].plate, trips[i].name]), 0.15, 0, LINEAR),
      to(node, (grid) => grid.at(x, CHIP_Y)),
      {
        duration: Math.max(0.5, flashScene.span(cue)),
        ease: smoother,
      },
    );
  flashScene.at(0.1, () =>
    stage.play(fadeIn([hbm, hbmLabel, onChip, chipEdge, chipLabel]), {
      duration: 0.45,
    }),
  );
  flashScene.on('naive', () =>
    stage.play(
      fadeIn(scoreGrid, {
        scale: 0.8,
      }),
      fadeIn([tooBigTag, naiveTag]),
      {
        duration: 0.4,
      },
    ),
  );
  flashScene.on('write-grid', () => takeTrip(scoreGrid, 0, HBM_X, 'write-grid'));
  flashScene.on('read-softmax', () => takeTrip(scoreGrid, 1, CHIP_X, 'read-softmax'));
  flashScene.after('read-softmax', () =>
    stage.play(morph(scoreGrid, shareGrid), {
      duration: 0.25,
    }),
  );
  flashScene.on('write-result', () => takeTrip(shareGrid, 2, HBM_X, 'write-result'));
  flashScene.on('read-mix', () => takeTrip(shareGrid, 3, CHIP_X, 'read-mix'));
  flashScene.on('trips', () =>
    stage.play(
      fadeIn(tripsTag),
      lagged(
        trips.map((trip) =>
          indicate(trip.wire, {
            color: 'ink',
            scale: 1.04,
          }),
        ),
        {
          lag: 0.25,
        },
      ),
      {
        duration: 1.2,
      },
    ),
  );
  // Don't store the grid. It keeps its size, so nothing jumps.
  const ghostGrid = gridNode(8, GRID_SIZE, 'red').at(HBM_X, HBM_Y);
  const crossA = line([HBM_X - 200, HBM_Y - 200], [HBM_X + 200, HBM_Y + 200], {
      stroke: 'red',
      width: 8,
    }),
    crossB = line([HBM_X + 200, HBM_Y - 200], [HBM_X - 200, HBM_Y + 200], {
      stroke: 'red',
      width: 8,
    });
  const noGrid = midProse(
    "The grid is only a step on the way. Don't store it.",
    0,
    450,
    54,
    'green',
  );
  waiting([ghostGrid]);
  flashScene.on('simple-point', () =>
    stage.play(
      fadeOut([...tripParts, tripsTag, shareGrid, tooBigTag, naiveTag], {
        duration: 0.3,
      }),
      fade(ghostGrid, 0.4),
      {
        duration: 0.5,
      },
    ),
  );
  flashScene.on('dont-store', () =>
    stage.play(draw(crossA), draw(crossB), fadeIn(noGrid), {
      duration: 0.5,
    }),
  );
  // Tiles stay in memory. Copies come up one at a time and pass the block of queries.
  const queryBlock = block(2, 4, 'yellow', CHIP_X + 25, CHIP_Y - 55, 40);
  const queryName = midMath('Q', CHIP_X - 95, CHIP_Y - 55, 56, 'yellow');
  const tileGroup = (x, y, alpha = 0.85) =>
    group(
      rect(120, 92, {
        radius: 8,
        fill: 'blue',
        stroke: null,
      })
        .at(0, -50)
        .opacity(alpha),
      midMath('k', 0, -50, 56, 'bg'),
      rect(120, 92, {
        radius: 8,
        fill: 'green',
        stroke: null,
      })
        .at(0, 50)
        .opacity(alpha),
      midMath('v', 0, 50, 56, 'bg'),
    ).at(x, y);
  const tileHome = (i) => [HBM_X - 240 + i * 160, HBM_Y + 110];
  const tiles = [0, 1, 2, 3].map((i) => tileGroup(...tileHome(i)));
  const tileCopies = [0, 1, 2, 3].map((i) => tileGroup(...tileHome(i), 1));
  const LANE_Y = CHIP_Y + 72,
    LANE_IN = CHIP_X - 95,
    LANE_OUT = CHIP_X + 95;
  const tileName = midProse('tiles of keys and values', HBM_X, HBM_Y - 50, 54, 'ink');
  flashScene.on('hold-block', () =>
    stage.play(
      fadeOut([ghostGrid, crossA, crossB], {
        duration: 0.3,
      }),
      fadeIn([queryBlock, queryName]),
      {
        duration: 0.5,
      },
    ),
  );
  flashScene.on('stream', () =>
    stage.play(
      lagged(
        tiles.map((node) =>
          fadeIn(node, {
            scale: 0.8,
          }),
        ),
        {
          lag: 0.05,
        },
      ),
      {
        duration: 0.3,
      },
    ),
  );
  tileCopies.forEach((copy, i) =>
    flashScene.on(
      'stream',
      () => {
        stage.play(fadeIn(copy), {
          duration: 0.1,
        });
        stage.play(
          to(copy, (node) => node.at(LANE_IN, LANE_Y).scale(0.62)),
          {
            duration: 0.55,
            ease: smoother,
          },
        );
        stage.play(
          to(copy, (node) => node.at(LANE_OUT, LANE_Y)),
          indicate(queryBlock, {
            color: 'ink',
            scale: 1.05,
          }),
          {
            duration: 0.6,
            ease: linear,
          },
        );
        stage.play(fadeOut(copy), {
          duration: 0.12,
        });
      },
      0.25 + i * 1,
    ),
  );
  show(flashScene, 'called-tiles', tileName);
  // Online softmax keeps running numbers, so it never needs the whole row.
  const [first, second] = TRACE.steps;
  const stripName = prose('One row of scores:', LEFT, -335, 50, 'dim');
  const stripCell = (value, i, color) =>
    group(
      rect(150, 90, {
        radius: 8,
        fill: 'surface',
        stroke: color,
        width: 3,
      }),
      text(value, {
        font: 'mono',
        size: 50,
        color: color === 'faint' ? 'dim' : color,
      }).moveTo([0, 0]),
    ).at(-300 + i * 170, -335);
  const strip = ['1000', '?', '?', '?', '?', '?'].map((value, i) =>
    stripCell(value, i, i ? 'faint' : 'yellow'),
  );
  const stripNext = stripCell(String(second.peak), 1, 'red');
  const noRowTag = prose(
    "Unseen scores can still change the maximum.",
    LEFT,
    -235,
    54,
    'orange',
  );
  const varRows = [
    ['m', 'largest score so far', 'yellow'],
    ['\\ell', 'running sum of exponentials', 'teal'],
    ['u', 'running weighted sum of values', 'green'],
  ].map(([symbol, meaning, color], i) => ({
    symbol: math(symbol, LEFT, -110 + i * 110, 84, color),
    meaning: prose(meaning, LEFT + 110, -110 + i * 110, 58, color),
  }));
  const mNow = midMono(`= ${first.peak}`, 135, -110, 64, 'yellow'),
    mNext = midMono(`= ${second.peak}`, 135, -110, 64, 'red');
  // The old mass stays outlined as the running sums shrink to the new scale.
  const barLeft = 230;
  const pixelsPerUnit = 280;
  const carryBar = (mass, y, color, outline = false) => {
    const width = mass * pixelsPerUnit;
    return rect(width, 42, {
      radius: 6,
      fill: outline ? 'bg' : color,
      stroke: outline ? 'dim' : null,
      width: 3,
    }).at(barLeft + width / 2, y);
  };
  const carry = [
    [first.sum, 0, 'teal'],
    [first.weighted, 110, 'green'],
  ].map(([mass, y, color]) => ({
    track: carryBar(mass, y, color, true),
    full: carryBar(mass, y, color),
    shrunk: carryBar(mass * second.rescale, y, color),
  }));
  const rescaleEq = midMath(
    '\\text{larger score: } \\ell,\\ u \\ \\times\\ e^{\\,m_{\\text{old}} - m_{\\text{new}}}',
    0,
    310,
    76,
    'red',
  );
  const streamParts = [
    hbm,
    hbmLabel,
    onChip,
    chipEdge,
    chipLabel,
    queryBlock,
    queryName,
    ...tiles,
    tileName,
    noGrid,
  ];
  const varParts = varRows.flatMap((row) => [row.symbol, row.meaning]);
  waiting(varParts);
  // The bottom line is clear of the new picture, so it lingers, and the frame is never empty.
  flashScene.on('need-largest', () =>
    stage.play(
      fadeOut(noGrid, {
        duration: 0.5,
      }),
    ),
  );
  handOver(
    flashScene,
    'need-largest',
    streamParts.filter((node) => node !== noGrid),
    () =>
      stage.play(fadeIn([stripName, ...strip, noRowTag]), ...dimIn(varParts), {
        duration: 0.26,
      }),
    0.22,
    0.1,
  );
  flashScene.on('two-running', () =>
    stage.play(...lit(varParts.slice(0, 4)), fadeIn([mNow, carry[0].track, carry[0].full]), {
      duration: 0.6,
    }),
  );
  flashScene.on('adds-one', () =>
    stage.play(...lit(varParts.slice(4)), fadeIn([carry[1].track, carry[1].full]), {
      duration: 0.6,
    }),
  );
  // A larger score arrives in the strip, and m takes its value.
  flashScene.on('rescale', () =>
    stage.play(
      fadeOut([strip[1], mNow], {
        duration: 0.25,
      }),
      fadeIn([stripNext, mNext], {
        scale: 1.1,
      }),
      {
        duration: 0.6,
      },
    ),
  );
  flashScene.on('shrink-carry', () =>
    stage.play(...carry.map((bar) => morph(bar.full, bar.shrunk)), fadeIn(rescaleEq), {
      duration: 0.85,
    }),
  );
  // The worked trace, computed by the same online softmax the checks above run.
  // Each tile stays in memory as keys and values. A copy goes to the chip, where meeting Q turns its keys into scores.
  const toyFlag = midProse('made-up numbers, with one-number values', 0, -395, 44, 'dim');
  const traceMemBox = rect(720, 190, {
      radius: 14,
      fill: 'surface',
      stroke: 'dim',
      width: 3,
    }).at(-500, -255),
    traceChipBox = rect(720, 190, {
      radius: 14,
      fill: 'surface',
      stroke: 'yellow',
      width: 3,
    }).at(500, -255);
  const memName = prose('main memory', -845, -322, 40, 'dim'),
    chipName2 = prose('on the chip', 155, -322, 40, 'yellow');
  const card = (content, w, x, color = 'ink') =>
    group(
      rect(w, 104, {
        radius: 8,
        fill: 'bg',
        stroke: color,
        width: 2.5,
      }),
      text(content, {
        font: 'mono',
        size: 36,
        color,
        leading: 1.2,
      }).moveTo([0, 0]),
    ).at(x, -232);
  const CARD_ONE = 'key\nvalue 2',
    CARD_TWO = '2 keys\nvalues 1, 4';
  const SCORED_ONE = 'score 1000\nvalue 2',
    SCORED_TWO = 'scores 1001, 999\nvalues 1, 4';
  const cardOne = card(CARD_ONE, 240, -725),
    cardTwo = card(CARD_TWO, 320, -425);
  const cardOneCopy = card(CARD_ONE, 240, -725, 'yellow'),
    cardTwoCopy = card(CARD_TWO, 320, -425, 'yellow');
  const CHIP_SLOT = 600,
    cardOneScored = card(SCORED_ONE, 240, CHIP_SLOT, 'yellow'),
    cardTwoScored = card(SCORED_TWO, 400, CHIP_SLOT, 'yellow');
  const traceQ = block(2, 4, 'yellow', 285, -232, 28),
    traceQName = midMath('Q', 185, -232, 48, 'yellow');
  const pathArrow = arrow([-135, -255], [135, -255], {
    stroke: 'dim',
    width: 4,
    tip: 20,
  });
  const COL_X = {
    tile: -730,
    m: -400,
    l: 115,
    u: 615,
  };
  const heads4 = [
    ['m', COL_X.m, 'yellow'],
    ['\\ell', COL_X.l, 'teal'],
    ['u', COL_X.u, 'green'],
  ].map(([name, x, color]) => midMath(name, x, -112, 66, color));
  const headNotes = [
    ['largest so far', COL_X.m],
    ['sum of exponentials', COL_X.l],
    ['weighted sum', COL_X.u],
  ].map(([note, x]) => prose(note, x + 52, -112, 40, 'dim'));
  const traceRules = [-72, 28, 268].map((y) =>
    line([-880, y], [880, y], {
      stroke: 'dim',
      width: 2,
    }),
  );
  const row1 = [
    midProse('tile 1', COL_X.tile, -20, 56, 'dim'),
    midMono(String(first.peak), COL_X.m, -20, 62, 'yellow'),
    midMono(num(first.sum), COL_X.l, -20, 62, 'teal'),
    midMono(num(first.weighted), COL_X.u, -20, 62, 'green'),
  ];
  const row2a = [
    midProse('tile 2', COL_X.tile, 78, 56, 'dim'),
    midMono(String(second.peak), COL_X.m, 78, 62, 'yellow'),
  ];
  const rescaled = [
    midMath(`1 \\times e^{-1} = ${f2(second.rescale)}`, COL_X.l, 78, 56, 'red'),
    midMath(`2 \\times e^{-1} = ${f2(2 * second.rescale)}`, COL_X.u, 78, 56, 'red'),
  ];
  const added = [
    midMath(`+\\ e^{0} + e^{-2}`, COL_X.l, 150, 56, 'teal'),
    midMath(`+\\ 1 e^{0} + 4 e^{-2}`, COL_X.u, 150, 56, 'green'),
  ];
  const totals = [
    midMono(second.sum.toFixed(3), COL_X.l, 225, 66, 'teal'),
    midMono(second.weighted.toFixed(3), COL_X.u, 225, 66, 'green'),
  ];
  const finalEq = midMath(
    `\\frac{u}{\\ell} = \\frac{${second.weighted.toFixed(3)}}{${second.sum.toFixed(3)}} \\approx ${f2(TRACE.output)}`,
    -420,
    385,
    88,
    'yellow',
  );
  const fullRowTag = midProse('the same as the full row', 470, 385, 62, 'green');
  const runningParts = [
    stripName,
    strip[0],
    ...strip.slice(2),
    stripNext,
    noRowTag,
    ...varParts,
    mNext,
    ...carry.flatMap((bar) => [bar.track, bar.shrunk]),
    rescaleEq,
  ];
  const passQ = (copy, scored) => {
    stage.play(fadeIn(copy), {
      duration: 0.1,
    });
    stage.play(
      to(copy, (node) => node.at(CHIP_SLOT, -232)),
      indicate(traceQ, {
        color: 'ink',
        scale: 1.08,
      }),
      {
        duration: 0.8,
        ease: smoother,
      },
    );
    stage.play(fadeOut(copy), fadeIn(scored), {
      duration: 0.25,
    });
  };
  const topBoxes = [
    traceMemBox,
    traceChipBox,
    memName,
    chipName2,
    cardOne,
    cardTwo,
    traceQ,
    traceQName,
    pathArrow,
  ];
  handOver(flashScene, 'try-it', runningParts, () =>
    stage.play(fadeIn([toyFlag, ...topBoxes, ...heads4, ...headNotes, ...traceRules]), {
      duration: 0.18,
    }),
  );
  flashScene.on('first-tile', () => {
    stage.play(fadeIn(row1[0]), {
      duration: 0.2,
    });
    passQ(cardOneCopy, cardOneScored);
  });
  flashScene.after('first-state', () =>
    stage.play(
      fadeOut(cardOneScored, {
        duration: 0.3,
      }),
      fadeIn(row1.slice(1)),
      {
        duration: 0.5,
      },
    ),
  );
  flashScene.on('next-tile', () => {
    stage.play(fadeIn(row2a[0]), {
      duration: 0.2,
    });
    passQ(cardTwoCopy, cardTwoScored);
  });
  flashScene.on('rises', () =>
    stage.play(fadeIn(row2a[1]), {
      duration: 0.5,
    }),
  );
  flashScene.after('rises', () => stage.play(fadeIn(rescaled), { duration: 0.2 }));
  flashScene.on('add-new', () =>
    stage.play(
      fadeOut(cardTwoScored, {
        duration: 0.3,
      }),
      fadeIn(added),
      {
        duration: 0.6,
      },
    ),
  );
  flashScene.after('add-new', () => stage.play(fadeIn(totals), { duration: 0.2 }));
  flashScene.after('divide-end', () =>
    stage.play(
      fadeOut(topBoxes, {
        duration: 0.3,
      }),
      fadeIn(finalEq),
      {
        duration: 0.6,
      },
    ),
  );
  show(flashScene, 'full-row', fullRowTag);
  // What main memory holds, before and after.
  const PANEL_X = [-460, 460],
    PANEL_Y = -60;
  const panelBoxes = PANEL_X.map((x) =>
    rect(800, 430, {
      radius: 18,
      fill: 'surface',
      stroke: 'dim',
      width: 3,
    }).at(x, PANEL_Y),
  );
  const panelTitles = [
    lineProse('A naive kernel, main memory', PANEL_X[0], -324, 56, 'red'),
    lineProse('FlashAttention, main memory', PANEL_X[1], -324, 56, 'green'),
  ];
  // Until the grid goes away, this panel shows the state FlashAttention removes, so it can't carry the name yet.
  const undecidedTitle = lineProse('Same pairs, main memory', PANEL_X[1], -324, 56, 'ink');
  const naiveStored = gridNode(8, 300, 'red').at(PANEL_X[0], PANEL_Y - 40),
    flashStored = gridNode(8, 300, 'red').at(PANEL_X[1], PANEL_Y - 40);
  const goneTag = midProse('quadratic storage: gone', PANEL_X[1], PANEL_Y - 40, 60, 'red');
  const rowStats = Array.from(
    {
      length: 8,
    },
    (_, i) =>
      rect(96, 30, {
        radius: 5,
        fill: 'green',
        stroke: null,
      })
        .at(PANEL_X[1] - 270, PANEL_Y - 40 + (i - 3.5) * 38)
        .opacity(0.85),
  );
  const rowStatsName = prose(
    'Row statistics:\nlinear, not quadratic',
    PANEL_X[1] - 190,
    PANEL_Y - 40,
    56,
    'green',
    {
      leading: 1.14,
    },
  );
  const backNaive = midProse(
      'Backward pass: read the saved grid',
      PANEL_X[0],
      PANEL_Y + 165,
      44,
      'red',
    ),
    backFlash = midProse('Backward pass: recompute tiles', PANEL_X[1], PANEL_Y + 165, 44, 'green');
  const exactLine = prose('Exact, up to rounding.', LEFT, 225, 56),
    pairsLine = prose('Every allowed pair is still computed.', -240, 225, 56);
  const tradeTag = midProse('Extra arithmetic for less memory traffic.', 0, 330, 66, 'yellow');
  const measureTag = midProse(
    'The time saved depends on hardware and workload. Measure it.',
    0,
    425,
    50,
    'dim',
  );
  const traceParts = [
    toyFlag,
    ...heads4,
    ...headNotes,
    ...traceRules,
    ...row1,
    ...row2a,
    ...rescaled,
    ...added,
    ...totals,
    finalEq,
    fullRowTag,
  ];
  handOver(flashScene, 'exact', traceParts, () =>
    stage.play(
      fadeIn([...panelBoxes, panelTitles[0], undecidedTitle, naiveStored, flashStored, exactLine]),
      {
        duration: 0.18,
      },
    ),
  );
  show(flashScene, 'allowed-pairs', pairsLine);
  flashScene.on('goes-away', () => {
    stage.play(fadeOut([flashStored, undecidedTitle]), {
      duration: 0.3,
    });
    stage.play(fadeIn([goneTag, panelTitles[1]]), {
      duration: 0.3,
    });
  });
  flashScene.on('row-stats', () => {
    stage.play(fadeOut(goneTag), {
      duration: 0.2,
    });
    stage.play(
      lagged(
        rowStats.map((node) =>
          fadeIn(node, {
            shift: [-10, 0],
          }),
        ),
        {
          lag: 0.04,
        },
      ),
      fadeIn(rowStatsName),
      {
        duration: 0.5,
      },
    );
  });
  show(flashScene, 'backward', [backNaive, backFlash]);
  show(flashScene, 'trade', tradeTag);
  show(flashScene, 'measure-it', measureTag);
  // Two bottlenecks, each with the picture it came from.
  const FIX_X = [-460, 460];
  const fixDivider = line([0, -370], [0, 400], {
    stroke: 'faint',
    width: 3,
  });
  const fixTrainName = lineProse('Training', FIX_X[0], -330, 70),
    fixGenName = lineProse('Generation', FIX_X[1], -330, 70);
  const fixTrainWhat = lineProse('storing and moving score grids', FIX_X[0], -255, 52, 'dim'),
    fixGenWhat = lineProse('storing and reading the cache', FIX_X[1], -255, 52, 'dim');
  const fixGrid = gridNode(8, 280, 'red').at(FIX_X[0], -30);
  const fixCache = new Node();
  for (let i = 0; i < 8; i++) {
    fixCache.add(
      rect(84, 110, {
        radius: 8,
        fill: 'blue',
        stroke: null,
      })
        .at((i - 3.5) * 96, -62)
        .opacity(0.75),
    );
    fixCache.add(
      rect(84, 110, {
        radius: 8,
        fill: 'green',
        stroke: null,
      })
        .at((i - 3.5) * 96, 62)
        .opacity(0.75),
    );
  }
  fixCache.at(FIX_X[1], -30);
  const fixTrainKind = lineProse('temporary data', FIX_X[0], 180, 56, 'dim'),
    fixGenKind = lineProse('persistent data', FIX_X[1], 180, 56, 'dim');
  const fixTrainName2 = lineProse('FlashAttention', FIX_X[0], 300, 84, 'yellow'),
    fixGenName2 = lineProse('Multi query or grouped query', FIX_X[1], 300, 66, 'green');
  const fixLeft = [fixTrainName, fixTrainWhat, fixGrid, fixTrainKind, fixTrainName2],
    fixRight = [fixGenName, fixGenWhat, fixCache, fixGenKind, fixGenName2];
  const keepApart = [
    ...panelBoxes,
    ...panelTitles,
    naiveStored,
    ...rowStats,
    rowStatsName,
    backNaive,
    backFlash,
    exactLine,
    pairsLine,
    tradeTag,
    measureTag,
  ];
  waiting([...fixLeft, ...fixRight]);
  // Old labels leave first, so no new title lands on one. The panels linger, so the frame is never empty.
  const lingering = [...panelBoxes, naiveStored, ...rowStats];
  handOver(
    flashScene,
    'apart',
    lingering,
    () =>
      stage.play(...dimIn([...fixLeft, ...fixRight]), fadeIn(fixDivider), {
        duration: 0.35,
      }),
    0.45,
    0.14,
  );
  flashScene.on('apart', () =>
    stage.play(
      fadeOut(
        keepApart.filter((node) => !lingering.includes(node)),
        {
          duration: 0.16,
        },
      ),
    ),
  );
  flashScene.on('fix-train', () =>
    stage.play(...lit(fixLeft), {
      duration: 0.5,
    }),
  );
  flashScene.on('fix-generate', () =>
    stage.play(...lit(fixRight), {
      duration: 0.5,
    }),
  );
  leave(flashScene, [fixDivider, ...fixLeft, ...fixRight]);
}
