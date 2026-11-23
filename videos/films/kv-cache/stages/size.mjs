import {
  draw,
  dynamic,
  fade,
  fadeIn,
  indicate,
  lagged,
  line,
  Node,
  rect,
  scene3d,
  smoother,
  tex,
  to,
  write,
} from 'vizmatic/stage';
import { sceneHeading } from '../../../stage-lessons/kit.mjs';
import {
  KIB,
  MIB,
  GIB,
  fmt,
  LAYERS,
  HEADS,
  QUERY_HEADS,
  PER_TOKEN,
  CONVERSATION,
  EIGHTY,
  BIG_LAYERS,
  BIG_PER_TOKEN,
  human,
} from '../model.mjs';
import { box } from '../defaults.mjs';

/** So how big is it?. */
export function buildSize(
  stage,
  narration,
  { T, M, S, place, brief, fadeOut, crossfade, clearFirst, handoff },
) {
  const size = narration.scene('size');
  sceneHeading(stage, size, narration.title('size'));
  // One slice per token, one row per layer, one column per KV head. The length is to scale, and
  // the framing pulls back as the block grows, so it stays large from the first cell to the last.
  const tokens = stage.value(1),
    keyValue = stage.value(0),
    layers = stage.value(1),
    heads = stage.value(1);
  const LENGTH = 5.2,
    HEIGHT = 3.2,
    DEPTH = 2,
    SLICE = 0.22,
    FRAME = 3.4;
  const length = () => SLICE + ((LENGTH - SLICE) * (tokens.value - 1)) / 4095,
    height = () => (HEIGHT * layers.value) / LAYERS,
    depth = () => (DEPTH * heads.value) / HEADS;
  const autoZoom = (L, H, span) =>
    FRAME / ((H ** 4 + (0.78 * L) ** 4 + (0.62 * span) ** 4) ** 0.25 + 0.1);
  // A held zoom lets a costlier block look larger, instead of being framed back to the same size.
  const zoomHold = stage.value(0),
    heldZoom = stage.value(1);
  const measure = () => {
    const L = length(),
      H = height(),
      D = depth(),
      G = D * 0.28 * keyValue.value,
      span = D + G + D * keyValue.value;
    const auto = autoZoom(L, H, span),
      zoom = auto + (heldZoom.value - auto) * zoomHold.value;
    return {
      L: L * zoom,
      H: H * zoom,
      D: D * zoom,
      G: G * zoom,
      span: span * zoom,
      V: D * keyValue.value * zoom,
    };
  };
  const rangeK = () => {
    const { L, H, D, span } = measure();
    return [
      [-L / 2, L / 2],
      [-span / 2, -span / 2 + D],
      [-H / 2, H / 2],
    ];
  };
  const rangeV = () => {
    const { L, H, V, span } = measure();
    return [
      [-L / 2, L / 2],
      [span / 2 - V, span / 2],
      [-H / 2, H / 2],
    ];
  };
  const STACK_Y = 82,
    STACK_LEFT = -345;
  const stack = scene3d({
    phi: 1.18,
    theta: -0.95,
    distance: 18,
    unit: 150,
    ambient: 0.62,
    fog: 0.1,
    brightness: 1,
  }).at(0, STACK_Y);
  // Mesh lines cannot change count while a face is drawn, so each stage of the build has its own set.
  const stages = [
    [1, 1, 1],
    [1, 1, LAYERS],
    [1, HEADS, LAYERS],
    [24, HEADS, LAYERS],
    [14, 1, 26],
  ].map((cells) => [...box(rangeK, 'blue', cells), ...box(rangeV, 'teal', cells)]);
  stack.add(...stages.flat());
  // The closing scene lights the part of the block that answers each recap line.
  const sweep = stage.value(1);
  const scanRing = dynamic(() => {
    const { L, H, span } = measure(),
      x = -L / 2 + L * sweep.value,
      a = (span / 2) * 1.06,
      b = (H / 2) * 1.06;
    const corners = [
      [x, -a, -b],
      [x, a, -b],
      [x, a, b],
      [x, -a, b],
    ].map((point) => stack.stagePoint(point));
    const node = new Node();
    corners.forEach((corner, i) =>
      node.add(
        line(corner, corners[(i + 1) % 4], {
          stroke: 'yellow',
          width: 7,
          glow: 10,
        }),
      ),
    );
    return node;
  }).zIndex(4);
  const redFaces = [...box(rangeK, 'red', [14, 1, 26]), ...box(rangeV, 'red', [14, 1, 26])];
  stack.add(...redFaces);
  const showStage = (from, to2) => [
    ...stages[from].map((face) =>
      fade(face, 0, {
        duration: 0.08,
      }),
    ),
    ...stages[to2].map((face) =>
      fade(face, 1, {
        duration: 0.08,
      }),
    ),
  ];
  const FORMULA_Y = -338,
    FORMULA_LEFT = -850,
    STAT_X = 230;
  const terms = [
    ['2', 'blue', 'K, V'],
    ['\\times\\, 32', 'yellow', 'layers'],
    ['\\times\\, 8', 'teal', 'KV heads'],
    ['\\times\\, 128', 'green', 'numbers'],
    ['\\times\\, 2', 'orange', 'bytes, FP16'],
  ].map(([math, color, name]) => ({
    node: tex(math, {
      size: 92,
      color,
    }),
    name,
    color,
  }));
  let formulaX = FORMULA_LEFT;
  for (const term of terms) {
    term.node.moveTo([0, FORMULA_Y]).alignTo([formulaX, 0], 'left');
    term.caption = S(term.name, {
      size: 38,
      color: term.color,
    }).at(term.node.center[0], FORMULA_Y + 76);
    if (term === terms.at(-1))
      term.caption
        .moveTo([0, FORMULA_Y + 76])
        .alignTo([term.node.center[0] - term.node.width / 2, 0], 'left');
    formulaX += term.node.width + 26;
  }
  const RESULT_X = formulaX + 6;
  const resultTex = (math) =>
    tex(math, {
      size: 84,
      color: 'ink',
    })
      .moveTo([0, FORMULA_Y])
      .alignTo([RESULT_X, 0], 'left');
  const bytesResult = resultTex(`= ${fmt(PER_TOKEN).replace(',', '{,}')}\\ \\text{bytes}`);
  const perToken = resultTex(`= ${PER_TOKEN / KIB}\\ \\text{KiB per token}`);
  const asked = resultTex('= \\ ?');
  const bigPerToken = resultTex(`= ${BIG_PER_TOKEN / KIB}\\ \\text{KiB per token}`);
  const termAppear = (i) =>
    fadeIn([terms[i].node, terms[i].caption], {
      shift: [0, 12],
    });
  // These labels are worked out from the block's own corners, so they stay attached as it moves.
  /** A counter that changes every frame blurs into mush, so a running count moves in readable steps. */
  const shownTokens = () =>
    Number.isInteger(tokens.value)
      ? tokens.value
      : Math.max(1, Math.round(tokens.value / 128) * 128);
  const onBlock = (world, dx, dy, build) =>
    dynamic(() => {
      const [x, y] = stack.stagePoint(world(measure()));
      return build().moveTo([
        x + dx,
        Math.min(y + (typeof dy === 'function' ? dy() : dy), 470),
      ]);
    });
  // The nearest bottom corner is the lowest point on screen, so text under it never touches the block.
  const tokenTag = onBlock(
    ({ L, H, span }) => [L / 2, -span / 2, -H / 2],
    0,
    62,
    () => {
      const value = shownTokens();
      return T(value === 1 ? 'One token' : `${fmt(value)} tokens`, {
        size: 76,
      });
    },
  );
  // While the block is flat, the key label rises clear of its top face.
  const keyTag = onBlock(
    ({ H, span, D }) => [0, -span / 2 + D, H / 2],
    -135,
    () => -30 - 96 * (1 - Math.min(1, (layers.value - 1) / 12)),
    () =>
      S('key', {
        size: 54,
        color: 'blue',
      }),
  );
  const valueTag = onBlock(
    ({ H, span }) => [0, span / 2, H / 2],
    76,
    () => -40 - 60 * (1 - Math.min(1, (layers.value - 1) / 12)),
    () =>
      S('value', {
        size: 54,
        color: 'teal',
      }),
  );
  const layerTag = onBlock(
    ({ L, span }) => [-L / 2, -span / 2, 0],
    -150,
    0,
    () =>
      S('32 layers', {
        size: 54,
        color: 'yellow',
      }),
  );
  const headTag = onBlock(
    ({ L, H }) => [L / 2, 0, -H / 2],
    170,
    30,
    () =>
      S('8 KV heads', {
        size: 54,
        color: 'teal',
      }),
  );
  const billTitle = place(
    T('The bill\nfor one token', {
      size: 76,
      color: 'dim',
      leading: 1.15,
    }),
    410,
    110,
  );
  const modelTag = place(
      M('Llama 3 8B', {
        size: 50,
        color: 'yellow',
      }),
      470,
      -462,
    ),
    bigModelTag = place(
      M('Llama 3 70B', {
        size: 50,
        color: 'yellow',
      }),
      470,
      -462,
    );
  size.at(0.05, () =>
    stage.play(
      ...stages[0].slice(0, 6).map((face) => fade(face, 1)),
      fadeIn([tokenTag, billTitle]),
      {
        duration: 0.35,
      },
    ),
  );
  size.on('shape', () =>
    stage.play(
      fadeIn(modelTag, {
        shift: [12, 0],
      }),
      {
        duration: 0.5,
      },
    ),
  );
  size.on('key-and-value', () =>
    stage.play(
      keyValue.to(1),
      ...stages[0].slice(6).map((face) => fade(face, 1)),
      fadeIn([keyTag, valueTag]),
      termAppear(0),
      {
        duration: 0.9,
        ease: smoother,
      },
    ),
  );
  size.on('layers', () => {
    stage.play(...showStage(0, 1), {
      duration: 0.08,
    });
    stage.play(layers.to(LAYERS), fadeIn(layerTag), termAppear(1), {
      duration: 1,
      ease: smoother,
    });
  });
  // Query heads in groups of four share one stored key value head.
  const HEAD_LEFT = 250,
    HEAD_W = 640,
    QUERY_Y = -130,
    KV_Y = 60;
  const queryDots = Array.from(
    {
      length: QUERY_HEADS,
    },
    (_, i) =>
      rect(14, 44, {
        radius: 4,
        fill: 'yellow',
        stroke: null,
      }).at(HEAD_LEFT + 10 + (i * (HEAD_W - 20)) / (QUERY_HEADS - 1), QUERY_Y),
  );
  const kvBoxes = Array.from(
    {
      length: HEADS,
    },
    (_, i) =>
      rect(66, 66, {
        radius: 8,
        fill: 'teal',
        stroke: null,
      }).at(HEAD_LEFT + 10 + ((i + 0.5) * (HEAD_W - 20)) / HEADS, KV_Y),
  );
  const headLinks = queryDots.map((dot2, i) =>
    line(
      [dot2.center[0], QUERY_Y + 26],
      [kvBoxes[Math.floor(i / (QUERY_HEADS / HEADS))].center[0], KV_Y - 38],
      {
        stroke: 'dim',
        width: 1.6,
      },
    ),
  );
  const queryName2 = place(
    S(`${QUERY_HEADS} query heads`, {
      size: 44,
      color: 'yellow',
    }),
    HEAD_LEFT,
    QUERY_Y - 62,
  );
  const kvName = place(
    S(`${HEADS} key value (KV) heads`, {
      size: 44,
      color: 'teal',
    }),
    HEAD_LEFT,
    KV_Y + 74,
  );
  const storedTag = place(
    T('Only these are stored', {
      size: 56,
      color: 'teal',
    }),
    HEAD_LEFT,
    KV_Y + 158,
  );
  size.on('heads', () => {
    stage.play(...showStage(1, 2), {
      duration: 0.08,
    });
    stage.play(
      heads.to(HEADS),
      fadeIn(headTag),
      fadeOut(billTitle, {
        duration: 0.3,
      }),
      termAppear(2),
      stack.theta.to(-0.85),
      to(stack, (node) => node.at(STACK_LEFT, STACK_Y)),
      lagged(
        kvBoxes.map((node) =>
          fadeIn(node, {
            scale: 0.7,
          }),
        ),
        {
          lag: 0.1,
        },
      ),
      fadeIn(kvName),
      {
        duration: 0.9,
        ease: smoother,
      },
    );
  });
  size.on('share-heads', () =>
    stage.play(
      lagged(
        queryDots.map((node) => fadeIn(node)),
        {
          lag: 0.03,
        },
      ),
      fadeIn(queryName2),
      lagged(
        headLinks.map((node) => draw(node)),
        {
          lag: 0.03,
        },
      ),
      {
        duration: 1.2,
      },
    ),
  );
  size.on('stored', () =>
    stage.play(
      ...queryDots.map((node) => fade(node, 0.3)),
      ...kvBoxes.map((node) =>
        indicate(node, {
          color: 'teal',
          scale: 1.14,
        }),
      ),
      write(storedTag),
      {
        duration: 0.7,
      },
    ),
  );
  size.on('numbers', () =>
    stage.play(
      termAppear(3),
      fadeOut([keyTag, valueTag], {
        duration: 0.2,
      }),
      {
        duration: 0.6,
      },
    ),
  );
  size.on('two-bytes', () =>
    stage.play(termAppear(4), {
      duration: 0.6,
    }),
  );
  const headPanel = [...queryDots, ...kvBoxes, ...headLinks, queryName2, kvName, storedTag];
  const unitRows = [
    `1 KiB = ${fmt(KIB)} bytes`,
    `1 MiB = ${fmt(KIB)} KiB`,
    `1 GiB = ${fmt(KIB)} MiB`,
  ].map((row, i) =>
    place(
      M(row, {
        size: 54,
        color: i ? 'dim' : 'ink',
      }),
      STAT_X,
      -130 + i * 92,
    ),
  );
  size.on('bytes', () =>
    stage.play(...terms.map(({ node }) => indicate(node, { color: 'yellow', scale: 1.04 })), {
      duration: 0.8,
    }),
  );
  size.after('bytes', () =>
    stage.play(
      fadeOut(headPanel, {
        duration: 0.3,
      }),
      write(bytesResult),
      {
        duration: 0.8,
      },
    ),
  );
  size.on('kibi', () =>
    stage.play(
      lagged(
        unitRows.map((node) =>
          fadeIn(node, {
            shift: [14, 0],
          }),
        ),
        {
          lag: 0.6,
        },
      ),
      {
        duration: 1.8,
      },
    ),
  );
  size.after('per-token', () =>
    stage.play(...crossfade(bytesResult, perToken), {
      duration: 0.55,
    }),
  );
  const payloadNote = place(
    T('Keys and values only.\nA real engine also needs tables,\nbuffers, and spare room.', {
      size: 46,
      color: 'dim',
      leading: 1.25,
    }),
    STAT_X - 12,
    250,
  );
  size.on('extra', () =>
    stage.play(
      fadeIn(payloadNote, {
        shift: [0, 10],
      }),
      {
        duration: 0.6,
      },
    ),
  );
  const conversationBytesRevealed = stage.value(0);
  const conversationTotal = human(CONVERSATION);
  const tokenBytes = dynamic(() => {
    const value = shownTokens();
    const amount = human(value * PER_TOKEN);
    const pending = amount === conversationTotal && conversationBytesRevealed.value === 0;
    return place(
      M(pending ? '? MiB' : amount, {
        size: 150,
        color: pending ? 'dim' : value >= 4096 ? 'red' : 'yellow',
      }),
      STAT_X,
      -130,
    );
  });
  size.on('grows', () => {
    stage.play(...showStage(2, 3), fadeOut([layerTag, headTag, ...unitRows, payloadNote]), {
      duration: 0.2,
    });
    stage.play(tokens.to(4096), stack.theta.to(-0.72), {
      duration: 3.2,
      ease: smoother,
    });
  });
  size.on(
    'grows',
    () =>
      stage.play(fadeIn(tokenBytes), {
        duration: 0.5,
      }),
    1.5,
  );
  size.after('conversation-bytes', () =>
    stage.play(conversationBytesRevealed.to(1), { duration: 0.01 }),
  );
  const halfGig = rect(690, 190, {
    radius: 16,
    stroke: 'red',
    width: 5,
  })
    .moveTo([STAT_X + 320, -130])
    .glow(12);
  size.on('half-gig', () =>
    stage.play(draw(halfGig), {
      duration: 0.6,
    }),
  );
  // Forty gibibytes, drawn as the conversations that fit in it.
  const FIT_COLS = 16,
    FIT_CELL = 42;
  const fitCells = Array.from(
    {
      length: EIGHTY,
    },
    (_, i) =>
      rect(FIT_CELL - 6, FIT_CELL - 6, {
        radius: 5,
        fill: 'red',
        stroke: null,
      })
        .opacity(0.85)
        .at(
          STAT_X + FIT_CELL / 2 + (i % FIT_COLS) * FIT_CELL,
          70 + Math.floor(i / FIT_COLS) * FIT_CELL,
        ),
  );
  const fitTitle = place(
    M(`40 GiB ÷ ${CONVERSATION / MIB} MiB = ${EIGHTY}`, {
      size: 52,
      color: 'ink',
    }),
    STAT_X,
    10,
  );
  const fitPending = place(
    M(`40 GiB ÷ ${CONVERSATION / MIB} MiB = ?`, {
      size: 52,
      color: 'ink',
    }),
    STAT_X,
    10,
  );
  size.on('budget', () => stage.play(fadeIn(fitPending), { duration: 0.4 }));
  size.after('eighty', () =>
    stage.play(
      ...crossfade(fitPending, fitTitle),
      lagged(
        fitCells.map((node) =>
          fadeIn(node, {
            scale: 0.5,
          }),
        ),
        {
          lag: 0.03,
        },
      ),
      {
        duration: 1,
      },
    ),
  );
  const fitNote = place(
    T('at best, before any overhead', {
      size: 46,
      color: 'dim',
    }),
    STAT_X - 12,
    320,
  );
  size.after('eighty', () =>
    stage.play(fadeIn(fitNote), {
      duration: 0.5,
    }),
  );
  const bigLayers = tex(`\\times\\, ${BIG_LAYERS}`, {
    size: 92,
    color: 'yellow',
  }).moveTo(terms[1].node.center);
  const tryTitle = place(
    T('Your turn', {
      size: 76,
      color: 'yellow',
    }),
    STAT_X,
    -100,
  );
  const trySame = place(
    T('Same 8 key value heads,\n128 numbers per head,\n2 bytes per number', {
      size: 56,
      color: 'dim',
      leading: 1.3,
    }),
    STAT_X,
    80,
  );
  // The block pulls back first and the zoom stays put, so eighty layers look taller than thirty two.
  const TRY_ZOOM = autoZoom(LENGTH, (HEIGHT * BIG_LAYERS) / LAYERS, DEPTH * 2.28);
  size.on('try', () =>
    handoff(
      [tokenBytes, halfGig, fitTitle, fitNote, ...fitCells],
      () => {
        stage.play(heldZoom.to(TRY_ZOOM), {
          duration: 0.01,
        });
        stage.play(
          zoomHold.to(1),
          brief(
            fadeIn(tryTitle, {
              shift: [0, 10],
            }),
            0.3,
          ),
          {
            duration: 1.2,
            ease: smoother,
          },
        );
      },
      clearFirst,
    ),
  );
  size.on('eighty-layers', () =>
    stage.play(
      ...crossfade(terms[1].node, bigLayers),
      ...crossfade(perToken, asked),
      ...crossfade(modelTag, bigModelTag),
      layers.to(BIG_LAYERS),
      fadeIn(trySame),
      {
        duration: 1.4,
        ease: smoother,
      },
    ),
  );
  size.on('ask', () =>
    stage.play(
      indicate(asked, {
        color: 'yellow',
        scale: 1.1,
      }),
      {
        duration: 0.7,
      },
    ),
  );
  size.on('multiply', () =>
    stage.play(
      lagged(
        [terms[0].node, bigLayers, terms[2].node, terms[3].node, terms[4].node].map((node) =>
          indicate(node, {
            color: 'yellow',
            scale: 1.12,
          }),
        ),
        {
          lag: 0.5,
        },
      ),
      {
        duration: 2.2,
      },
    ),
  );
  size.after('answer', () =>
    stage.play(
      fadeOut([tryTitle, trySame], {
        duration: 0.3,
      }),
      ...crossfade(asked, bigPerToken),
      {
        duration: 0.55,
      },
    ),
  );
  const bigStat = place(
    M(`${(BIG_PER_TOKEN * 4096) / GIB} GiB`, {
      size: 130,
      color: 'yellow',
    }),
    STAT_X,
    -130,
  );
  const bigStatNote = place(
    S('for those same 4,096 tokens', {
      size: 44,
      color: 'dim',
    }),
    STAT_X,
    -30,
  );
  size.after('quarter', () =>
    stage.play(
      fadeIn(bigStat, {
        shift: [0, 10],
      }),
      fadeIn(bigStatNote),
      {
        duration: 0.6,
      },
    ),
  );
  const fleetStat = place(
    M(`128 × ${(BIG_PER_TOKEN * 4096) / GIB} GiB = ${(128 * BIG_PER_TOKEN * 4096) / GIB} GiB`, {
      size: 44,
      color: 'red',
    }),
    STAT_X - 12,
    80,
  );
  size.on('fleet', () =>
    stage.play(indicate(bigStat, { color: 'yellow', scale: 1.04 }), { duration: 0.6 }),
  );
  size.after('fleet', () =>
    stage.play(
      fadeIn(fleetStat, {
        shift: [0, 10],
      }),
      {
        duration: 0.6,
      },
    ),
  );
  const capNote = place(
    T('Memory can cap how many\npeople you serve before\nraw compute does.', {
      size: 58,
      color: 'ink',
      leading: 1.2,
    }),
    STAT_X - 12,
    280,
  );
  size.on('cap', () =>
    stage.play(write(capNote), {
      duration: 0.9,
    }),
  );
  const wholeBlock = stages[3];
  stage.at(size.end - 0.5, () =>
    stage.play(
      fadeOut(
        [terms[0], terms[2], terms[3], terms[4]].flatMap((term) => [term.node, term.caption]),
      ),
      fadeOut([
        bigLayers,
        terms[1].caption,
        bigPerToken,
        tokenTag,
        bigStat,
        bigStatNote,
        fleetStat,
        capNote,
        bigModelTag,
      ]),
      ...wholeBlock.map((face) => fade(face, 0)),
      {
        duration: 0.45,
      },
    ),
  );
  stage.at(size.end - 0.04, () =>
    stage.play(layers.to(LAYERS), zoomHold.to(0), {
      duration: 0.02,
    }),
  );
  return {
    tokens,
    keyValue,
    layers,
    heads,
    LENGTH,
    HEIGHT,
    DEPTH,
    autoZoom,
    zoomHold,
    heldZoom,
    measure,
    stack,
    stages,
    sweep,
    scanRing,
    redFaces,
    wholeBlock,
  };
}
