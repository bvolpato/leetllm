import assert from 'node:assert/strict';
import { Node, arrow, draw, fadeIn, line, rect, smoother } from 'vizmatic/stage';
import { gridNode, gridPath, sceneHeading } from '../../../stage-lessons/kit.mjs';
import {
  fadeOut,
  arrive,
  midProse,
  lineProse,
  midMono,
  midMath,
  waiting,
  dimIn,
  lit,
} from '../defaults.mjs';

/** Why long sequences get expensive. */
export function buildCost(stage, narration, { show, leave }) {
  const cost = narration.scene('cost');
  sceneHeading(stage, cost, narration.title('cost'));
  const COST_X = -300,
    COST_Y = 70,
    COST_SIZE = 640;
  const inFirst = (index) => index % 8 < 4 && Math.floor(index / 8) < 4;
  const firstCells = new Node(gridPath(8, COST_SIZE).filter((_, index) => inFirst(index)))
    .fill('blue', 0.85)
    .stroke('blue', 2.5)
    .at(COST_X, COST_Y);
  const restCells = new Node(gridPath(8, COST_SIZE).filter((_, index) => !inFirst(index)))
    .fill('blue', 0.42)
    .stroke('blue', 2.5)
    .at(COST_X, COST_Y);
  const keysAxis = lineProse('keys', COST_X, COST_Y - COST_SIZE / 2 - 44, 50, 'dim');
  const queriesAxis = midProse('queries', COST_X - COST_SIZE / 2 - 100, COST_Y, 50, 'dim');
  const quadrantV = line([COST_X, COST_Y - COST_SIZE / 2], [COST_X, COST_Y + COST_SIZE / 2], {
    stroke: 'yellow',
    width: 5,
  });
  const quadrantH = line([COST_X - COST_SIZE / 2, COST_Y], [COST_X + COST_SIZE / 2, COST_Y], {
    stroke: 'yellow',
    width: 5,
  });
  const tokens4 = midMono('4 tokens', 490, -220, 76, 'blue'),
    count4 = midMono('16 scores', 490, -100, 100, 'ink');
  const tokens8 = midMono('8 tokens', 490, 70, 76, 'blue'),
    count8 = midMono('64 scores', 490, 190, 100, 'yellow');
  const timesFour = midProse('Double the length:\nfour times the grid.', 490, 380, 58, 'yellow', {
    leading: 1.14,
  });
  assert.equal(8 * 8, 4 * (4 * 4));
  waiting([restCells, tokens4]);
  cost.at(0.1, () =>
    stage.play(fadeIn([firstCells, keysAxis, queriesAxis]), ...dimIn([restCells, tokens4]), {
      duration: 0.45,
    }),
  );
  cost.on('four', () =>
    stage.play(...lit([tokens4]), {
      duration: 0.5,
    }),
  );
  cost.after('four', () => stage.play(fadeIn(count4), { duration: 0.25 }));
  cost.on('eight', () =>
    stage.play(...lit([restCells]), fadeIn(tokens8), {
      duration: 0.7,
      ease: smoother,
    }),
  );
  cost.after('eight', () => stage.play(fadeIn(count8), { duration: 0.25 }));
  cost.on('four-times', () =>
    stage.play(draw(quadrantV), draw(quadrantH), fadeIn(timesFour), {
      duration: 0.6,
    }),
  );
  // Every small square is one 8,192 by 8,192 grid of scores: 32 heads for each of 8 sequences.
  const costEq = midMath('8 \\times 32 \\times 8192^2 \\times 2\\ \\text{bytes}', 0, -310, 96);
  const sheets = new Node();
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 32; c++)
      sheets.add(
        rect(42, 42, {
          radius: 3,
          fill: 'blue',
          stroke: null,
        })
          .at((c - 15.5) * 50, (r - 3.5) * 50)
          .opacity(0.8),
      );
  sheets.at(0, 30);
  const sheetsTop = midProse('32 heads', 0, -215, 48, 'dim'),
    sheetsSide = midProse('8 in the batch', -650, 280, 48, 'dim');
  const sheetNote = midProse('each square: 8,192 × 8,192 scores', 280, 280, 48, 'dim');
  const costTotal = midMono('≈ 34 GB', 0, 400, 130, 'red');
  const firstPart = [
    firstCells,
    restCells,
    keysAxis,
    queriesAxis,
    quadrantV,
    quadrantH,
    tokens4,
    count4,
    tokens8,
    count8,
    timesFour,
  ];
  cost.on('real-size', () =>
    stage.play(
      fadeOut(firstPart, {
        duration: 0.16,
      }),
      arrive(fadeIn(costEq)),
      {
        duration: 0.42,
      },
    ),
  );
  cost.on('sizes', () =>
    stage.play(
      fadeIn(sheets, {
        lag: 0.002,
      }),
      fadeIn([sheetsTop, sheetsSide, sheetNote]),
      {
        duration: 1,
      },
    ),
  );
  cost.after('total', () =>
    stage.play(
      fadeIn(costTotal, {
        scale: 0.9,
      }),
      {
        duration: 0.6,
      },
    ),
  );
  // Where this happens.
  const trainingGrid = gridNode(8, 460, 'blue').at(-560, 90);
  const trainingTag = midProse(
    'Training and prompt processing:\nall the tokens together',
    -520,
    -240,
    54,
    'ink',
    {
      leading: 1.14,
    },
  );
  const mainMemory = rect(680, 460, {
    radius: 16,
    fill: 'surface',
    stroke: 'dim',
    width: 3,
  }).at(480, 90);
  const memoryName = midProse('GPU main memory', 480, -190, 52, 'dim');
  const storedGrid = gridNode(8, 300, 'red').at(480, 100);
  const intoMemory = arrow([-310, 90], [130, 90], {
    stroke: 'red',
    width: 6,
    tip: 28,
  });
  const differentTag = midProse('Generating text is a different problem.', 0, 430, 62, 'yellow');
  const sheetParts = [costEq, sheets, sheetsTop, sheetsSide, sheetNote, costTotal];
  cost.on('when', () =>
    stage.play(
      fadeOut(sheetParts, {
        duration: 0.16,
      }),
      arrive(fadeIn([trainingGrid, trainingTag, mainMemory, memoryName])),
      {
        duration: 0.42,
      },
    ),
  );
  cost.on('stores', () =>
    stage.play(
      draw(intoMemory, {
        lag: 1,
      }),
      fadeIn(storedGrid, {
        scale: 0.7,
      }),
      {
        duration: 0.8,
      },
    ),
  );
  show(cost, 'different', differentTag);
  leave(cost, [
    trainingGrid,
    trainingTag,
    mainMemory,
    memoryName,
    storedGrid,
    intoMemory,
    differentTag,
  ]);
}
