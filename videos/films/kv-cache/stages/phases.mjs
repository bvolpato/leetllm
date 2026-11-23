import {
  arrow,
  concat,
  draw,
  fadeIn,
  indicate,
  lagged,
  Node,
  rect,
  rectPath,
  to,
  write,
} from 'vizmatic/stage';
import { chip, sceneHeading } from '../../../stage-lessons/kit.mjs';

/** Prefill builds. Decode extends.. */
export function buildPhases(
  stage,
  narration,
  { T, S, place, fadeOut, bar, frameBar, growBar, clearScene, pulse, arrive, clearFirst, handoff },
) {
  const phases = narration.scene('phases');
  sceneHeading(stage, phases, narration.title('phases'));
  const PW = 104,
    PGAP = 8,
    PROMPT = 8,
    ANSWER = 6,
    P_LEFT = -((PROMPT + ANSWER - 1) * (PW + PGAP)) / 2,
    TOKEN_Y = -310,
    CACHE_Y = -178;
  const px = (i) => P_LEFT + i * (PW + PGAP);
  const tokenCells = Array.from(
    {
      length: PROMPT + ANSWER,
    },
    (_, i) =>
      chip(i < PROMPT ? `p${i}` : `a${i - PROMPT}`, {
        w: PW,
        h: 92,
        color: i < PROMPT ? 'blue' : 'green',
        size: 40,
      }).at(px(i), TOKEN_Y),
  );
  const cacheSlots = tokenCells.map((_, i) =>
    rect(PW, 110, {
      radius: 10,
      fill: 'surface',
      stroke: 'dim',
      width: 1.5,
    }).at(px(i), CACHE_Y),
  );
  const cacheFill = tokenCells.map((_, i) => {
    const node = new Node();
    node.add(
      rect(PW, 110, {
        radius: 10,
        fill: i < PROMPT ? 'blue' : 'green',
        stroke: null,
      }).opacity(0.9),
      S('K V', {
        size: 38,
        color: 'bg',
        weight: 600,
      }),
    );
    return node.at(px(i), CACHE_Y);
  });
  const cacheLabel = S('cache: one key and value per position', {
    size: 38,
    color: 'dim',
  }).at(0, -92);
  const phaseWords = [
    ['Prefill', 'the prompt, all at once', 'blue', -440],
    ['Decode', 'the answer, one token at a time', 'green', 440],
  ].flatMap(([name, job, color, x]) => [
    T(name, {
      size: 130,
      color,
    }).at(x, 110),
    T(job, {
      size: 52,
      color: 'dim',
    }).at(x, 250),
  ]);
  phases.at(0.05, () =>
    stage.play(
      lagged(
        tokenCells.slice(0, PROMPT).map((node) =>
          fadeIn(node, {
            scale: 0.8,
          }),
        ),
        {
          lag: 0.1,
        },
      ),
      fadeIn([...cacheSlots, cacheLabel, ...phaseWords]),
      {
        duration: 0.45,
      },
    ),
  );
  const wideBand = rect(PROMPT * (PW + PGAP) + 8, 264, {
    radius: 14,
    fill: 'yellow',
    stroke: 'yellow',
    width: 3,
  })
    .opacity(0.16)
    .at((px(0) + px(PROMPT - 1)) / 2, (TOKEN_Y + CACHE_Y) / 2);
  const prefillNote = place(
    T('Prefill: every prompt position, together', {
      size: 66,
      color: 'yellow',
    }),
    -380,
    60,
  );
  phases.on('prefill', () =>
    handoff(
      phaseWords,
      () =>
        arrive(fadeIn(wideBand), write(prefillNote), {
          duration: 0.8,
        }),
      clearFirst,
    ),
  );
  const MASK = 8,
    MASK_CELL = 38;
  const maskRings = [],
    blockedRings = [];
  for (let r = 0; r < MASK; r++)
    for (let c = 0; c < MASK; c++)
      (c <= r ? maskRings : blockedRings).push(
        rectPath(
          (-MASK * MASK_CELL) / 2 + c * MASK_CELL,
          (-MASK * MASK_CELL) / 2 + r * MASK_CELL,
          MASK_CELL - 4,
          MASK_CELL - 4,
          3,
        ),
      );
  const maskNode = new Node();
  maskNode.add(
    new Node(concat(...blockedRings)).stroke('faint', 1.2),
    new Node(concat(...maskRings)).fill('yellow', 0.75),
  );
  maskNode.at(-650, 200);
  const maskNote = place(
    T('The mask: each position reads\nitself and earlier positions', {
      size: 54,
      color: 'dim',
      leading: 1.2,
    }),
    -380,
    190,
  );
  phases.on('mask', () =>
    stage.play(
      fadeIn(maskNode, {
        scale: 0.85,
      }),
      fadeIn(maskNote),
      {
        duration: 0.6,
      },
    ),
  );
  phases.on('fills', () =>
    stage.play(
      lagged(
        cacheFill.slice(0, PROMPT).map((node) =>
          fadeIn(node, {
            scale: 0.9,
          }),
        ),
        {
          lag: 0.04,
        },
      ),
      {
        duration: 0.7,
      },
    ),
  );
  const firstArrow = arrow([px(PROMPT - 1), TOKEN_Y - 50], [px(PROMPT), TOKEN_Y - 50], {
    stroke: 'yellow',
    width: 5,
    tip: 22,
    bend: -34,
  });
  const firstNote = place(
    T('Scores for the first answer token', {
      size: 52,
      color: 'green',
    }),
    -380,
    350,
  );
  phases.on('first-scores', () =>
    stage.play(
      draw(firstArrow),
      fadeIn(tokenCells[PROMPT], {
        scale: 0.8,
      }),
      fadeIn(firstNote),
      {
        duration: 0.7,
      },
    ),
  );
  const stepBand = rect(PW + 12, 264, {
    radius: 12,
    fill: 'green',
    stroke: 'green',
    width: 3,
  })
    .opacity(0.2)
    .at(px(PROMPT), (TOKEN_Y + CACHE_Y) / 2);
  const decodeNote = place(
    T('Decode: one new token each step', {
      size: 66,
      color: 'green',
    }),
    -800,
    50,
  );
  phases.on('decode', () =>
    handoff(
      [wideBand, prefillNote, maskNode, maskNote, firstArrow, firstNote],
      () =>
        arrive(fadeIn(stepBand), write(decodeNote), {
          duration: 0.7,
        }),
      clearFirst,
    ),
  );
  const appendNote = place(
    T('Its key and value join the cache, and the next token comes out', {
      size: 52,
      color: 'dim',
    }),
    -800,
    140,
  );
  const chainCells = Array.from(
    {
      length: ANSWER,
    },
    (_, i) =>
      chip(`a${i}`, {
        w: 170,
        h: 120,
        color: 'green',
        size: 60,
      }).at(-715 + i * 286, 320),
  );
  const chainArrows = Array.from(
    {
      length: ANSWER - 1,
    },
    (_, i) =>
      arrow([-715 + i * 286 + 92, 320], [-715 + (i + 1) * 286 - 92, 320], {
        stroke: 'green',
        width: 5,
        tip: 24,
      }),
  );
  const chainNote = place(
    T('Each choice becomes the next input', {
      size: 48,
      color: 'green',
    }),
    -800,
    215,
  );
  phases.on('appends', () =>
    stage.play(
      fadeIn(cacheFill[PROMPT], {
        scale: 0.9,
      }),
      fadeIn(appendNote),
      fadeIn(chainCells[0], {
        scale: 0.85,
      }),
      fadeIn(chainNote),
      {
        duration: 0.6,
      },
    ),
  );
  phases.on('in-order', () => {
    for (let i = 1; i < ANSWER; i++) {
      stage.play(
        draw(chainArrows[i - 1]),
        fadeIn(chainCells[i], {
          scale: 0.85,
        }),
        {
          duration: 0.16,
        },
      );
      stage.play(
        to(stepBand, (node) => node.at(px(PROMPT + i), (TOKEN_Y + CACHE_Y) / 2)),
        fadeIn(tokenCells[PROMPT + i], {
          scale: 0.85,
        }),
        {
          duration: 0.24,
        },
      );
      stage.play(
        fadeIn(cacheFill[PROMPT + i], {
          scale: 0.9,
        }),
        {
          duration: 0.14,
        },
      );
    }
  });
  const parallelNote = place(
    T('Plenty of parallel work inside each step', {
      size: 48,
      color: 'dim',
    }),
    -800,
    440,
  );
  phases.on('parallel', () =>
    stage.play(fadeIn(parallelNote), {
      duration: 0.5,
    }),
  );
  const stressRows = [
    [
      'Prefill, with a large prompt',
      'blue',
      -700,
      [
        ['computation', 560, 'blue'],
        ['memory bandwidth', 210, 'teal'],
      ],
    ],
    [
      'Decode, at common batch sizes',
      'green',
      110,
      [
        ['computation', 230, 'blue'],
        ['memory bandwidth', 590, 'teal'],
      ],
    ],
  ].map(([name, color, x, gauges]) => {
    const title = place(
      T(name, {
        size: 50,
        color,
      }),
      x,
      40,
    );
    const bars = gauges.map(([label, w, tint], i) => ({
      label: place(
        S(label, {
          size: 38,
          color: 'dim',
        }),
        x,
        120 + i * 118,
      ),
      track: frameBar(x, 170 + i * 118, 650, 36),
      fill: growBar(x, 170 + i * 118, w, 36, tint),
    }));
    return {
      title,
      bars,
    };
  });
  const stressNote = S('A typical pattern, not a measurement', {
    size: 38,
    color: 'dim',
  }).at(0, 450);
  const gaugeFrames = (row) => [row.title, ...row.bars.flatMap((b) => [b.label, b.track])];
  const showGauges = (row) =>
    stage.play(
      fadeIn(row.bars.map((b) => b.fill.node)),
      ...row.bars.map((b) =>
        b.fill.grow({
          duration: 0.9,
        }),
      ),
      {
        duration: 0.9,
      },
    );
  phases.on('stress', () =>
    stage.play(
      fadeOut(
        [decodeNote, appendNote, parallelNote, stepBand, ...chainCells, ...chainArrows, chainNote],
        {
          duration: 0.3,
        },
      ),
      fadeIn([stressNote, ...gaugeFrames(stressRows[0]), ...gaugeFrames(stressRows[1])], {
        shift: [0, 8],
      }),
      {
        duration: 0.5,
      },
    ),
  );
  phases.on('compute', () => showGauges(stressRows[0]));
  phases.on('bandwidth', () => showGauges(stressRows[1]));
  // Every decode step reads the weights and the cache, so both rows pulse.
  const weightsRow = rect(px(13) - px(0) + PW, 50, {
    radius: 10,
    fill: 'teal',
    stroke: null,
  })
    .opacity(0.85)
    .at(0, -30);
  const weightsName = S('weights', {
    size: 38,
    color: 'bg',
    weight: 600,
  }).at(0, -30);
  phases.on('reload', () =>
    stage.play(
      fadeIn([weightsRow, weightsName]),
      indicate(stressRows[1].bars[1].label, {
        color: 'teal',
        scale: 1.1,
      }),
      lagged(
        cacheFill.map((node) => pulse(node, 1.05)),
        {
          lag: 0.05,
        },
      ),
      {
        duration: 1.1,
      },
    ),
  );
  const stressAll = stressRows.flatMap((row) => [
    row.title,
    ...row.bars.flatMap((b) => [b.label, b.track, b.fill.node]),
  ]);
  const ttftName = place(
    T('Time to first token', {
      size: 58,
      color: 'yellow',
    }),
    -700,
    40,
  );
  const ttftParts = [
    ['queue', 330, 'orange'],
    ['prefill', 780, 'blue'],
    ['transport', 230, 'purple'],
  ];
  let ttftX = -700;
  const ttftBars = ttftParts.map(([name, w, color]) => {
    const node = new Node();
    node.add(
      bar(ttftX, 130, w - 6, 90, color),
      S(name, {
        size: 42,
        color: 'bg',
        weight: 600,
      }).at(ttftX + (w - 6) / 2, 130),
    );
    ttftX += w;
    return node;
  });
  const itlName = place(
    T('Inter token latency', {
      size: 58,
      color: 'green',
    }),
    -700,
    260,
  );
  const itlTicks = Array.from(
    {
      length: 12,
    },
    (_, i) => bar(-700 + i * 116, 350, 76, 70, 'green'),
  );
  const itlNote = place(
    S('decode and scheduling set each gap', {
      size: 42,
      color: 'dim',
    }),
    -700,
    430,
  );
  const scaleNote = S('Not to scale', {
    size: 38,
    color: 'dim',
  }).at(740, 40);
  const bothNote = T('Measure both', {
    size: 66,
    color: 'ink',
  }).at(580, 430);
  phases.on('two-numbers', () =>
    handoff(
      [...stressAll, stressNote, weightsRow, weightsName],
      () =>
        arrive(fadeIn(scaleNote), fadeIn(ttftName), {
          duration: 0.4,
        }),
      clearFirst,
    ),
  );
  phases.on('ttft', () =>
    stage.play(
      lagged(
        ttftBars.map((node) =>
          fadeIn(node, {
            shift: [-14, 0],
          }),
        ),
        {
          lag: 0.3,
        },
      ),
      {
        duration: 1,
      },
    ),
  );
  phases.on('itl', () =>
    stage.play(
      fadeIn([itlName, itlNote]),
      lagged(
        itlTicks.map((node) =>
          fadeIn(node, {
            scale: 0.7,
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
  phases.on('both', () =>
    stage.play(write(bothNote), {
      duration: 0.5,
    }),
  );
  clearScene(phases, [
    ...tokenCells,
    ...cacheSlots,
    ...cacheFill,
    cacheLabel,
    ttftName,
    ...ttftBars,
    itlName,
    ...itlTicks,
    itlNote,
    scaleNote,
    bothNote,
  ]);
}
