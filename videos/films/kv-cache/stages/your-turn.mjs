import assert from 'node:assert/strict';
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
  smoother,
  tex,
  write,
} from 'vizmatic/stage';
import { chip, sceneHeading } from '../../../stage-lessons/kit.mjs';
import { blocksFor, C_TABLE } from '../model.mjs';

/** Your turn. */
export function buildYourTurn(
  stage,
  narration,
  {
    T,
    M,
    place,
    fadeOut,
    crossfade,
    bar,
    slotBlock,
    clearScene,
    pulse,
    arrive,
    handoff,
    PREVIEW,
  },
) {
  const turn = narration.scene('your-turn');
  sceneHeading(stage, turn, narration.title('your-turn'));
  const Y_LEFT = -800,
    Y_CELL = 200,
    Y_ROWS = [-285, -60],
    Y_SIZE = 176;
  const A_PLACES = [5, 11, 2, 7],
    B_PLACE = 9;
  assert.equal(A_PLACES.length, blocksFor(100, 32));
  assert.ok(C_TABLE.every((block) => A_PLACES.includes(block)));
  const ySpot = (index) => [Y_LEFT + 94 + (index % 8) * Y_CELL, Y_ROWS[Math.floor(index / 8)]];
  const yBlock = (index, filled, color) => {
    const node = slotBlock(32, filled, color, {
      w: Y_SIZE,
      h: Y_SIZE,
      columns: 8,
    });
    return node.at(...ySpot(index)).zIndex(1);
  };
  const yEmptyBlocks = Array.from(
    {
      length: 16,
    },
    (_, i) =>
      slotBlock(32, 0, 'dim', {
        w: Y_SIZE,
        h: Y_SIZE,
        columns: 8,
      }).at(...ySpot(i)),
  );
  const yNumbers = Array.from(
    {
      length: 16,
    },
    (_, i) =>
      M(String(i), {
        size: 38,
        color: 'yellow',
      })
        .at(ySpot(i)[0], ySpot(i)[1] - Y_SIZE / 2 - 24)
        .zIndex(2),
  );
  const yA = A_PLACES.map((index, i) => yBlock(index, Math.min(32, 100 - i * 32), 'blue'));
  const yB = [yBlock(B_PLACE, 32, 'orange')];
  const yC = C_TABLE.map((index, i) => yBlock(index, Math.min(32, 70 - i * 32), 'green'));
  const sizeName = place(
    M('block size 32', {
      size: 52,
      color: 'yellow',
    }),
    -500,
    -462,
  );
  const askOne = place(
    T('A holds 100 tokens. B holds 32. How many blocks?', {
      size: 66,
      color: 'ink',
    }),
    Y_LEFT,
    80,
  );
  const newNumbers = T('New numbers', {
    italic: true,
    size: 170,
    color: 'yellow',
  }).at(0, 280);
  const yPoolTag = place(
    M('A small example pool: 16 blocks', {
      size: 38,
      color: 'dim',
    }),
    190,
    -462,
  );
  turn.at(0.05, () =>
    stage.play(
      fadeIn(sizeName),
      fadeIn(yPoolTag),
      fadeIn(yEmptyBlocks),
      fadeIn(yNumbers),
      fadeIn(newNumbers),
      {
        duration: 0.4,
      },
    ),
  );
  turn.on('size-32', () =>
    stage.play(
      fadeOut(newNumbers, {
        duration: 0.25,
      }),
      indicate(sizeName, {
        color: 'yellow',
        scale: 1.06,
      }),
      fadeIn(askOne, {
        shift: [0, 8],
      }),
      {
        duration: 0.6,
      },
    ),
  );
  const askMark = M('?', {
    size: 240,
    color: 'yellow',
  }).at(0, 300);
  turn.on('ask-one', () =>
    stage.play(
      fadeIn(askMark, {
        scale: 0.7,
      }),
      {
        duration: 0.5,
      },
    ),
  );
  const yATag = place(
    M('A: 4 blocks, 28 slots empty', {
      size: 48,
      color: 'blue',
    }),
    Y_LEFT,
    70,
  );
  const yBTag = place(
    M('B: 1 block', {
      size: 48,
      color: 'orange',
    }),
    Y_LEFT,
    140,
  );
  const yCount = stage.value(5);
  const yAsking = stage.value(0);
  const yTotal = dynamic(() =>
    M(`in use: ${yAsking.value > 0.5 ? '?' : Math.round(yCount.value)}`, {
      size: 110,
      color: 'yellow',
    }).at(590, 105),
  );
  const aRule = tex(`\\left\\lceil \\frac{100}{32} \\right\\rceil = ${blocksFor(100, 32)}`, {
    size: 110,
    color: 'blue',
  })
    .moveTo([0, 340])
    .alignTo([Y_LEFT, 0], 'left');
  turn.on('a-four', () => stage.play(pulse(sizeName, 1.04), { duration: 0.7 }));
  turn.after('a-four', () =>
    stage.play(
      fadeOut([askMark, askOne], {
        duration: 0.2,
      }),
      lagged(
        yA.map((node) =>
          fadeIn(node, {
            scale: 0.85,
          }),
        ),
        {
          lag: 0.25,
        },
      ),
      write(aRule),
      {
        duration: 0.8,
      },
    ),
  );
  turn.after('empty', () =>
    stage.play(fadeIn(yATag), pulse(yA[3], 1.04), {
      duration: 0.6,
    }),
  );
  turn.after('b-one', () =>
    stage.play(
      fadeIn(yB, {
        scale: 0.85,
      }),
      fadeIn(yBTag),
      {
        duration: 0.5,
      },
    ),
  );
  turn.after('five', () =>
    stage.play(fadeIn(yTotal), {
      duration: 0.35,
    }),
  );
  const askTwo = place(
    T('C holds 70 tokens. How many blocks now?', {
      size: 58,
      color: 'ink',
    }),
    Y_LEFT,
    240,
  );
  const cTableChips = C_TABLE.map((block) =>
    chip(String(block), {
      w: 130,
      h: 96,
      color: 'green',
      size: 56,
    }),
  );
  cTableChips.forEach((node, logical) => node.at(Y_LEFT + 310 + logical * 146, 360));
  const chipLit = chip(String(C_TABLE[1]), {
    w: 130,
    h: 96,
    color: 'yellow',
    size: 56,
    fill: 'surface',
    width: 5,
  })
    .at(Y_LEFT + 310 + 146, 360)
    .zIndex(2);
  const cTableName = place(
    M("C's table", {
      size: 44,
      color: 'green',
    }),
    Y_LEFT,
    360,
  );
  const askThree = place(
    T('Where does position 40 live?', {
      size: 54,
      color: 'ink',
    }),
    10,
    360,
  );
  turn.on('a-done', () =>
    stage.play(
      fadeOut([...yA, yATag, aRule], {
        shift: [0, -14],
      }),
      yCount.to(1),
      {
        duration: 0.5,
      },
    ),
  );
  turn.on('c-joins', () =>
    stage.play(
      fadeIn(askTwo, {
        shift: [0, 8],
      }),
      yAsking.to(1),
      {
        duration: 0.4,
      },
    ),
  );
  turn.on('table', () =>
    stage.play(
      lagged(
        cTableChips.map((node) =>
          fadeIn(node, {
            scale: 0.85,
          }),
        ),
        {
          lag: 0.25,
        },
      ),
      fadeIn(cTableName),
      {
        duration: 0.7,
      },
    ),
  );
  turn.on('ask-two', () =>
    stage.play(fadeIn(askThree), {
      duration: 0.4,
    }),
  );
  const yCTag = place(
    M('C: 3 blocks', {
      size: 48,
      color: 'green',
    }),
    Y_LEFT,
    240,
  );
  turn.on('c-three', () => stage.play(pulse(sizeName, 1.04), { duration: 0.6 }));
  turn.after('c-three', () =>
    stage.play(
      fadeOut([askTwo, askThree], {
        duration: 0.2,
      }),
      lagged(
        yC.map((node) =>
          fadeIn(node, {
            scale: 0.85,
          }),
        ),
        {
          lag: 0.25,
        },
      ),
      fadeIn(yCTag),
      yCount.to(4),
      {
        duration: 0.8,
      },
    ),
  );
  turn.after('four', () =>
    stage.play(
      yAsking.to(0),
      indicate(yTotal, {
        color: 'yellow',
        scale: 1.08,
      }),
      {
        duration: 0.5,
      },
    ),
  );
  const divideTex = tex('40 = 1 \\times 32 + 8', {
    size: 92,
    color: 'yellow',
  })
    .moveTo([0, 250])
    .alignTo([10, 0], 'left');
  turn.on('divide', () => stage.play(pulse(sizeName, 1.04), { duration: 0.7 }));
  turn.after('divide', () =>
    stage.play(write(divideTex), {
      duration: 0.7,
    }),
  );
  const logicalName = place(
    M('logical block 1, slot 8', {
      size: 56,
      color: 'yellow',
    }),
    10,
    370,
  );
  // Slot 8 inside block 11: the second row of eight, first column. slotBlock lays out cells the same way.
  const SLOT_PAD = 12,
    SLOT_GAP = 4,
    SLOT_W = (Y_SIZE - SLOT_PAD * 2 - SLOT_GAP * 7) / 8,
    SLOT_H = (Y_SIZE - SLOT_PAD * 2 - SLOT_GAP * 3) / 4;
  const slotLit = rect(SLOT_W + 8, SLOT_H + 8, {
    radius: 4,
    fill: 'yellow',
    stroke: 'bg',
    width: 2,
  })
    .at(
      ySpot(C_TABLE[1])[0] - Y_SIZE / 2 + SLOT_PAD + SLOT_W / 2,
      ySpot(C_TABLE[1])[1] - Y_SIZE / 2 + SLOT_PAD + SLOT_H + SLOT_GAP + SLOT_H / 2,
    )
    .zIndex(4);
  turn.on('logical', () =>
    stage.play(fadeIn(logicalName), {
      duration: 0.5,
    }),
  );
  const physicalName = place(
    M(`physical block ${C_TABLE[1]}`, {
      size: 66,
      color: 'green',
    }),
    10,
    465,
  );
  // The ring sits inside the block, so it never crosses the block's number above it.
  const physicalRing = rect(Y_SIZE - 8, Y_SIZE - 8, {
    radius: 12,
    stroke: 'yellow',
    width: 7,
  })
    .at(...ySpot(C_TABLE[1]))
    .glow(10)
    .zIndex(3);
  turn.after('physical', () =>
    stage.play(
      fadeIn(chipLit, {
        scale: 0.9,
      }),
      fadeIn(physicalName, {
        shift: [0, 8],
      }),
      draw(physicalRing),
      fadeIn(slotLit, {
        scale: 0.7,
      }),
      {
        duration: 0.5,
      },
    ),
  );
  const turnParts = [
    sizeName,
    yPoolTag,
    ...yEmptyBlocks,
    ...yNumbers,
    ...yB,
    yBTag,
    ...yC,
    yCTag,
    yTotal,
    ...cTableChips,
    chipLit,
    cTableName,
    divideTex,
    logicalName,
    physicalName,
    physicalRing,
    slotLit,
  ];
  // The last answer, tried on the same picture as the scene about shrinking: bars against a budget.
  const lastFull = place(
    T('Full and over budget: what helps?', {
      size: 66,
      color: 'ink',
    }),
    -800,
    -388,
  );
  const lastBytes = place(
    T('Fewer bytes: back under budget', {
      size: 66,
      color: 'green',
    }),
    -800,
    -388,
  );
  const lastMore = place(
    T('Otherwise: more memory, a higher budget', {
      size: 66,
      color: 'yellow',
    }),
    -800,
    -388,
  );
  const Y_BAR = -250,
    Y_BAR_X = -800,
    Y_BUDGET = 300;
  const yLength = stage.value(1500),
    yBudgetX = stage.value(Y_BUDGET);
  const yBar = dynamic(() => {
    const node = new Node(),
      over = Y_BAR_X + yLength.value - yBudgetX.value;
    node.add(bar(Y_BAR_X, Y_BAR, yLength.value, 86, 'blue'));
    if (over > 0)
      node.add(
        rect(over, 86, {
          radius: 6,
          fill: 'red',
          stroke: null,
        })
          .opacity(0.55)
          .at(yBudgetX.value + over / 2, Y_BAR),
      );
    return node;
  });
  const yBudgetLine = dynamic(() =>
    line([yBudgetX.value, Y_BAR - 66], [yBudgetX.value, Y_BAR + 66], {
      stroke: 'red',
      width: 7,
    }).zIndex(2),
  );
  const yBudgetName = dynamic(() =>
    M('budget', {
      size: 42,
      color: 'red',
    }).at(yBudgetX.value + 90, Y_BAR - 74),
  );
  const ROW_Y = [-100, 50, 205, 355];
  const answerRows = [
    'Smaller blocks?',
    'A different scheduler?',
    'Fewer bytes: fewer key value heads or lower\nprecision, then check quality',
    'More memory, or fewer requests at once',
  ].map((name, i) =>
    place(
      T(name, {
        size: 64,
        color: 'ink',
        leading: 1.18,
      }),
      -590,
      ROW_Y[i],
    ).opacity(PREVIEW),
  );
  const verdicts = [
    ['No', 'red'],
    ['No', 'red'],
    ['Yes', 'green'],
    ['Else', 'yellow'],
  ].map(([word, color], i) =>
    place(
      M(word, {
        size: 72,
        color,
      }),
      -800,
      ROW_Y[i],
    ),
  );
  turn.on('full', () =>
    handoff(turnParts, () =>
      arrive(
        fadeIn(lastFull),
        fadeIn(yBar),
        fadeIn(yBudgetLine),
        fadeIn(yBudgetName),
        fadeIn(answerRows),
        {
          duration: 0.45,
        },
      ),
    ),
  );
  // Each permission includes the spoken answer and any qualification before it completes.
  turn.after('no-blocks', () =>
    stage.play(
      fade(answerRows[0], 1),
      fadeIn(verdicts[0], {
        scale: 0.8,
      }),
      yLength.to(1480),
      {
        duration: 0.5,
      },
    ),
  );
  turn.after('no-scheduler', () =>
    stage.play(
      fade(answerRows[1], 1),
      fadeIn(verdicts[1], {
        scale: 0.8,
      }),
      {
        duration: 0.5,
      },
    ),
  );
  turn.on('bytes', () => stage.play(pulse(yBudgetLine, 1.02), { duration: 0.7 }));
  turn.after('bytes', () =>
    stage.play(
      fade(answerRows[2], 1),
      fadeIn(verdicts[2], {
        scale: 0.8,
      }),
      ...crossfade(lastFull, lastBytes, 0.45),
      yLength.to(1040),
      {
        duration: 0.8,
        ease: smoother,
      },
    ),
  );
  // More memory is the other route, so the full bar returns and the budget moves past it.
  turn.on('more', () =>
    stage.play(
      fade(answerRows[3], 1),
      fadeIn(verdicts[3], {
        scale: 0.8,
      }),
      ...crossfade(lastBytes, lastMore),
      yLength.to(1480),
      yBudgetX.to(740),
      {
        duration: 0.8,
        ease: smoother,
      },
    ),
  );
  clearScene(turn, [lastMore, yBar, yBudgetLine, yBudgetName, ...answerRows, ...verdicts]);
}
