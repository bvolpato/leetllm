import assert from 'node:assert/strict';
import {
  Node,
  draw,
  fadeIn,
  indicate,
  lagged,
  line,
  morph,
  morphMatching,
  rect,
  smoother,
  text,
  tex,
  to,
  write,
} from 'vizmatic/stage';
import { sceneHeading } from '../../../stage-lessons/kit.mjs';
import {
  brief,
  fadeOut,
  fade,
  WORDS,
  f2,
  num,
  bmatrix,
  midProse,
  lineProse,
  midMono,
  midMath,
  block,
  dimIn,
  lit,
} from '../defaults.mjs';
import { Q, K, V, SCORES, SCALED, WEIGHTS, OUTPUT, COLUMN_SUMS } from '../model.mjs';

/** One line for every word. */
export function buildMatrix(stage, narration, { show, leave }, { triplet }) {
  const mat = narration.scene('matrix');
  sceneHeading(stage, mat, narration.title('matrix'));
  const fmt = (rows) => rows.map((row) => row.map(num));
  const M_Y = 150;
  const mQ = tex(`Q = ${bmatrix(fmt(Q))}`, {
    size: 66,
    color: 'yellow',
  }).moveTo([-570, M_Y - 200]);
  const mK = tex(`K = ${bmatrix(fmt(K))}`, {
    size: 66,
    color: 'blue',
  }).moveTo([-570, M_Y]);
  const mV = tex(`V = ${bmatrix(fmt(V))}`, {
    size: 66,
    color: 'green',
  }).moveTo([-570, M_Y + 200]);
  const eq1 = tex('QK^{\\top}', {
    size: 88,
  }).at(360, -250);
  const eq2 = tex('\\frac{QK^{\\top}}{\\sqrt{d}}', {
    size: 88,
  }).at(360, -250);
  const eq3 = tex('\\text{softmax}\\left(\\frac{QK^{\\top}}{\\sqrt{d}}\\right)', {
    size: 88,
  }).at(360, -250);
  const eq4 = tex('\\text{softmax}\\left(\\frac{QK^{\\top}}{\\sqrt{d}}\\right) V', {
    size: 88,
  }).at(360, -250);
  const grid = (rows, color = 'ink') =>
    tex(bmatrix(rows.map((row) => row.map(f2))), {
      size: 150,
      color,
    }).at(300, M_Y + 90);
  const g1 = grid(SCORES),
    g2 = grid(SCALED),
    g3 = grid(WEIGHTS, 'yellow'),
    g4 = grid(OUTPUT, 'green');
  const allWords = WORDS.map((word, i) => {
    const x = -745 + i * 213,
      node = new Node();
    node.add(
      ...triplet(x, -30, 1.35),
      text(word, {
        font: 'text-serif',
        size: 70,
        color: i === 0 ? 'blue' : i === 4 ? 'teal' : 'ink',
      }).at(x, 150),
    );
    return node;
  });
  mat.at(0.15, () =>
    stage.play(
      lagged(
        allWords.map((node) =>
          fadeIn(node, {
            shift: [0, 18],
          }),
        ),
        {
          lag: 0.12,
        },
      ),
      {
        duration: 1.1,
      },
    ),
  );
  const rowEach = text('One row\nper word', {
    font: 'text-serif',
    size: 150,
    leading: 1.08,
  }).at(300, M_Y + 40);
  mat.on('stack', () =>
    stage.play(
      ...allWords.map((node) =>
        fadeOut(node, {
          duration: 0.3,
        }),
      ),
      brief(
        lagged([write(mQ), write(mK), write(mV)], {
          lag: 0.4,
        }),
        1.3,
        0.2,
      ),
      brief(
        fadeIn(rowEach, {
          shift: [0, 14],
        }),
        0.6,
        0.2,
      ),
      {
        duration: 1.5,
      },
    ),
  );
  mat.on('qk', () =>
    stage.play(
      fadeOut(rowEach, {
        duration: 0.3,
      }),
      write(eq1),
      {
        duration: 1,
      },
    ),
  );
  mat.after('qk', () => stage.play(write(g1), { duration: 0.2 }));
  mat.on('root-d', () =>
    stage.play(morphMatching(eq1, eq2), {
      duration: 0.9,
    }),
  );
  mat.after('root-d', () =>
    stage.play(morphMatching(g1, g2, { key: (leaf) => leaf.data.key }), { duration: 0.2 }),
  );
  mat.on('softmax-rows', () =>
    stage.play(morphMatching(eq2, eq3), {
      duration: 1,
    }),
  );
  mat.after('softmax-rows', () => stage.play(morph(g2, g3), { duration: 0.2 }));
  mat.on('times-v', () =>
    stage.play(morphMatching(eq3, eq4), {
      duration: 1,
    }),
  );
  mat.after('times-v', () => stage.play(morph(g3, g4), { duration: 0.2 }));
  const boxed = rect(eq4.width + 70, eq4.height + 44, {
    radius: 14,
    stroke: 'yellow',
    width: 3,
  })
    .moveTo(eq4.center)
    .glow(12);
  mat.on('one-line', () =>
    stage.play(draw(boxed), {
      duration: 0.9,
    }),
  );
  // Both rows, shares on the left and outputs on the right.
  const headX = [-430, -80],
    headY = [50, 260],
    outX = [340, 720];
  const rowHeads = ['Birds', 'sing'].map((name, i) =>
    lineProse(name, -720, headY[i] + 10, 80, i ? 'teal' : 'blue'),
  );
  const columnHeads = ['Birds', 'sing'].map((name, i) =>
    lineProse(name, headX[i], -40, 58, i ? 'teal' : 'blue'),
  );
  const sharesTitle = lineProse('Shares', (headX[0] + headX[1]) / 2, -130, 62, 'dim');
  const outTitle = lineProse('Output', (outX[0] + outX[1]) / 2, -130, 62, 'dim');
  const shareCells = WEIGHTS.map((row, i) =>
    row.map((value, j) => midMono(f2(value), headX[j], headY[i], 112, 'yellow')),
  );
  const outCells = OUTPUT.map((row, i) =>
    row.map((value, j) => midMono(f2(value), outX[j], headY[i], 112, 'green')),
  );
  const rowParts = [...rowHeads, ...columnHeads, sharesTitle, outTitle];
  mat.on('both-rows', () => {
    stage.play(
      fadeOut([mQ, mK, mV, g4], {
        duration: 0.3,
      }),
      fadeOut(boxed, {
        duration: 0.14,
      }),
      brief(
        to(eq4, (node) => node.shift(-360, -60).scale(0.9)),
        0.4,
        0.14,
        smoother,
      ),
      {
        duration: 0.54,
      },
    );
    stage.play(fadeIn(rowParts), {
      duration: 0.35,
    });
  });
  mat.on('birds-row', () =>
    stage.play(
      fadeIn([...shareCells[0], ...outCells[0]], {
        shift: [0, 10],
      }),
      {
        duration: 0.6,
      },
    ),
  );
  mat.on('sing-row', () =>
    stage.play(
      fadeIn([...shareCells[1], ...outCells[1]], {
        shift: [0, 10],
      }),
      {
        duration: 0.6,
      },
    ),
  );
  // Shapes, with unequal sizes so that nothing can coincide. Two queries, three keys, key width four, value width five.
  const NQ = 2,
    NK = 3,
    DK = 4,
    DV = 5;
  const SHAPE_Y = 70,
    SHAPE_NAME = -130,
    SHAPE_SIZE = 262;
  const QX = -470,
    KX = -40,
    SX = 480;
  /** A shape as separate digits, so one side can light up or travel. */
  const dims = (a, b, x, color) => {
    const row = [
      midMono(String(a), x - 62, SHAPE_SIZE, 58, color),
      midMono('×', x, SHAPE_SIZE, 58, color),
      midMono(String(b), x + 62, SHAPE_SIZE, 58, color),
    ];
    row.forEach((node) => node.opacity(0));
    return row;
  };
  const blockQ = block(NQ, DK, 'yellow', QX, SHAPE_Y),
    blockK = block(NK, DK, 'blue', KX, SHAPE_Y),
    blockKT = block(DK, NK, 'blue', KX, SHAPE_Y);
  const blockKAgain = block(NK, DK, 'red', KX, SHAPE_Y),
    blockSquare = block(DK, DK, 'orange', KX, SHAPE_Y),
    blockKBack = block(DK, NK, 'blue', KX, SHAPE_Y);
  const blockS = block(NQ, NK, 'ink', SX, SHAPE_Y),
    blockSWrong = block(NQ, DK, 'orange', SX, SHAPE_Y),
    blockSBack = block(NQ, NK, 'ink', SX, SHAPE_Y);
  const nameQ = midMath('Q', QX, SHAPE_NAME, 76, 'yellow'),
    nameK = midMath('K', KX, SHAPE_NAME, 76, 'blue'),
    nameKT = midMath('K^{\\top}', KX, SHAPE_NAME, 76, 'blue');
  const nameS = lineProse('scores', SX, SHAPE_NAME + 18, 66);
  const dimsQ = dims(NQ, DK, QX, 'yellow'),
    dimsK = dims(NK, DK, KX, 'blue'),
    dimsKT = dims(DK, NK, KX, 'blue'),
    dimsKAgain = dims(NK, DK, KX, 'red'),
    dimsSquare = dims(DK, DK, KX, 'orange'),
    dimsKBack = dims(DK, NK, KX, 'blue');
  const dimsS = dims(NQ, NK, SX, 'ink'),
    dimsSWrong = dims(NQ, DK, SX, 'orange');
  const opTimes = midMath('\\times', -255, SHAPE_Y, 90),
    opEquals = midMath('=', 250, SHAPE_Y, 90);
  const rowsTag = midProse('one row per query, one column per key', SX, 335, 46, 'dim');
  // Inner sizes must match. The link joins Q's last digit to the next matrix's first digit.
  const LINK_Y = 318,
    innerFrom = QX + 62,
    innerTo = KX - 62,
    linkMid = (innerFrom + innerTo) / 2;
  const link = (color) =>
    line([innerFrom, LINK_Y], [innerTo, LINK_Y], {
      stroke: color,
      width: 5,
    });
  const linkText = (content, color) => midMath(content, linkMid, LINK_Y + 40, 54, color);
  const linkBad = [link('red'), linkText(`${DK} \\ne ${NK}`, 'red')],
    linkGood = [link('green'), linkText(`${DK} = ${DK}`, 'green')];
  const linkBadAgain = [link('red'), linkText(`${DK} \\ne ${NK}`, 'red')],
    linkRuns = [link('orange'), linkText(`${DK} = ${DK}`, 'orange')],
    linkFixed = [link('green'), linkText(`${DK} = ${DK}`, 'green')];
  assert.notEqual(DK, NK);
  const crashLine = midProse(
    `Without the transpose, ${NQ} × ${DK} times ${NK} × ${DK}: a shape error.`,
    0,
    440,
    56,
    'red',
  );
  const sameLine = midProse(
    `If keys = key width, ${NQ} × ${DK} times ${DK} × ${DK} runs, and it's wrong.`,
    0,
    440,
    56,
    'orange',
  );
  const unequalLine = midProse('So test with unequal sizes.', 0, 440, 64, 'yellow');
  const nameK2 = midMath('K', KX, SHAPE_NAME, 76, 'red'),
    nameKSquare = midMath('K', KX, SHAPE_NAME, 76, 'orange'),
    nameKTBack = midMath('K^{\\top}', KX, SHAPE_NAME, 76, 'blue'),
    dimsSBack = dims(NQ, NK, SX, 'ink');
  const shapeFirst = [blockQ, nameQ, ...dimsQ, opTimes, blockK, nameK, ...dimsK];
  [blockQ, nameQ, opTimes, blockK, nameK].forEach((node) => node.opacity(0));
  mat.on('shapes', () =>
    stage.play(
      fadeOut([...rowParts, ...shareCells.flat(), ...outCells.flat()], {
        duration: 0.3,
      }),
      ...dimIn(shapeFirst),
      {
        duration: 0.5,
      },
    ),
  );
  mat.on('q-rows', () =>
    stage.play(...lit([blockQ, nameQ, ...dimsQ]), {
      duration: 0.5,
    }),
  );
  mat.on('k-rows', () =>
    stage.play(...lit([opTimes, blockK, nameK, ...dimsK]), {
      duration: 0.5,
    }),
  );
  // Both widths are the last digit of each shape, and they match.
  mat.on('widths', () =>
    stage.play(
      to(dimsQ[2], (node) => node.color('green')),
      to(dimsK[2], (node) => node.color('green')),
      {
        duration: 0.4,
      },
    ),
  );
  // Side by side, the inner sizes don't match yet, and transposing makes them match.
  mat.on('transpose', () =>
    stage.play(
      to(dimsQ[2], (node) => node.color('red')),
      to(dimsK[0], (node) => node.color('red')),
      to(dimsK[2], (node) => node.color('blue')),
      fadeIn(linkBad),
      {
        duration: 0.35,
      },
    ),
  );
  mat.on('rows-cols', () => {
    // The labels change as the turn ends, together with the red link, so that link is never false.
    const turn = mat.span('rows-cols') - 0.2;
    stage.play(
      morph(blockK, blockKT),
      morph(nameK, nameKT),
      brief(fadeOut(dimsK), 0.18, turn - 0.18),
      {
        duration: turn,
        ease: smoother,
      },
    );
    stage.play(
      fadeOut(linkBad),
      fadeIn(linkGood),
      ...lit(dimsKT),
      to(dimsQ[2], (node) => node.color('green')),
      to(dimsKT[0], (node) => node.color('green')),
      {
        duration: 0.2,
      },
    );
  });
  mat.on('every-key', () =>
    stage.play(
      indicate(blockKT, {
        color: 'ink',
        scale: 1.04,
      }),
      {
        duration: 0.8,
      },
    ),
  );
  // The outer sizes drop down to name the grid.
  const carryA = midMono(String(NQ), QX - 62, SHAPE_SIZE, 58, 'yellow'),
    carryB = midMono(String(NK), KX + 62, SHAPE_SIZE, 58, 'yellow');
  mat.on('score-grid', () => {
    stage.play(
      fadeIn([opEquals, blockS, nameS], {
        shift: [0, 10],
      }),
      fadeIn([carryA, carryB]),
      {
        duration: 0.35,
      },
    );
    stage.play(
      to(carryA, (node) => node.at(QX - 62, SHAPE_SIZE + 150)),
      to(carryB, (node) => node.at(KX + 62, SHAPE_SIZE + 150)),
      {
        duration: 0.25,
        ease: smoother,
      },
    );
    stage.play(
      to(carryA, (node) => node.at(SX - 62, SHAPE_SIZE + 150)),
      to(carryB, (node) => node.at(SX + 62, SHAPE_SIZE + 150)),
      {
        duration: 0.7,
        ease: smoother,
      },
    );
    stage.play(
      to(carryA, (node) => node.at(SX - 62, SHAPE_SIZE + 20)),
      to(carryB, (node) => node.at(SX + 62, SHAPE_SIZE + 20)),
      {
        duration: 0.25,
        ease: smoother,
      },
    );
    stage.play(fadeOut([carryA, carryB]), ...lit(dimsS), fadeIn(rowsTag), {
      duration: 0.25,
    });
  });
  // Take the transpose away: the multiply fails.
  mat.on('crash', () => {
    stage.play(
      morph(blockKT, blockKAgain),
      fadeOut([...linkGood, ...dimsKT, nameKT]),
      ...lit(dimsKAgain),
      fadeIn(nameK2),
      fadeIn(linkBadAgain),
      fade(blockS, 0.15),
      fade(nameS, 0.15),
      ...dimsS.map((node) => fade(node, 0.15)),
      fade(opEquals, 0.15),
      fadeOut(rowsTag),
      to(dimsQ[2], (node) => node.color('red')),
      {
        duration: 0.6,
        ease: smoother,
      },
    );
    stage.play(fadeIn(crashLine), {
      duration: 0.35,
    });
  });
  // With a square K the same mistake runs, and returns a grid of the wrong shape.
  mat.on('same-size', () => {
    stage.play(fadeOut(crashLine), {
      duration: 0.2,
    });
    stage.play(
      morph(blockKAgain, blockSquare),
      fadeOut([...linkBadAgain, ...dimsKAgain, nameK2]),
      fadeIn(nameKSquare),
      ...lit(dimsSquare),
      fadeIn(linkRuns),
      morph(blockS, blockSWrong),
      fadeOut(dimsS),
      ...lit(dimsSWrong),
      fade(nameS, 1),
      fade(opEquals, 1),
      to(dimsQ[2], (node) => node.color('orange')),
      {
        duration: 0.6,
        ease: smoother,
      },
    );
    stage.play(fadeIn(sameLine), {
      duration: 0.35,
    });
  });
  mat.on('unequal', () => {
    stage.play(fadeOut(sameLine), {
      duration: 0.2,
    });
    stage.play(
      morph(blockSquare, blockKBack),
      fadeOut([...linkRuns, ...dimsSquare, nameKSquare]),
      ...lit(dimsKBack),
      fadeIn(nameKTBack),
      fadeIn(linkFixed),
      morph(blockSWrong, blockSBack),
      fadeOut(dimsSWrong),
      ...lit(dimsSBack),
      to(dimsQ[2], (node) => node.color('green')),
      {
        duration: 0.6,
        ease: smoother,
      },
    );
    stage.play(fadeIn(unequalLine), {
      duration: 0.35,
    });
  });
  // Softmax runs over the keys. Rows sum to one, and columns do not.
  const axisX = [-420, -60],
    axisY = [-30, 130];
  const axisCols = ['key 1', 'key 2'].map((name, j) => lineProse(name, axisX[j], -146, 56, 'dim'));
  const axisRows = ['query 1', 'query 2'].map((name, i) =>
    midProse(name, -720, axisY[i], 56, 'dim'),
  );
  const axisCells = WEIGHTS.map((row, i) =>
    row.map((value, j) => midMono(f2(value), axisX[j], axisY[i], 100, 'yellow')),
  );
  const rowSums = [0, 1].map((i) =>
    midMono(`= ${f2(WEIGHTS[i][0] + WEIGHTS[i][1])}`, 260, axisY[i], 90, 'green'),
  );
  const colSums = [0, 1].map((j) => midMono(f2(COLUMN_SUMS[j]), axisX[j], 285, 90, 'orange'));
  const colSumsTag = midProse("Columns needn't add to one.", 420, 285, 52, 'orange');
  const rowBox = rect(760, 140, {
    radius: 12,
    stroke: 'green',
    width: 4,
  }).at(-240, axisY[0]);
  const colBox = rect(290, 290, {
    radius: 12,
    stroke: 'red',
    width: 4,
  }).at(axisX[0], 50);
  const wrongAxis = midProse(
    'Over the queries: silently a different operation.',
    0,
    420,
    56,
    'red',
  );
  mat.on('across', () => {
    stage.play(
      fadeOut(
        [
          blockQ,
          blockKBack,
          blockSBack,
          nameQ,
          nameKTBack,
          nameS,
          ...dimsQ,
          ...dimsKBack,
          ...dimsSBack,
          ...linkFixed,
          opTimes,
          opEquals,
          unequalLine,
        ],
        {
          duration: 0.3,
        },
      ),
      {
        duration: 0.3,
      },
    );
    stage.play(fadeIn([...axisCols, ...axisRows, ...axisCells.flat()]), draw(rowBox), {
      duration: 0.6,
    });
  });
  mat.on('wrong-axis', () =>
    stage.play(
      fadeOut(rowBox, {
        duration: 0.25,
      }),
      draw(colBox),
      fadeIn(wrongAxis),
      {
        duration: 0.5,
      },
    ),
  );
  mat.on('rows-one', () =>
    stage.play(
      fadeOut([colBox, wrongAxis], {
        duration: 0.25,
      }),
      fadeIn(rowSums, {
        shift: [10, 0],
      }),
      {
        duration: 0.5,
      },
    ),
  );
  mat.after('columns', () =>
    stage.play(
      fadeIn([...colSums, colSumsTag], {
        shift: [0, 8],
      }),
      {
        duration: 0.5,
      },
    ),
  );
  // Multiplying by V replaces the key axis with the value width.
  const blockA = block(NQ, NK, 'yellow', -550, SHAPE_Y),
    blockV = block(NK, DV, 'green', -100, SHAPE_Y),
    blockO = block(NQ, DV, 'green', 480, SHAPE_Y);
  const nameA = lineProse('shares', -550, SHAPE_NAME + 18, 66, 'yellow'),
    nameV = midMath('V', -100, SHAPE_NAME, 76, 'green'),
    nameO = lineProse('output', 480, SHAPE_NAME + 18, 66, 'green');
  const sizeA = midMono(`${NQ} × ${NK}`, -550, SHAPE_SIZE, 56, 'yellow'),
    sizeV = midMono(`${NK} × ${DV}`, -100, SHAPE_SIZE, 56, 'green'),
    sizeO = midMono(`${NQ} × ${DV}`, 480, SHAPE_SIZE, 56, 'green');
  const opTimes2 = midMath('\\times', -340, SHAPE_Y, 90),
    opEquals2 = midMath('=', 190, SHAPE_Y, 90);
  const widthNote = midProse(
    `Value width ${DV}, key width ${DK}. They don't have to match.`,
    0,
    420,
    56,
    'yellow',
  );
  mat.on('multiply-v', () => {
    stage.play(
      fadeOut(
        [...axisCols, ...axisRows, ...axisCells.flat(), ...rowSums, ...colSums, colSumsTag, rowBox],
        {
          duration: 0.3,
        },
      ),
      {
        duration: 0.3,
      },
    );
    stage.play(
      fadeIn([blockA, nameA, sizeA, opTimes2, blockV, nameV, sizeV], {
        shift: [0, 10],
      }),
      {
        duration: 0.5,
      },
    );
  });
  mat.on('one-output', () =>
    stage.play(
      fadeIn([opEquals2, blockO, nameO, sizeO], {
        shift: [0, 10],
      }),
      {
        duration: 0.6,
      },
    ),
  );
  show(mat, 'width-note', widthNote);
  leave(mat, [
    eq4,
    blockA,
    nameA,
    sizeA,
    opTimes2,
    blockV,
    nameV,
    sizeV,
    opEquals2,
    blockO,
    nameO,
    sizeO,
    widthNote,
  ]);
}
