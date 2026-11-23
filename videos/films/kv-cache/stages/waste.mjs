import {
  decimal,
  draw,
  dynamic,
  fade,
  fadeIn,
  indicate,
  lagged,
  linear,
  Node,
  rect,
  write,
} from 'vizmatic/stage';
import { chip, sceneHeading } from '../../../stage-lessons/kit.mjs';
import { STEPS } from '../model.mjs';

/** The wasteful way. */
export function buildWaste(
  stage,
  narration,
  { T, M, S, place, fadeOut, retitle, arrive, clearFirst, handoff },
  { WORDS },
) {
  const waste = narration.scene('waste');
  // From six computations on, the picture is the fix and no longer the wasteful way.
  retitle(waste, sceneHeading(stage, waste, narration.title('waste')), [
    ['keep-it', 'Compute once, keep it'],
  ]);
  const CELL_W = 170,
    CELL = 124,
    GAP = 12,
    GX = -600,
    GY = -250;
  const cellAt = (step, position) => [GX + position * (CELL_W + GAP), GY + step * (CELL + GAP)];
  const NAMES = WORDS.slice(0, STEPS);
  const columnNames = NAMES.map((word, i) =>
    T(word, {
      size: 38,
      color: 'ink',
    }).at(cellAt(0, i)[0], GY - 104),
  );
  const stepLabels = Array.from(
    {
      length: STEPS,
    },
    (_, step) =>
      place(
        M(`step ${step + 1}`, {
          size: 44,
          color: 'dim',
        }),
        GX - CELL_W / 2 - 194,
        cellAt(step, 0)[1],
      ),
  );
  const slots = [],
    tiles = [],
    keptTiles = [];
  for (let step = 0; step < STEPS; step++) {
    tiles.push([]);
    for (let position = 0; position <= step; position++) {
      const [x, y] = cellAt(step, position),
        fresh = position === step;
      slots.push(
        rect(CELL_W, CELL, {
          radius: 12,
          fill: 'surface',
          stroke: 'dim',
          width: 1.5,
        }).at(x, y),
      );
      tiles[step].push(
        rect(CELL_W, CELL, {
          radius: 12,
          fill: fresh ? 'green' : 'red',
          stroke: null,
        })
          .at(x, y)
          .opacity(fresh ? 0.92 : 0.62),
      );
      // A repeated cell is not thrown away. It becomes data the cache keeps and later tokens read.
      if (!fresh)
        keptTiles.push(
          rect(CELL_W, CELL, {
            radius: 12,
            fill: 'teal',
            stroke: null,
          })
            .at(x, y)
            .opacity(0.34),
        );
    }
  }
  const counts = stage.value(0);
  const CX = 660;
  const countRed = dynamic(() =>
    decimal(() => counts.value, {
      digits: 0,
      font: 'mono',
      size: 300,
      color: 'red',
    }).at(CX, -70),
  );
  const countGreen = dynamic(() =>
    decimal(() => counts.value, {
      digits: 0,
      font: 'mono',
      size: 300,
      color: 'green',
    }).at(CX, -70),
  );
  const countLabel = S('computations', {
    size: 64,
    color: 'dim',
  }).at(CX, 110);
  waste.at(0.05, () =>
    stage.play(
      lagged(
        columnNames.map((node) =>
          fadeIn(node, {
            shift: [0, -10],
          }),
        ),
        {
          lag: 0.04,
        },
      ),
      lagged(
        slots.map((node) =>
          fadeIn(node, {
            scale: 0.8,
          }),
        ),
        {
          lag: 0.05,
        },
      ),
      {
        duration: 1.1,
      },
    ),
  );
  const tokenTitle = T('One token can be', {
    size: 62,
    color: 'dim',
  }).at(CX, -240);
  const tokenChips = [
    ['renews', 'blue', 'a whole word'],
    ['re + news', 'teal', 'pieces of a word'],
    ['.', 'yellow', 'punctuation'],
  ].map(([sample, color, name], i) => {
    const node = new Node();
    node.add(
      chip(sample, {
        w: 330,
        h: 110,
        color,
        size: 52,
      }).at(0, 0),
      S(name, {
        size: 38,
        color: 'dim',
      }).at(0, 88),
    );
    return node.at(CX, -120 + i * 210);
  });
  waste.on('tokens', () =>
    stage.play(
      fadeIn(tokenTitle),
      lagged(
        tokenChips.map((node) =>
          fadeIn(node, {
            shift: [14, 0],
          }),
        ),
        {
          lag: 0.3,
        },
      ),
      {
        duration: 1.2,
      },
    ),
  );
  const queryRow = rect(4 * (CELL_W + GAP) + 8, CELL + 22, {
    radius: 16,
    stroke: 'yellow',
    width: 5,
  })
    .moveTo([(cellAt(3, 0)[0] + cellAt(3, 3)[0]) / 2, cellAt(3, 0)[1]])
    .glow(10);
  const queryName = M('q', {
    size: 72,
    color: 'yellow',
  }).at(cellAt(3, 4)[0], cellAt(3, 0)[1]);
  waste.on('query', () =>
    stage.play(
      fadeIn(queryName, {
        scale: 0.7,
      }),
      {
        duration: 0.4,
      },
    ),
  );
  waste.on('reads-self', () =>
    stage.play(draw(queryRow), {
      duration: 0.8,
    }),
  );
  waste.on('naive', () =>
    handoff(
      [tokenTitle, ...tokenChips, queryRow, queryName],
      () =>
        arrive(fadeIn(countRed), fadeIn(countLabel), {
          duration: 0.4,
        }),
      clearFirst,
    ),
  );
  // Each row lands on its own words, and the count reaches 21 as the voice says it.
  const rowIn = (step) =>
    lagged(
      [
        fadeIn(stepLabels[step]),
        ...tiles[step].map((node) =>
          fadeIn(node, {
            scale: 0.7,
          }),
        ),
      ],
      {
        lag: 0.3,
      },
    );
  waste.on('step-one', () =>
    stage.play(rowIn(0), counts.to(1), {
      duration: 0.5,
    }),
  );
  waste.on('step-two', () =>
    stage.play(rowIn(1), counts.to(3), {
      duration: 0.6,
    }),
  );
  waste.on('step-three', () =>
    stage.play(rowIn(2), counts.to(6), {
      duration: 0.7,
    }),
  );
  const toTwentyOne = waste.cue('twenty-one').start - waste.cue('by-six').start;
  waste.on('by-six', () =>
    stage.play(
      lagged([3, 4, 5].map(rowIn), {
        lag: 0.85,
      }),
      counts.to(21),
      {
        duration: toTwentyOne,
        ease: linear,
      },
    ),
  );
  waste.on('twenty-one', () =>
    stage.play(
      indicate(countLabel, {
        color: 'red',
        scale: 1.1,
      }),
      {
        duration: 0.7,
      },
    ),
  );
  const columnBox = rect(CELL_W + 24, (CELL + GAP) * 5 + CELL + 24, {
    radius: 16,
    stroke: 'yellow',
    width: 5,
  })
    .moveTo([cellAt(0, 0)[0], (cellAt(0, 0)[1] + cellAt(5, 0)[1]) / 2])
    .glow(12);
  waste.on('same-column', () =>
    stage.play(draw(columnBox), {
      duration: 0.9,
    }),
  );
  const repeated = tiles.flatMap((rowTiles) => rowTiles.slice(0, -1));
  waste.on('keep-it', () =>
    stage.play(fadeOut(columnBox), ...repeated.map((node) => fade(node, 0)), fadeIn(keptTiles), {
      duration: 0.9,
    }),
  );
  countGreen.opacity(0);
  // The red total is false once the picture changes, and the voice has not yet given the new one. So the count leaves, and it returns on the voice's six.
  waste.on('keep-it', () =>
    stage.play(fade(countRed, 0), fade(countLabel, 0), {
      duration: 0.3,
    }),
  );
  waste.on(
    'keep-it',
    () =>
      stage.play(counts.to(6), {
        duration: 0.05,
      }),
    0.4,
  );
  waste.on('six-six', () =>
    stage.play(fade(countGreen, 1), fade(countLabel, 1), {
      duration: 0.4,
    }),
  );
  const cacheTag = T('the key value cache', {
    size: 56,
    color: 'green',
  }).at(CX, 225);
  waste.on('cache-name', () =>
    stage.play(write(cacheTag), {
      duration: 0.8,
    }),
  );
  waste.on('join', () =>
    stage.play(
      lagged(
        tiles.map((rowTiles) =>
          indicate(rowTiles.at(-1), {
            color: 'green',
            scale: 1.06,
          }),
        ),
        {
          lag: 0.2,
        },
      ),
      {
        duration: 1,
      },
    ),
  );
  const readRow = rect(6 * (CELL_W + GAP) + 8, CELL + 22, {
    radius: 16,
    stroke: 'yellow',
    width: 5,
  })
    .moveTo([(cellAt(5, 0)[0] + cellAt(5, 5)[0]) / 2, cellAt(5, 0)[1]])
    .glow(10);
  const readsTag = T('The reads remain', {
    size: 60,
    color: 'yellow',
  }).at(CX, 340);
  waste.on('reads-remain', () =>
    stage.play(
      draw(readRow),
      fadeIn(readsTag, {
        shift: [0, 10],
      }),
      {
        duration: 0.8,
      },
    ),
  );
  stage.at(waste.end - 0.5, () =>
    stage.play(
      ...tiles.flat().map((node) => fadeOut(node)),
      fadeOut([
        ...keptTiles,
        ...slots,
        ...columnNames,
        ...stepLabels,
        countRed,
        countGreen,
        countLabel,
        cacheTag,
        readRow,
        readsTag,
      ]),
      {
        duration: 0.45,
      },
    ),
  );
}
